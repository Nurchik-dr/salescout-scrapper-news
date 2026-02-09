import { NewsItem } from "../types/news";
import NewsCard from "./NewsCard";

type Props = {
  news: NewsItem[];
};

export default function NewsList({ news }: Props) {
  return (
    <div className="grid">
      {news.map((item) => (
        <NewsCard key={item._id} item={item} />
      ))}
    </div>
  );
}
