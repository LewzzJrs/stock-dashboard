const money = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const compact = new Intl.NumberFormat("en-US", {
  notation: "compact",
  maximumFractionDigits: 2,
});

const whole = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 });

export function formatPrice(value: number): string {
  return money.format(value);
}

export function formatMoney(value: number): string {
  return `$${money.format(value)}`;
}

export function formatCompact(value: number): string {
  return compact.format(value);
}

export function formatShares(value: number): string {
  return whole.format(value);
}

/**
 * Percentages print to two places, so anything under half of the last place is
 * flat. Without this a rounding crumb like -0.000001 draws a red "down".
 */
export function direction(value: number): -1 | 0 | 1 {
  if (value >= 0.005) return 1;
  if (value <= -0.005) return -1;
  return 0;
}

function sign(value: number): string {
  return value > 0 ? "+" : value < 0 ? "−" : "";
}

export function formatPercent(value: number): string {
  const flat = direction(value) === 0 ? 0 : value;
  return `${sign(flat)}${money.format(Math.abs(flat))}%`;
}

export function formatDelta(value: number): string {
  return `${sign(value)}${money.format(Math.abs(value))}`;
}

export function formatDay(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function formatStamp(iso: string): string {
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function normalizeSymbol(input: string): string {
  return input.trim().toUpperCase().replace(/[^A-Z0-9.\-]/g, "");
}
