import { useMemo } from "react";
import { Link } from "react-router-dom";
import type { ApiNewsItem, NewsCategory } from "../types/news";
import NewsSlider from "../components/NewsSlider";
import NewsList from "../components/NewsList";
import NewsCard from "../components/NewsCard";

type HomeProps = {
  items: ApiNewsItem[];
  category: NewsCategory;
  onCategoryChange: (category: NewsCategory) => void;
};

export default function Home({ items, category, onCategoryChange }: HomeProps) {
  const filtered = useMemo(() => {
    if (category === "all") return items;
    return items.filter((item) => item.category?.toLowerCase() === category);
  }, [items, category]);

  const latest = filtered.slice(0, 4);
  const funny = filtered.slice(4, 8);
  const interesting = filtered.slice(8, 11);
  const videos = filtered.slice(11, 13);
  const awesome = filtered.slice(13, 16);
  const useful = filtered.slice(16, 18);

  return (
    <div className="container main-layout">
      <aside className="column left-column">
        <NewsList title="Последние новости" items={latest} categoryRoute="tech" />
        <NewsList title="Забавные новости" items={funny} categoryRoute="science" />

        <section className="panel subscribe-panel">
          <h2>Подпишитесь, чтобы получать срочные новости!</h2>
          <input type="text" placeholder="Имя" />
          <input type="email" placeholder="Email" />
          <button type="button">Отправить</button>
        </section>

        <section className="panel social-panel">
          <h2>Мы в Facebook</h2>
          <div className="social-placeholder">Виджет Facebook</div>
          <h2>Мы в Twitter</h2>
          <div className="social-placeholder">Виджет Twitter</div>
        </section>
      </aside>

      <main className="column center-column">
        <NewsSlider items={filtered} />

        <div className="section-grid">
          <NewsList title="Интересные новости" items={interesting} categoryRoute="business" compact={false} />
          <NewsList title="Главное" items={awesome} categoryRoute="tech" />
        </div>

        <section className="panel videos-panel">
          <div className="panel-header">
            <h2>Наши видео</h2>
            <Link to="/category/science" className="view-all">
              Смотреть все
            </Link>
          </div>
          <div className="videos-grid">
            {videos.map((item) => (
              <NewsCard key={`${item.url}-${item.title}`} item={item} />
            ))}
          </div>
        </section>

        <div className="section-grid">
          <NewsList title="Полезные новости" items={useful} categoryRoute="science" compact={false} />
          <section className="panel category-filter-panel">
            <h2>Категории</h2>
            <div className="filter-buttons">
              <button className={category === "all" ? "active" : ""} onClick={() => onCategoryChange("all")}>
                Все
              </button>
              <button className={category === "tech" ? "active" : ""} onClick={() => onCategoryChange("tech")}>
                Технологии
              </button>
              <button
                className={category === "business" ? "active" : ""}
                onClick={() => onCategoryChange("business")}
              >
                Бизнес
              </button>
              <button className={category === "science" ? "active" : ""} onClick={() => onCategoryChange("science")}>
                Наука
              </button>
              <button className={category === "sports" ? "active" : ""} onClick={() => onCategoryChange("sports")}>
                Спорт
              </button>
            </div>
          </section>
        </div>
      </main>

      <aside className="column right-column">
        <NewsList title="Популярное" items={awesome} categoryRoute="business" />
        <NewsList title="Полезное" items={useful} categoryRoute="science" compact={false} />
      </aside>
    </div>
  );
}
