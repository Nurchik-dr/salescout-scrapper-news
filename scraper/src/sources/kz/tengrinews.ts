// scraper/src/sources/kz/tengrinews.ts
import { RawNews } from "../../types";
import { fetchHtml } from "../../core/html";
import { absUrl } from "../../core/url";
import { clamp } from "../../core/limits";
import { parseFullArticle } from "../../core/article";

export async function scrapeTengrinews(): Promise<RawNews[]> {
  const base = "https://tengrinews.kz/";
  const $ = await fetchHtml(base);

  const items: RawNews[] = [];

  $(
    "a[href*='/kazakhstan_news/'], a[href*='/world_news/'], a[href*='/business_news/'], a[href*='/sport_news/']"
  ).each((_, el) => {
    const href = $(el).attr("href") || "";
    const title = $(el).text().trim();

    if (!title || title.length < 20) return;

    const link = absUrl(base, href);

    const region = href.includes("/kazakhstan_news/") ? "kz" : "world";

    items.push({
      source: "tengrinews.kz",
      rawTitle: title,
      rawUrl: link,
      rawDate: new Date().toISOString(),
      rawCategory: "Новости",
      region,
    } as any);
  });

  const unique = Array.from(new Map(items.map((x) => [x.rawUrl, x])).values());
  const limited = clamp(unique, 60);

  for (const it of limited) {
    if (!it.rawUrl) continue;
    const full = await parseFullArticle(it.rawUrl, {
      text: [
        ".content_main_text p",
        "article .text p",
        "div.article_text p",
        "div.text p",
      ],
      image: ['meta[property="og:image"]', "article img", ".main_image img"],
      date: [
        'meta[property="article:published_time"]',
        "time[datetime]",
        ".date time",
      ],
    });
    if (full?.text) it.rawText = full.text;
    if (full?.image) it.rawImage = full.image;
    if (full?.date) it.rawDate = full.date;
  }

  return limited;
}
