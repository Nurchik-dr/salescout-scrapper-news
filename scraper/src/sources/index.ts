// scraper/src/sources/index.ts
import { ScraperFn } from "../types";
import { kzScrapers } from "./kz";

export const allScrapers: ScraperFn[] = [...kzScrapers];
