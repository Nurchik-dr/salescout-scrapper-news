// /Users/mac/Desktop/salescout-scrapper-codex-create-positive-news-feed-aggregator/ui/src/components/NewsCard.tsx
import { useNavigate } from "react-router-dom";
import { NewsItem } from "../../types/news";
import "./NewsCard.css"
type Props = {
  item: NewsItem;
};

function isNew(publishedAt: string) {
  const diff = Date.now() - new Date(publishedAt).getTime();
  return diff < 1000 * 60 * 60 * 6;
}

function categoryLabel(cat?: string) {
  switch (cat) {
    case "sports":
      return "";
    case "tech":
      return "";
    case "business":
      return "";
    case "science":
      return "";
    default:
      return "";
  }
}

const FALLBACK_IMG =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(`
  <svg xmlns="http://www.w3.org/2000/svg" width="640" height="420">
    <rect width="100%" height="100%" fill="#eef1f5"/>
    <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle"
      font-family="Arial" font-size="42" fill="#9aa3ad">NEWS</text>
  </svg>`);

export default function NewsCard({ item }: Props) {
  const navigate = useNavigate();

  const img =
    item.image && item.image.startsWith("http") ? item.image : FALLBACK_IMG;

  return (
    <article
      className="news-card"
      onClick={() => navigate(`/article/${item._id}`)}
      style={{ cursor: "pointer" }}
    >
      <div className="news-image">
        <img src={img} alt={item.title} loading="lazy" />
      </div>

      <div className="news-content">
        <div className="news-category">{categoryLabel(item.category)}</div>

        <p className="news-date">
          {new Date(item.publishedAt).toLocaleString("ru-RU", {
            day: "2-digit",
            month: "long",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </p>

        <h3 className="news-title">
          {item.title}
          {isNew(item.publishedAt) && <span className="badge">NEW</span>}
        </h3>

        <p className="news-text">
          {item.text ? item.text.slice(0, 140) + "..." : "Описание отсутствует"}
        </p>

        <button
          className="news-link"
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/article/${item._id}`);
          }}
        >
          Читать →
        </button>
      </div>
    </article>
  );
}

