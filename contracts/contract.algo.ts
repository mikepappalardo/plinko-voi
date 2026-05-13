import {
  Contract,
  GlobalState,
  LocalState,
  uint64,
  Account,
  assert,
  itxn,
  op,
  Txn,
  Global,
  PayTxn,
} from '@algorandfoundation/algorand-typescript';

/**
 * VoiPlinko — on-chain Plinko game for Voi Network
 *
 * Flow:
 *   1. Deploy: createApplication(houseAddr)
 *   2. Fund prize pool: fundPool(payment)
 *   3. Player opts in: optInToApplication()
 *   4. Player plays: playPlinko(payment, riskLevel, boardRows)
 *      - payment goes to contract
 *      - contract derives bucket from txID + round
 *      - contract pays out bet * multiplier
 *      - 3% house fee sent to house address
 *
 * Risk levels: 0=LOW, 1=MEDIUM, 2=HIGH
 * Board rows: 8, 12, 16
 */
export class VoiPlinko extends Contract {
  // House wallet receives fees and can manage contract
  houseAddress = GlobalState<Account>({ initialValue: Global.zeroAddress });

  // Stats
  totalBets = GlobalState<uint64>({ initialValue: 0 });
  totalPayout = GlobalState<uint64>({ initialValue: 0 });

  // Bet limits in microVOI
  minBet = GlobalState<uint64>({ initialValue: 100_000 });     // 0.1 VOI
  maxBet = GlobalState<uint64>({ initialValue: 100_000_000 }); // 100 VOI

  // House fee in basis points (300 = 3%)
  houseFeeBps = GlobalState<uint64>({ initialValue: 300 });

  // Per-player local state
  playerBets = LocalState<uint64>({ initialValue: 0 });
  playerWinnings = LocalState<uint64>({ initialValue: 0 });

  // ─── Lifecycle ────────────────────────────────────────────────────────────

  createApplication(houseAddr: Account): void {
    this.houseAddress.value = houseAddr;
  }

  optInToApplication(): void {
    this.playerBets(Txn.sender).value = 0;
    this.playerWinnings(Txn.sender).value = 0;
  }

  // ─── House Management ─────────────────────────────────────────────────────

  fundPool(payment: PayTxn): void {
    assert(payment.receiver === Global.currentApplicationAddress, 'Payment must go to contract');
    assert(payment.amount > 0, 'Must send VOI to fund pool');
  }

  withdrawPool(amount: uint64): void {
    assert(Txn.sender === this.houseAddress.value, 'Only house can withdraw');
    assert(Global.currentApplicationAddress.balance >= amount + Global.minBalance, 'Insufficient balance');
    itxn
      .payment({
        receiver: this.houseAddress.value,
        amount: amount,
        fee: 0,
      })
      .submit();
  }

  setBetLimits(newMin: uint64, newMax: uint64): void {
    assert(Txn.sender === this.houseAddress.value, 'Only house can update');
    assert(newMin > 0, 'Min must be > 0');
    assert(newMax > newMin, 'Max must exceed min');
    this.minBet.value = newMin;
    this.maxBet.value = newMax;
  }

  setHouseAddress(newHouse: Account): void {
    assert(Txn.sender === this.houseAddress.value, 'Only house can update');
    this.houseAddress.value = newHouse;
  }

  // ─── Game ─────────────────────────────────────────────────────────────────

