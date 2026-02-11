// parser/src/runParser.ts
import dotenv from "dotenv";
import mongoose, { Schema } from "mongoose";
import { normalize } from "./normalize";
import { filterPositive } from "./filterPositive";
import { RawNews, NewsItem } from "./types";

dotenv.config();

/* ===========================
   TRANSLATE (RU <-> KZ)
=========================== */

async function translateText(text: string, target: "ru" | "kk") {
  try {
    const res = await fetch("https://libretranslate.com/translate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        q: text,
        source: "auto",
        target,
        format: "text",
      }),
    });

    const data: any = await res.json();
    return data.translatedText || text;
  } catch {
    return text;
  }
}

/* ===========================
   CATEGORY
=========================== */

type Category = "general" | "sports" | "tech" | "business" | "science";

function detectCategory(text: string): Category {
  const t = text.toLowerCase();

  if (t.includes("спорт") || t.includes("матч") || t.includes("чемпион"))
    return "sports";

  if (t.includes("технолог") || t.includes("ai") || t.includes("интернет"))
    return "tech";

  if (t.includes("бизнес") || t.includes("банк") || t.includes("рынок"))
    return "business";

  if (t.includes("наука") || t.includes("исследован") || t.includes("космос"))
    return "science";

  return "general";
}

/* ===========================
   SCHEMA
=========================== */

const newsSchema = new Schema(
  {
    source: { type: String, required: true },

    category: {
      type: String,
      enum: ["general", "sports", "tech", "business", "science"],
      required: false,
    },

    title: { type: String, required: true },
    text: { type: String, required: false },

    // ✅ translations
    titleRu: { type: String, required: false },
    titleKk: { type: String, required: false },
    textRu: { type: String, required: false },
    textKk: { type: String, required: false },

    image: { type: String, required: false },
    url: { type: String, required: true },
    publishedAt: { type: String, required: true },

    sentiment: {
      type: String,
      enum: ["positive", "neutral", "negative"],
      required: true,
    },
  },
  { collection: "news", timestamps: true }
);

const NewsModel = mongoose.models.News || mongoose.model("News", newsSchema);

/* ===========================
   LOAD RAW
=========================== */

async function loadRawNews(): Promise<RawNews[]> {
  const RawModel = mongoose.connection.collection("raw_news");
  const docs = await RawModel.find({}).toArray();
  return docs as unknown as RawNews[];
}

/* ===========================
   MAIN PARSER
=========================== */

async function runParser(): Promise<void> {
  await mongoose.connect(
    process.env.MONGO_URI || "mongodb://localhost:27017/positive_news"
  );

  const rawNews = await loadRawNews();
  const normalized = normalize(rawNews);

  // Не отбрасываем новости без изображения: на фронте есть заглушка.
  // Иначе в ленте может быть пусто, если источники вернули материалы без картинок.
  const validItems: NewsItem[] = normalized.filter((item) => Boolean(item.url));

  const categorized: NewsItem[] = validItems.map((item) => ({
    ...item,
    category: detectCategory(`${item.title} ${item.text || ""}`),
  }));

  // ✅ positivnews.ru всегда positive
  const positivNews = categorized.filter((i) =>
    i.source.includes("positivnews.ru")
  );

  // ✅ остальные источники
  const otherSources = categorized.filter(
    (i) => !i.source.includes("positivnews.ru")
  );

  // ✅ positive = что прошло фильтр
  const positiveList = filterPositive(otherSources);

  const positiveFiltered = positiveList.map((item) => ({
    ...item,
    sentiment: "positive" as const,
  }));

  // ✅ neutral = всё остальное
  const positiveUrls = new Set(positiveList.map((x) => x.url));

  const neutralFiltered = otherSources
    .filter((x) => !positiveUrls.has(x.url))
    .map((item) => ({
      ...item,
      sentiment: "neutral" as const,
    }));

  // ✅ positivnews авто-positive
  const positivAuto = positivNews.map((item) => ({
    ...item,
    sentiment: "positive" as const,
  }));

  // ✅ итог только positive + neutral
  const finalNews = [...positivAuto, ...positiveFiltered, ...neutralFiltered];

  // ===========================
  // ✅ TRANSLATE BEFORE SAVE
  // ===========================

  for (const item of finalNews) {
    const titleRu = await translateText(item.title, "ru");
    const titleKk = await translateText(item.title, "kk");

    const textRu = item.text ? await translateText(item.text, "ru") : "";
    const textKk = item.text ? await translateText(item.text, "kk") : "";

    await NewsModel.updateOne(
      { url: item.url },
      {
        $set: {
          ...item,
          titleRu,
          titleKk,
          textRu,
          textKk,
        },
      },
      { upsert: true }
    );
  }

  console.log("✅ Upsert done + translations saved");

  await mongoose.disconnect();
}

/* ===========================
   RUN
=========================== */

runParser()
  .then(() => {
    console.log("✅ Parser finished нормально");
    process.exit(0);
  })
  .catch((e) => {
    console.error("❌ Parser crashed:", e);
    process.exit(1);
  });
