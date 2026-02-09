import mongoose from "mongoose";
import { scrapeRss } from "./sources/rssScraper";
import { scrapeSite } from "./sources/siteScraper";
import { scrapeTelegram } from "./sources/telegramScraper";
import { RawNews } from "./types";
import { scrapeInformburo, scrapeNur } from "./sources/kzSitesScraper";

export async function runScraper(): Promise<RawNews[]> {
  await mongoose.connect("mongodb://localhost:27017/positive_news");

  // ✅ RSS источники
  const rssSources = [
    "https://lenta.ru/rss/news",
    "https://www.interfax.ru/rss.asp",
  ];

  // ✅ Tengri HTML scraping
  const siteSources: string[] = ["https://tengrinews.kz/news/"];

  const rssResults = await Promise.all(
    rssSources.map((url) => scrapeRss(url))
  );

  const siteResults = await Promise.all(
    siteSources.map((url) => scrapeSite(url))
  );

  // ✅ Telegram вместо Instagram
  const telegramResults = await scrapeTelegram();
  const nurResults = await scrapeNur(); // добавляем новый источник
  const informburoResults = await scrapeInformburo(); // добавляем новый источник
  const rawNews: RawNews[] = [
    ...rssResults.flat(),
    ...siteResults.flat(),
    ...telegramResults,
    ...nurResults,
    ...informburoResults,
  ];

  // ✅ Stats by source
  const stats: Record<string, number> = {};
  for (const item of rawNews) {
    stats[item.source] = (stats[item.source] || 0) + 1;
  }

  console.log("📊 Sources stats:");
  Object.entries(stats).forEach(([src, count]) => {
    console.log(`   ${src}: ${count}`);
  });

  if (rawNews.length > 0) {
    await mongoose.connection.collection("raw_news").deleteMany({});
    await mongoose.connection.collection("raw_news").insertMany(rawNews);
  }

  console.log(`✅ Scraped ${rawNews.length} RU raw items and saved to raw_news`);

  await mongoose.disconnect();
  return rawNews;
}

runScraper().catch((error) => {
  console.error("❌ Scraper failed:", error);
  process.exit(1);
});