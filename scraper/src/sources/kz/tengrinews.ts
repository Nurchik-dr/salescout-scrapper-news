// scraper/src/sources/kz/tengrinews.ts
import { RawNews } from "../../types";
import { fetchHtml } from "../../core/html";
import { absUrl } from "../../core/url";
import { clamp } from "../../core/limits";
import { parseFullArticle } from "../../core/article";

export async function scrapeTengrinews(): Promise<RawNews[]> {
  const base = "https://tengrinews.kz/news/";
  const $ = await fetchHtml(base);

  const items: RawNews[] = [];
  $("a[href*='/news/']").each((_, el) => {
    const href = $(el).attr("href") || "";
    const title = $(el).text().trim();

    if (!title || title.length < 20) return;

    const link = absUrl(base, href);

    items.push({
      source: "tengrinews.kz",
      rawTitle: title,
      rawUrl: link,
      rawDate: new Date().toISOString(),
      rawCategory: "Новости",
    });
  });

  const unique = Array.from(new Map(items.map((x) => [x.rawUrl, x])).values());
  const limited = clamp(unique, 60);

  for (const it of limited) {
    if (!it.rawUrl) continue;
    const full = await parseFullArticle(it.rawUrl, {
      text: [".content_main_text p", "article p"],
      image: ['meta[property="og:image"]', "article img"],
      date: ['meta[property="article:published_time"]', "time[datetime]"],
    });
    if (full?.text) it.rawText = full.text;
    if (full?.image) it.rawImage = full.image;
    if (full?.date) it.rawDate = full.date;
  }

  return limited;
}
