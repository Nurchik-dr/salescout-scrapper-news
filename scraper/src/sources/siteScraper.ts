import axios from "axios";
import * as cheerio from "cheerio";
import { RawNews } from "../types";

async function fetchFullArticle(url: string) {
  try {
    const res = await axios.get(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X) AppleWebKit/537.36 Chrome/120 Safari/537.36",
      },
    });

    const $ = cheerio.load(res.data);

    // ✅ Tengri article text
    const text = $(".content_main_text")
      .text()
      .replace(/\s+/g, " ")
      .trim();

    // ✅ image
    const img =
      $("meta[property='og:image']").attr("content") || undefined;

    // ✅ date
    const date =
      $("meta[property='article:published_time']").attr("content") ||
      new Date().toISOString();

    return { text, img, date };
  } catch {
    return { text: "", img: undefined, date: new Date().toISOString() };
  }
}

export async function scrapeSite(url: string): Promise<RawNews[]> {
  const response = await axios.get(url);
  const $ = cheerio.load(response.data);

  const links: string[] = [];

  $("a[href*='/news/']").each((_, el) => {
    const href = $(el).attr("href");
    if (!href) return;

    const link = href.startsWith("http")
      ? href
      : "https://tengrinews.kz" + href;

    links.push(link);
  });

  const uniqueLinks = Array.from(new Set(links)).slice(0, 10);

  const items: RawNews[] = [];

  for (const link of uniqueLinks) {
    const full = await fetchFullArticle(link);

    if (!full.text) continue;

    items.push({
      source: "tengrinews.kz",
      rawTitle: $("title").text().trim(),
      rawUrl: link,
      rawText: full.text,
      rawImage: full.img,
      rawDate: full.date,
    });
  }

  return items;
}
