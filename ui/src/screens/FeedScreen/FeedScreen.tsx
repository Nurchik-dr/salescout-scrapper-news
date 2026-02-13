// ui/src/screens/FeedScreen/FeedScreen.tsx
import { useEffect, useMemo, useRef, useState } from "react";
import { NewsItem } from "../../types/news";
import "./FeedScreen.css";
import { useNavigate } from "react-router-dom";
import Navbar from "../../components/NavBar/NavBar";

type ApiResponse = {
  page: number;
  limit: number;
  total: number;
  items: NewsItem[];
};

function formatMetaDate(date: string) {
  return new Date(date).toLocaleString("ru-RU", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function FeedScreen() {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(false);

  const [region, setRegion] = useState<"kz" | "world">("kz");

  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const [isFetching, setIsFetching] = useState(false);

  const navigate = useNavigate();
  const limit = 25;

  const loaderRef = useRef<HTMLDivElement | null>(null);

  const hasMore = useMemo(() => {
    if (total === 0) return true;
    return news.length < total;
  }, [news.length, total]);

  async function loadNext(reset = false) {
    if (isFetching) return;
    if (!reset && !hasMore) return;

    setIsFetching(true);

    try {
      const nextPage = reset ? 1 : page;

      const res = await fetch(
        `http://localhost:4000/api/news?page=${nextPage}&limit=${limit}&region=${region}`
      );

      const data: ApiResponse = await res.json();
      setTotal(data.total || 0);

      if (reset) {
        setNews(data.items || []);
        setPage(2);
      } else {
        setNews((prev) => {
          const merged = [...prev, ...(data.items || [])];
          return Array.from(new Map(merged.map((x) => [x.url, x])).values());
        });

        setPage((prev) => prev + 1);
      }
    } finally {
      setIsFetching(false);
    }
  }

  async function refresh() {
    setLoading(true);

    try {
      await fetch("http://localhost:4000/api/refresh", { method: "POST" });

      const res = await fetch(
        `http://localhost:4000/api/news?page=1&limit=${limit}&region=${region}`
      );

      const data: ApiResponse = await res.json();

      setNews((prev) => {
        const merged = [...(data.items || []), ...prev];
        return Array.from(new Map(merged.map((x) => [x.url, x])).values());
      });

      setTotal(data.total || 0);
      setPage(2);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    setNews([]);
    setTotal(0);
    setPage(1);
    loadNext(true);
  }, [region]);

  useEffect(() => {
    loadNext(true);
  }, []);

  useEffect(() => {
    if (!loaderRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          loadNext(false);
        }
      },
      { threshold: 1 }
    );

    observer.observe(loaderRef.current);

    return () => observer.disconnect();
  }, [hasMore, page, isFetching, region]);

  const sortedNews = useMemo(() => {
    return [...news].sort(
      (a, b) =>
        new Date(b.publishedAt || "").getTime() -
        new Date(a.publishedAt || "").getTime()
    );
  }, [news]);

  useEffect(() => {
    const saved = sessionStorage.getItem("feed-scroll");
    if (saved) {
      window.scrollTo(0, Number(saved));
    }
  }, []);

  useEffect(() => {
    const onScroll = () => {
      sessionStorage.setItem("feed-scroll", String(window.scrollY));
    };

    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="feed-page">

      <main className="feed-main">
        {sortedNews.map((item) => (
          <article
            key={item._id}
            className="feed-item"
            onClick={() => navigate(`/news/${item._id}`)}
          >
            <div className="feed-item-content">
              <h3>{item.title}</h3>

              <p className="feed-preview">
                {item.text?.slice(0, 120) || "Читать полностью →"}
              </p>

              <div className="feed-item-meta">
                <span>● {formatMetaDate(item.publishedAt)}</span>
              </div>
            </div>
          </article>
        ))}

        <div ref={loaderRef} style={{ height: 40 }} />

        <div className="feed-footer">
          {isFetching && (
            <div className="feed-status">Загрузка новостей...</div>
          )}

          {!hasMore && news.length > 0 && (
            <div className="feed-status">Вы просмотрели все новости</div>
          )}

          {!isFetching && news.length === 0 && (
            <div className="feed-status">Пока нет новостей</div>
          )}
        </div>
      </main>
    </div>
  );
}
