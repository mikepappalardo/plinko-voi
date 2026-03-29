/**
 * Mock Voi blockchain service
 * These functions are scaffolded for future Voi Network integration.
 * Currently they return mock data / simulate behavior.
 */

export interface WalletState {
  connected: boolean;
  address: string | null;
  balance: number;
}

export interface BetResult {
  txHash: string;
  multiplier: number;
  payout: number;
  timestamp: number;
}

// Mock wallet state
let mockWalletState: WalletState = {
  connected: false,
  address: null,
  balance: 0,
};

export async function connectWallet(): Promise<WalletState> {
  // TODO: Integrate with Voi wallet (e.g., Kibisis, Defly)
  console.log('[Voi] connectWallet() called — mock implementation');
  mockWalletState = {
    connected: true,
    address: 'VOI' + Math.random().toString(36).substring(2, 15).toUpperCase() + '...',
    balance: 500,
  };
  return mockWalletState;
}

export async function disconnectWallet(): Promise<void> {
  console.log('[Voi] disconnectWallet() called — mock implementation');
  mockWalletState = { connected: false, address: null, balance: 0 };
}

export async function getWalletBalance(): Promise<number> {
  // TODO: Query Voi chain for balance
  return mockWalletState.balance;
}

export async function submitPlinkoBet(
  amount: number,
  riskLevel: string
): Promise<{ txHash: string }> {
  // TODO: Submit transaction to Plinko smart contract
  console.log(`[Voi] submitPlinkoBet(${amount}, ${riskLevel}) — mock`);
  return {
    txHash: '0x' + Math.random().toString(16).substring(2, 18),
  };
}

export async function awaitGameResult(txHash: string): Promise<BetResult> {
  // TODO: Listen for on-chain result event
  console.log(`[Voi] awaitGameResult(${txHash}) — mock`);
  return {
    txHash,
    multiplier: 1,
    payout: 0,
    timestamp: Date.now(),
  };
}

export async function claimWinnings(txHash: string): Promise<boolean> {
  // TODO: Call smart contract claim function
  console.log(`[Voi] claimWinnings(${txHash}) — mock`);
  return true;
}

export function getWalletState(): WalletState {
  return { ...mockWalletState };
}
