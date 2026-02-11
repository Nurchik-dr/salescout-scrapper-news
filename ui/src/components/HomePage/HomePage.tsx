import type { Dispatch, SetStateAction } from "react";
import type { NewsItem } from "../../types/news";
import Navbar from "./Navbar";
import "./HomePage.css";

type Props = {
  news: NewsItem[];
  active: string;
  setActive: Dispatch<SetStateAction<string>>;
};

type CategoryKey = "all" | "general" | "tech" | "business" | "sports" | "science";

const sectionFilters: { label: string; value: CategoryKey }[] = [
  { label: "All", value: "all" },
  { label: "National", value: "general" },
  { label: "Technology", value: "tech" },
  { label: "Business", value: "business" },
  { label: "Sport", value: "sports" },
  { label: "People", value: "science" },
];

function cut(text = "", size: number) {
  if (!text) return "";
  return text.length > size ? `${text.slice(0, size).trim()}...` : text;
}

function byCategory(news: NewsItem[], key: string) {
  if (key === "all") return news;
  return news.filter((item) => item.category === key);
}

function toCategoryLabel(category?: string) {
  if (category === "tech") return "TECH";
  if (category === "business") return "BUSINESS";
  if (category === "sports") return "SPORT";
  if (category === "science") return "PEOPLE";
  return "NATIONAL";
}

function NewsLine({ item }: { item: NewsItem }) {
  return (
    <article className="ub-line-item">
      <img src={item.image || "/no-image.png"} alt={item.title} />
      <div>
        <h4>{cut(item.title, 64)}</h4>
        <p>{cut(item.text, 130)}</p>
        <a href={item.url} target="_blank" rel="noreferrer" className="ub-read-link">
          READ MORE
        </a>
      </div>
    </article>
  );
}

export default function HomePage({ news, active, setActive }: Props) {
  const filtered = byCategory(news, active);
  const hero = filtered[0] || news[0];

  const listA = filtered.slice(1, 4);
  const listB = filtered.slice(4, 8);
  const listC = filtered.slice(8, 12);
  const listD = filtered.slice(12, 16);
  const sideA = filtered.slice(2, 5);
  const sideB = filtered.slice(5, 8);

  const topicCards = sectionFilters.slice(1).map((cat) => ({
    ...cat,
    items: byCategory(news, cat.value).slice(0, 3),
  }));

  return (
    <div className="ub-page">
      <Navbar active={active} setActive={setActive} />

      <main className="ub-wrapper">
        <section className="ub-grid ub-row1">
          <article className="ub-card ub-hero-card">
            <div className="ub-card-head red">FEATURED ARTICLES</div>
            {hero && (
              <>
                <img src={hero.image || "/no-image.png"} alt={hero.title} className="ub-hero-image" />
                <div className="ub-hero-overlay">
                  <h2>{cut(hero.title, 90)}</h2>
                  <p>{cut(hero.text, 120)}</p>
                  <a href={hero.url} target="_blank" rel="noreferrer" className="ub-read-link">
                    READ MORE
                  </a>
                </div>
              </>
            )}
          </article>

          <article className="ub-card ub-list-card">
            <div className="ub-list-top">
              <h3>UB DAILY</h3>
              <button type="button" className="ub-mini-btn" onClick={() => setActive("all")}>
                VIEW ALL
              </button>
            </div>
            {listA.map((item) => (
              <div className="ub-mini-item" key={item._id}>
                <h4>{cut(item.title, 60)}</h4>
                <p>{cut(item.text, 82)}</p>
              </div>
            ))}
          </article>

          <article className="ub-card ub-side-card">
            <h3>UTAH BUSINESS SOCIAL</h3>
            <p>This area can include social widgets and quick links.</p>
            <div className="ub-social-actions">
              <button type="button">FACEBOOK</button>
              <button type="button">TWITTER</button>
              <button type="button">LINKEDIN</button>
            </div>
          </article>
        </section>

        <section className="ub-grid ub-row2">
          <article className="ub-card ub-news-list-card">
            <div className="ub-card-head blue">{toCategoryLabel(active)} NEWS</div>
            {listB.map((item) => (
              <NewsLine item={item} key={item._id} />
            ))}
          </article>

          <article className="ub-card ub-news-list-card">
            <div className="ub-card-head red">LOCAL BUSINESS NEWS</div>
            {listC.map((item) => (
              <NewsLine item={item} key={item._id} />
            ))}
          </article>

          <article className="ub-card ub-side-card">
            <div className="ub-card-head blue">CURRENT ISSUE</div>
            {sideA.map((item) => (
              <div className="ub-mini-item" key={item._id}>
                <h4>{cut(item.title, 56)}</h4>
                <p>{cut(item.text, 90)}</p>
              </div>
            ))}
          </article>
        </section>

        <section className="ub-grid ub-row3">
          <article className="ub-card ub-video-card">
            <div className="ub-card-head red">FEATURED VIDEOS</div>
            {listD[0] && (
              <div className="ub-video-main">
                <img src={listD[0].image || "/no-image.png"} alt={listD[0].title} />
                <h4>{cut(listD[0].title, 68)}</h4>
              </div>
            )}
            <div className="ub-video-strip">
              {listD.slice(1, 3).map((item) => (
                <a key={item._id} href={item.url} target="_blank" rel="noreferrer">
                  <img src={item.image || "/no-image.png"} alt={item.title} />
                </a>
              ))}
            </div>
          </article>

          <article className="ub-card ub-side-card">
            <div className="ub-card-head blue">COMMUNITY EVENTS</div>
            {sideB.map((item) => (
              <div className="ub-mini-item" key={item._id}>
                <h4>{cut(item.title, 58)}</h4>
                <p>{cut(item.text, 84)}</p>
              </div>
            ))}
          </article>
        </section>

        <section className="ub-filter-panel">
          {sectionFilters.map((filter) => (
            <button
              type="button"
              key={filter.value}
              className={active === filter.value ? "ub-filter-btn is-active" : "ub-filter-btn"}
              onClick={() => setActive(filter.value)}
            >
              {filter.label}
            </button>
          ))}
        </section>

        <section className="ub-topics-grid">
          {topicCards.map((topic) => (
            <article className="ub-topic-card" key={topic.value}>
              <div className="ub-card-head blue">{topic.label}</div>
              {topic.items.map((item) => (
                <NewsLine key={item._id} item={item} />
              ))}
            </article>
          ))}
        </section>
      </main>

      <footer className="ub-footer">
        <div className="ub-footer-inner">
          <div className="ub-footer-nav">
            {sectionFilters.map((item) => (
              <button key={item.value} type="button" onClick={() => setActive(item.value)}>
                {item.label}
              </button>
            ))}
          </div>
          <p>Copyright © 2026, news portal layout. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
