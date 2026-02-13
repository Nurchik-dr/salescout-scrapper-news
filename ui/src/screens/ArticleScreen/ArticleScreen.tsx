// ui/src/screens/ArticleScreen/ArticleScreen.tsx
import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { NewsItem } from "../../types/news";
import "./ArticleScreen.css";

export default function ArticleScreen() {
  const { id } = useParams();
  const [item, setItem] = useState<NewsItem | null>(null);

  useEffect(() => {
    fetch(`http://localhost:4000/api/news/${id}`)
      .then((r) => r.json())
      .then(setItem);
  }, [id]);

  if (!item) return <div className="article-page">Загрузка...</div>;

  return (
    <div className="article-page">
      <div className="article-container">
        <Link to="/" className="back-link">
          ← Назад
        </Link>

        <h1>{item.title}</h1>
        <p className="article-meta">{item.publishedAt}</p>

        <div className="article-text">{item.text}</div>

        <a href={item.url} target="_blank" rel="noreferrer" className="source">
          Читать оригинал ↗
        </a>
      </div>
    </div>
  );
}
