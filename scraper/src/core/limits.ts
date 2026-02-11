// scraper/src/core/limits.ts
export function clamp<T>(arr: T[], n: number) {
  return arr.slice(0, Math.max(0, n));
}
