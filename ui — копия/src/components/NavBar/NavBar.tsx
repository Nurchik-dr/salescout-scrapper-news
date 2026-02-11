// /Users/mac/Desktop/salescout-scrapper-codex-create-positive-news-feed-aggregator/ui/src/components/NavBar/NavBar.tsx
import "./NavBar.css";

type Props = {
  active: string;
  setActive: (v: string) => void;
  loading: boolean;
  onRefresh: () => void;
};

const links = [
  { label: "Все", value: "all" },
  { label: "Новости", value: "general" },
  { label: "Спорт", value: "sports" },
  { label: "Технологии", value: "tech" },
  { label: "Бизнес", value: "business" },
  { label: "Наука", value: "science" },
];

export default function Navbar({
  active,
  setActive,
  loading,
  onRefresh,
}: Props) {
  return (
    <div className="topbar">
      <div className="navbar-inner">
        <div className="navbar-links">
          {links.map((item) => (
            <button
              key={item.value}
              className={active === item.value ? "nav-link active" : "nav-link"}
              onClick={() => setActive(item.value)}
            >
              {item.label}
            </button>
          ))}
        </div>

        <button className="refresh-btn" onClick={onRefresh} disabled={loading}>
          {loading ? "Updating..." : "Update"}
        </button>
      </div>
    </div>
  );
}
