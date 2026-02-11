import { makeSiteScraper } from "../../core/genericSiteScraper";

export const scrape24kz = makeSiteScraper({
  id: "24kz",
  source: "24.kz",
  startUrls: ["https://24.kz/ru/"],
  link: {
    requireAny: [/\/\d{4}\//, "/ru/news/"],
    exclude: ["/video", "/photo"],
  },
  maxItems: 120,
  enrich: true,
});
