import axios from "axios";
import { RawNews } from "../../types";
import { clamp } from "../../core/limits";

export async function scrapeAstanaHub(): Promise<RawNews[]> {
  try {
    const res = await axios.get("https://astanahub.com/api/article/", {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X) AppleWebKit/537.36 Chrome/120 Safari/537.36",
      },
    });

    const items = res.data?.results || [];

    const news: RawNews[] = items.map((x: any) => ({
      source: "astanahub.com",
      rawTitle: String(x.title || "").trim(),
      rawUrl: x.absolute_url
        ? "https://astanahub.com" + x.absolute_url
        : `https://astanahub.com/api/article/${x.id}/`,
      rawDate: x.created_at || new Date().toISOString(),
      rawImage: x.image || undefined,
      rawCategory: "Tech",
    }));

    return clamp(news, 50);
  } catch {
    return [];
  }
}
