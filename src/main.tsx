import React from 'react';
import ReactDOM from 'react-dom/client';
import { WalletProvider, WalletManager, WalletId, NetworkConfigBuilder } from '@txnlab/use-wallet-react';
import App from './App';
import './index.css';

// Wipe stale use-wallet persisted state
try {
  localStorage.removeItem('@txnlab/use-wallet:v4');
  localStorage.removeItem('@txnlab/use-wallet');
} catch { /* ignore */ }

const networks = new NetworkConfigBuilder()
  .addNetwork('voimain', {
    algod: {
      token: '',
      baseServer: 'https://mainnet-api.voi.nodely.dev',
      port: '443',
    },
    isTestnet: false,
    genesisHash: 'r20fSQI8gWe/kFZziNonSPCXLwcQmH/nxROvnnueWOk=',
    genesisId: 'voimain-v1.0',
    caipChainId: 'algorand:r20fSQI8gWe_kFZziNonSPCXLwcQmH_n',
  })
  .build();

const walletManager = new WalletManager({
  wallets: [
    WalletId.KIBISIS,
    { id: WalletId.LUTE, options: { siteName: 'Plinko on Voi' } },
  ],
  networks,
  defaultNetwork: 'voimain',
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <WalletProvider manager={walletManager}>
      <App />
    </WalletProvider>
  </React.StrictMode>
);
