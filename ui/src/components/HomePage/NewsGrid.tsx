import type { NewsItem } from "../../types/news";

type Props = {
  recentNews: NewsItem[];
  warNews: NewsItem[];
};

function trim(text: string, size: number) {
  if (text.length <= size) return text;
  return `${text.slice(0, size).trim()}...`;
}

function mapCategory(category?: NewsItem["category"]) {
  if (!category) return "World";
  if (category === "tech") return "Technology";
  if (category === "sports") return "Sport";
  if (category === "science") return "Health";
  if (category === "general") return "World";
  return "Business";
}

function NewsRow({ item }: { item: NewsItem }) {
  return (
    <a href={item.url} target="_blank" rel="noreferrer" className="nb-news-row">
      <img src={item.image || "/no-image.png"} alt={item.title} />
      <div>
        <h4>{trim(item.title, 68)}</h4>
        <p>{trim(item.text, 128)}</p>
        <div className="nb-meta-row">
          <span className="nb-meta-category">{mapCategory(item.category)}</span>
          <span>•</span>
          <span>150K views</span>
          <span>•</span>
          <span>3h ago</span>
        </div>
      </div>
    </a>
  );
}

export default function NewsGrid({ recentNews, warNews }: Props) {
  return (
    <section className="nb-news-grid">
      <div className="nb-news-column">
        <div className="nb-section-head nb-section-head-tight">
          <h2>Recent News</h2>
          <span className="nb-section-arrow">›</span>
        </div>

        <div className="nb-card-list">
          {recentNews.map((item) => (
            <NewsRow key={item._id} item={item} />
          ))}
        </div>
      </div>

      <div className="nb-news-column">
        <div className="nb-section-head nb-section-head-tight">
          <h2>Russia&apos;s war in Ukraine</h2>
          <span className="nb-section-arrow">›</span>
        </div>

        <div className="nb-war-card">
          {warNews[0] && (
            <>
              <img src={warNews[0].image || "/no-image.png"} alt={warNews[0].title} />
              <h4>{trim(warNews[0].title, 96)}</h4>
              <p>{trim(warNews[0].text, 136)}</p>
            </>
          )}
        </div>

        <ul className="nb-bullet-list">
          {warNews.slice(1, 5).map((item) => (
            <li key={item._id}>
              <a href={item.url} target="_blank" rel="noreferrer">
                <h5>{trim(item.title, 70)}</h5>
                <p>{trim(item.text, 115)}</p>
              </a>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
