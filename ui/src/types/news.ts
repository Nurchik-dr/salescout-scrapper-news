// ui/src/types/news.ts
export type NewsItem = {
  _id: string;
  source: string;
  category?: string;
  title: string;
  text?: string;
  image?: string;
  url: string;
  publishedAt: string;
  sentiment: "positive" | "neutral" | "negative";
  createdAt?: string;
  updatedAt?: string;
};
