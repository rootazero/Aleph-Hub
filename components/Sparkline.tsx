export function Sparkline({ points, color }: { points: number[]; color: string }) {
  if (!points.length) return <svg width={50} height={18} viewBox="0 0 56 18" aria-hidden />;
  const pts = points.map((y, i) => `${(i / (points.length - 1)) * 56},${y}`).join(" ");
  return (
    <svg width={50} height={18} viewBox="0 0 56 18">
      <polyline points={pts} fill="none" stroke={color} strokeWidth={1.5} />
    </svg>
  );
}
