// scraper/src/sources/kz/zakon.ts
import { RawNews } from "../../types";
import { fetchHtml } from "../../core/html";
import { absUrl } from "../../core/url";
import { clamp } from "../../core/limits";
import { parseFullArticle } from "../../core/article";

export async function scrapeZakon(): Promise<RawNews[]> {
  const base = "https://www.zakon.kz/";
  const $ = await fetchHtml(base);

  const items: RawNews[] = [];
  $("a[href]").each((_, el) => {
    const href = $(el).attr("href") || "";
    const title = $(el).text().trim();

    if (!title || title.length < 20) return;
    if (!href.includes(".html")) return;

    const link = absUrl(base, href);

    items.push({
      source: "zakon.kz",
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
    const full = await parseFullArticle(it.rawUrl);
    if (full?.text) it.rawText = full.text;
    if (full?.image) it.rawImage = full.image;
    if (full?.date) it.rawDate = full.date;
  }

  return limited;
}
