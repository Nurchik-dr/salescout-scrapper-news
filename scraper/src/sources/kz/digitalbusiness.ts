import { RawNews } from "../../types";
import { fetchHtml } from "../../core/html";
import { absUrl } from "../../core/url";
import { clamp } from "../../core/limits";

export async function scrapeDigitalbusiness(): Promise<RawNews[]> {
  const base = "https://digitalbusiness.kz/";
  const $ = await fetchHtml(base);

  const items: RawNews[] = [];

  // ✅ реальные карточки статей
  $("a[href*='/202']").each((_, el) => {
    const href = $(el).attr("href") || "";
    const title = $(el).text().trim();

    if (!title || title.length < 20) return;

    items.push({
      source: "digitalbusiness.kz",
      rawTitle: title,
      rawUrl: absUrl(base, href),
      rawDate: new Date().toISOString(),
    });
  });

  return clamp(items, 80);
}
