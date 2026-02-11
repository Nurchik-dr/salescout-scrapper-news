// scraper/src/sources/kz/mgorod.ts
import { makeSiteScraper } from "../../core/genericSiteScraper";

export const scrapeMgorod = makeSiteScraper({
  id: "mgorod",
  source: "mgorod.kz",
  startUrls: ["https://mgorod.kz/"],
  maxItems: 120,
  enrich: true,
});
