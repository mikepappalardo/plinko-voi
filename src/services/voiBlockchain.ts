/**
 * Voi Blockchain service — VoiPlinko contract
 * App ID: 49028406 on Voi mainnet
 *
 * Signing is delegated to @txnlab/use-wallet-react (Kibisis, Lute, Voi Wallet).
 * Call setSigner() from the component that holds the useWallet hook.
 */

import algosdk from 'algosdk';

export const PLINKO_APP_ID = 49028406;
const ALGOD_URL = 'https://mainnet-api.voi.nodely.dev';
const ALGOD_TOKEN = '';
const MIN_BET_MICROALGOS = 100_000;
const MAX_BET_MICROALGOS = 100_000_000;

export const algod = new algosdk.Algodv2(ALGOD_TOKEN, ALGOD_URL, '');

// Signer function injected from the React component (use-wallet)
type SignerFn = (txns: algosdk.Transaction[]) => Promise<Uint8Array[]>;
let _signer: SignerFn | null = null;
let _activeAddress: string | null = null;

export function setSigner(signer: SignerFn | null, address: string | null) {
  _signer = signer;
  _activeAddress = address;
}

export async function getPoolBalance(): Promise<number> {
  try {
    const appAddr = algosdk.getApplicationAddress(PLINKO_APP_ID).toString();
    const info = await algod.accountInformation(appAddr).do();
    return Number(info.amount ?? 0n) / 1_000_000;
  } catch { return 0; }
}

export async function ensureOptedIn(address: string): Promise<boolean> {
  const info = await algod.accountInformation(address).do();
  const apps: any[] = info['apps-local-state'] ?? info.appsLocalState ?? [];
  if (apps.some((a: any) => Number(a.id ?? a['id']) === PLINKO_APP_ID)) return true;

  if (!_signer) throw new Error('No signer available');
  const sp = await algod.getTransactionParams().do();
  const optInTxn = algosdk.makeApplicationOptInTxnFromObject({
    sender: address,
    suggestedParams: sp,
    appIndex: PLINKO_APP_ID,
  });
  const [signed] = await _signer([optInTxn]);
  const res = await algod.sendRawTransaction(signed).do();
  await algosdk.waitForConfirmation(algod, res.txid ?? res.txId, 8);
  return true;
}

export async function submitPlinkoBet(
  amountVoi: number,
  riskLevel: 'low' | 'medium' | 'high' | string,
  boardRows: number = 16
): Promise<{ txHash: string }> {
  if (!_signer || !_activeAddress) throw new Error('Wallet not connected');

  const microVoi = Math.round(amountVoi * 1_000_000);
  if (microVoi < MIN_BET_MICROALGOS) throw new Error('Min bet is 0.1 VOI');
  if (microVoi > MAX_BET_MICROALGOS) throw new Error('Max bet is 100 VOI');

  const riskMap: Record<string, number> = { low: 0, medium: 1, high: 2 };
  const riskNum = riskMap[riskLevel.toLowerCase()] ?? 1;
  const validRows = [8, 12, 16].includes(boardRows) ? boardRows : 16;

  await ensureOptedIn(_activeAddress);

  const sp = await algod.getTransactionParams().do();
  const spCall = { ...sp, fee: 3000n, flatFee: true };
  const spPay  = { ...sp, fee: 0n,    flatFee: true };

  const payTxn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
    sender: _activeAddress,
    receiver: algosdk.getApplicationAddress(PLINKO_APP_ID).toString(),
    amount: BigInt(microVoi),
    suggestedParams: spPay,
  });

  const callTxn = algosdk.makeApplicationNoOpTxnFromObject({
    sender: _activeAddress,
    suggestedParams: spCall,
    appIndex: PLINKO_APP_ID,
    appArgs: [
      new Uint8Array(Buffer.from('play')),
      algosdk.encodeUint64(riskNum),
      algosdk.encodeUint64(validRows),
    ],
  });

  algosdk.assignGroupID([payTxn, callTxn]);
  const signedGroup = await _signer([payTxn, callTxn]);
  const res = await algod.sendRawTransaction(signedGroup).do();
  return { txHash: res.txid ?? res.txId };
}

export interface BetResult {
  txHash: string;
  bucketIndex: number;
  multiplierBps: number;
  multiplier: number;
  payout: number;
  timestamp: number;
}

export async function awaitGameResult(txHash: string): Promise<BetResult> {
  const result = await algosdk.waitForConfirmation(algod, txHash, 8);
  let bucketIndex = 0, multiplierBps = 100, payoutMicro = 0;
  try {
    const logs: string[] = result.logs ?? result['logs'] ?? [];
    if (logs.length > 0) {
      const logBytes = Buffer.from(logs[0], 'base64');
      if (logBytes.length >= 24) {
        bucketIndex   = Number(logBytes.readBigUInt64BE(0));
        multiplierBps = Number(logBytes.readBigUInt64BE(8));
        payoutMicro   = Number(logBytes.readBigUInt64BE(16));
      }
    }
  } catch {}
  return {
    txHash, bucketIndex, multiplierBps,
    multiplier: multiplierBps / 100,
    payout: payoutMicro / 1_000_000,
    timestamp: Date.now(),
  };
}

export async function getContractInfo() {
  const info = await algod.getApplicationByID(PLINKO_APP_ID).do();
  const gs: any[] = info.params?.globalState ?? info['params']?.['global-state'] ?? [];
  const get = (key: string) => {
    const e = gs.find(e => Buffer.from(e.key, 'base64').toString() === key);
    return e ? Number(e.value.uint ?? 0n) : 0;
  };
  const appAddress = algosdk.getApplicationAddress(PLINKO_APP_ID).toString();
  const acc = await algod.accountInformation(appAddress).do();
  return {
    appId: PLINKO_APP_ID, appAddress,
    totalBets: get('totalBets'), totalPayout: get('totalPayout'),
    poolBalance: Number(acc.amount ?? 0n) / 1_000_000,
    minBet: get('minBet') / 1_000_000, maxBet: get('maxBet') / 1_000_000,
  };
}
