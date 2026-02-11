import { useState } from "react";
import { Link, NavLink } from "react-router-dom";
import type { NewsCategory } from "../types/news";

type NavbarProps = {
  activeCategory: NewsCategory;
  onSelectCategory: (category: NewsCategory) => void;
};

const navItems: { label: string; category?: NewsCategory; to?: string }[] = [
  { label: "Главная", category: "all", to: "/" },
  { label: "Видео", category: "all", to: "/" },
  { label: "Политика", category: "all", to: "/" },
  { label: "Бизнес", category: "business", to: "/category/business" },
  { label: "Технологии", category: "tech", to: "/category/tech" },
  { label: "Наука", category: "science", to: "/category/science" },
];

export default function Navbar({ activeCategory, onSelectCategory }: NavbarProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleNavClick = (category?: NewsCategory) => {
    if (category) {
      onSelectCategory(category);
    }
    setIsOpen(false);
  };

  return (
    <header className="site-header">
      <div className="top-strip">
        <div className="container top-strip-inner">
          <span className="top-strip-text">"НОВОЕ" ПОЗИТИВНЫЕ НОВОСТИ</span>
          <div className="top-links">
            <a href="#contacts">Контакты</a>
            <a href="#">Реклама</a>
            <a href="#">Конфиденциальность</a>
          </div>
        </div>
      </div>

      <div className="container navbar-wrap">
        <Link className="brand" to="/" onClick={() => handleNavClick("all")}>
          <span className="brand-red">ПОЗИТИВНЫЕ</span> НОВОСТИ
        </Link>

        <button className="burger" onClick={() => setIsOpen((prev) => !prev)} aria-label="Открыть меню">
          <span />
          <span />
          <span />
        </button>

        <nav className={`navbar ${isOpen ? "open" : ""}`}>
          {navItems.map((item) => {
            const className = item.category === activeCategory ? "active" : "";
            if (item.to) {
              return (
                <NavLink
                  key={item.label}
                  to={item.to}
                  className={className}
                  onClick={() => handleNavClick(item.category)}
                >
                  {item.label}
                </NavLink>
              );
            }

            return (
              <button key={item.label} className="menu-placeholder" onClick={() => setIsOpen(false)}>
                {item.label}
              </button>
            );
          })}
        </nav>

        <a className="contact-button" href="#contacts" onClick={() => setIsOpen(false)}>
          Контакты
        </a>
      </div>
    </header>
  );
}
