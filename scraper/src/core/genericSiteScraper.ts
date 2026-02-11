import { RawNews } from "../types";
import { fetchHtml } from "./html";
import { absUrl } from "./url";
import { parseFullArticle } from "./article";
import { extractOgImage } from "./og";
import { dedupeByUrl } from "./dedupe";
import { clamp } from "./limits";

type ArticleSelectors = {
  text?: string[];
  image?: string[];
  date?: string[];
};

type LinkRule = {
  include?: (string | RegExp)[];
  exclude?: (string | RegExp)[];
  requireAny?: (string | RegExp)[];
  requireAll?: (string | RegExp)[];
};

type SiteConfig = {
  id: string;
  source: string;
  startUrls: string[];

  link?: LinkRule; // ✅ теперь НЕ обязательно

  maxItems?: number;
  minTitleLen?: number;
  enrich?: boolean;
  selectors?: ArticleSelectors;
};

/* ===========================
   HELPERS
=========================== */

function matchAny(val: string, rules: (string | RegExp)[] = []) {
  return rules.some((r) =>
    typeof r === "string" ? val.includes(r) : r.test(val)
  );
}

function matchAll(val: string, rules: (string | RegExp)[] = []) {
  return rules.every((r) =>
    typeof r === "string" ? val.includes(r) : r.test(val)
  );
}

function keepLink(href: string, rule?: LinkRule) {
  // ✅ если правил нет — пропускаем всё
  if (!rule) return true;

  if (rule.exclude?.length && matchAny(href, rule.exclude)) return false;
  if (rule.requireAny?.length && !matchAny(href, rule.requireAny)) return false;
  if (rule.requireAll?.length && !matchAll(href, rule.requireAll)) return false;
  if (rule.include?.length) return matchAny(href, rule.include);

  return true;
}

function isJunkLink(url: string) {
  const bad = [
    "/tag/",
    "/category/",
    "/video",
    "/photo",
    "/gallery",
    "/login",
    "/search",
    "/rss",
    "#",
  ];
  return bad.some((x) => url.includes(x));
}

function cleanTitle(t: string) {
  return String(t || "")
    .replace(/\s+/g, " ")
    .replace(/реклама|advert|sponsor|1xbet/gi, "")
    .trim();
}

/* ===========================
   SCRAPER FACTORY
=========================== */

export function makeSiteScraper(cfg: SiteConfig) {
  return async (): Promise<RawNews[]> => {
    const items: RawNews[] = [];

    for (const startUrl of cfg.startUrls) {
      const $ = await fetchHtml(startUrl);

      const selectors = [
        "h1 a[href]",
        "h2 a[href]",
        "h3 a[href]",
        ".title a[href]",
        ".post-title a[href]",
        ".news-item a[href]",
        "article a[href]",
      ];

      $(selectors.join(",")).each((_, el) => {
        const href = String($(el).attr("href") || "");
        let title = cleanTitle($(el).text());

        const minLen = cfg.minTitleLen ?? 15;
        if (!title || title.length < minLen) return;

        // ✅ сначала junk фильтр
        const link = absUrl(startUrl, href);
        if (!link) return;
        if (isJunkLink(link)) return;

        // ✅ если link rules есть — применяем
        if (!keepLink(link, cfg.link)) return;

        items.push({
          source: cfg.source,
          rawTitle: title,
          rawUrl: link,
          rawDate: new Date().toISOString(),
        });
      });
    }

    const unique = dedupeByUrl(items);
    const limited = clamp(unique, cfg.maxItems ?? 80);

    if (cfg.enrich) {
      for (const it of limited) {
        if (!it.rawUrl) continue;

        const full = await parseFullArticle(it.rawUrl, cfg.selectors);

        if (full?.text) it.rawText = full.text;
        if (full?.date) it.rawDate = full.date;

        if (full?.image) it.rawImage = full.image;
        else it.rawImage = await extractOgImage(it.rawUrl);
      }
    } else {
      for (const it of limited) {
        if (!it.rawUrl) continue;
        it.rawImage = await extractOgImage(it.rawUrl);
      }
    }

    return limited;
  };
}
