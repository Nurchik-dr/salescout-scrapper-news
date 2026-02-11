import type { Dispatch, SetStateAction } from "react";
import type { NewsItem } from "../../types/news";
import Navbar from "./Navbar";
import HeroSection from "./HeroSection";
import NewsGrid from "./NewsGrid";
import Sidebar from "./Sidebar";
import "./HomePage.css";

type Props = {
  news: NewsItem[];
  active: string;
  setActive: Dispatch<SetStateAction<string>>;
};

export default function HomePage({ news, active, setActive }: Props) {
  const featured = news[0];
  const recentNews = news.slice(1, 5);
  const warNews = news.slice(5, 10);
  const technologyNews = news.filter((item) => item.category === "tech").slice(0, 4);

  return (
    <div className="nb-page">
      <Navbar active={active} setActive={setActive} />

      <main className="nb-main-layout">
        <section className="nb-left-column">
          <HeroSection featured={featured} />
          <NewsGrid recentNews={recentNews} warNews={warNews} />
        </section>

        <Sidebar technologyNews={technologyNews.length ? technologyNews : news.slice(0, 4)} allNews={news} />
      </main>
    </div>
  );
}
