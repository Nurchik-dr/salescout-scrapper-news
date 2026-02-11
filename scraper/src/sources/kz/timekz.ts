import { makeSiteScraper } from "../../core/genericSiteScraper";

export const scrapeTimeKz = makeSiteScraper({
  id: "timekz",
  source: "time.kz",
  startUrls: ["https://time.kz/"],
  link: {
    requireAny: [/\/\d{4}\//, "/news/"],
    exclude: ["/tag/", "/category/"],
  },
  maxItems: 120,
  enrich: true,
});
