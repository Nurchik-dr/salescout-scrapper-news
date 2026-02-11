import type { Dispatch, SetStateAction } from "react";

type Props = {
  active: string;
  setActive: Dispatch<SetStateAction<string>>;
};

const leftItems = [
  { label: "Home", value: "all" },
  { label: "US Politics", value: "general" },
  { label: "Technology", value: "tech" },
];

const rightItems = [
  { label: "Business", value: "business" },
  { label: "Sport", value: "sports" },
  { label: "Entertainment", value: "science" },
];

function SocialIcon({ children }: { children: string }) {
  return <span className="nb-social-icon">{children}</span>;
}

function NavItem({
  active,
  label,
  value,
  setActive,
}: {
  active: string;
  label: string;
  value: string;
  setActive: Dispatch<SetStateAction<string>>;
}) {
  return (
    <button
      className={active === value ? "nb-nav-item is-active" : "nb-nav-item"}
      onClick={() => setActive(value)}
    >
      {label}
    </button>
  );
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
          <SocialIcon>◉</SocialIcon>
        </div>
      </div>

      <div className="nb-nav-row">
        <nav className="nb-nav-group nb-nav-group-left">
          {leftItems.map((item) => (
            <NavItem key={item.value} active={active} setActive={setActive} {...item} />
          ))}
        </nav>

        <h1 className="nb-logo">NewsBite</h1>

        <nav className="nb-nav-group nb-nav-group-right">
          {rightItems.map((item) => (
            <NavItem key={item.value} active={active} setActive={setActive} {...item} />
          ))}
        </nav>
      </div>
    </header>
  );
}
