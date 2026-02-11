// scraper/src/types.ts
export type RawNews = {
  source: string;
  rawTitle?: string;
  rawText?: string;
  rawUrl?: string;
  rawDate?: string;
  rawImage?: string;
  rawCategory?: string;
};

export type ScrapeResult = RawNews[];
export type ScraperFn = () => Promise<ScrapeResult>;
