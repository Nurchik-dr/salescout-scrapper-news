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
  category?: string;
};
