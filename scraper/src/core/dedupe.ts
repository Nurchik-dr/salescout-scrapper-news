// scraper/src/core/dedupe.ts
import { RawNews } from "../types";

export function dedupeByUrl(items: RawNews[]) {
  return Array.from(new Map(items.map((x) => [x.rawUrl, x])).values());
}
