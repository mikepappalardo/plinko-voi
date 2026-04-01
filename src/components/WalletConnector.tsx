import { useEffect, useState } from 'react';
import { Wallet, ChevronDown, Copy, ExternalLink, LogOut } from 'lucide-react';
import { useWallet } from '@txnlab/use-wallet-react';
import { useWalletStore } from '@/lib/stores/walletStore';

const WALLET_ICONS: Record<string, string> = {
  kibisis: '🟣',
  lute: '🎸',
  walletconnect: '🔗',
};

const WALLET_LABELS: Record<string, string> = {
  kibisis: 'Kibisis',
  lute: 'Lute',
  walletconnect: 'Voi Wallet (WalletConnect)',
};

export function WalletConnector() {
  const { wallets, activeAddress, activeWallet } = useWallet();
  const { connected, balance, syncFromUseWallet, refreshBalance } = useWalletStore();
  const [open, setOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [connectingId, setConnectingId] = useState<string | null>(null);

  useEffect(() => {
    syncFromUseWallet(activeAddress ?? null);
  }, [activeAddress, syncFromUseWallet]);

  const handleConnect = async (wallet: (typeof wallets)[0]) => {
    setConnectingId(wallet.id);
    try {
      await wallet.connect();
      setOpen(false);
    } catch (e: any) {
      alert(e?.message ?? 'Failed to connect wallet');
    } finally {
      setConnectingId(null);
    }
  };

  const handleDisconnect = () => {
    activeWallet?.disconnect();
    setDropdownOpen(false);
  };

  const copyAddress = () => {
    if (activeAddress) navigator.clipboard.writeText(activeAddress);
  };

  const short = activeAddress
    ? activeAddress.slice(0, 6) + '...' + activeAddress.slice(-4)
    : null;

  if (connected && activeAddress) {
    return (
      <div className="relative">
        <button
          onClick={() => setDropdownOpen(v => !v)}
          className="flex items-center gap-2 px-3 py-2 rounded-xl bg-primary/10 border border-primary/30 text-primary text-sm font-medium hover:bg-primary/20 transition-colors"
        >
          <Wallet size={15} />
          <span className="font-mono text-xs hidden sm:inline">{short}</span>
          <span className="text-xs text-primary/60 hidden sm:inline">{balance.toFixed(2)} VOI</span>
          <ChevronDown size={13} className="opacity-60" />
        </button>

        {dropdownOpen && (
          <div className="absolute right-0 top-full mt-2 w-56 rounded-xl border border-white/10 bg-[#0e1a2b] shadow-xl z-50 overflow-hidden">
            <div className="px-4 py-3 border-b border-white/10">
              <div className="text-xs text-muted-foreground font-mono">{short}</div>
              <div className="text-base font-bold text-primary mt-0.5">{balance.toFixed(4)} VOI</div>
            </div>
            <button onClick={copyAddress} className="flex w-full items-center gap-2 px-4 py-2.5 text-sm hover:bg-white/5 transition-colors">
              <Copy size={14} /> Copy Address
            </button>
            <button
              onClick={() => window.open(`https://explorer.voi.network/explorer/account/${activeAddress}`, '_blank')}
              className="flex w-full items-center gap-2 px-4 py-2.5 text-sm hover:bg-white/5 transition-colors"
            >
              <ExternalLink size={14} /> View on Explorer
            </button>
            <div className="border-t border-white/10" />
            <button onClick={handleDisconnect} className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-red-400 hover:bg-white/5 transition-colors">
              <LogOut size={14} /> Disconnect
            </button>
          </div>
        )}

        {dropdownOpen && (
          <div className="fixed inset-0 z-40" onClick={() => setDropdownOpen(false)} />
        )}
      </div>
    );
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-3 py-2 rounded-xl bg-primary/10 border border-primary/30 text-primary text-sm font-medium hover:bg-primary/20 transition-colors"
      >
        <Wallet size={15} />
        <span className="hidden sm:inline">Connect Wallet</span>
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setOpen(false)}>
          <div className="bg-[#0e1a2b] border border-white/10 rounded-2xl p-6 w-full max-w-sm mx-4 shadow-2xl" onClick={e => e.stopPropagation()}>
            <h2 className="text-lg font-bold text-center mb-5">Connect Wallet</h2>
            <div className="space-y-3">
              {wallets.map(wallet => (
                <button
                  key={wallet.id}
                  onClick={() => handleConnect(wallet)}
                  disabled={connectingId !== null}
                  className="w-full flex items-center gap-4 p-4 rounded-xl border border-white/10 hover:border-primary/40 hover:bg-primary/5 transition-all disabled:opacity-50"
                >
                  <span className="text-2xl">{WALLET_ICONS[wallet.id] || '💼'}</span>
                  <div className="text-left flex-1">
                    <div className="font-semibold">{WALLET_LABELS[wallet.id] || wallet.metadata.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {wallet.id === 'kibisis' && 'Browser extension'}
                      {wallet.id === 'lute' && 'Browser extension'}
                      {wallet.id === 'walletconnect' && 'Mobile wallet via QR code'}
                    </div>
                  </div>
                  {connectingId === wallet.id && (
                    <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  )}
                </button>
              ))}
            </div>
            <button onClick={() => setOpen(false)} className="mt-4 w-full text-sm text-muted-foreground hover:text-foreground transition-colors">
              Cancel
            </button>
          </div>
        </div>
      )}
    </>
  );
}
