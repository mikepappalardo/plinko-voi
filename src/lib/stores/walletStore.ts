import { create } from 'zustand';
import algosdk from 'algosdk';

const algod = new algosdk.Algodv2('', 'https://mainnet-api.voi.nodely.dev', '');

interface WalletState {
  connected: boolean;
  address: string | null;
  balance: number;
  syncFromUseWallet: (address: string | null) => void;
  refreshBalance: () => Promise<void>;
  disconnect: () => void;
}

export const useWalletStore = create<WalletState>((set, get) => ({
  connected: false,
  address: null,
  balance: 0,

  syncFromUseWallet: (address: string | null) => {
    if (address) {
      set({ connected: true, address });
      get().refreshBalance();
    } else {
      set({ connected: false, address: null, balance: 0 });
    }
  },

  disconnect: () => set({ connected: false, address: null, balance: 0 }),

  refreshBalance: async () => {
    const { address } = get();
    if (!address) return;
    try {
      const info = await algod.accountInformation(address).do();
      const balance = Number((info as any).amount || 0n) / 1_000_000;
      set({ balance });
    } catch { /* ignore */ }
  },
}));
