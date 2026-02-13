// parser/src/normalize.ts
import { NewsItem, RawNews, Category, Region } from "./types";

function cleanText(text: string) {
  return text
    .replace(/\s+/g, " ")
    .replace(/Читайте также:.*$/gi, "")
    .replace(/Реклама.*$/gi, "")
    .replace(/Подписывайтесь.*$/gi, "")
    .replace(/Источник:.*$/gi, "")
    .trim();
}

function clampText(text: string, max = 800) {
  if (text.length <= max) return text;
  return text.slice(0, max).trim() + "...";
}

export function normalize(raw: RawNews[]): NewsItem[] {
  return raw.map((item: any) => {
    let publishedAt = item.rawDate;

    if (!publishedAt || isNaN(Date.parse(publishedAt))) {
      publishedAt = new Date().toISOString();
    }

    const title = cleanText(item.rawTitle?.trim() || "Без заголовка");
    const text = clampText(cleanText(item.rawText?.trim() || ""));

    const region: Region = item.region || "kz";

    return {
      source: item.source,
      title,
      text,
      image: item.rawImage ?? null,
      url: item.rawUrl?.trim() || "",
      publishedAt,
      category: undefined as Category | undefined,
      region,
    };
  });
}
