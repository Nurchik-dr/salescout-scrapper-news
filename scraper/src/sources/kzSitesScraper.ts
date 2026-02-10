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

    let img =
      $('meta[property="og:image"]').attr("content") ||
      $('meta[name="twitter:image"]').attr("content");

    if (!img) {
      img =
        $("article img").first().attr("src") ||
        $(".post img").first().attr("src") ||
        $("img").first().attr("src");
    }

    if (!img) return undefined;

    if (img.startsWith("/")) {
      img = new URL(url).origin + img;
    }

    return img;
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
   ✅ KHABAR.KZ
=========================== */

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
  const $ = await fetchHtml("https://khabar.kz/ru/news");
  const items: RawNews[] = [];

  // ссылки на новости
  $("a[href]").each((_, el) => {
    const href = $(el).attr("href") || "";
    const title = $(el).text().trim();

    if (!href) return;
    if (!title) return;
    if (title.length < 20) return;

    // ✅ khabar news links only
    if (!href.includes("/ru/news/")) return;

    const link = href.startsWith("http") ? href : "https://khabar.kz" + href;

    items.push({
      source: "khabar.kz",
      rawTitle: title,
      rawUrl: link,
      rawDate: new Date().toISOString(),
      rawCategory: detectKhabarCategory(href),
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
   ✅ ZAKON.KZ
=========================== */

export async function scrapeZakon(): Promise<RawNews[]> {
  const $ = await fetchHtml("https://www.zakon.kz/");
  const items: RawNews[] = [];

  $("a[href]").each((_, el) => {
    const href = $(el).attr("href") || "";
    const title = $(el).text().trim();

    if (!title || title.length < 20) return;
    if (!href.includes(".html")) return;

    const link = href.startsWith("http")
      ? href
      : "https://www.zakon.kz" + href;

    items.push({
      source: "zakon.kz",
      rawTitle: title,
      rawUrl: link,
      rawDate: new Date().toISOString(),
      rawCategory: "Новости",
    });
  });

  const unique = Array.from(
    new Map(items.map((x) => [x.rawUrl, x])).values()
  ).slice(0, 60);

  // ✅ вытаскиваем картинки через og:image
  const withImages: RawNews[] = [];
  for (const it of unique) {
    const img = it.rawUrl ? await extractOgImage(it.rawUrl) : undefined;
    withImages.push({ ...it, rawImage: img });
  }

  return withImages;
}

/* ===========================
   ✅ POSITIVNEWS.RU
=========================== */

export async function scrapePositivNews(): Promise<RawNews[]> {
  const $ = await fetchHtml("https://positivnews.ru/");
  const items: RawNews[] = [];

  $("a[href]").each((_, el) => {
    const href = $(el).attr("href") || "";
    const title = $(el).text().trim();

    // титулы короткие не нужны
    if (!title || title.length < 20) return;

    // ссылки на статьи обычно содержат www.positivnews.ru
    if (!href.includes("positivnews.ru")) return;

    const link = href.startsWith("http") ? href : "https://positivnews.ru" + href;

    items.push({
      source: "positivnews.ru",
      rawTitle: title,
      rawUrl: link,
      rawDate: new Date().toISOString(),
      rawCategory: "Позитив",
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
   ✅ SPUTNIK.KZ
=========================== */

export async function scrapeSputnik(): Promise<RawNews[]> {
  const $ = await fetchHtml("https://sputniknews.kz/");
  const items: RawNews[] = [];

  $("a[href]").each((_, el) => {
    const href = $(el).attr("href") || "";
    const title = $(el).text().trim();

    if (!title || title.length < 20) return;
    if (!href.includes("/news/")) return;

    const link = href.startsWith("http")
      ? href
      : "https://sputniknews.kz" + href;

    items.push({
      source: "sputniknews.kz",
      rawTitle: title,
      rawUrl: link,
      rawDate: new Date().toISOString(),
      rawCategory: "Новости",
    });
  });

  return Array.from(new Map(items.map((x) => [x.rawUrl, x])).values()).slice(
    0,
    80
  );
}

/* ===========================
   ✅ TENGRINEWS.KZ
=========================== */

export async function scrapeTengrinews(): Promise<RawNews[]> {
  const $ = await fetchHtml("https://tengrinews.kz/news/");
  const items: RawNews[] = [];

  $("a[href*='/news/']").each((_, el) => {
    const href = $(el).attr("href") || "";
    const title = $(el).text().trim();

    if (!title || title.length < 20) return;

    const link = href.startsWith("http")
      ? href
      : "https://tengrinews.kz" + href;

    items.push({
      source: "tengrinews.kz",
      rawTitle: title,
      rawUrl: link,
      rawDate: new Date().toISOString(),
      rawCategory: "Новости",
    });
  });

  const unique = Array.from(
    new Map(items.map((x) => [x.rawUrl, x])).values()
  ).slice(0, 60);

  // ✅ вытаскиваем картинки через og:image
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