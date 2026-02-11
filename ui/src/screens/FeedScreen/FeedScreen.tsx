import { useEffect, useMemo, useRef, useState } from "react";
import type { NewsItem } from "../../types/news";
import HomePage from "../../components/HomePage/HomePage";

type ApiResponse = {
  page: number;
  limit: number;
  total: number;
  items: NewsItem[];
};

export default function FeedScreen() {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [category, setCategory] = useState("all");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [isFetching, setIsFetching] = useState(false);
  const limit = 30;
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
      const endpoint = `http://localhost:4000/api/news?page=${nextPage}&limit=${limit}&category=${encodeURIComponent(category)}`;
      const res = await fetch(endpoint);
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

  useEffect(() => {
    setNews([]);
    setTotal(0);
    setPage(1);
    load(true);
  }, [category]);

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
      { rootMargin: "650px" }
    );

    io.observe(el);
    return () => io.disconnect();
  }, [hasMore, isFetching]);

  return (
    <>
      <HomePage news={news} active={category} setActive={setCategory} />
      <div ref={bottomRef} style={{ height: 1 }} />
    </>
  );
}
