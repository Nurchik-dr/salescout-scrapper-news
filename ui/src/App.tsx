import { useEffect, useMemo, useState } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import BreakingTicker from "./components/BreakingTicker";
import Footer from "./components/Footer";
import Navbar from "./components/Navbar";
import CategoryPage from "./pages/CategoryPage";
import Home from "./pages/Home";
import type { ApiNewsItem, NewsApiResponse, NewsCategory } from "./types/news";
import { toCategory } from "./types/news";
import "./styles.css";

const API_CANDIDATES = ["http://localhost:3001/api/news", "http://localhost:4000/api/news"];

type NewsLikeResponse = NewsApiResponse | { items?: ApiNewsItem[]; page?: number; limit?: number; total?: number };

export default function App() {
  const [news, setNews] = useState<ApiNewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState<NewsCategory>("all");
  const location = useLocation();

  useEffect(() => {
    const controller = new AbortController();

    const loadNews = async () => {
      setLoading(true);

      for (const endpoint of API_CANDIDATES) {
        try {
          const response = await fetch(endpoint, { signal: controller.signal });
          if (!response.ok) {
            continue;
          }

          const data = (await response.json()) as NewsLikeResponse;
          const items = Array.isArray(data.items) ? data.items : [];

          if (items.length > 0) {
            setNews(items);
            setLoading(false);
            return;
          }

          setNews(items);
          setLoading(false);
          return;
        } catch (error) {
          if ((error as Error).name === "AbortError") {
            return;
          }
        }
      }

      setNews([]);
      setLoading(false);
    };

    void loadNews();

    return () => controller.abort();
  }, []);

  useEffect(() => {
    if (location.pathname.startsWith("/category/")) {
      const slug = location.pathname.split("/").pop();
      setCategory(toCategory(slug));
    }
    if (location.pathname === "/") {
      setCategory("all");
    }
  }, [location.pathname]);

  const tickerItems = useMemo(() => news.slice(0, 8), [news]);

  return (
    <div className="page-root">
      <Navbar activeCategory={category} onSelectCategory={setCategory} />
      <BreakingTicker items={tickerItems} />

      {loading ? (
        <div className="container loading-state">Загрузка новостей...</div>
      ) : (
        <Routes>
          <Route path="/" element={<Home items={news} category={category} onCategoryChange={setCategory} />} />
          <Route path="/category/:slug" element={<CategoryPage items={news} onCategoryChange={setCategory} />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      )}

      <Footer />
    </div>
  );
}
