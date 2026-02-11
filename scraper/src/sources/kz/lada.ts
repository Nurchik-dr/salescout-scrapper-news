// scraper/src/sources/kz/lada.ts
import { makeSiteScraper } from "../../core/genericSiteScraper";

export const scrapeLada = makeSiteScraper({
  id: "lada",
  source: "lada.kz",
  startUrls: ["https://lada.kz/"],
  maxItems: 120,
  enrich: true,
});
