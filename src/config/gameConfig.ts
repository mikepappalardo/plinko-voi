export type RiskLevel = 'low' | 'medium' | 'high';
export type BoardSize = 8 | 12 | 16;

export interface PayoutConfig {
  multipliers: number[];
  colors: string[];
}

// Generate symmetric colors for any bucket count
function symmetricColors(count: number, hueStart: number, hueEnd: number, satStart: number, satEnd: number, lightStart: number, lightEnd: number): string[] {
  const half = Math.ceil(count / 2);
  const colors: string[] = [];
  for (let i = 0; i < half; i++) {
    const t = i / (half - 1 || 1);
    const h = Math.round(hueStart + (hueEnd - hueStart) * t);
    const s = Math.round(satStart + (satEnd - satStart) * t);
    const l = Math.round(lightStart + (lightEnd - lightStart) * t);
    colors.push(`hsl(${h}, ${s}%, ${l}%)`);
  }
  const mirrored = [...colors.slice(0, Math.floor(count / 2))].reverse();
  return [...colors, ...mirrored].slice(0, count);
}

// Generate symmetric multipliers from half-array
function mirror(half: number[]): number[] {
  return [...half, ...[...half].reverse()];
}

export const BOARD_SIZES: BoardSize[] = [8, 12, 16];

export const PAYOUT_TABLES: Record<BoardSize, Record<RiskLevel, PayoutConfig>> = {
  8: {
    low: {
      multipliers: mirror([1.3, 1.1, 0.8, 0.5]),
      colors: symmetricColors(8, 165, 250, 80, 20, 45, 20),
    },
    medium: {
      multipliers: mirror([2.5, 1.5, 0.5, 0.3]),
      colors: symmetricColors(8, 45, 10, 100, 25, 55, 22),
    },
    high: {
      multipliers: mirror([7, 3, 0.5, 0.2]),
      colors: symmetricColors(8, 0, 260, 80, 30, 55, 22),
    },
  },
  12: {
    low: {
      multipliers: mirror([1.4, 1.2, 1, 0.8, 0.5, 0.3]),
      colors: symmetricColors(12, 165, 250, 80, 20, 45, 20),
    },
    medium: {
      multipliers: mirror([3, 2, 1.2, 0.5, 0.3, 0.2]),
      colors: symmetricColors(12, 45, 10, 100, 25, 55, 22),
    },
    high: {
      multipliers: mirror([8, 4, 2, 0.5, 0.2, 0.1]),
      colors: symmetricColors(12, 0, 260, 80, 30, 55, 22),
    },
  },
  16: {
    low: {
      multipliers: mirror([1.5, 1.2, 1.1, 1, 0.8, 0.5, 0.3, 0.2]),
      colors: symmetricColors(16, 165, 250, 80, 20, 45, 20),
    },
    medium: {
      multipliers: mirror([3, 2, 1.5, 1, 0.5, 0.3, 0.2, 0.2]),
      colors: symmetricColors(16, 45, 10, 100, 25, 55, 22),
    },
    high: {
      multipliers: mirror([10, 5, 3, 1.5, 0.5, 0.2, 0.1, 0.1]),
      colors: symmetricColors(16, 0, 260, 80, 30, 55, 22),
    },
  },
};

export const BOARD_CONFIG = {
  pegRadius: 4,
  ballRadius: 7,
  pegGap: 36,
  pegColor: 'hsl(165, 80%, 45%)',
  ballColor: 'hsl(45, 100%, 55%)',
  boardPadding: 20,
};

export const BET_OPTIONS = [0.1, 0.5, 1, 2, 5, 10, 25, 50, 100];

export const INITIAL_BALANCE = 1000;
