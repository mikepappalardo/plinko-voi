import React from 'react';
import ReactDOM from 'react-dom/client';
import { WalletProvider, WalletManager, WalletId } from '@txnlab/use-wallet-react';
import App from './App';
import './index.css';

const manager = new WalletManager({
  wallets: [WalletId.KIBISIS, WalletId.LUTE],
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <WalletProvider manager={manager}>
      <App />
    </WalletProvider>
  </React.StrictMode>
);
