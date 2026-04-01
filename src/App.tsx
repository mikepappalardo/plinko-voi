import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { WalletProvider, WalletManager, WalletId, NetworkConfigBuilder } from "@txnlab/use-wallet-react";
import Index from "./pages/Index.tsx";
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient();

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

const WC_PROJECT_ID = import.meta.env.VITE_WC_PROJECT_ID || '';

const walletList: any[] = [
  WalletId.KIBISIS,
  { id: WalletId.LUTE, options: { siteName: 'Voi Plinko' } },
];

if (WC_PROJECT_ID) {
  walletList.push({
    id: WalletId.WALLETCONNECT,
    options: { projectId: WC_PROJECT_ID, themeMode: 'dark' as const },
  });
}

const walletManager = new WalletManager({
  wallets: walletList,
  networks,
  defaultNetwork: 'voimain',
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <WalletProvider manager={walletManager}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </WalletProvider>
  </QueryClientProvider>
);

export default App;
