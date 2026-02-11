import { formatDate } from "../types/news";
import type { ApiNewsItem } from "../types/news";

type NewsCardProps = {
  item: ApiNewsItem;
  compact?: boolean;
};

export default function NewsCard({ item, compact = false }: NewsCardProps) {
  return (
    <article className={`news-card ${compact ? "compact" : ""}`}>
      <a href={item.url} target="_blank" rel="noreferrer" className="news-thumb">
        <img src={item.image || "/no-image.png"} alt={item.title} loading="lazy" />
      </a>

      <div className="news-content">
        <h3>{item.title}</h3>
        <p className="news-date">{formatDate(item.publishedAt)}</p>
        {!compact && <p className="news-text">{item.text}</p>}
        <a href={item.url} target="_blank" rel="noreferrer" className="read-more">
          Читать далее
        </a>
      </div>
    </article>
  );
}
