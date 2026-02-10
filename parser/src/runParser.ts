import dotenv from "dotenv";
import mongoose, { Schema } from "mongoose";
import { normalize } from "./normalize";
import { filterPositive } from "./filterPositive";
import { RawNews } from "./types";

dotenv.config();

const newsSchema = new Schema(
  {
    source: { type: String, required: true },
    title: { type: String, required: true },
    text: { type: String, required: false },
    image: { type: String, required: false },
    url: { type: String, required: true },
    publishedAt: { type: String, required: true },
    category: { type: String, required: false },
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

  const withImagesOnly = normalized.filter((item) => item.image);

  const positivNews = withImagesOnly.filter((item) =>
    item.source.includes("positivnews.ru")
  );

  const otherSources = withImagesOnly.filter(
    (item) => !item.source.includes("positivnews.ru")
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

  await NewsModel.deleteMany({});
  await NewsModel.insertMany(finalNews);

  console.log(`✅ Parsed ${normalized.length} news items`);
  console.log(`🖼 Saved ONLY with images: ${withImagesOnly.length}`);
  console.log(`✅ Auto published positivnews.ru: ${positivAuto.length}`);
  console.log(`✅ Saved ONLY positive: ${finalNews.length}`);

  await mongoose.disconnect();
}

runParser().catch((error) => {
  console.error("❌ Parser failed:", error);
  process.exit(1);
});
