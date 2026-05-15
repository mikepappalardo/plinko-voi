import { useEffect, useRef, useState } from 'react';

interface Props {
  rows: number;
  risk: 'low' | 'mid' | 'high';
  dropping: boolean;
  onLand: (bucket: number) => void;
}

const PLINK_SIZE = 10;
const BALL_R = 8;
const COL_W = 36;

export default function PlinkoBoard({ rows, risk, dropping, onLand }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const [ballPos, setBallPos] = useState<{ x: number; y: number } | null>(null);

  const cols = rows + 1;
  const W = cols * COL_W + COL_W;
  const H = rows * 40 + 80;

  // Peg positions
  const pegs: [number, number][] = [];
  for (let r = 0; r < rows; r++) {
    const count = r + 2;
    const offset = (W - (count - 1) * COL_W) / 2;
    for (let c = 0; c < count; c++) {
      pegs.push([offset + c * COL_W, 60 + r * 40]);
    }
  }

  const bucketColors: Record<string, string[]> = {
    low:  ['#22c55e','#4ade80','#86efac','#d1fae5','#fef9c3','#fde68a','#22c55e'],
    mid:  ['#f59e0b','#fbbf24','#fcd34d','#fef9c3','#fde68a','#fbbf24','#f59e0b'],
    high: ['#ef4444','#f97316','#fbbf24','#fef9c3','#fde68a','#f97316','#ef4444'],
  };

  function drawBoard(ctx: CanvasRenderingContext2D, bx?: number, by?: number) {
    ctx.clearRect(0, 0, W, H);

    // Background
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, W, H);

    // Pegs
    pegs.forEach(([px, py]) => {
      ctx.beginPath();
      ctx.arc(px, py, PLINK_SIZE / 2, 0, Math.PI * 2);
      ctx.fillStyle = '#38bdf8';
      ctx.fill();
    });

    // Buckets
    const bucketY = 60 + rows * 40 + 10;
    const colors = bucketColors[risk];
    for (let i = 0; i < cols; i++) {
      const bw = COL_W - 4;
      const bxPos = (W - cols * COL_W) / 2 + i * COL_W + 2;
      const color = colors[Math.min(i < cols / 2 ? i : cols - 1 - i, colors.length - 1)];
      ctx.fillStyle = color + '44';
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(bxPos, bucketY, bw, 28, 4);
      ctx.fill();
      ctx.stroke();
    }

    // Ball
    if (bx !== undefined && by !== undefined) {
      ctx.beginPath();
      ctx.arc(bx, by, BALL_R, 0, Math.PI * 2);
      const grad = ctx.createRadialGradient(bx - 2, by - 2, 1, bx, by, BALL_R);
      grad.addColorStop(0, '#fef08a');
      grad.addColorStop(1, '#f59e0b');
      ctx.fillStyle = grad;
      ctx.fill();
    }
  }

  useEffect(() => {
    if (!dropping) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;

    // Simulate path
    let x = W / 2;
    let pegRow = 0;
    const path: [number, number][] = [[x, 20]];
    const dirs: number[] = [];

    for (let r = 0; r < rows; r++) {
      const d = Math.random() < 0.5 ? -1 : 1;
      dirs.push(d);
      x += d * COL_W / 2;
      path.push([x, 60 + r * 40]);
    }

    const finalBucket = dirs.filter(d => d > 0).length;

    // Animate over 3 seconds
    let step = 0;
    const totalSteps = path.length * 15;
    const startTime = performance.now();

    function animate() {
      const elapsed = performance.now() - startTime;
      const progress = Math.min(elapsed / 3000, 1);
      const idx = Math.min(Math.floor(progress * (path.length - 1)), path.length - 2);
      const t = (progress * (path.length - 1)) - idx;
      const [x1, y1] = path[idx];
      const [x2, y2] = path[idx + 1];
      const bx = x1 + (x2 - x1) * t;
      const by = y1 + (y2 - y1) * t;

      drawBoard(ctx, bx, by);

      if (progress < 1) {
        animRef.current = requestAnimationFrame(animate);
      } else {
        drawBoard(ctx, path[path.length - 1][0], 60 + rows * 40 + 20);
        setTimeout(() => onLand(finalBucket), 300);
      }
    }

    animRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animRef.current);
  }, [dropping]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    drawBoard(ctx);
  }, [rows, risk]);

  return (
    <canvas
      ref={canvasRef}
      width={W}
      height={H}
      style={{ borderRadius: 12, display: 'block', margin: '0 auto' }}
    />
  );
}
