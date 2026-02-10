import { NewsItem, RawNews, Category } from "./types";

export function normalize(raw: RawNews[]): NewsItem[] {
  return raw.map((item) => {
    let publishedAt = item.rawDate;

    if (!publishedAt || isNaN(Date.parse(publishedAt))) {
      publishedAt = new Date().toISOString();
    }

    return {
      source: item.source,
      title: item.rawTitle?.trim() || "Без заголовка",
      text: item.rawText?.trim() || "",
      image: item.rawImage ?? null,
      url: item.rawUrl?.trim() || "",
      publishedAt,

      // ✅ только правильные категории
      category: undefined as Category | undefined,
    };
  });
}
