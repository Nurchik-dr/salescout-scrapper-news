// scraper/src/core/article.ts
import * as cheerio from "cheerio";
import { fetchRawHtml } from "./html";
import { absUrl } from "./url";

export type ParsedArticle = {
  text?: string;
  image?: string;
  date?: string;
};

function cleanText(t: string) {
  return t
    .replace(/\s+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
}

export async function parseFullArticle(
  url: string,
  selectors?: {
    text?: string[];
    image?: string[];
    date?: string[];
  }
): Promise<ParsedArticle | null> {
  try {
    const html = await fetchRawHtml(url);
    const $ = cheerio.load(html);

    $("script, style, nav, footer, header, aside, form").remove();

    const textSelectors =
      selectors?.text ?? [
        ".content_main_text p",
        ".news-text p",
        ".article__text p",
        ".post-content p",
        ".entry-content p",
        "article p",
      ];

    const imageSelectors =
      selectors?.image ?? [
        'meta[property="og:image"]',
        'meta[name="twitter:image"]',
        "article img",
        ".entry-content img",
        ".post img",
        "img",
      ];

    const dateSelectors =
      selectors?.date ?? [
        'meta[property="article:published_time"]',
        'meta[name="pubdate"]',
        "time[datetime]",
        "time",
      ];

    // TEXT
    let text = "";
    for (const sel of textSelectors) {
      const got = $(sel)
        .map((_, p) => $(p).text().trim())
        .get()
        .filter((x) => x.length > 30);

      if (got.length) {
        text = got.join("\n\n");
        break;
      }
    }

    if (!text) {
      const block =
        $("article").text().trim() ||
        $(".article").text().trim() ||
        $(".post").text().trim();

      if (block.length > 200) text = block;
    }

    text = cleanText(text);

    // IMAGE (fix for otyrar + lazyload)
    let image: string | undefined;
    for (const sel of imageSelectors) {
      if (sel.startsWith("meta")) {
        image = $(sel).attr("content") || undefined;
      } else {
        image =
          $(sel).first().attr("src") ||
          $(sel).first().attr("data-src") ||
          $(sel).first().attr("data-lazy-src") ||
          $(sel).first().attr("data-original") ||
          undefined;
      }
      if (image) break;
    }

    if (image) image = absUrl(url, image);

    // DATE
    let date: string | undefined;
    for (const sel of dateSelectors) {
      if (sel.startsWith("meta")) {
        date = $(sel).attr("content") || undefined;
      } else if (sel.includes("[datetime]")) {
        date = $(sel).attr("datetime") || undefined;
      } else {
        const dt = $(sel).attr("datetime");
        date = dt || $(sel).text().trim() || undefined;
      }
      if (date && date.length > 5) break;
    }

    return {
      text: text || undefined,
      image,
      date,
    };
  } catch {
    return null;
  }
}
