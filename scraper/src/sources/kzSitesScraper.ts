// scraper/src/sources/kzSitesScraper.ts

import axios from "axios";
import * as cheerio from "cheerio";
import { RawNews } from "../types";

/* ===========================
   HELPERS
=========================== */

async function fetchHtml(url: string) {
  const res = await axios.get(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X) AppleWebKit/537.36 Chrome/120 Safari/537.36",
    },
  });

  return cheerio.load(res.data);
}

async function extractOgImage(url: string): Promise<string | undefined> {
  try {
    const res = await axios.get(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X) AppleWebKit/537.36 Chrome/120 Safari/537.36",
      },
    });

    const $ = cheerio.load(res.data);

    return (
      $('meta[property="og:image"]').attr("content") ||
      $('meta[name="twitter:image"]').attr("content")
    );
  } catch {
    return undefined;
  }
}

/* ===========================
   CATEGORY DETECTORS
=========================== */

function detectNurCategory(href: string): string {
  if (href.includes("/sport/")) return "Спорт";
  if (href.includes("/politics/")) return "Политика";
  if (href.includes("/economy/")) return "Экономика";
  if (href.includes("/world/")) return "Мир";
  if (href.includes("/society/")) return "Общество";
  return "Новости";
}

// ✅ Informburo убираем спорт полностью
function detectInformburoCategory(link: string): string {
  if (link.includes("/interview")) return "Интервью";
  if (link.includes("/stati") || link.includes("/istorii")) return "Истории";
  return "Новости";
}

function detectTengriSportCategory(link: string): string {
  if (link.includes("/football")) return "Футбол";
  if (link.includes("/hockey")) return "Хоккей";
  if (link.includes("/boxing")) return "Бокс";
  if (link.includes("/tennis")) return "Теннис";
  return "Спорт";
}

/* ===========================
   ✅ NUR.KZ
=========================== */

export async function scrapeNur(): Promise<RawNews[]> {
  const $ = await fetchHtml("https://nur.kz/");
  const items: RawNews[] = [];

  $("a[href]").each((_, el) => {
    const href = $(el).attr("href") || "";
    const title = $(el).text().trim();

    if (!title) return;
    if (title.length < 20) return;

    if (
      !href.includes("/society/") &&
      !href.includes("/politics/") &&
      !href.includes("/sport/") &&
      !href.includes("/world/") &&
      !href.includes("/economy/")
    ) {
      return;
    }

    const link = href.startsWith("http") ? href : "https://nur.kz" + href;

    items.push({
      source: "nur.kz",
      rawTitle: title,
      rawUrl: link,
      rawDate: new Date().toISOString(),
      rawCategory: detectNurCategory(href),
    });
  });

  const unique = Array.from(
    new Map(items.map((x) => [x.rawUrl, x])).values()
  ).slice(0, 80);

  const withImages: RawNews[] = [];
  for (const it of unique) {
    const img = it.rawUrl ? await extractOgImage(it.rawUrl) : undefined;
    withImages.push({ ...it, rawImage: img });
  }

  return withImages;
}

/* ===========================
   ✅ INFORMBURO (без спорта)
=========================== */

export async function scrapeInformburo(): Promise<RawNews[]> {
  const $ = await fetchHtml("https://informburo.kz/");
  const items: RawNews[] = [];

  $("a[href]").each((_, el) => {
    const href = $(el).attr("href") || "";
    const title = $(el).text().trim();

    if (!title) return;
    if (title.length < 20) return;

    // ✅ убрали /sport/
    if (
      !href.includes("/novosti/") &&
      !href.includes("/interview/") &&
      !href.includes("/stati/") &&
      !href.includes("/istorii/")
    ) {
      return;
    }

    const link = href.startsWith("http")
      ? href
      : "https://informburo.kz" + href;

    items.push({
      source: "informburo.kz",
      rawTitle: title,
      rawUrl: link,
      rawDate: new Date().toISOString(),
      rawCategory: detectInformburoCategory(link),
    });
  });

  const unique = Array.from(
    new Map(items.map((x) => [x.rawUrl, x])).values()
  ).slice(0, 100);

  const withImages: RawNews[] = [];
  for (const it of unique) {
    const img = it.rawUrl ? await extractOgImage(it.rawUrl) : undefined;
    withImages.push({ ...it, rawImage: img });
  }

  return withImages;
}

/* ===========================
   ✅ TENGRISPORT.KZ (главный спорт)
=========================== */

export async function scrapeTengriSport(): Promise<RawNews[]> {
  const $ = await fetchHtml("https://tengrisport.kz/");
  const items: RawNews[] = [];

  $("a[href]").each((_, el) => {
    const href = $(el).attr("href") || "";
    const title = $(el).text().trim();

    if (!title) return;
    if (title.length < 20) return;

    if (!href.includes(".kz/")) return;

    const link = href.startsWith("http")
      ? href
      : "https://tengrisport.kz" + href;

    items.push({
      source: "tengrisport.kz",
      rawTitle: title,
      rawUrl: link,
      rawDate: new Date().toISOString(),
      rawCategory: detectTengriSportCategory(link),
    });
  });

  const unique = Array.from(
    new Map(items.map((x) => [x.rawUrl, x])).values()
  ).slice(0, 100);

  const withImages: RawNews[] = [];
  for (const it of unique) {
    const img = it.rawUrl ? await extractOgImage(it.rawUrl) : undefined;
    withImages.push({ ...it, rawImage: img });
  }

  return withImages;
}
