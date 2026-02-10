import axios from "axios";
import * as cheerio from "cheerio";

export async function fetchFullText(url: string): Promise<string> {
  try {
    const res = await axios.get(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X) AppleWebKit/537.36 Chrome/120 Safari/537.36",
      },
    });

    const $ = cheerio.load(res.data);

    // универсально: собираем все абзацы статьи
    const paragraphs = $("article p")
      .map((_, el) => $(el).text().trim())
      .get()
      .filter(Boolean);

    return paragraphs.slice(0, 15).join("\n\n");
  } catch {
    return "";
  }
}
