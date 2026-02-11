// /Users/mac/Desktop/salescout-scrapper-codex-create-positive-news-feed-aggregator/ui/src/screens/ArticleWebViewScreen/ArticleWebViewScreen.tsx
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { NewsItem } from "../../types/news";

export default function ArticleWebViewScreen() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [article, setArticle] = useState<NewsItem | null>(null);

  useEffect(() => {
    async function load() {
      const res = await fetch(`http://localhost:4000/api/news/${id}`);
      const data = await res.json();
      setArticle(data);
    }

    load();
  }, [id]);

  if (!article) {
    return <div className="feed-status">Загрузка статьи...</div>;
  }

  return (
    <div className="page">
      {/* TOP BAR */}
      <div className="topbar">
        <div className="navbar-inner">
          <button className="refresh-btn" onClick={() => navigate("/")}>
            ← Назад
          </button>

          <div style={{ color: "white", fontWeight: 900 }}>
            Статья
          </div>
        </div>
      </div>

      {/* ARTICLE */}
      <div className="container">
        <h1 style={{ fontSize: 26, marginBottom: 14 }}>
          {article.title}
        </h1>

        {article.image && (
          <img
            src={article.image}
            alt=""
            style={{
              width: "100%",
              borderRadius: 14,
              marginBottom: 18,
              maxHeight: 420,
              objectFit: "cover",
            }}
          />
        )}

        <p style={{ fontSize: 16, lineHeight: 1.6, marginBottom: 22 }}>
          {article.text || "Полный текст пока недоступен."}
        </p>

        {/* BUTTON */}
        <a
          href={article.url}
          target="_blank"
          rel="noreferrer"
          className="refresh-btn"
          style={{
            display: "inline-block",
            textAlign: "center",
          }}
        >
          Подробнее на сайте →
        </a>
      </div>
    </div>
  );
}
