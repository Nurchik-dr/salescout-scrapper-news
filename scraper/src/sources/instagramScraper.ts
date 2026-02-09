import { RawNews } from '../types';

export async function scrapeInstagram(): Promise<RawNews[]> {
  return [
    {
      source: 'instagram',
      rawTitle: 'Добрые новости дня',
      rawText: 'Волонтеры помогли восстановить парк и посадили новые деревья.',
      rawUrl: 'https://instagram.com/p/positive-news-1',
      rawDate: new Date().toISOString(),
      rawImage: 'https://images.example.com/positive-news-1.jpg',
    },
  ];
}
