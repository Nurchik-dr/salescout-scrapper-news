
import Parser from "rss-parser";
import { RawNews } from "../types";

const rssParser = new Parser({
  customFields: {
    item: [
      ["media:content", "mediaContent"],
      ["media:thumbnail", "mediaThumbnail"],
      ["enclosure", "enclosure"],
    ],
  },
});

function cleanTitle(title: string) {
  return title
    .replace(/•.*$/g, "") // убираем всё после •
    .replace(/#\S+/g, "") // убираем хэштеги
    .trim();
}

function extractImage(item: any): string | undefined {
  // 1) enclosure
  if (item.enclosure?.url) return item.enclosure.url;

  // 2) media:content
  if (item.mediaContent?.$?.url) return item.mediaContent.$.url;
  if (item.mediaContent?.url) return item.mediaContent.url;

  // 3) media:thumbnail
  if (item.mediaThumbnail?.$?.url) return item.mediaThumbnail.$.url;
  if (item.mediaThumbnail?.url) return item.mediaThumbnail.url;

  // 4) fallback image field
  if (item.image?.url) return item.image.url;

  // ✅ 5) вытаскиваем img из HTML внутри content/description
  const html = item.content || item["content:encoded"] || item.summary || "";

  const match = html.match(/<img[^>]+src="([^">]+)"/);

  if (match?.[1]) return match[1];

  return undefined;
}

export async function scrapeRss(url: string): Promise<RawNews[]> {
  const feed = await rssParser.parseURL(url);

  return (feed.items || [])
    .map((item: any) => {
      const title = item.title ? cleanTitle(item.title) : undefined;

      const text =
        item.contentSnippet ||
        item.content ||
        item.summary ||
        "Описание отсутствует";

      const image = extractImage(item);

      return {
        source: feed.title || url,
        rawTitle: title,
        rawText: text?.trim(),
        rawUrl: item.link ?? undefined,
        rawDate: item.isoDate ?? item.pubDate ?? new Date().toISOString(),
        rawImage: image,
      };
    })
    .slice(0, 50);
}