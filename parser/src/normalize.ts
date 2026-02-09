import { NewsItem, RawNews } from "./types";

export function normalize(raw: RawNews[]): NewsItem[] {
  return raw.map((item) => ({
    source: item.source,
    title: item.rawTitle?.trim() || 'Без заголовка',
    text: item.rawText?.trim() || '',
    image: item.rawImage ?? null,
    url: item.rawUrl?.trim() || '',
    publishedAt: item.rawDate || new Date().toISOString(),
  }));
}
