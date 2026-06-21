export function Sparkline({ points, color }: { points: number[]; color: string }) {
  // No trend history yet (first runs): render nothing rather than a dead gap.
  if (!points.length) return null;
  const pts = points.map((y, i) => `${(i / (points.length - 1)) * 56},${y}`).join(" ");
  return (
    <svg width={50} height={18} viewBox="0 0 56 18">
      <polyline points={pts} fill="none" stroke={color} strokeWidth={1.5} />
    </svg>
  );
}
