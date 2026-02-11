import type { NewsItem } from "../../types/news";

type Props = {
  technologyNews: NewsItem[];
  allNews: NewsItem[];
};

const topicNames = ["Fashion", "Politics", "Movie", "Sports", "Travel", "Health"];

export default function Sidebar({ technologyNews, allNews }: Props) {
  const topicCards = topicNames.map((topic, i) => ({
    topic,
    image: allNews[i]?.image || "/no-image.png",
  }));

  return (
    <aside className="nb-sidebar">
      <section className="nb-tech-section">
        <div className="nb-section-head">
          <h2>Technology</h2>
        </div>

        {technologyNews[0] && (
          <article className="nb-tech-main">
            <img src={technologyNews[0].image || "/no-image.png"} alt={technologyNews[0].title} />
            <h4>{technologyNews[0].title}</h4>
            <p>{technologyNews[0].text}</p>
          </article>
        )}

        <ul className="nb-bullet-list compact">
          {technologyNews.slice(1, 5).map((item) => (
            <li key={item._id}>
              <a href={item.url} target="_blank" rel="noreferrer">
                {item.title}
              </a>
            </li>
          ))}
        </ul>
      </section>

      <section className="nb-topics-section">
        <div className="nb-section-head">
          <h2>Your topics</h2>
          <span className="nb-see-all">See all</span>
        </div>

        <div className="nb-topics-grid">
          {topicCards.map((topic) => (
            <article key={topic.topic} className="nb-topic-card">
              <img src={topic.image} alt={topic.topic} />
              <div className="nb-topic-overlay">{topic.topic}</div>
            </article>
          ))}
        </div>
      </section>
    </aside>
  );
}
