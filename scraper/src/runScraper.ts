import mongoose from "mongoose";
import { allScrapers } from "./sources";
import { RawNews } from "./types";
import { dedupeByUrl } from "./core/dedupe";
import { logStats } from "./core/logger";

export async function runScraper(): Promise<RawNews[]> {
  await mongoose.connect("mongodb://localhost:27017/positive_news");

  const results = await Promise.all(
    allScrapers.map(async (fn) => {
      try {
        const data = await fn();
        console.log("✅ OK:", fn.name, data.length);
        return data;
      } catch (e: any) {
        console.log("❌ FAILED:", fn.name);
        console.log("   ", e.message);
        return [];
      }
    })
  );

  const rawNews = results.flat();
  const unique = dedupeByUrl(rawNews);

  logStats(unique);

  if (unique.length > 0) {
    await mongoose.connection.collection("raw_news").deleteMany({});
    await mongoose.connection.collection("raw_news").insertMany(unique);
  }

  console.log(`✅ Scraped ${unique.length} raw items and saved to raw_news`);

  await mongoose.disconnect();
  return unique;
}

runScraper().catch((error) => {
  console.error("❌ Scraper failed:", error);
  process.exit(1);
});
