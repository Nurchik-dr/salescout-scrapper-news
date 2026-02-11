import { useMemo } from "react";
import { Link, useParams } from "react-router-dom";
import NewsCard from "../components/NewsCard";
import { CATEGORY_LABELS, toCategory } from "../types/news";
import type { ApiNewsItem, NewsCategory } from "../types/news";

type CategoryPageProps = {
  items: ApiNewsItem[];
  onCategoryChange: (category: NewsCategory) => void;
};

export default function CategoryPage({ items, onCategoryChange }: CategoryPageProps) {
  const { slug } = useParams();
  const category = toCategory(slug);

  const filtered = useMemo(() => {
    if (category === "all") return items;
    return items.filter((item) => item.category?.toLowerCase() === category);
  }, [items, category]);

  return (
    <div className="container category-page">
      <div className="category-page-header panel">
        <h1>{CATEGORY_LABELS[category].toUpperCase()}</h1>
        <p>Все новости выбранной категории</p>
        <div className="category-actions">
          <Link to="/" onClick={() => onCategoryChange("all")}>
            ← На главную
          </Link>
        </div>
      </div>

      <section className="panel category-grid">
        {filtered.length ? (
          filtered.map((item) => <NewsCard key={`${item.url}-${item.title}`} item={item} />)
        ) : (
          <p className="empty-state">В этой категории пока нет новостей.</p>
        )}
      </section>
    </div>
  );
}
