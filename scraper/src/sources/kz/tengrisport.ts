// scraper/src/sources/kz/tengrisport.ts
import { RawNews } from "../../types";
import { fetchHtml } from "../../core/html";
import { absUrl } from "../../core/url";
import { clamp } from "../../core/limits";
import { parseFullArticle } from "../../core/article";

function detectTengriSportCategory(link: string): string {
  if (link.includes("/football")) return "Футбол";
  if (link.includes("/hockey")) return "Хоккей";
  if (link.includes("/boxing")) return "Бокс";
  if (link.includes("/tennis")) return "Теннис";
  return "Спорт";
}

export async function scrapeTengriSport(): Promise<RawNews[]> {
  const base = "https://tengrisport.kz/";
  const $ = await fetchHtml(base);

  const items: RawNews[] = [];
  $("a[href]").each((_, el) => {
    const href = $(el).attr("href") || "";
    const title = $(el).text().trim();

    if (!title || title.length < 20) return;
    if (!href.includes(".kz/")) return;

    const link = absUrl(base, href);

    items.push({
      source: "tengrisport.kz",
      rawTitle: title,
      rawUrl: link,
      rawDate: new Date().toISOString(),
      rawCategory: detectTengriSportCategory(link),
    });
  });

  const unique = Array.from(new Map(items.map((x) => [x.rawUrl, x])).values());
  const limited = clamp(unique, 100);

  for (const it of limited) {
    if (!it.rawUrl) continue;
    const full = await parseFullArticle(it.rawUrl);
    if (full?.text) it.rawText = full.text;
    if (full?.image) it.rawImage = full.image;
    if (full?.date) it.rawDate = full.date;
  }

  return limited;
}
