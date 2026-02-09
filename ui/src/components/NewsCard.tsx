import { NewsItem } from "../types/news";

type Props = {
  item: NewsItem;
};

function isNew(publishedAt: string) {
  const diff = Date.now() - new Date(publishedAt).getTime();
  return diff < 1000 * 60 * 60 * 6;
}

export default function NewsCard({ item }: Props) {
  const hasImage =
    item.image && item.image.startsWith("http");

  return (
    <div className="news-card">
      {/* IMAGE */}
      <div className="news-image">
        {hasImage ? (
          <img
            src={
              item.image && item.image.startsWith("http")
                ? item.image
                : "/no-image.png"
            }
          />

        ) : (
          <div className="news-image-empty" />
        )}
      </div>

      {/* CONTENT */}
      <div className="news-content">
        {/* DATE */}
        <p className="news-date">
          {new Date(item.publishedAt).toLocaleString("ru-RU", {
            day: "2-digit",
            month: "long",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </p>

        {/* TITLE */}
        <h2 className="news-title">
          {item.title}
          {isNew(item.publishedAt) && (
            <span className="badge">NEW</span>
          )}
        </h2>

        {/* TEXT */}
        <p className="news-text">
          {item.text
            ? item.text.slice(0, 120) + "..."
            : "Описание отсутствует"}
        </p>

        {/* LINK */}
        <a
          className="news-link"
          href={item.url}
          target="_blank"
          rel="noreferrer"
        >
          Читать →
        </a>
      </div>
    </div>
  );
}