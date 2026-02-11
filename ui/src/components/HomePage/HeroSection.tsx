import type { NewsItem } from "../../types/news";

type Props = {
  featured?: NewsItem;
};

export default function HeroSection({ featured }: Props) {
  if (!featured) {
    return <section className="nb-hero" />;
  }

  return (
    <section className="nb-hero">
      <div className="nb-section-head">
        <h2>Trending News</h2>
        <div className="nb-tabs-mini">
          <span>Latest</span>
          <span className="is-active">Trending</span>
        </div>
      </div>

      <article className="nb-hero-card">
        <img src={featured.image || "/no-image.png"} alt={featured.title} />
        <div className="nb-hero-overlay" />
        <div className="nb-hero-content">
          <h3>{featured.title}</h3>
          <p>{featured.text}</p>
        </div>
      </article>

      <div className="nb-hero-footer">
        <div className="nb-pagination">
          {[1, 2, 3, 4, 5].map((page) => (
            <button key={page} className={page === 1 ? "is-active" : ""}>
              {page}
            </button>
          ))}
        </div>
        <div className="nb-nav-arrows">
          <button aria-label="previous">‹</button>
          <button aria-label="next">›</button>
        </div>
      </div>
    </section>
  );
}
