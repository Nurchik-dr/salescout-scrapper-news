import type { Dispatch, SetStateAction } from "react";

type Props = {
  active: string;
  setActive: Dispatch<SetStateAction<string>>;
};

const navItems = [
  { label: "Home", value: "all" },
  { label: "Politics", value: "general" },
  { label: "Technology", value: "tech" },
  { label: "Business", value: "business" },
  { label: "Sport", value: "sports" },
  { label: "Entertainment", value: "science" },
];

function SocialIcon({ children }: { children: string }) {
  return <span className="nb-social-icon">{children}</span>;
}

export default function Navbar({ active, setActive }: Props) {
  return (
    <header className="nb-header-wrap">
      <div className="nb-top-search-row">
        <button className="nb-menu-button" aria-label="Open menu">
          ☰
        </button>
        <div className="nb-search-box">Search NewsBite</div>
        <div className="nb-social-list" aria-label="social media links">
          <SocialIcon>𝕏</SocialIcon>
          <SocialIcon>f</SocialIcon>
          <SocialIcon>◎</SocialIcon>
        </div>
      </div>

      <div className="nb-nav-row">
        <nav className="nb-nav-links">
          {navItems.map((item) => (
            <button
              key={item.value}
              className={active === item.value ? "nb-nav-item is-active" : "nb-nav-item"}
              onClick={() => setActive(item.value)}
            >
              {item.label}
            </button>
          ))}
        </nav>
        <h1 className="nb-logo">NewsBite</h1>
      </div>
    </header>
  );
}
