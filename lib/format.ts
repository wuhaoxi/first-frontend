export function formatCompact(value: number): string {
  if (value < 1000) {
    return String(value);
  }

  if (value < 10000) {
    return `${(value / 1000).toFixed(1)}k`;
  }

  return `${Math.round(value / 1000)}k`;
}
