import { useGameState } from '@/hooks/useGameState';

interface EventLogProps {
  results: ReturnType<typeof useGameState>['results'];
}

export default function EventLog({ results }: EventLogProps) {
  const events = results.slice(0, 20);

  return (
    <div className="glass rounded-xl p-4">
      <h3 className="text-xs text-muted-foreground uppercase tracking-wider mb-3">Event Log</h3>
      {events.length === 0 ? (
        <p className="text-xs text-muted-foreground text-center py-4">No events yet — drop a ball to start.</p>
      ) : (
        <div className="space-y-1 max-h-[240px] overflow-y-auto pr-1">
          {events.map((r, i) => {
            const isWin = r.multiplier >= 1;
            return (
              <div
                key={i}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-secondary/30 text-xs"
              >
                <span className="text-muted-foreground font-mono w-6 shrink-0">#{events.length - i}</span>
                <span className="flex-1 text-muted-foreground">
                  Bet {r.bet} → {r.multiplier}×
                </span>
                <span
                  className={`font-mono font-semibold ${
                    r.multiplier >= 5
                      ? 'text-primary'
                      : isWin
                        ? 'text-win'
                        : 'text-destructive'
                  }`}
                >
                  {r.multiplier}×
                </span>
                <span className={`font-mono text-[10px] ${isWin ? 'text-win' : 'text-destructive'}`}>
                  {isWin ? '+' : ''}{r.profit.toFixed(2)}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
