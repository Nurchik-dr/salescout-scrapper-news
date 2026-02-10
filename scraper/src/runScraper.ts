import mongoose from "mongoose";
import { scrapeRss } from "./sources/rssScraper";
import { scrapeSite } from "./sources/siteScraper";
import { scrapeTelegram } from "./sources/telegramScraper";
import { RawNews } from "./types";
import { scrapeInformburo, scrapeKhabar, scrapeNur, scrapePositivNews, scrapeSputnik, scrapeTengrinews, scrapeZakon } from "./sources/kzSitesScraper";

export async function runScraper(): Promise<RawNews[]> {
  await mongoose.connect("mongodb://localhost:27017/positive_news");

  // ✅ RSS источники (много)
  const rssSources = [
    // RU
    "https://lenta.ru/rss/news",
    "https://www.interfax.ru/rss.asp",

    // KZ
    "https://khabar.kz/rss",
    "https://www.zakon.kz/rss/all.xml",
    "https://kapital.kz/rss",
    "https://baigenews.kz/rss",
    "https://forbes.kz/rss",
    "https://liter.kz/rss",
    "https://tengrinews.kz/rss/news/",
  ];

  // ✅ HTML scraping
  const siteSources: string[] = ["https://tengrinews.kz/news/"];

  // ✅ Parallel scraping
  const rssResults = await Promise.all(
    rssSources.map((url) =>
      scrapeRss(url).catch(() => [])
    )
  );

  const siteResults = await Promise.all(
    siteSources.map((url) =>
      scrapeSite(url).catch(() => [])
    )
  );

  // ✅ Telegram
  const telegramResults = await scrapeTelegram().catch(() => []);

  // ✅ Казахстанские сайты
  const nurResults = await scrapeNur().catch(() => []);
  const informburoResults = await scrapeInformburo().catch(() => []);
  const khabarResults = await scrapeKhabar().catch(() => []);
  const zakonResults = await scrapeZakon().catch(() => []);
  const sputnikResults = await scrapeSputnik().catch(() => []);
  const tengriResults = await scrapeTengrinews().catch(() => []);
const positivNewsResults = await scrapePositivNews().catch(() => []);

  // ✅ Итоговый raw_news
  const rawNews: RawNews[] = [
    ...rssResults.flat(),
    ...siteResults.flat(),
    ...telegramResults,
    ...nurResults,
    ...informburoResults,
    ...khabarResults,
    ...zakonResults,
    ...sputnikResults,
    ...tengriResults,
    ...positivNewsResults,
  ];

  // ✅ убираем дубли по ссылке
  const unique = Array.from(
    new Map(rawNews.map((x) => [x.rawUrl, x])).values()
  );

  // ✅ Stats
  const stats: Record<string, number> = {};
  for (const item of unique) {
    stats[item.source] = (stats[item.source] || 0) + 1;
  }

  console.log("📊 Sources stats:");
  Object.entries(stats).forEach(([src, count]) => {
    console.log(`   ${src}: ${count}`);
  });

  // ✅ Save raw_news
  if (unique.length > 0) {
    await mongoose.connection.collection("raw_news").deleteMany({});
    await mongoose.connection.collection("raw_news").insertMany(unique);
  }

  console.log(
    `✅ Scraped ${unique.length} raw items and saved to raw_news`
  );

  await mongoose.disconnect();
  return unique;
}

runScraper().catch((error) => {
  console.error("❌ Scraper failed:", error);
  process.exit(1);
});
