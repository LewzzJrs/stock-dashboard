export function Sparkline({
  values,
  rising,
  className,
}: {
  values: number[];
  rising: boolean;
  className?: string;
}) {
  if (values.length < 2) return null;

  const high = Math.max(...values);
  const low = Math.min(...values);
  const span = high - low || 1;
  const points = values
    .map((value, index) => {
      const x = (index / (values.length - 1)) * 100;
      const y = 28 - ((value - low) / span) * 26;
      return `${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(" ");

  return (
    <svg
      viewBox="0 0 100 30"
      preserveAspectRatio="none"
      aria-hidden="true"
      className={`${rising ? "text-up" : "text-down"} ${className ?? ""}`}
    >
      <polyline
        points={points}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        vectorEffect="non-scaling-stroke"
        strokeLinejoin="round"
      />
    </svg>
  );
}
