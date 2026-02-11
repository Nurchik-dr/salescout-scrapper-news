// scraper/src/sources/kz/khabar.ts
import { RawNews } from "../../types";
import { fetchHtml } from "../../core/html";
import { absUrl } from "../../core/url";
import { clamp } from "../../core/limits";
import { parseFullArticle } from "../../core/article";

function detectKhabarCategory(href: string): string {
  if (href.includes("/sport")) return "Спорт";
  if (href.includes("/economy")) return "Экономика";
  if (href.includes("/culture")) return "Культура";
  if (href.includes("/society")) return "Общество";
  if (href.includes("/world")) return "Мир";
  if (href.includes("/politics")) return "Политика";
  return "Новости";
}

export async function scrapeKhabar(): Promise<RawNews[]> {
  const base = "https://khabar.kz/ru/news";
  const $ = await fetchHtml(base);

  const items: RawNews[] = [];
  $("a[href]").each((_, el) => {
    const href = $(el).attr("href") || "";
    const title = $(el).text().trim();

    if (!href || !title || title.length < 20) return;
    if (!href.includes("/ru/news/")) return;

    const link = absUrl(base, href);

    items.push({
      source: "khabar.kz",
      rawTitle: title,
      rawUrl: link,
      rawDate: new Date().toISOString(),
      rawCategory: detectKhabarCategory(href),
    });
  });

  const unique = Array.from(new Map(items.map((x) => [x.rawUrl, x])).values());
  const limited = clamp(unique, 80);

  for (const it of limited) {
    if (!it.rawUrl) continue;
    const full = await parseFullArticle(it.rawUrl);
    if (full?.text) it.rawText = full.text;
    if (full?.image) it.rawImage = full.image;
    if (full?.date) it.rawDate = full.date;
  }

  return limited;
}
