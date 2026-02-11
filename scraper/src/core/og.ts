// scraper/src/core/og.ts
import * as cheerio from "cheerio";
import { fetchRawHtml } from "./html";
import { absUrl } from "./url";

export async function extractOgImage(url: string): Promise<string | undefined> {
  try {
    const html = await fetchRawHtml(url);
    const $ = cheerio.load(html);

    let img =
      $('meta[property="og:image"]').attr("content") ||
      $('meta[name="twitter:image"]').attr("content") ||
      undefined;

    if (!img) {
      img =
        $("article img").first().attr("src") ||
        $(".post img").first().attr("src") ||
        $("img").first().attr("src") ||
        undefined;
    }
    if (!img) return undefined;

    return absUrl(url, img);
  } catch {
    return undefined;
  }
}
