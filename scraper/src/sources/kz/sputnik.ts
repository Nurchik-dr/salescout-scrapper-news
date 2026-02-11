import { scrapeRss } from "../rssScraper";

export async function scrapeSputnik() {
  return scrapeRss("https://sputniknews.kz/export/rss2/archive/index.xml");
}
