import { useEffect, useMemo, useRef, useState } from "react";
import { NewsItem } from "./types/news";

// import Header from "./components/Header";
import Tabs from "./components/Tabs";
import NewsList from "./components/NewsList";
import "./styles.css";
import Navbar from "./components/NavBar/NavBar";

type ApiResponse = {
  page: number;
  limit: number;
  total: number;
  items: NewsItem[];
};

export default function App() {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [mode, setMode] = useState<"all" | "positive">("all");
  const [loading, setLoading] = useState(false);
  const [category, setCategory] = useState("Новости");

  const [page, setPage] = useState(1);
  const limit = 15;

  const [total, setTotal] = useState(0);
  const [isFetching, setIsFetching] = useState(false);

  // ✅ hasMore работает даже если total ещё не пришёл
  const hasMore = useMemo(() => {
    if (total === 0) return true;
    return news.length < total;
  }, [news.length, total]);

  const bottomRef = useRef<HTMLDivElement | null>(null);

  function endpointFor(p: number) {
    const base =
      mode === "all"
        ? "http://localhost:4000/api/news"
        : "http://localhost:4000/api/news/positive";

    return `${base}?page=${p}&limit=${limit}&category=${category}`;
  }



  // ui/src/App.tsx (фикс кнопки Positive)

async function load(reset = false) {
  if (isFetching) return;
  if (!reset && !hasMore) return;

  setIsFetching(true);

  try {
    const nextPage = reset ? 1 : page;

    const endpoint =
      mode === "all"
        ? `http://localhost:4000/api/news?page=${nextPage}&limit=${limit}`
        : `http://localhost:4000/api/news/positive?page=${nextPage}&limit=${limit}`;

    const res = await fetch(endpoint);
    const data: ApiResponse = await res.json();

    setTotal(data.total || 0);

    if (reset) {
      setNews(data.items || []);
      setPage(2);
    } else {
      setNews((prev) => [...prev, ...(data.items || [])]);
      setPage((p) => p + 1);
    }
  } finally {
    setIsFetching(false);
  }
}


  async function refresh() {
    setLoading(true);

    try {
      await fetch("http://localhost:4000/api/refresh", {
        method: "POST",
      });

      setNews([]);
      setTotal(0);
      setPage(1);

      await load(true);
    } finally {
      setLoading(false);
    }
  }

  // reset при смене вкладки
  useEffect(() => {
    setNews([]);
    setTotal(0);
    setPage(1);
    load(true);
  }, [category]);


  // infinite scroll
  useEffect(() => {
    const el = bottomRef.current;
    if (!el) return;

    const io = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry.isIntersecting && hasMore && !isFetching) {
          load(false);
        }
      },
      { rootMargin: "600px" }
    );

    io.observe(el);
    return () => io.disconnect();
  }, [hasMore, isFetching, page, mode]);

  return (
    <div className="page">
      <Navbar active={category} setActive={setCategory} loading={loading} onRefresh={refresh}  />
      {/* <Header loading={loading} onRefresh={refresh} /> */}

      <div className="container">
        {/* <Tabs mode={mode} setMode={setMode} /> */}

        <div className="section-title">
          <span className="section-mark" />
          <h2>ГЛАВНЫЕ НОВОСТИ</h2>
        </div>

        <NewsList news={news} />

        <div className="feed-footer">
          {isFetching && <div className="feed-status">Загрузка...</div>}

          {!isFetching && !hasMore && news.length > 0 && (
            <div className="feed-status">Это всё ✅</div>
          )}

          {!isFetching && news.length === 0 && (
            <div className="feed-status">Нет новостей</div>
          )}
        </div>

        <div ref={bottomRef} style={{ height: 1 }} />
      </div>
    </div>
  );
}
