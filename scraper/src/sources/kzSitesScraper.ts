import axios from "axios";
import * as cheerio from "cheerio";
import { RawNews } from "../types";

async function fetchHtml(url: string) {
  const res = await axios.get(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X) AppleWebKit/537.36 Chrome/120 Safari/537.36",
    },
  });

  return cheerio.load(res.data);
}

/* ✅ NUR.KZ */
export async function scrapeNur(): Promise<RawNews[]> {
  const $ = await fetchHtml("https://nur.kz/");

  const items: RawNews[] = [];

  $("a[href]").each((_, el) => {
    const href = $(el).attr("href") || "";
    const title = $(el).text().trim();

    if (!title) return;
    if (title.length < 25) return;

    if (
      !href.includes("/society/") &&
      !href.includes("/politics/") &&
      !href.includes("/sport/") &&
      !href.includes("/world/") &&
      !href.includes("/economy/")
    )
      return;

    const link = href.startsWith("http") ? href : "https://nur.kz" + href;

    // ✅ вытаскиваем картинку
    const img =
      $(el).find("img").attr("src") ||
      $(el).find("img").attr("data-src") ||
      undefined;

    items.push({
      source: "nur.kz",
      rawTitle: title,
      rawUrl: link,
      rawImage: img?.startsWith("http") ? img : undefined,
      rawDate: new Date().toISOString(),
    });
  });

  return Array.from(new Map(items.map((x) => [x.rawUrl, x])).values()).slice(
    0,
    25
  );
}


/* ✅ INFORMBURO */
export async function scrapeInformburo(): Promise<RawNews[]> {
  const $ = await fetchHtml("https://informburo.kz/novosti");

  const items: RawNews[] = [];

  $("article").each((_, el) => {
    const title =
      $(el).find("h2, h3").first().text().trim() ||
      $(el).text().trim();

    const link = $(el).find("a").attr("href");

    let image =
      $(el).find("img").attr("src") ||
      $(el).find("img").attr("data-src");

    if (!title || !link) return;
    if (title.length < 20) return;

    const fullUrl = link.startsWith("http")
      ? link
      : "https://informburo.kz" + link;

    if (image && image.startsWith("/")) {
      image = "https://informburo.kz" + image;
    }

    items.push({
      source: "informburo.kz",
      rawTitle: title,
      rawUrl: fullUrl,
      rawImage: image,
      rawDate: new Date().toISOString(),
    });
  });

  return Array.from(new Map(items.map((x) => [x.rawUrl, x])).values()).slice(
    0,
    25
  );
}