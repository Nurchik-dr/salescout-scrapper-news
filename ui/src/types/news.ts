// /Users/mac/Desktop/salescout-scrapper-codex-create-positive-news-feed-aggregator/ui/src/types/news.ts
export type NewsItem = {
  _id: string;
  title: string;
  text: string;
  url: string;
  publishedAt: string;
  image?: string;
  sentiment: "positive" | "neutral" | "negative";
  category?: "general" | "sports" | "tech" | "business" | "science";
};
