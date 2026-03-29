import { GameResult } from '@/hooks/useGameState';

interface ResultsHistoryProps {
  results: GameResult[];
}

export default function ResultsHistory({ results }: ResultsHistoryProps) {
  if (results.length === 0) {
    return (
      <div className="glass rounded-xl p-4 animate-fade-in">
        <h3 className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Recent Results</h3>
        <p className="text-sm text-muted-foreground text-center py-4">Drop a ball to start playing!</p>
      </div>
    );
  }

  return (
    <div className="glass rounded-xl p-4 animate-fade-in">
      <h3 className="text-xs text-muted-foreground uppercase tracking-wider mb-3">Recent Results</h3>

      {/* Quick results strip */}
      <div className="flex gap-1 mb-3 overflow-x-auto pb-1">
        {results.slice(0, 20).map(r => (
          <span
            key={r.id}
            className={`shrink-0 px-2 py-0.5 rounded text-xs font-mono font-medium animate-scale-in ${
              r.multiplier >= 2
                ? 'bg-win/20 text-win'
                : r.multiplier >= 1
                ? 'bg-primary/20 text-primary'
                : 'bg-destructive/15 text-destructive'
            }`}
          >
            {r.multiplier}x
          </span>
        ))}
      </div>

      {/* Detailed history */}
      <div className="space-y-1 max-h-48 overflow-y-auto">
        {results.slice(0, 10).map(r => (
          <div
            key={r.id}
            className="flex items-center justify-between text-xs py-1.5 px-2 rounded-md bg-secondary/30"
          >
            <span className="text-muted-foreground font-mono">{r.bet} VOI</span>
            <span
              className={`font-mono font-semibold ${
                r.profit > 0 ? 'text-win' : r.profit < 0 ? 'text-destructive' : 'text-muted-foreground'
              }`}
            >
              {r.profit >= 0 ? '+' : ''}{r.profit.toFixed(2)}
            </span>
            <span
              className={`font-mono ${
                r.multiplier >= 2 ? 'text-win' : r.multiplier >= 1 ? 'text-primary' : 'text-muted-foreground'
              }`}
            >
              {r.multiplier}x
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
