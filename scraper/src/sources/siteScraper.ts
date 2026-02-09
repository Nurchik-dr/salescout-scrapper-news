import axios from "axios";
import * as cheerio from "cheerio";
import { RawNews } from "../types";

export async function scrapeSite(url: string): Promise<RawNews[]> {
  const response = await axios.get(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X) AppleWebKit/537.36 Chrome/120 Safari/537.36",
      Accept: "text/html",
    },
  });

  const $ = cheerio.load(response.data);

  const items: RawNews[] = [];

  // ✅ Универсальный Tengri парсинг: все ссылки на новости
  $("a[href*='/news/']").each((_, el) => {
    const title = $(el).text().trim();
    const href = $(el).attr("href");

    if (!title || !href) return;
    if (title.length < 20) return;

    const link = href.startsWith("http")
      ? href
      : "https://tengrinews.kz" + href;

    items.push({
      source: "tengrinews.kz",
      rawTitle: title,
      rawUrl: link,
      rawDate: new Date().toISOString(),
    });
  });

  // убираем дубли
  const unique = Array.from(
    new Map(items.map((x) => [x.rawUrl, x])).values()
  );

  return unique.slice(0, 30);
}
