import Parser from "rss-parser";
import { RawNews } from "../types";
import { extractOgImage } from "../core/og";

const parser = new Parser();

export async function scrapeRss(url: string): Promise<RawNews[]> {
  try {
    const feed = await parser.parseURL(url);

    const items: RawNews[] = [];

    for (const entry of feed.items.slice(0, 80)) {
      if (!entry.link || !entry.title) continue;

      const img =
        (entry.enclosure?.url as string | undefined) ||
        (await extractOgImage(entry.link));

      items.push({
        source: new URL(url).hostname,
        rawTitle: entry.title,
        rawUrl: entry.link,
        rawDate: entry.pubDate || new Date().toISOString(),
        rawImage: img,
        rawCategory: "RSS",
      });
    }

    return items;
  } catch {
    return [];
  }
}
