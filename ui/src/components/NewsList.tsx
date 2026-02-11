import { Link } from "react-router-dom";
import type { ApiNewsItem, NewsCategory } from "../types/news";
import NewsCard from "./NewsCard";

type NewsListProps = {
  title: string;
  items: ApiNewsItem[];
  categoryRoute?: NewsCategory;
  compact?: boolean;
};

export default function NewsList({ title, items, categoryRoute, compact = true }: NewsListProps) {
  return (
    <section className="panel">
      <div className="panel-header">
        <h2>{title}</h2>
        {categoryRoute && categoryRoute !== "all" && (
          <Link className="view-all" to={`/category/${categoryRoute}`}>
            Смотреть все
          </Link>
        )}
      </div>

      <div className="panel-list">
        {items.length ? (
          items.map((item) => <NewsCard key={`${item.url}-${item.title}`} item={item} compact={compact} />)
        ) : (
          <p className="empty-state">Пока новостей нет.</p>
        )}
      </div>
    </section>
  );
}
