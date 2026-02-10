import Parser from "rss-parser";
import axios from "axios";
import * as cheerio from "cheerio";
import { RawNews } from "../types";

const rssParser = new Parser({
  customFields: {
    item: [
      ["media:content", "mediaContent"],
      ["media:thumbnail", "mediaThumbnail"],
      ["content:encoded", "contentEncoded"],
      ["enclosure", "enclosure"],
    ],
  },
});

/* ===========================
   HELPERS
=========================== */

function cleanTitle(title: string) {
  return title.replace(/•.*$/g, "").replace(/#\S+/g, "").trim();
}

function extractImage(item: any): string | undefined {
  if (item.enclosure?.url) return item.enclosure.url;
  if (item.mediaContent?.$?.url) return item.mediaContent.$.url;
  if (item.mediaThumbnail?.$?.url) return item.mediaThumbnail.$.url;

  const html = item.contentEncoded || item.content || item.summary || "";
  const match = html.match(/<img[^>]+src="([^">]+)"/);

  return match?.[1];
}

// ✅ вытаскиваем полный текст со страницы
async function fetchFullText(url: string): Promise<string> {
  try {
    const res = await axios.get(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X) AppleWebKit/537.36 Chrome/120 Safari/537.36",
      },
    });

    const $ = cheerio.load(res.data);

    // берём все абзацы статьи
    const paragraphs = $("article p")
      .map((_, el) => $(el).text().trim())
      .get()
      .filter(Boolean);

    if (paragraphs.length === 0) return "";

    return paragraphs.slice(0, 20).join("\n\n");
  } catch {
    return "";
  }
}

/* ===========================
   MAIN RSS SCRAPER
=========================== */

export async function scrapeRss(url: string): Promise<RawNews[]> {
  const feed = await rssParser.parseURL(url);

  const results: RawNews[] = [];

  for (const item of feed.items.slice(0, 30)) {
    const title = item.title ? cleanTitle(item.title) : "Без заголовка";

    const link = item.link;
    if (!link) continue;

    // сначала пробуем текст из RSS
    const rssText =
      item.contentSnippet ||
      item.contentEncoded ||
      item.content ||
      item.summary ||
      "";

    // если короткий → идём в статью
    let fullText = rssText.trim();

    if (fullText.length < 200) {
      const scraped = await fetchFullText(link);
      if (scraped.length > 200) {
        fullText = scraped;
      }
    }

    results.push({
      source: feed.title || url,
      rawTitle: title,
      rawText: fullText || "Полный текст недоступен",
      rawUrl: link,
      rawDate: item.isoDate ?? item.pubDate ?? new Date().toISOString(),
      rawImage: extractImage(item),
    });
  }

  return results;
}
