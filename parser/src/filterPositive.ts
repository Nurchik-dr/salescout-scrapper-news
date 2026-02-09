import { NewsItem } from './types';

const positiveWords = ['успех', 'открыли', 'помогли', 'добро', 'счастье'];
const negativeWords = [
  "авария",
  "дтп",
  "опрокинулся",
  "погиб",
  "погибли",
  "смерть",
  "умер",
  "убийство",
  "нападение",
  "катастрофа",
  "пожар",
  "взрыв",
  "война",
  "трагедия",
  "преступление",
  "арест",
  "мошенник",
];
function countMatches(text: string, words: string[]): number {
  const lower = text.toLowerCase();
  return words.reduce(
    (count, word) => count + (lower.includes(word) ? 1 : 0),
    0,
  );
}

export function filterPositive(news: NewsItem[]): NewsItem[] {
  return news.filter((item) => {
    const content = `${item.title} ${item.text}`;
    const positiveScore = countMatches(content, positiveWords);
    const negativeScore = countMatches(content, negativeWords);
    return positiveScore > negativeScore;
  });
}
