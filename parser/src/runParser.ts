import dotenv from "dotenv";
import mongoose, { Schema } from "mongoose";
import { normalize } from "./normalize";
import { filterPositive } from "./filterPositive";
import { NewsItem, RawNews } from "./types";

dotenv.config();

const positiveWords = ["успех", "открыли", "помогли", "добро", "счастье"];

const negativeWords = [
  "авария",
  "дтп",
  "опрокинулся",
  "погиб",
  "погибли",
  "смерть",
  "умер",
  "убийство",
  "нападение",
  "катастрофа",
  "пожар",
  "взрыв",
  "война",
  "трагедия",
  "преступление",
  "арест",
  "мошенник",
];

const newsSchema = new Schema(
  {
    source: { type: String, required: true },
    title: { type: String, required: true },
    text: { type: String, required: false },

    image: { type: String, required: false }, // ✅ сохраняем фото

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

const NewsModel =
  mongoose.models.News || mongoose.model("News", newsSchema);

// ===================================================
// ✅ Sentiment строгий: негатив сразу режем
// ===================================================
function getSentiment(item: NewsItem): "positive" | "neutral" | "negative" {
  const content = `${item.title} ${item.text}`.toLowerCase();

  // ❌ если есть хоть одно негативное слово → NEGATIVE
  if (negativeWords.some((w) => content.includes(w))) {
    return "negative";
  }

  // ✅ если есть позитив → POSITIVE
  if (positiveWords.some((w) => content.includes(w))) {
    return "positive";
  }

  return "neutral";
}

// ===================================================
// ✅ Load raw_news from Mongo
// ===================================================
async function loadRawNews(): Promise<RawNews[]> {
  const RawModel = mongoose.connection.collection("raw_news");
  const docs = await RawModel.find({}).toArray();
  return docs as unknown as RawNews[];
}

// ===================================================
// ✅ Main parser
// ===================================================
async function runParser(): Promise<void> {
  await mongoose.connect(
    process.env.MONGO_URI || "mongodb://localhost:27017/positive_news"
  );

  const rawNews = await loadRawNews();

  const normalized = normalize(rawNews);

  const withSentiment = normalized.map((item) => ({
    ...item,
    sentiment: getSentiment(item),
  }));

  if (withSentiment.length > 0) {
    // ✅ очищаем старое (иначе фото не обновится)
    await NewsModel.deleteMany({});

    // ✅ вставляем заново
    await NewsModel.insertMany(withSentiment);
  }

  const positiveNews = filterPositive(normalized);

  console.log(`✅ Parsed ${normalized.length} news items`);
  console.log(`✅ Positive news count: ${positiveNews.length}`);

  await mongoose.disconnect();
}

runParser().catch((error) => {
  console.error("❌ Parser failed:", error);
  process.exit(1);
});