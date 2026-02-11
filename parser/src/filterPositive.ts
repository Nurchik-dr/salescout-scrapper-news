// /Users/mac/Desktop/salescout-scrapper-codex-create-positive-news-feed-aggregator/parser/src/filterPositive.ts
import { NewsItem } from "./types";

const bannedWords = [
  "погиб",
  "смерт",
  "убий",
  "авари",
  "дтп",
  "катастроф",
  "взрыв",
  "пожар",
  "трагед",
  "войн",
  "арест",
  "задерж",
  "мвд",
  "прокуратур",
  "нарколаборат",
  "преступлен",
  "мошеннич",
  "пирамида",
  "коррупц",
  "инфаркт",
  "может стоить жизни",
];

const trashWords = [
  "гороскоп",
  "зодиак",
  "везунчик",
  "астролог",
];

const goodTopics = [
  "спорт",
  "побед",
  "чемпион",
  "турнир",
  "рекорд",
  "технолог",
  "искусственный интеллект",
  "открыли",
  "запустили",
  "новый парк",
  "волонт",
  "помог",
  "фестиваль",
  "концерт",
  "культура",
  "образован",
  "здоровье",
  "экология",
  "природа",
  "стартап",
  "инновац",
  "грант",
];

function hasAny(text: string, words: string[]) {
  return words.some((w) => text.includes(w));
}

export function filterPositive(news: NewsItem[]): NewsItem[] {
  return news.filter((item) => {
    const content = `${item.title} ${item.text || ""}`.toLowerCase();

    // ❌ жесть убираем всегда
    if (hasAny(content, bannedWords)) return false;

    // ❌ мусор убираем
    if (hasAny(content, trashWords)) return false;

    // ✅ positive только если реально хорошая тема
    if (hasAny(content, goodTopics)) return true;

    // ❌ всё остальное не считаем позитивом
    return false;
  });
}
