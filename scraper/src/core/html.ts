// scraper/src/core/html.ts
import * as cheerio from "cheerio";
import { http } from "./http";

export async function fetchHtml(url: string) {
  const res = await http.get(url);
  return cheerio.load(res.data);
}

export async function fetchRawHtml(url: string) {
  const res = await http.get(url);
  return String(res.data);
}
