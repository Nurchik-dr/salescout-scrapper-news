// ui/src/components/NavBar/NavBar.tsx
import "./NavBar.css";

type Props = {
  region: "kz" | "world";
  setRegion: (v: "kz" | "world") => void;
  loading: boolean;
  onRefresh: () => void;
};

export default function Navbar({
  region,
  setRegion,
  loading,
  onRefresh,
}: Props) {
  return (
    <div className="topbar">
      <div className="navbar-inner">
        <div className="navbar-links">
          <button
            className={region === "kz" ? "nav-link active" : "nav-link"}
            onClick={() => setRegion("kz")}
          >
            🇰🇿 Казахстан
          </button>

          <button
            className={region === "world" ? "nav-link active" : "nav-link"}
            onClick={() => setRegion("world")}
          >
            🌍 Мир
          </button>
        </div>

        <button className="refresh-btn" onClick={onRefresh} disabled={loading}>
          {loading ? "Обновляем..." : "Обновить"}
        </button>
      </div>
    </div>
  );
}

