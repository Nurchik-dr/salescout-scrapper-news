import { useEffect, useMemo, useRef, useState } from "react";
import { NewsItem } from "../../types/news";
import "./FeedScreen.css";

type ApiResponse = {
  page: number;
  limit: number;
  total: number;
  items: NewsItem[];
};

type CategoryKey = "general" | "sports" | "tech" | "business" | "science";

const CATEGORIES: Array<{ key: CategoryKey; label: string }> = [
  { key: "tech", label: "Технологии" },
  { key: "business", label: "Бизнес" },
  { key: "sports", label: "Спорт" },
  { key: "science", label: "Наука" },
  { key: "general", label: "Новости" },
];

const FALLBACK_IMG = "/no-image.png";
const PREVIEW_LIMIT = 280;

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
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [isFetching, setIsFetching] = useState(false);

  const [openedId, setOpenedId] = useState<string | null>(null);
  const [expandedTextIds, setExpandedTextIds] = useState<Record<string, boolean>>({});

  const limit = 25;
  const bottomRef = useRef<HTMLDivElement | null>(null);

  const hasMore = useMemo(() => {
    if (total === 0) return true;
    return news.length < total;
  }, [news.length, total]);

  async function load(reset = false) {
    if (isFetching) return;
    if (!reset && !hasMore) return;

    setIsFetching(true);
    try {
      const nextPage = reset ? 1 : page;
      const res = await fetch(
        `http://localhost:4000/api/news?page=${nextPage}&limit=${limit}&category=all`
      );
      const data: ApiResponse = await res.json();

      setTotal(data.total || 0);

      if (reset) {
        setNews(data.items || []);
        setPage(2);
      } else {
        setNews((prev) => [...prev, ...(data.items || [])]);
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
      setNews([]);
      setTotal(0);
      setPage(1);
      setOpenedId(null);
      setExpandedTextIds({});
      await load(true);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load(true);
  }, []);

  useEffect(() => {
    const el = bottomRef.current;
    if (!el) return;

    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isFetching) {
          load(false);
        }
      },
      { rootMargin: "700px" }
    );

    io.observe(el);
    return () => io.disconnect();
  }, [hasMore, isFetching, page]);

  const groupedNews = useMemo(() => {
    const base: Record<CategoryKey, NewsItem[]> = {
      tech: [],
      business: [],
      sports: [],
      science: [],
      general: [],
    };

    news.forEach((item) => {
      const key = item.category && item.category in base ? (item.category as CategoryKey) : "general";
      base[key].push(item);
    });

    return base;
  }, [news]);

  return (
    <div className="feed-page">
      <header className="feed-header">
        <h1>дебил</h1>
        <p>Только хорошие новости</p>

        <button className="refresh-feed-btn" onClick={refresh} disabled={loading}>
          {loading ? "Обновляем..." : "Обновить ленту"}
        </button>
      </header>

      <main className="feed-main">
        {CATEGORIES.map((section) => {
          const items = groupedNews[section.key];
          if (!items.length) return null;

          return (
            <section key={section.key} className="news-section">
              <h2>{section.label}</h2>
              {items.map((item) => {
                const isOpen = openedId === item._id;
                const fullText = item.text || "";
                const textExpanded = !!expandedTextIds[item._id];
                const isLongText = fullText.length > PREVIEW_LIMIT;

                const visibleText = !isOpen
                  ? ""
                  : textExpanded || !isLongText
                    ? fullText
                    : `${fullText.slice(0, PREVIEW_LIMIT)}...`;

                return (
                  <article
                    key={item._id}
                    className={`feed-item ${isOpen ? "opened" : ""}`}
                    onClick={() => setOpenedId((prev) => (prev === item._id ? null : item._id))}
                  >
                    <img
                      className="feed-item-thumb"
                      src={item.image?.startsWith("http") ? item.image : FALLBACK_IMG}
                      alt={item.title}
                      loading="lazy"
                    />

                    <div className="feed-item-content">
                      <h3>{item.title}</h3>
                      <div className="feed-item-meta">
                        <span>● {formatMetaDate(item.publishedAt)}</span>
                        <span>● {section.label}</span>
                      </div>

                      {isOpen && (
                        <div className="feed-item-expanded" onClick={(e) => e.stopPropagation()}>
                          <p>{visibleText}</p>

                          {isLongText && (
                            <button
                              className="expand-btn"
                              onClick={() =>
                                setExpandedTextIds((prev) => ({
                                  ...prev,
                                  [item._id]: !prev[item._id],
                                }))
                              }
                            >
                              {textExpanded ? "Скрыть" : "Еще"}
                            </button>
                          )}

                          <a href={item.url} target="_blank" rel="noreferrer" className="source-link">
                            Читать источник ↗
                          </a>
                        </div>
                      )}
                    </div>
                  </article>
                );
              })}
            </section>
          );
        })}

        <div className="feed-footer">
          {isFetching && <div className="feed-status">Загрузка новостей...</div>}
          {!isFetching && !hasMore && news.length > 0 && (
            <div className="feed-status">Вы просмотрели все новости</div>
          )}
          {!isFetching && news.length === 0 && <div className="feed-status">Пока нет новостей</div>}
        </div>

        {hasMore && !isFetching && (
          <button className="show-more-btn" onClick={() => load(false)}>
            Показать еще
          </button>
        )}

        <div ref={bottomRef} style={{ height: 1 }} />
      </main>
    </div>
  );
}
