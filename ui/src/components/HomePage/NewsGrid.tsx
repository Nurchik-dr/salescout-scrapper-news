import type { NewsItem } from "../../types/news";

type Props = {
  recentNews: NewsItem[];
  warNews: NewsItem[];
};

function NewsRow({ item }: { item: NewsItem }) {
  return (
    <a href={item.url} target="_blank" rel="noreferrer" className="nb-news-row">
      <img src={item.image || "/no-image.png"} alt={item.title} />
      <div>
        <h4>{item.title}</h4>
        <p>{item.text}</p>
        <span>{item.category || "World"}</span>
      </div>
    </a>
  );
}

export default function NewsGrid({ recentNews, warNews }: Props) {
  return (
    <section className="nb-news-grid">
      <div className="nb-news-column">
        <div className="nb-section-head">
          <h2>Recent News</h2>
        </div>
        <div className="nb-card-list">
          {recentNews.map((item) => (
            <NewsRow key={item._id} item={item} />
          ))}
        </div>
      </div>

      <div className="nb-news-column">
        <div className="nb-section-head">
          <h2>Russia&apos;s war in Ukraine</h2>
        </div>
        <div className="nb-war-card">
          {warNews[0] && (
            <>
              <img src={warNews[0].image || "/no-image.png"} alt={warNews[0].title} />
              <h4>{warNews[0].title}</h4>
            </>
          )}
        </div>
        <ul className="nb-bullet-list">
          {warNews.slice(1, 5).map((item) => (
            <li key={item._id}>
              <a href={item.url} target="_blank" rel="noreferrer">
                {item.title}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
