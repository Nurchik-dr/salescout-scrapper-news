import { useMemo, useState } from "react";
import { formatDate } from "../types/news";
import type { ApiNewsItem } from "../types/news";

type NewsSliderProps = {
  items: ApiNewsItem[];
};

export default function NewsSlider({ items }: NewsSliderProps) {
  const slides = useMemo(() => items.slice(0, 5), [items]);
  const [index, setIndex] = useState(0);

  if (!slides.length) {
    return (
      <section className="hero-empty panel">
        <h2>ПОСЛЕДНИЕ НОВОСТИ</h2>
        <p>Загрузка материалов...</p>
      </section>
    );
  }

  const activeSlide = slides[index];

  return (
    <section className="hero-slider">
      <img src={activeSlide.image || "/no-image.png"} alt={activeSlide.title} className="hero-image" />
      <div className="hero-overlay">
        <p className="hero-title-tag">ПОСЛЕДНИЕ НОВОСТИ</p>
        <h1>{activeSlide.title}</h1>
        <p className="hero-date">{formatDate(activeSlide.publishedAt)}</p>
        <a href={activeSlide.url} target="_blank" rel="noreferrer" className="read-more">
          Читать далее
        </a>
      </div>

      <button className="hero-arrow left" onClick={() => setIndex((value) => (value - 1 + slides.length) % slides.length)}>
        ❮
      </button>
      <button className="hero-arrow right" onClick={() => setIndex((value) => (value + 1) % slides.length)}>
        ❯
      </button>
    </section>
  );
}
