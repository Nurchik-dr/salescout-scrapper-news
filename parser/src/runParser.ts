import dotenv from "dotenv";
import mongoose, { Schema } from "mongoose";
import { normalize } from "./normalize";
import { filterPositive } from "./filterPositive";
import { RawNews, NewsItem } from "./types";

dotenv.config();

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

async function loadRawNews(): Promise<RawNews[]> {
  const RawModel = mongoose.connection.collection("raw_news");
  const docs = await RawModel.find({}).toArray();
  return docs as unknown as RawNews[];
}

async function runParser(): Promise<void> {
  await mongoose.connect(
    process.env.MONGO_URI || "mongodb://localhost:27017/positive_news"
  );

  const rawNews = await loadRawNews();
  const normalized = normalize(rawNews);

  const withImagesOnly: NewsItem[] = normalized.filter((i) => i.image);

  const categorized: NewsItem[] = withImagesOnly.map((item) => ({
    ...item,
    category: detectCategory(`${item.title} ${item.text || ""}`),
  }));

  const positivNews = categorized.filter((i) =>
    i.source.includes("positivnews.ru")
  );

  const otherSources = categorized.filter(
    (i) => !i.source.includes("positivnews.ru")
  );

  const positiveFiltered = filterPositive(otherSources).map((item) => ({
    ...item,
    sentiment: "positive" as const,
  }));

  const positivAuto = positivNews.map((item) => ({
    ...item,
    sentiment: "positive" as const,
  }));

  const finalNews = [...positivAuto, ...positiveFiltered];

  // ✅ FIX: НЕ удаляем базу → сохраняем старые новости и id
  for (const item of finalNews) {
    await NewsModel.updateOne(
      { url: item.url },
      { $set: item },
      { upsert: true }
    );
  }

  console.log("✅ Upsert done (старые новости сохранены)");

  await mongoose.disconnect();
}

runParser().catch(() => process.exit(1));
