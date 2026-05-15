import React from 'react';
import ReactDOM from 'react-dom/client';
import { WalletProvider, WalletManager, NetworkConfigBuilder, WalletId } from '@txnlab/use-wallet-react';
import App from './App';
import './index.css';

const manager = new WalletManager({
  wallets: [WalletId.KIBISIS, WalletId.LUTE],
  network: new NetworkConfigBuilder()
    .addNetwork({
      id: 'voi-mainnet-v1.0',
      algod: {
        token: '',
        baseServer: 'https://mainnet-api.voi.nodely.dev',
        port: 443,
      },
    })
    .build()
    .find(n => n.id === 'voi-mainnet-v1.0')!,
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <WalletProvider manager={manager}>
      <App />
    </WalletProvider>
  </React.StrictMode>
);
