// scraper/src/sources/kz/otyrar.ts
import { makeSiteScraper } from "../../core/genericSiteScraper";

export const scrapeOtyrar = makeSiteScraper({
  id: "otyrar",
  source: "otyrar.kz",
  startUrls: ["https://otyrar.kz/"],
  link: {
    requireAny: [/\/\d{4}\//],
    exclude: ["/tag/", "/category/"],
  },
  maxItems: 80,
  enrich: true,
  selectors: {
    text: ["article p", ".entry-content p"],
    image: ['meta[property="og:image"]', ".entry-content img", "article img"],
    date: ['meta[property="article:published_time"]', "time[datetime]"],
  },
});

