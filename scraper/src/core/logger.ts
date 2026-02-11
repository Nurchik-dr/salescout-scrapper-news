// scraper/src/core/logger.ts
export function logStats(items: { source: string }[]) {
  const stats: Record<string, number> = {};
  for (const x of items) stats[x.source] = (stats[x.source] || 0) + 1;

  console.log("📊 Sources stats:");
  for (const [src, count] of Object.entries(stats)) {
    console.log(`   ${src}: ${count}`);
  }
}
