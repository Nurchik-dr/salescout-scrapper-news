import type { NewsItem } from "../../types/news";

type Props = {
  technologyNews: NewsItem[];
  allNews: NewsItem[];
};

const topicNames = ["Fashion", "Politics", "Movie", "Sports", "Travel", "Health"];

function trim(text: string, size: number) {
  if (text.length <= size) return text;
  return `${text.slice(0, size).trim()}...`;
}

export default function Sidebar({ technologyNews, allNews }: Props) {
  const topicCards = topicNames.map((topic, i) => {
    const startIndex = i * 3;
    return {
      topic,
      image: allNews[startIndex]?.image || "/no-image.png",
      posts: allNews.slice(startIndex, startIndex + 3),
    };
  });

  return (
    <aside className="nb-sidebar">
      <section className="nb-tech-section">
        <div className="nb-section-head nb-section-head-tight">
          <h2>Technology</h2>
          <span className="nb-section-arrow">›</span>
        </div>

        <div className="nb-tech-layout">
          {technologyNews[0] && (
            <article className="nb-tech-main">
              <img src={technologyNews[0].image || "/no-image.png"} alt={technologyNews[0].title} />
              <h4>{trim(technologyNews[0].title, 74)}</h4>
              <p>{trim(technologyNews[0].text, 200)}</p>
            </article>
          )}

          <ul className="nb-bullet-list nb-bullet-list-tech">
            {technologyNews.slice(1, 4).map((item) => (
              <li key={item._id}>
                <a href={item.url} target="_blank" rel="noreferrer">
                  <h5>{trim(item.title, 60)}</h5>
                  <p>{trim(item.text, 112)}</p>
                </a>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="nb-topics-section">
        <div className="nb-section-head nb-section-head-tight">
          <h2>Your topics</h2>
          <span className="nb-see-all">See all</span>
        </div>

        <div className="nb-topics-grid">
          {topicCards.map((topic) => (
            <article key={topic.topic} className="nb-topic-card">
              <div className="nb-topic-cover">
                <img src={topic.image} alt={topic.topic} />
                <div className="nb-topic-overlay">{topic.topic}</div>
              </div>

              <ul className="nb-topic-list">
                {topic.posts.map((post) => (
                  <li key={post._id}>
                    <a href={post.url} target="_blank" rel="noreferrer">
                      <h5>{trim(post.title, 52)}</h5>
                      <p>{trim(post.text, 86)}</p>
                    </a>
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>
    </aside>
  );
}
