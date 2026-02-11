// scraper/src/sources/kz/nur.ts
import { RawNews } from "../../types";
import { fetchHtml } from "../../core/html";
import { absUrl } from "../../core/url";
import { clamp } from "../../core/limits";
import { parseFullArticle } from "../../core/article";
import { extractOgImage } from "../../core/og";

function detectNurCategory(href: string): string {
  if (href.includes("/sport/")) return "Спорт";
  if (href.includes("/politics/")) return "Политика";
  if (href.includes("/economy/")) return "Экономика";
  if (href.includes("/world/")) return "Мир";
  if (href.includes("/society/")) return "Общество";
  return "Новости";
}

export async function scrapeNur(): Promise<RawNews[]> {
  const base = "https://nur.kz/";
  const $ = await fetchHtml(base);

  const items: RawNews[] = [];
  $("a[href]").each((_, el) => {
    const href = $(el).attr("href") || "";
    const title = $(el).text().trim();

    if (!title || title.length < 20) return;
    if (
      !href.includes("/society/") &&
      !href.includes("/politics/") &&
      !href.includes("/sport/") &&
      !href.includes("/world/") &&
      !href.includes("/economy/")
    ) return;

    const link = absUrl(base, href);

    items.push({
      source: "nur.kz",
      rawTitle: title,
      rawUrl: link,
      rawDate: new Date().toISOString(),
      rawCategory: detectNurCategory(href),
    });
  });

  const unique = Array.from(new Map(items.map((x) => [x.rawUrl, x])).values());
  const limited = clamp(unique, 80);

  for (const it of limited) {
    if (!it.rawUrl) continue;
    const full = await parseFullArticle(it.rawUrl);
    if (full?.text) it.rawText = full.text;
    it.rawImage = full?.image || (await extractOgImage(it.rawUrl));
    if (full?.date) it.rawDate = full.date;
  }

  return limited;
}
