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
        <NewsList title="Latest News" items={latest} categoryRoute="tech" />
        <NewsList title="Funny Post's" items={funny} categoryRoute="science" />

        <section className="panel subscribe-panel">
          <h2>Get breaking news and enter to win gear!</h2>
          <input type="text" placeholder="Name" />
          <input type="email" placeholder="Email" />
          <button type="button">SUBMIT</button>
        </section>

        <section className="panel social-panel">
          <h2>BUSSPO ON FACEBOOK</h2>
          <div className="social-placeholder">Facebook Widget</div>
          <h2>BUSSPO ON TWITTER</h2>
          <div className="social-placeholder">Twitter Widget</div>
        </section>
      </aside>

      <main className="column center-column">
        <NewsSlider items={filtered} />

        <div className="section-grid">
          <NewsList title="Interesting Post's" items={interesting} categoryRoute="business" compact={false} />
          <NewsList title="Awesome Post's" items={awesome} categoryRoute="tech" />
        </div>

        <section className="panel videos-panel">
          <div className="panel-header">
            <h2>Our Videos</h2>
            <Link to="/category/science" className="view-all">
              View All
            </Link>
          </div>
          <div className="videos-grid">
            {videos.map((item) => (
              <NewsCard key={`${item.url}-${item.title}`} item={item} />
            ))}
          </div>
        </section>

        <div className="section-grid">
          <NewsList title="Useful Post's" items={useful} categoryRoute="science" compact={false} />
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
        <NewsList title="Awesome Posts" items={awesome} categoryRoute="business" />
        <NewsList title="Useful Posts" items={useful} categoryRoute="science" compact={false} />
      </aside>
    </div>
  );
}
