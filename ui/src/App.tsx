import { useEffect, useState } from "react";
import { NewsItem } from "./types/news";

import Header from "./components/Header";
import Tabs from "./components/Tabs";
import NewsList from "./components/NewsList";
import "./styles.css";

export default function App() {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [mode, setMode] = useState<"all" | "positive">("all");
  const [loading, setLoading] = useState(false);

  const [page, setPage] = useState(1);
  const limit = 15;

  const [isFetching, setIsFetching] = useState(false);

  // ===========================
  // LOAD NEWS
  // ===========================
  async function load(reset = false) {
    if (isFetching) return;
    setIsFetching(true);

    const nextPage = reset ? 1 : page;

    const endpoint =
      mode === "all"
        ? `http://localhost:4000/api/news?page=${nextPage}&limit=${limit}`
        : `http://localhost:4000/api/news/positive?page=${nextPage}&limit=${limit}`;

    const res = await fetch(endpoint);
    const data = await res.json();

    if (reset) {
      setNews(data.items);
      setPage(2);
    } else {
      setNews((prev) => [...prev, ...data.items]);
      setPage((p) => p + 1);
    }

    setIsFetching(false);
  }

  // ===========================
  // REFRESH BUTTON
  // ===========================
  async function refresh() {
    setLoading(true);

    await fetch("http://localhost:4000/api/refresh", {
      method: "POST",
    });

    // после update обновляем заново
    await load(true);

    setLoading(false);
  }

  // ===========================
  // Reload when mode changes
  // ===========================
  useEffect(() => {
    load(true);
  }, [mode]);

  // ===========================
  // Infinite scroll
  // ===========================
  useEffect(() => {
    function onScroll() {
      if (
        window.innerHeight + window.scrollY >=
        document.body.offsetHeight - 400
      ) {
        load();
      }
    }

    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, [page, mode]);

  return (
    <div>
      <Header loading={loading} onRefresh={refresh} />
      <Tabs mode={mode} setMode={setMode} />
      <NewsList news={news} />
    </div>
  );
}
