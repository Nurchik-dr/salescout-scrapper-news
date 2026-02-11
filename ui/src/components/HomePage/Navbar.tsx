import type { Dispatch, SetStateAction } from "react";

type Props = {
  active: string;
  setActive: Dispatch<SetStateAction<string>>;
};

type NavItem = {
  label: string;
  value: string;
};

const categories: NavItem[] = [
  { label: "Home", value: "all" },
  { label: "National", value: "general" },
  { label: "Technology", value: "tech" },
  { label: "Business", value: "business" },
  { label: "Sport", value: "sports" },
  { label: "People", value: "science" },
];

export default function Navbar({ active, setActive }: Props) {
  return (
    <header className="ub-header">
      <div className="ub-header-inner">
        <div className="ub-logo-block">
          <span className="ub-logo-top">Utah</span>
          <span className="ub-logo-bottom">Business</span>
        </div>

        <nav className="ub-main-nav">
          {categories.map((item) => (
            <button
              key={item.value}
              type="button"
              className={active === item.value ? "ub-nav-btn is-active" : "ub-nav-btn"}
              onClick={() => setActive(item.value)}
            >
              {item.label}
            </button>
          ))}
        </nav>

        <button type="button" className="ub-search-btn" aria-label="Search news">
          🔍
        </button>
      </div>
    </header>
  );
}
