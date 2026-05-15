from algopy import (
    Account,
    ARC4Contract,
    arc4,
    Bytes,
    Global,
    gtxn,
    itxn,
    LocalState,
    GlobalState,
    op,
    Txn,
    UInt64,
)

class BettingContract(ARC4Contract):
    def __init__(self) -> None:
        self.house = GlobalState(Account, key=b"house")
        self.total_bets = GlobalState(UInt64, key=b"totalBets")
        self.total_payout = GlobalState(UInt64, key=b"totalPayout")
        self.min_bet = GlobalState(UInt64, key=b"minBet")
        self.max_bet = GlobalState(UInt64, key=b"maxBet")
        self.house_fee_bps = GlobalState(UInt64, key=b"houseFeeBps")

        self.pending_bet_round = LocalState(UInt64, key=b"pRound")
        self.pending_bet_amount = LocalState(UInt64, key=b"pAmt")
        self.pending_risk = LocalState(UInt64, key=b"pRisk")
        self.pending_rows = LocalState(UInt64, key=b"pRows")

    @arc4.abimethod(allow_actions=["NoOp"])
    def create_application(self) -> None:
        self.house.value = Account("KZGWTTEQNSTBVFNQNEWKO4KJV6R3DRBZOAR7A36TOUFDHXIVNJUMTELF7U")
        self.total_bets.value = UInt64(0)
        self.total_payout.value = UInt64(0)
        self.min_bet.value = UInt64(100_000)
        self.max_bet.value = UInt64(100_000_000)
        self.house_fee_bps.value = UInt64(300)

    @arc4.abimethod(allow_actions=["OptIn"])
    def opt_in(self) -> None:
        self.pending_bet_round[Txn.sender] = UInt64(0)
        self.pending_bet_amount[Txn.sender] = UInt64(0)
        self.pending_risk[Txn.sender] = UInt64(0)
        self.pending_rows[Txn.sender] = UInt64(0)

    @arc4.abimethod
    def submit_bet(self, pay: gtxn.PaymentTransaction, risk_level: UInt64, board_rows: UInt64) -> None:
        assert pay.receiver == Global.current_application_address, "Wrong receiver"
        assert self.pending_bet_round[Txn.sender] == 0, "Already have a bet pending"
        
        self.pending_bet_round[Txn.sender] = Global.round + 1
        self.pending_bet_amount[Txn.sender] = pay.amount
        self.pending_risk[Txn.sender] = risk_level
        self.pending_rows[Txn.sender] = board_rows

    @arc4.abimethod
    def settle_bet(self) -> None:
        target_round = self.pending_bet_round[Txn.sender]
        bet_amount = self.pending_bet_amount[Txn.sender]

        assert target_round > 0, "No bet pending"
        assert Global.round > target_round, "Wait for next block"

        block_seed = op.Block.blk_seed(target_round)
        seed = op.sha256(block_seed + Txn.sender.bytes)

        board_rows = self.pending_rows[Txn.sender]
        num_buckets = board_rows + 1
        bucket_index = op.btoi(op.extract(seed, 0, 8)) % num_buckets

        half = num_buckets // 2
        pos = bucket_index
        if bucket_index > half:
            pos = board_rows - bucket_index

        risk = self.pending_risk[Txn.sender]
        multiplier = UInt64(0)
        
        if risk == 0:
            multiplier = self._get_low_risk(pos)
        elif risk == 1:
            multiplier = self._get_mid_risk(pos)
        else:
            multiplier = self._get_high_risk(pos)

        house_fee = (bet_amount * self.house_fee_bps.value) // 10_000
        final_payout = ((bet_amount - house_fee) * multiplier) // 100

        if house_fee > 0:
            itxn.Payment(receiver=self.house.value, amount=house_fee).submit()
        
        if final_payout > 0:
            itxn.Payment(receiver=Txn.sender, amount=final_payout).submit()

        self.total_bets.value += 1
        self.total_payout.value += final_payout
        self.pending_bet_round[Txn.sender] = UInt64(0)
        self.pending_bet_amount[Txn.sender] = UInt64(0)

    def _get_low_risk(self, pos: UInt64) -> UInt64:
        if pos == 0:
            return UInt64(560)
        if pos == 1:
            return UInt64(210)
        if pos == 2:
            return UInt64(110)
        if pos == 3:
            return UInt64(100)
        if pos == 4:
            return UInt64(70)
        if pos == 5:
            return UInt64(50)
        return UInt64(40)

    def _get_mid_risk(self, pos: UInt64) -> UInt64:
        if pos == 0:
            return UInt64(1300)
        if pos == 1:
            return UInt64(300)
        if pos == 2:
            return UInt64(130)
        if pos == 3:
            return UInt64(70)
        if pos == 4:
            return UInt64(40)
        if pos == 5:
            return UInt64(30)
        return UInt64(20)

    def _get_high_risk(self, pos: UInt64) -> UInt64:
        if pos == 0:
            return UInt64(2900)
        if pos == 1:
            return UInt64(400)
        if pos == 2:
            return UInt64(150)
        if pos == 3:
            return UInt64(30)
        if pos == 4:
            return UInt64(20)
        if pos == 5:
            return UInt64(10)
        return UInt64(5)

    @arc4.abimethod
    def refund_bet(self, player: Account) -> None:
        target_round = self.pending_bet_round[player]
        amount = self.pending_bet_amount[player]
        assert target_round > 0, "No bet"
        itxn.Payment(receiver=player, amount=amount).submit()
        self.pending_bet_round[player] = UInt64(0)

    @arc4.abimethod
    def withdraw(self, amount: UInt64) -> None:
        assert Txn.sender == self.house.value, "Not house"
        itxn.Payment(receiver=self.house.value, amount=amount).submit()