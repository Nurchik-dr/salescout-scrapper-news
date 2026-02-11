// scraper/src/sources/kz/informburo.ts
import { RawNews } from "../../types";
import { fetchHtml } from "../../core/html";
import { absUrl } from "../../core/url";
import { clamp } from "../../core/limits";
import { parseFullArticle } from "../../core/article";

function detectInformburoCategory(link: string): string {
  if (link.includes("/interview")) return "Интервью";
  if (link.includes("/stati") || link.includes("/istorii")) return "Истории";
  return "Новости";
}

export async function scrapeInformburo(): Promise<RawNews[]> {
  const base = "https://informburo.kz/";
  const $ = await fetchHtml(base);

  const items: RawNews[] = [];
  $("a[href]").each((_, el) => {
    const href = $(el).attr("href") || "";
    const title = $(el).text().trim();

    if (!title || title.length < 20) return;
    if (
      !href.includes("/novosti/") &&
      !href.includes("/interview/") &&
      !href.includes("/stati/") &&
      !href.includes("/istorii/")
    ) return;

    const link = absUrl(base, href);

    items.push({
      source: "informburo.kz",
      rawTitle: title,
      rawUrl: link,
      rawCategory: detectInformburoCategory(link),
      rawDate: new Date().toISOString(),
    });
  });

  const unique = Array.from(new Map(items.map((x) => [x.rawUrl, x])).values());
  const limited = clamp(unique, 100);

  for (const it of limited) {
    if (!it.rawUrl) continue;
    const full = await parseFullArticle(it.rawUrl, {
      text: [".news-text p", ".article__text p", "article p"],
      image: ['meta[property="og:image"]', "article img"],
      date: ['meta[property="article:published_time"]', "time[datetime]"],
    });
    if (full?.text) it.rawText = full.text;
    if (full?.image) it.rawImage = full.image;
    if (full?.date) it.rawDate = full.date;
  }

  return limited;
}
