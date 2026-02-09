type Props = {
  loading: boolean;
  onRefresh: () => void;
};

export default function Header({ loading, onRefresh }: Props) {
  return (
    <header className="topbar">
      <div className="topbar-inner">
        {/* <div className="brand">
          <span className="brand-i">i</span>
          <span className="brand-text">informburo</span>
        </div>

        <nav className="nav">
          <a className="nav-link" href="#">
            НОВОСТИ
          </a>
          <a className="nav-link" href="#">
            ИСТОРИИ
          </a>
          <a className="nav-link" href="#">
            ИНТЕРВЬЮ
          </a>
          <a className="nav-link" href="#">
            YOUTUBE
          </a>
        </nav> */}

        <button className="refresh-btn" onClick={onRefresh} disabled={loading}>
          {loading ? "Updating..." : "🔄 Update"}
        </button>
      </div>
    </header>
  );
}
