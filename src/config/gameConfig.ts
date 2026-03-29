export type RiskLevel = 'low' | 'medium' | 'high';

export interface PayoutConfig {
  multipliers: number[];
  colors: string[];
}

// 16 rows of pegs = 17 payout slots (for the default board)
// Symmetrical multipliers
export const PAYOUT_TABLES: Record<RiskLevel, PayoutConfig> = {
  low: {
    multipliers: [1.5, 1.2, 1.1, 1, 0.8, 0.5, 0.3, 0.2, 0.2, 0.3, 0.5, 0.8, 1, 1.1, 1.2, 1.5],
    colors: [
      'hsl(165, 80%, 45%)', 'hsl(165, 70%, 40%)', 'hsl(170, 60%, 35%)',
      'hsl(180, 50%, 30%)', 'hsl(200, 40%, 28%)', 'hsl(220, 30%, 25%)',
      'hsl(240, 25%, 22%)', 'hsl(250, 20%, 20%)',
      'hsl(250, 20%, 20%)', 'hsl(240, 25%, 22%)',
      'hsl(220, 30%, 25%)', 'hsl(200, 40%, 28%)', 'hsl(180, 50%, 30%)',
      'hsl(170, 60%, 35%)', 'hsl(165, 70%, 40%)', 'hsl(165, 80%, 45%)',
    ],
  },
  medium: {
    multipliers: [3, 2, 1.5, 1, 0.5, 0.3, 0.2, 0.2, 0.2, 0.2, 0.3, 0.5, 1, 1.5, 2, 3],
    colors: [
      'hsl(45, 100%, 55%)', 'hsl(40, 90%, 50%)', 'hsl(35, 80%, 45%)',
      'hsl(30, 70%, 40%)', 'hsl(25, 50%, 35%)', 'hsl(20, 40%, 30%)',
      'hsl(15, 30%, 25%)', 'hsl(10, 25%, 22%)',
      'hsl(10, 25%, 22%)', 'hsl(15, 30%, 25%)',
      'hsl(20, 40%, 30%)', 'hsl(25, 50%, 35%)', 'hsl(30, 70%, 40%)',
      'hsl(35, 80%, 45%)', 'hsl(40, 90%, 50%)', 'hsl(45, 100%, 55%)',
    ],
  },
  high: {
    multipliers: [10, 5, 3, 1.5, 0.5, 0.2, 0.1, 0.1, 0.1, 0.1, 0.2, 0.5, 1.5, 3, 5, 10],
    colors: [
      'hsl(0, 80%, 55%)', 'hsl(350, 75%, 50%)', 'hsl(340, 65%, 45%)',
      'hsl(330, 55%, 40%)', 'hsl(310, 45%, 35%)', 'hsl(290, 40%, 30%)',
      'hsl(270, 35%, 25%)', 'hsl(260, 30%, 22%)',
      'hsl(260, 30%, 22%)', 'hsl(270, 35%, 25%)',
      'hsl(290, 40%, 30%)', 'hsl(310, 45%, 35%)', 'hsl(330, 55%, 40%)',
      'hsl(340, 65%, 45%)', 'hsl(350, 75%, 50%)', 'hsl(0, 80%, 55%)',
    ],
  },
};

export const BOARD_CONFIG = {
  rows: 16,
  get bucketCount() { return this.rows; },
  pegRadius: 4,
  ballRadius: 7,
  pegGap: 36,
  pegColor: 'hsl(165, 80%, 45%)',
  ballColor: 'hsl(45, 100%, 55%)',
  boardPadding: 20,
};

export const BET_OPTIONS = [0.1, 0.5, 1, 2, 5, 10, 25, 50, 100];

export const INITIAL_BALANCE = 1000;
