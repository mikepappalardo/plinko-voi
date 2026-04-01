import { useState, useCallback, useRef, useEffect } from 'react';
import Header from '@/components/game/Header';
import BetControls from '@/components/game/BetControls';
import PlinkoBoard from '@/components/game/PlinkoBoard';
import PayoutTable from '@/components/game/PayoutTable';
import ResultsHistory from '@/components/game/ResultsHistory';
import SessionStats from '@/components/game/SessionStats';
import Leaderboard from '@/components/game/Leaderboard';
import EventLog from '@/components/game/EventLog';
import { WalletConnector } from '@/components/WalletConnector';
import { useGameState } from '@/hooks/useGameState';
import { useCelebration } from '@/hooks/useCelebration';
import { useWallet } from '@txnlab/use-wallet-react';
import { useWalletStore } from '@/lib/stores/walletStore';
import { setSigner, submitPlinkoBet, awaitGameResult, PLINKO_APP_ID } from '@/services/voiBlockchain';
import { toast } from 'sonner';
import algosdk from 'algosdk';

export default function Index() {
  const game = useGameState();
  const { celebrate, setFlashRef } = useCelebration();
  const [dropTrigger, setDropTrigger] = useState(0);
  const [forceBucket, setForceBucket] = useState<number | null>(null);
  const [pendingTx, setPendingTx] = useState(false);
  const autoIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const onChainResultRef = useRef<{ multiplier: number } | null>(null);

  const { activeAddress, signTransactions } = useWallet();
  const { connected, balance, refreshBalance } = useWalletStore();

  // Keep voiBlockchain signer in sync with use-wallet
  useEffect(() => {
    if (activeAddress && signTransactions) {
      setSigner(async (txns: algosdk.Transaction[]) => {
        const encoded = txns.map(t => algosdk.encodeUnsignedTransaction(t));
        const signed = await signTransactions(encoded);
        return signed.map(s => new Uint8Array(s!));
      }, activeAddress);
    } else {
      setSigner(null, null);
      if (game.tokenMode) game.setTokenMode(false);
    }
  }, [activeAddress, signTransactions]);

  // ── Demo drop ──────────────────────────────────────────────────────────────
  const handleDrop = useCallback(() => {
    if (!game.deductBet()) { toast.error('Insufficient balance!'); return; }
    setForceBucket(null);
    onChainResultRef.current = null;
    game.setIsDropping(true);
    setDropTrigger(prev => prev + 1);
    setTimeout(() => game.setIsDropping(false), 300);
  }, [game]);

  // ── On-chain drop ──────────────────────────────────────────────────────────
  const handleOnChainDrop = useCallback(async () => {
    if (pendingTx) return;
    if (!connected || !activeAddress) { toast.error('Connect your wallet first'); return; }
    if (balance < game.betAmount) { toast.error('Insufficient VOI balance'); return; }

    setPendingTx(true);
    game.setIsDropping(true);
    const toastId = toast.loading('Submitting to Voi Network...');
    try {
      const { txHash } = await submitPlinkoBet(game.betAmount, game.risk, game.boardRows);
      toast.loading('Waiting for confirmation...', { id: toastId });
      const result = await awaitGameResult(txHash);

      onChainResultRef.current = { multiplier: result.multiplier };
      setForceBucket(result.bucketIndex);
      setDropTrigger(prev => prev + 1);
      refreshBalance();

      const msg = result.multiplier >= 5
        ? `🔥 ${result.multiplier.toFixed(2)}x — HUGE WIN!`
        : result.multiplier >= 1
        ? `✓ ${result.multiplier.toFixed(2)}x`
        : `${result.multiplier.toFixed(2)}x`;
      toast.success(`${msg} (${txHash.slice(0, 8)}...)`, { id: toastId, duration: 4000 });
    } catch (e: any) {
      toast.error(e.message ?? 'Transaction failed', { id: toastId });
    } finally {
      setPendingTx(false);
      setTimeout(() => game.setIsDropping(false), 400);
    }
  }, [game, pendingTx, connected, activeAddress, balance, refreshBalance]);

  const handleDropMultiple = useCallback((count: number) => {
    if (game.tokenMode) { toast.info('Multi-drop not available in token mode'); return; }
    let dropped = 0;
    const interval = setInterval(() => {
      if (dropped >= count || game.balance < game.betAmount) { clearInterval(interval); return; }
      if (game.deductBet()) {
        setForceBucket(null);
        onChainResultRef.current = null;
        setDropTrigger(prev => prev + 1);
        dropped++;
      }
    }, 200);
  }, [game]);

  const handleBallLand = useCallback((bucketIndex: number, multiplier: number) => {
    const finalMultiplier = game.tokenMode && onChainResultRef.current != null
      ? onChainResultRef.current.multiplier
      : multiplier;
    game.addResult(finalMultiplier, bucketIndex);
    celebrate(finalMultiplier);
    onChainResultRef.current = null;
    if (finalMultiplier >= 5) toast.success(`🔥 ${finalMultiplier}x — HUGE WIN!`, { duration: 3000 });
    else if (finalMultiplier >= 2) toast.success(`🎉 ${finalMultiplier}x`, { duration: 2000 });
  }, [game, celebrate]);

  const handleAutoToggle = useCallback(() => {
    if (game.tokenMode) { toast.info('Auto mode not available in token mode'); return; }
    game.setAutoMode(!game.autoMode);
  }, [game]);

  useEffect(() => {
    if (game.autoMode && !game.tokenMode) {
      autoIntervalRef.current = setInterval(() => {
        if (game.balance >= game.betAmount && game.deductBet()) {
          setForceBucket(null);
          onChainResultRef.current = null;
          setDropTrigger(prev => prev + 1);
        } else {
          game.setAutoMode(false);
        }
      }, 800);
    }
    return () => { if (autoIntervalRef.current) { clearInterval(autoIntervalRef.current); autoIntervalRef.current = null; } };
  }, [game.autoMode, game.tokenMode, game]);

  const handleTokenModeToggle = () => {
    if (!game.tokenMode && !connected) {
      toast.info('Connect your wallet to enable Token Mode');
      return;
    }
    game.setTokenMode(!game.tokenMode);
  };

  const activeDrop = game.tokenMode ? handleOnChainDrop : handleDrop;
  const displayBalance = game.tokenMode ? balance : game.balance;

  return (
    <div className="min-h-screen flex flex-col bg-background relative">
      <div ref={setFlashRef} className="fixed inset-0 pointer-events-none z-50" style={{ opacity: 0 }} />

      {/* Header with WalletConnector */}
      <header className="flex items-center justify-between px-4 py-3 glass-strong">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
            <span className="text-primary font-heading font-bold text-sm">V</span>
          </div>
          <h1 className="font-heading font-bold text-lg text-foreground">
            Voi <span className="text-primary text-glow-primary">Plinko</span>
          </h1>
        </div>
        <WalletConnector />
      </header>

      <main className="flex-1 container py-4">
        <div className="flex flex-col items-center gap-4 max-w-6xl mx-auto">
          <div className="w-full max-w-[600px]">
            <BetControls
              balance={displayBalance}
              risk={game.risk}
              boardRows={game.boardRows}
              betAmount={game.betAmount}
              isDropping={game.isDropping || pendingTx}
              autoMode={game.autoMode}
              tokenMode={game.tokenMode}
              onRiskChange={game.setRisk}
              onBoardRowsChange={game.setBoardRows}
              onBetChange={game.setBetAmount}
              onDrop={activeDrop}
              onDropMultiple={handleDropMultiple}
              onAutoToggle={handleAutoToggle}
              onTokenModeToggle={handleTokenModeToggle}
              onResetBalance={game.resetBalance}
            />
          </div>

          <PlinkoBoard
            risk={game.risk}
            rows={game.boardRows}
            onBallLand={handleBallLand}
            dropTrigger={dropTrigger}
            forceBucket={forceBucket}
          />

          <div className="w-full max-w-[500px]">
            <PayoutTable risk={game.risk} rows={game.boardRows} />
          </div>

          <div className="w-full max-w-[600px] grid grid-cols-1 sm:grid-cols-2 gap-4">
            <SessionStats stats={game.stats} />
            <ResultsHistory results={game.results} />
          </div>

          <div className="w-full max-w-[600px] grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Leaderboard />
            <EventLog results={game.results} />
          </div>

          <div className="glass rounded-xl p-4 w-full max-w-[600px]">
            <h3 className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Provably Fair</h3>
            {game.tokenMode ? (
              <p className="text-xs text-muted-foreground">
                Results are derived on-chain from <code className="text-primary">sha256(txID + round)</code> — verifiable by anyone on Voi Network.
              </p>
            ) : (
              <p className="text-xs text-muted-foreground">
                Connect a wallet and enable Token Mode to play with real VOI — provably fair via on-chain randomness.
              </p>
            )}
            <div className="mt-2 px-3 py-2 rounded-lg bg-secondary/50 text-xs text-muted-foreground font-mono">
              {game.tokenMode ? `App ID: ${PLINKO_APP_ID} | Voi Mainnet` : 'Mode: Demo'}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
