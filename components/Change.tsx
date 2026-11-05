import { direction, formatDelta, formatPercent } from "@/lib/format";

type Size = "sm" | "md" | "lg";

const SIZES: Record<Size, string> = {
  sm: "text-xs",
  md: "text-sm",
  lg: "text-xl",
};

/**
 * Direction rides on the glyph and the sign as well as the hue, so the reading
 * survives colour blindness and forced-colors mode.
 */
export function Change({
  percent,
  delta,
  size = "md",
  showDelta = true,
}: {
  percent: number;
  delta?: number;
  size?: Size;
  showDelta?: boolean;
}) {
  const rising = direction(percent) === 1;
  const falling = direction(percent) === -1;
  const tone = rising ? "text-up" : falling ? "text-down" : "text-muted";
  const glyph = rising ? "▲" : falling ? "▼" : "–";
  const word = rising ? "up" : falling ? "down" : "flat";

  return (
    <span className={`tabular-nums whitespace-nowrap ${SIZES[size]} ${tone}`}>
      <span aria-hidden="true">{glyph} </span>
      <span className="sr-only">{word} </span>
      {formatPercent(percent)}
      {showDelta && delta !== undefined ? (
        <span className="text-muted"> {formatDelta(delta)}</span>
      ) : null}
    </span>
  );
}
