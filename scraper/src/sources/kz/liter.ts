import { makeSiteScraper } from "../../core/genericSiteScraper";

export const scrapeLiter = makeSiteScraper({
  id: "liter",
  source: "liter.kz",
  startUrls: ["https://liter.kz/"],
  maxItems: 80,
  enrich: true,
});
