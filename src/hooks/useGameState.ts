import { useState, useCallback } from 'react';
import { RiskLevel, BoardSize, INITIAL_BALANCE } from '@/config/gameConfig';

export interface GameResult {
  id: string;
  bet: number;
  multiplier: number;
  payout: number;
  profit: number;
  risk: RiskLevel;
  timestamp: number;
}

export interface SessionStats {
  ballsDropped: number;
  totalWagered: number;
  totalReturned: number;
  netProfit: number;
}

export interface GameState {
  balance: number;
  risk: RiskLevel;
  betAmount: number;
  isDropping: boolean;
  autoMode: boolean;
  tokenMode: boolean;
  results: GameResult[];
  stats: SessionStats;
}

export function useGameState() {
  const [balance, setBalance] = useState(INITIAL_BALANCE);
  const [risk, setRisk] = useState<RiskLevel>('medium');
  const [boardRows, setBoardRows] = useState<BoardSize>(16);
  const [betAmount, setBetAmount] = useState(1);
  const [isDropping, setIsDropping] = useState(false);
  const [autoMode, setAutoMode] = useState(false);
  const [tokenMode, setTokenMode] = useState(false);
  const [results, setResults] = useState<GameResult[]>([]);
  const [stats, setStats] = useState<SessionStats>({
    ballsDropped: 0,
    totalWagered: 0,
    totalReturned: 0,
    netProfit: 0,
  });

  const addResult = useCallback((multiplier: number, bucketIndex: number) => {
    const payout = betAmount * multiplier;
    const profit = payout - betAmount;

    const result: GameResult = {
      id: crypto.randomUUID(),
      bet: betAmount,
      multiplier,
      payout,
      profit,
      risk,
      timestamp: Date.now(),
    };

    setResults(prev => [result, ...prev].slice(0, 50));
    setBalance(prev => prev + payout);
    setStats(prev => ({
      ballsDropped: prev.ballsDropped + 1,
      totalWagered: prev.totalWagered + betAmount,
      totalReturned: prev.totalReturned + payout,
      netProfit: prev.netProfit + profit,
    }));
  }, [betAmount, risk]);

  const deductBet = useCallback(() => {
    if (balance < betAmount) return false;
    setBalance(prev => prev - betAmount);
    return true;
  }, [balance, betAmount]);

  const resetBalance = useCallback(() => {
    setBalance(INITIAL_BALANCE);
    setStats({ ballsDropped: 0, totalWagered: 0, totalReturned: 0, netProfit: 0 });
    setResults([]);
  }, []);

  return {
    balance, risk, boardRows, betAmount, isDropping, autoMode, tokenMode, results, stats,
    setRisk, setBoardRows, setBetAmount, setIsDropping, setAutoMode, setTokenMode,
    addResult, deductBet, resetBalance,
  };
}
