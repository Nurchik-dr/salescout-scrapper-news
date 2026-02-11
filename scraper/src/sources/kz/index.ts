// scraper/src/sources/kz/index.ts
import { scrapeNur } from "./nur";
import { scrapeInformburo } from "./informburo";
import { scrapeTengrinews } from "./tengrinews";
import { scrapeTengriSport } from "./tengrisport";
import { scrapeZakon } from "./zakon";
import { scrapeKhabar } from "./khabar";
import { scrapeSputnik } from "./sputnik";

import { scrapeLiter } from "./liter";

import { scrape24kz } from "./24kz";
import { scrapeTimeKz } from "./timekz";

import { scrapeNewtimes } from "./newtimes";
import { scrapeLada } from "./lada";
import { scrapeMgorod } from "./mgorod";
import { scrapeOtyrar } from "./otyrar";
import { scrapeDigitalbusiness } from "./digitalbusiness";

export const kzScrapers = [
  scrapeNur,
  scrapeInformburo,
  scrapeTengrinews,
  scrapeTengriSport,
  scrapeZakon,
  scrapeKhabar,
  scrapeSputnik,

  scrapeLiter,

  scrape24kz,
  scrapeTimeKz,

  scrapeNewtimes,
  scrapeLada,
  scrapeMgorod,
  scrapeOtyrar,
  scrapeDigitalbusiness,

];
