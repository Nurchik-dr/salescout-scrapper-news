// /Users/mac/Desktop/salescout-scrapper-codex-create-positive-news-feed-aggregator/ui/src/components/NewsList.tsx
import { NewsItem } from "../../types/news";
import NewsCard from "../NewsCard/NewsCard";
import "./NewsList.css";

type Props = {
  news: NewsItem[];
};

export default function NewsList({ news }: Props) {
  return (
    <div className="grid">
      {news.map((item) => (
        <NewsCard key={item._id} item={item} variant="hero" />
      ))}
    </div>
  );
}
