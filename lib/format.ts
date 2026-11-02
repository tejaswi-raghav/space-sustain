export function formatNumber(value: number, decimals = 0) {
  return new Intl.NumberFormat('en-AE', { maximumFractionDigits: decimals }).format(value);
}
export function formatCoordinate(value: number, positive: string, negative: string) {
  return `${Math.abs(value).toFixed(4)}° ${value >= 0 ? positive : negative}`;
}
