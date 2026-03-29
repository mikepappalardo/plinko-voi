const placeholderData = [
  { rank: 1, name: 'VoiWhale.algo', wins: 1_842, profit: 12_450.5 },
  { rank: 2, name: '0xPlinko...f3a1', wins: 1_205, profit: 8_320.0 },
  { rank: 3, name: 'Degen4Life.algo', wins: 987, profit: 5_100.75 },
  { rank: 4, name: '0xLucky...b2c9', wins: 754, profit: 3_890.2 },
  { rank: 5, name: 'VoiMaxi.algo', wins: 612, profit: 2_150.0 },
];

const rankColors = ['text-yellow-400', 'text-gray-300', 'text-amber-600'];

export default function Leaderboard() {
  return (
    <div className="glass rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs text-muted-foreground uppercase tracking-wider">Leaderboard</h3>
        <span className="text-[10px] px-2 py-0.5 rounded-full bg-secondary text-muted-foreground">Coming Soon</span>
      </div>
      <div className="space-y-1.5">
        {placeholderData.map((entry) => (
          <div
            key={entry.rank}
            className="flex items-center gap-3 px-3 py-2 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors"
          >
            <span className={`font-mono font-bold text-sm w-5 ${rankColors[entry.rank - 1] ?? 'text-muted-foreground'}`}>
              {entry.rank}
            </span>
            <span className="flex-1 text-sm text-foreground font-medium truncate">{entry.name}</span>
            <span className="text-xs text-muted-foreground">{entry.wins} wins</span>
            <span className="font-mono text-xs text-primary font-semibold">+{entry.profit.toLocaleString()}</span>
          </div>
        ))}
      </div>
      <p className="text-[10px] text-muted-foreground mt-3 text-center">
        Live leaderboard will be available with on-chain play on Voi Network.
      </p>
    </div>
  );
}
