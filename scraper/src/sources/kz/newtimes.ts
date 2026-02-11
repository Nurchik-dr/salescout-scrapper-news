// scraper/src/sources/kz/newtimes.ts
import { makeSiteScraper } from "../../core/genericSiteScraper";

export const scrapeNewtimes = makeSiteScraper({
  id: "newtimes",
  source: "newtimes.kz",
  startUrls: ["https://newtimes.kz/"],
  maxItems: 120,
  enrich: true,
});
