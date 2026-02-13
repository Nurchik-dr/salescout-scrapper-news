// /Users/mac/Desktop/salescout-scrapper-news/parser/src/runParser.ts
import dotenv from "dotenv";
import mongoose, { Schema } from "mongoose";
import { normalize } from "./normalize";
import { filterPositive } from "./filterPositive";
import { RawNews, NewsItem } from "./types";

dotenv.config();

const newsSchema = new Schema(
  {
    source: { type: String, required: true },

    title: { type: String, required: true },
    text: { type: String, required: false },

    titleRu: { type: String, required: false },
    textRu: { type: String, required: false },

    image: { type: String, required: false },

    url: { type: String, required: true, unique: true },

    publishedAt: { type: Date, required: true },

    region: {
      type: String,
      enum: ["kz", "world"],
      required: true,
    },

    sentiment: {
      type: String,
      enum: ["positive"],
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
    process.env.MONGO_URI || "mongodb://127.0.0.1:27017/positive_news"
  );

  const rawNews = await loadRawNews();
  const normalized = normalize(rawNews);

  const withContentOnly: NewsItem[] = normalized.filter(
    (i) => i.title && (i.text || "").trim().length > 80
  );

  const positivNews = withContentOnly.filter((i) =>
    i.source.includes("positivnews.ru")
  );

  const otherSources = withContentOnly.filter(
    (i) => !i.source.includes("positivnews.ru")
  );

  const positiveList = filterPositive(otherSources);

  const positiveFiltered: NewsItem[] = positiveList.map((item) => ({
    ...item,
    sentiment: "positive",
  }));

  const positivAuto: NewsItem[] = positivNews.map((item) => ({
    ...item,
    sentiment: "positive",
  }));

  const finalNews: NewsItem[] = [...positivAuto, ...positiveFiltered];

  for (const item of finalNews) {
    const published =
      item.publishedAt && !isNaN(Date.parse(item.publishedAt))
        ? new Date(item.publishedAt)
        : new Date();

    await NewsModel.updateOne(
      { url: item.url },
      {
        $set: {
          ...item,
          titleRu: item.title,
          textRu: item.text || "",
          publishedAt: published,
          sentiment: "positive",
          region: item.region || "kz",
        },
      },
      { upsert: true }
    );
  }

  console.log("✅ Saved ONLY positive news:", finalNews.length);

  await mongoose.disconnect();
}

runParser()
  .then(() => {
    console.log("✅ Parser finished нормально");
    process.exit(0);
  })
  .catch((e) => {
    console.error("❌ Parser crashed:", e);
    process.exit(1);
  });
