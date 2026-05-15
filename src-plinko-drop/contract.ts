import algosdk from 'algosdk';
import { APP_ID, ALGOD_URL, ALGOD_TOKEN } from './config';

export const client = new algosdk.Algodv2(ALGOD_TOKEN, ALGOD_URL, '');

const sel = (sig: string) => {
  const m = new algosdk.ABIMethod(algosdk.ABIMethod.fromSignature(sig));
  return m.getSelector();
};

export const SELECTORS = {
  opt_in:     sel('opt_in()void'),
  submit_bet: sel('submit_bet(pay,uint64,uint64)void'),
  settle_bet: sel('settle_bet()void'),
};

export async function optIn(signer: (txns: algosdk.Transaction[]) => Promise<Uint8Array[]>, sender: string) {
  const sp = await client.getTransactionParams().do();
  sp.flatFee = true; sp.fee = 2000n;
  const txn = algosdk.makeApplicationOptInTxnFromObject({
    sender,
    suggestedParams: sp,
    appIndex: APP_ID,
    appArgs: [SELECTORS.opt_in],
  });
  const [signed] = await signer([txn]);
  const { txid } = await client.sendRawTransaction(signed).do();
  await algosdk.waitForConfirmation(client, txid, 5);
  return txid;
}

export async function submitBet(
  signer: (txns: algosdk.Transaction[]) => Promise<Uint8Array[]>,
  sender: string,
  amountMicroVoi: bigint,
  riskLevel: number,
  boardRows: number
) {
  const sp = await client.getTransactionParams().do();
  sp.flatFee = true; sp.fee = 1000n;

  const appAddr = algosdk.getApplicationAddress(APP_ID).toString();
  const payTxn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
    sender,
    receiver: appAddr,
    amount: amountMicroVoi,
    suggestedParams: { ...sp },
  });

  const sp2 = await client.getTransactionParams().do();
  sp2.flatFee = true; sp2.fee = 2000n;

  const enc = algosdk.ABIUintType.from('uint64');
  const appTxn = algosdk.makeApplicationCallTxnFromObject({
    sender,
    suggestedParams: sp2,
    appIndex: APP_ID,
    onComplete: algosdk.OnApplicationComplete.NoOpOC,
    appArgs: [
      SELECTORS.submit_bet,
      enc.encode(BigInt(riskLevel)),
      enc.encode(BigInt(boardRows)),
    ],
  });

  algosdk.assignGroupID([payTxn, appTxn]);
  const signed = await signer([payTxn, appTxn]);
  const { txid } = await client.sendRawTransaction(signed).do();
  await algosdk.waitForConfirmation(client, txid, 5);
  return txid;
}

export async function settleBet(
  signer: (txns: algosdk.Transaction[]) => Promise<Uint8Array[]>,
  sender: string
) {
  const sp = await client.getTransactionParams().do();
  sp.flatFee = true; sp.fee = 3000n;
  const txn = algosdk.makeApplicationCallTxnFromObject({
    sender,
    suggestedParams: sp,
    appIndex: APP_ID,
    onComplete: algosdk.OnApplicationComplete.NoOpOC,
    appArgs: [SELECTORS.settle_bet],
  });
  const [signed] = await signer([txn]);
  const { txid } = await client.sendRawTransaction(signed).do();
  await algosdk.waitForConfirmation(client, txid, 5);
  return txid;
}

export async function getPendingBet(address: string) {
  try {
    const info = await client.accountApplicationInformation(address, APP_ID).do();
    const ls = info['app-local-state']?.['key-value'] ?? [];
    const get = (key: string) => {
      const b64 = btoa(key);
      const found = ls.find((x: {key: string}) => x.key === b64);
      return found?.value?.uint ?? 0n;
    };
    return {
      round:  BigInt(get('pRound')),
      amount: BigInt(get('pAmt')),
      risk:   Number(get('pRisk')),
      rows:   Number(get('pRows')),
      optedIn: true,
    };
  } catch {
    return { round: 0n, amount: 0n, risk: 0, rows: 0, optedIn: false };
  }
}