  /**
   * Play Plinko.
   *
   * @param payment   - VOI bet paid to the contract
   * @param riskLevel - 0=LOW, 1=MEDIUM, 2=HIGH
   * @param boardRows - 8, 12, or 16
   * @returns payout amount in microVOI
   */
  playPlinko(payment: PayTxn, riskLevel: uint64, boardRows: uint64): uint64 {
    // Validate payment
    assert(payment.receiver === Global.currentApplicationAddress, 'Payment must go to contract');
    assert(payment.sender === Txn.sender, 'Payment sender mismatch');
    assert(payment.amount >= this.minBet.value, 'Bet below minimum');
    assert(payment.amount <= this.maxBet.value, 'Bet above maximum');

    // Validate game params
    assert(riskLevel <= 2, 'Invalid risk level');
    assert(boardRows === 8 || boardRows === 12 || boardRows === 16, 'Invalid board rows');

    // Derive pseudo-random bucket from txID + current round
    const numBuckets = boardRows + 1;
    const seedInput = op.concat(Txn.txID, op.itob(Global.round));
    const hash = op.sha256(seedInput);
    const bucketIndex = op.btoi(op.extract(hash, 0, 8)) % numBuckets;

    // Get multiplier (in basis points: 100 = 1x, 500 = 5x)
    const multiplierBps = this.getMultiplier(riskLevel, boardRows, bucketIndex);

    // Calculate amounts
    const betAmount = payment.amount;
    const houseFee = (betAmount * this.houseFeeBps.value) / 10_000;
    const netBet = betAmount - houseFee;
    const payout = (netBet * multiplierBps) / 100;

    // Send house fee
    if (houseFee > 0) {
      itxn
        .payment({
          receiver: this.houseAddress.value,
          amount: houseFee,
          fee: 0,
        })
        .submit();
    }

    // Pay out winnings
    if (payout > 0) {
      assert(
        Global.currentApplicationAddress.balance >= payout + Global.minBalance,
        'Insufficient pool — contact house to refund'
      );
      itxn
        .payment({
          receiver: Txn.sender,
          amount: payout,
          fee: 0,
        })
        .submit();
    }

    // Update stats
    this.totalBets.value = this.totalBets.value + 1;
    this.totalPayout.value = this.totalPayout.value + payout;
    this.playerBets(Txn.sender).value = this.playerBets(Txn.sender).value + 1;
    this.playerWinnings(Txn.sender).value = this.playerWinnings(Txn.sender).value + payout;

    // Log result: [bucketIndex u64][multiplierBps u64][payout u64]
    op.log(op.concat(op.itob(bucketIndex), op.concat(op.itob(multiplierBps), op.itob(payout))));

    return payout;
  }

  // ─── Multiplier Table ─────────────────────────────────────────────────────

  /**
   * Returns multiplier in basis points (100 = 1x).
   * Buckets are mirrored (edge = high, center = low).
   */
  getMultiplier(riskLevel: uint64, boardRows: uint64, bucketIndex: uint64): uint64 {
    const half = (boardRows + 1) / 2;
    // Mirror: fold right half onto left
    const pos: uint64 = bucketIndex <= half ? bucketIndex : boardRows - bucketIndex;

    if (riskLevel === 0) {
      // LOW — gentle curve
      if (pos === 0) return 560;   // 5.6x
      if (pos === 1) return 210;   // 2.1x
      if (pos === 2) return 110;   // 1.1x
      if (pos === 3) return 100;   // 1.0x
      if (pos === 4) return 70;    // 0.7x
      if (pos === 5) return 50;    // 0.5x
      return 40;                   // 0.4x center
    }

    if (riskLevel === 1) {
      // MEDIUM
      if (pos === 0) return 1300;  // 13x
      if (pos === 1) return 300;   // 3x
      if (pos === 2) return 130;   // 1.3x
      if (pos === 3) return 70;    // 0.7x
      if (pos === 4) return 40;    // 0.4x
      if (pos === 5) return 30;    // 0.3x
      return 20;                   // 0.2x
    }

    // HIGH
    if (pos === 0) return 2900;    // 29x
    if (pos === 1) return 400;     // 4x
    if (pos === 2) return 150;     // 1.5x
    if (pos === 3) return 30;      // 0.3x
    if (pos === 4) return 20;      // 0.2x
    if (pos === 5) return 10;      // 0.1x
    return 5;                      // 0.05x
  }
}
