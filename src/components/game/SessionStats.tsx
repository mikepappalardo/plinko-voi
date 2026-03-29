import { SessionStats as Stats } from '@/hooks/useGameState';
import { TrendingUp, TrendingDown, Coins, Target } from 'lucide-react';

interface SessionStatsProps {
  stats: Stats;
}

export default function SessionStats({ stats }: SessionStatsProps) {
  const isProfit = stats.netProfit >= 0;

  return (
    <div className="glass rounded-xl p-4 animate-fade-in">
      <h3 className="text-xs text-muted-foreground uppercase tracking-wider mb-3">Session Stats</h3>
      <div className="grid grid-cols-2 gap-3">
        <div className="flex items-center gap-2">
          <Target size={14} className="text-muted-foreground" />
          <div>
            <p className="text-xs text-muted-foreground">Drops</p>
            <p className="font-mono text-sm font-semibold text-foreground">{stats.ballsDropped}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Coins size={14} className="text-muted-foreground" />
          <div>
            <p className="text-xs text-muted-foreground">Wagered</p>
            <p className="font-mono text-sm font-semibold text-foreground">{stats.totalWagered.toFixed(2)}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <TrendingUp size={14} className="text-primary" />
          <div>
            <p className="text-xs text-muted-foreground">Returned</p>
            <p className="font-mono text-sm font-semibold text-foreground">{stats.totalReturned.toFixed(2)}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isProfit ? (
            <TrendingUp size={14} className="text-win" />
          ) : (
            <TrendingDown size={14} className="text-destructive" />
          )}
          <div>
            <p className="text-xs text-muted-foreground">Net P/L</p>
            <p className={`font-mono text-sm font-semibold ${isProfit ? 'text-win' : 'text-destructive'}`}>
              {isProfit ? '+' : ''}{stats.netProfit.toFixed(2)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
