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

// ❌ Мусорные темы
const trashWords = [
  "гороскоп",
  "зодиак",
  "везунчик",
  "астролог",
];

// ✅ Позитивные темы (оставляем)
const goodTopics = [
  "спорт",
  "побед",
  "чемпион",
  "турнир",
  "технолог",
  "искусственный интеллект",
  "открыли",
  "новый парк",
  "волонт",
  "помог",
  "фестиваль",
  "концерт",
  "культура",
  "образован",
  "здоровье",
  "бег",
  "экология",
  "природа",
];

function hasAny(text: string, words: string[]) {
  return words.some((w) => text.includes(w));
}

export function filterPositive(news: NewsItem[]): NewsItem[] {
  return news.filter((item) => {
    const content = `${item.title} ${item.text || ""}`.toLowerCase();

    // ❌ убираем жесть
    if (hasAny(content, bannedWords)) return false;

    // ❌ убираем мусор
    if (hasAny(content, trashWords)) return false;

    // ✅ оставляем только если есть полезная тема
    if (hasAny(content, goodTopics)) return true;

    // всё остальное скрываем
    return false;
  });
}

