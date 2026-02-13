// scraper/src/sources/kz/sportnews.ts
import { RawNews } from "../../types";
import { fetchHtml } from "../../core/html";
import { absUrl } from "../../core/url";
import { clamp } from "../../core/limits";
import { parseFullArticle } from "../../core/article";

export async function scrapeSportnews(): Promise<RawNews[]> {
  const base = "https://sportnews.kz/";
  const $ = await fetchHtml(base);

  const items: RawNews[] = [];

  $("a[href*='/tennis/'], a[href*='/football/'], a[href*='/boxing/'], a[href*='/sport/']").each(
    (_, el) => {
      const href = $(el).attr("href") || "";
      const title = $(el).text().trim();

      if (!title || title.length < 15) return;

      const link = absUrl(base, href);

      items.push({
        source: "sportnews.kz",
        rawTitle: title,
        rawUrl: link,
        rawDate: new Date().toISOString(),
        rawCategory: "Спорт",
      });
    }
  );

  const unique = Array.from(new Map(items.map((x) => [x.rawUrl, x])).values());
  const limited = clamp(unique, 60);

  for (const it of limited) {
    if (!it.rawUrl) continue;

    const full = await parseFullArticle(it.rawUrl, {
      text: ["article p", ".content p", ".post-content p"],
      image: ['meta[property="og:image"]', "article img"],
      date: ['meta[property="article:published_time"]', "time[datetime]"],
    });

    if (full?.text) it.rawText = full.text;
    if (full?.image) it.rawImage = full.image;
    if (full?.date) it.rawDate = full.date;
  }

  return limited;
}
