export type ApiNewsItem = {
  title: string;
  text: string;
  image?: string;
  category?: string;
  publishedAt: string;
  url: string;
};

export type NewsApiResponse = {
  items: ApiNewsItem[];
};

export type NewsItem = ApiNewsItem & {
  _id?: string;
  sentiment?: "positive" | "neutral" | "negative";
};

export type NewsCategory = "all" | "tech" | "business" | "science" | "sports";

export const CATEGORY_LABELS: Record<NewsCategory, string> = {
  all: "Все",
  tech: "Технологии",
  business: "Бизнес",
  science: "Наука",
  sports: "Спорт",
};

export const CATEGORY_ROUTE_SLUGS: Exclude<NewsCategory, "all">[] = [
  "tech",
  "business",
  "science",
];

export const toCategory = (value?: string): NewsCategory => {
  const normalized = value?.toLowerCase();

  if (normalized === "tech" || normalized === "technology") return "tech";
  if (normalized === "business") return "business";
  if (normalized === "science") return "science";
  if (normalized === "sports" || normalized === "sport") return "sports";

  return "all";
};

export const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) {
    return "Дата неизвестна";
  }

  return new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(date);
};
