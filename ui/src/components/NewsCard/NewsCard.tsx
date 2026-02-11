// /Users/mac/Desktop/salescout-scrapper-codex-create-positive-news-feed-aggregator/ui/src/components/NewsCard/NewsCard.tsx
import { useNavigate } from "react-router-dom";
import { NewsItem } from "../../types/news";
import "./NewsCard.css";

type Props = {
  item: NewsItem;
  variant?: "default" | "hero";
};

function isNew(publishedAt: string) {
  const diff = Date.now() - new Date(publishedAt).getTime();
  return diff < 1000 * 60 * 60 * 6;
}

const FALLBACK_IMG =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(`
  <svg xmlns="http://www.w3.org/2000/svg" width="640" height="420">
    <rect width="100%" height="100%" fill="#eef1f5"/>
    <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle"
      font-family="Arial" font-size="42" fill="#9aa3ad">NEWS</text>
  </svg>`);

export default function NewsCard({ item, variant = "default" }: Props) {
  const navigate = useNavigate();

  const img =
    item.image && item.image.startsWith("http") ? item.image : FALLBACK_IMG;

  return (
    <article
      className={`news-card ${variant}`}
      onClick={() => navigate(`/article/${item._id}`)}
    >
      {/* IMAGE */}
      <div className="news-image">
        <img src={img} alt={item.title} loading="lazy" />

        {/* OVERLAY TITLE for HERO */}
        {variant === "hero" && (
          <div className="hero-overlay">
            <p className="hero-date">
              {new Date(item.publishedAt).toLocaleString("ru-RU", {
                day: "2-digit",
                month: "long",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>

            <h3 className="hero-title">
              {item.title}
              {isNew(item.publishedAt) && <span className="badge">NEW</span>}
            </h3>
          </div>
        )}
      </div>

      {/* NORMAL CONTENT */}
      {variant === "default" && (
        <div className="news-content">
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
            {item.text ? item.text.slice(0, 120) + "..." : ""}
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
      )}
    </article>
  );
}
