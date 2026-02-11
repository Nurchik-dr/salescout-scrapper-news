import { useMemo, useState } from "react";
import type { ApiNewsItem } from "../types/news";

type BreakingTickerProps = {
  items: ApiNewsItem[];
};

export default function BreakingTicker({ items }: BreakingTickerProps) {
  const slides = useMemo(() => items.slice(0, 6), [items]);
  const [start, setStart] = useState(0);

  const visible = [slides[start], slides[(start + 1) % slides.length], slides[(start + 2) % slides.length]].filter(
    Boolean,
  ) as ApiNewsItem[];

  if (!slides.length) {
    return null;
  }

  const prev = () => setStart((value) => (value - 1 + slides.length) % slides.length);
  const next = () => setStart((value) => (value + 1) % slides.length);

  return (
    <section className="breaking-ticker">
      <div className="container breaking-inner">
        <strong className="breaking-title">СРОЧНЫЕ НОВОСТИ</strong>

        <div className="ticker-track">
          {visible.map((item) => (
            <a key={`${item.url}-${item.title}`} href={item.url} target="_blank" rel="noreferrer" className="ticker-item">
              <img src={item.image || "/no-image.png"} alt={item.title} />
              <div>
                <p>{item.title}</p>
              </div>
            </a>
          ))}
        </div>

        <div className="ticker-controls">
          <button onClick={prev} aria-label="Предыдущая новость">
            ◀
          </button>
          <button onClick={next} aria-label="Следующая новость">
            ▶
          </button>
        </div>
      </div>
    </section>
  );
}
