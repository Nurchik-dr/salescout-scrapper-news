// /Users/mac/Desktop/salescout-scrapper-news/parser/src/types.ts
export type Category = "general" | "sports" | "tech" | "business" | "science";
export type Region = "kz" | "world";

export type RawNews = {
  source: string;
  rawTitle?: string;
  rawText?: string;
  rawUrl?: string;
  rawDate?: string;
  rawImage?: string;
  rawCategory?: string;
};

export type NewsItem = {
  source: string;
  title: string;
  text: string;
  image?: string | null;
  url: string;
  publishedAt: string;
  category?: Category;
  sentiment?: "positive" | "neutral" | "negative";

  titleKz?: string;
  textKz?: string;
  region: Region;
};
