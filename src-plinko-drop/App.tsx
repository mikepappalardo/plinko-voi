import { useState, useEffect } from 'react';
import { useWallet } from '@txnlab/use-wallet-react';
import algosdk from 'algosdk';
import { client, optIn, submitBet, settleBet, getPendingBet } from './contract';
import PlinkoBoard from './PlinkoBoard';
import { MULTIPLIERS, ROWS_OPTIONS } from './config';

type Risk = 'low' | 'mid' | 'high';
type Phase = 'idle' | 'betting' | 'dropping' | 'settling' | 'done';

export default function App() {
  const { activeAddress, signTransactions, isReady } = useWallet();
  const [optedIn, setOptedIn] = useState(false);
  const [balance, setBalance] = useState(0);
  const [betAmount, setBetAmount] = useState(1);
  const [risk, setRisk] = useState<Risk>('mid');
  const [rows, setRows] = useState(12);
  const [phase, setPhase] = useState<Phase>('idle');
  const [landedBucket, setLandedBucket] = useState<number | null>(null);
  const [payout, setPayout] = useState<number | null>(null);
  const [txid, setTxid] = useState('');
  const [error, setError] = useState('');
  const [pending, setPending] = useState<Awaited<ReturnType<typeof getPendingBet>> | null>(null);

  const signer = async (txns: algosdk.Transaction[]) => {
    const encoded = txns.map(t => t.toByte());
    return signTransactions(encoded);
  };

  useEffect(() => {
    if (!activeAddress) return;
    (async () => {
      try {
        const info = await client.accountInformation(activeAddress).do();
        setBalance(Number(info.amount) / 1e6);
        const pb = await getPendingBet(activeAddress);
        setOptedIn(pb.optedIn);
        if (pb.round > 0n) setPending(pb);
      } catch {}
    })();
  }, [activeAddress]);

  async function handleOptIn() {
    if (!activeAddress) return;
    setError('');
    try {
      await optIn(signer, activeAddress);
      setOptedIn(true);
    } catch (e: any) { setError(e.message); }
  }

  async function handleBet() {
    if (!activeAddress) return;
    setError('');
    setPhase('betting');
    try {
      const microVoi = BigInt(Math.round(betAmount * 1e6));
      const riskNum = risk === 'low' ? 0 : risk === 'mid' ? 1 : 2;
      const tid = await submitBet(signer, activeAddress, microVoi, riskNum, rows);
      setTxid(tid);
      setPhase('dropping');
    } catch (e: any) {
      setError(e.message);
      setPhase('idle');
    }
  }

  async function handleLand(bucket: number) {
    setLandedBucket(bucket);
    setPhase('settling');
    // Wait 1s then settle
    setTimeout(async () => {
      try {
        if (!activeAddress) return;
        await settleBet(signer, activeAddress);
        const mults = MULTIPLIERS[risk];
        const numBuckets = rows + 1;
        const half = Math.floor(numBuckets / 2);
        const pos = bucket > half ? rows - bucket : bucket;
        const mult = mults[Math.min(pos, mults.length - 1)];
        const pOut = betAmount * mult * 0.97; // after 3% fee
        setPayout(pOut);
        setPhase('done');
      } catch (e: any) {
        setError(e.message);
        setPhase('done');
      }
    }, 1000);
  }

  function reset() {
    setPhase('idle');
    setLandedBucket(null);
    setPayout(null);
    setTxid('');
    setError('');
  }

  const mults = MULTIPLIERS[risk];

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)',
      fontFamily: 'Poppins, system-ui, sans-serif',
      color: '#f8fafc',
      padding: '24px 16px',
    }}>
      <div style={{ maxWidth: 700, margin: '0 auto' }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <h1 style={{ fontSize: 42, fontWeight: 800, margin: 0,
            background: 'linear-gradient(90deg, #38bdf8, #a78bfa)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'
          }}>
            🎯 Plinko Drop
          </h1>
          <p style={{ color: '#94a3b8', marginTop: 4 }}>On-chain • Voi Network • Provably Fair</p>
        </div>

        {/* Wallet status */}
        <div style={{ background: '#1e293b', borderRadius: 12, padding: '12px 20px',
          marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center'
        }}>
          {activeAddress ? (
            <>
              <span style={{ color: '#94a3b8', fontSize: 13 }}>
                {activeAddress.slice(0,8)}...{activeAddress.slice(-6)}
              </span>
              <span style={{ color: '#22c55e', fontWeight: 700 }}>{balance.toFixed(2)} VOI</span>
            </>
          ) : (
            <span style={{ color: '#64748b' }}>Connect your Voi wallet to play</span>
          )}
        </div>

        {/* Opt-in */}
        {activeAddress && !optedIn && (
          <div style={{ background: '#1e293b', borderRadius: 12, padding: 20, marginBottom: 24, textAlign: 'center' }}>
            <p style={{ margin: '0 0 12px', color: '#94a3b8' }}>
              Opt in to the Plinko contract to start playing
            </p>
            <button onClick={handleOptIn} style={btnStyle('#38bdf8')}>
              Opt In
            </button>
          </div>
        )}

        {/* Pending bet banner */}
        {pending && pending.round > 0n && phase === 'idle' && (
          <div style={{ background: '#854d0e44', border: '1px solid #f59e0b', borderRadius: 12,
            padding: '12px 20px', marginBottom: 20, textAlign: 'center'
          }}>
            <p style={{ margin: '0 0 8px', color: '#fcd34d' }}>
              You have a pending bet of {Number(pending.amount) / 1e6} VOI — claim your result!
            </p>
            <button onClick={() => handleLand(0)} style={btnStyle('#f59e0b')}>
              Claim Result
            </button>
          </div>
        )}

        {/* Controls */}
        {optedIn && phase === 'idle' && (
          <div style={{ background: '#1e293b', borderRadius: 16, padding: 24, marginBottom: 24 }}>
            {/* Risk */}
            <Label>Risk Level</Label>
            <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
              {(['low','mid','high'] as Risk[]).map(r => (
                <button key={r} onClick={() => setRisk(r)}
                  style={{ ...btnStyle(risk===r ? riskColor(r) : '#334155'), flex: 1, textTransform: 'capitalize' }}>
                  {r}
                </button>
              ))}
            </div>

            {/* Rows */}
            <Label>Board Size</Label>
            <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
              {ROWS_OPTIONS.map(r => (
                <button key={r} onClick={() => setRows(r)}
                  style={{ ...btnStyle(rows===r ? '#38bdf8' : '#334155'), flex: 1 }}>
                  {r} rows
                </button>
              ))}
            </div>

            {/* Bet amount */}
            <Label>Bet Amount (VOI)</Label>
            <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
              {[0.1, 0.5, 1, 5, 10].map(v => (
                <button key={v} onClick={() => setBetAmount(v)}
                  style={{ ...btnStyle(betAmount===v ? '#a78bfa' : '#334155'), flex: 1, fontSize: 13 }}>
                  {v}
                </button>
              ))}
            </div>
            <input type="range" min={0.1} max={100} step={0.1} value={betAmount}
              onChange={e => setBetAmount(Number(e.target.value))}
              style={{ width: '100%', margin: '8px 0 4px' }} />
            <div style={{ textAlign: 'center', color: '#a78bfa', fontWeight: 700, fontSize: 18 }}>
              {betAmount} VOI
            </div>

            {/* Multiplier preview */}
            <div style={{ marginTop: 16, display: 'flex', gap: 4, flexWrap: 'wrap', justifyContent: 'center' }}>
              {mults.map((m, i) => (
                <div key={i} style={{ background: '#0f172a', borderRadius: 6, padding: '4px 8px',
                  fontSize: 12, color: m >= 5 ? '#22c55e' : m >= 1 ? '#fbbf24' : '#f87171'
                }}>
                  {m}x
                </div>
              ))}
            </div>

            <button onClick={handleBet}
              style={{ ...btnStyle('#22c55e'), width: '100%', marginTop: 20, fontSize: 18, padding: '14px 0' }}>
              🎯 Drop Ball — {betAmount} VOI
            </button>
          </div>
        )}

        {/* Plinko board */}
        {(phase === 'dropping' || phase === 'settling' || phase === 'done') && (
          <div style={{ marginBottom: 24 }}>
            <PlinkoBoard
              rows={rows}
              risk={risk}
              dropping={phase === 'dropping'}
              onLand={handleLand}
            />
          </div>
        )}

        {/* Result */}
        {phase === 'done' && (
          <div style={{ background: payout && payout > betAmount ? '#14532d44' : '#7f1d1d44',
            border: `1px solid ${payout && payout > betAmount ? '#22c55e' : '#ef4444'}`,
            borderRadius: 16, padding: 28, textAlign: 'center', marginBottom: 24
          }}>
            <div style={{ fontSize: 48, marginBottom: 8 }}>
              {payout && payout > betAmount ? '🎉' : '😔'}
            </div>
            {payout !== null ? (
              <>
                <div style={{ fontSize: 28, fontWeight: 800 }}>
                  {payout > betAmount ? '+' : ''}{(payout - betAmount).toFixed(3)} VOI
                </div>
                <div style={{ color: '#94a3b8', marginTop: 4 }}>
                  Paid out {payout.toFixed(3)} VOI
                </div>
              </>
            ) : (
              <div>Settled on-chain</div>
            )}
            {txid && (
              <a href={`https://explorer.voi.network/explorer/transaction/${txid}`}
                target="_blank" rel="noopener noreferrer"
                style={{ color: '#38bdf8', fontSize: 12, display: 'block', marginTop: 8 }}>
                View transaction ↗
              </a>
            )}
            <button onClick={reset} style={{ ...btnStyle('#38bdf8'), marginTop: 20, padding: '10px 40px' }}>
              Play Again
            </button>
          </div>
        )}

        {/* Status */}
        {phase === 'betting' && (
          <div style={{ textAlign: 'center', color: '#94a3b8', padding: 20 }}>
            Submitting bet...
          </div>
        )}
        {phase === 'settling' && (
          <div style={{ textAlign: 'center', color: '#94a3b8', padding: 20 }}>
            Settling on-chain...
          </div>
        )}

        {error && (
          <div style={{ background: '#7f1d1d44', border: '1px solid #ef4444', borderRadius: 8,
            padding: '10px 16px', color: '#fca5a5', marginBottom: 16, fontSize: 13
          }}>
            {error}
          </div>
        )}

        {/* Contract info */}
        <div style={{ color: '#475569', fontSize: 11, textAlign: 'center', marginTop: 32 }}>
          App ID: 49241326 • Voi Mainnet • House fee: 3% • Min: 0.1 VOI • Max: 100 VOI
        </div>
      </div>
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return <div style={{ color: '#94a3b8', fontSize: 12, fontWeight: 600,
    textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>{children}</div>;
}

function btnStyle(color: string) {
  return {
    background: color + '22',
    border: `1px solid ${color}`,
    color: color,
    borderRadius: 8,
    padding: '8px 16px',
    cursor: 'pointer',
    fontWeight: 600,
    fontSize: 14,
    fontFamily: 'inherit',
    transition: 'all 0.15s',
  } as React.CSSProperties;
}

function riskColor(r: Risk) {
  return r === 'low' ? '#22c55e' : r === 'mid' ? '#f59e0b' : '#ef4444';
}
