import "./NavBar.css"
type Props = {
  active: string;
  setActive: (v: string) => void;
  loading: boolean;
  onRefresh: () => void;
};

export default function Navbar({ active, setActive, loading,onRefresh }: Props) {
  const links = ["Новости", "Спорт", "Интервью", "Истории"];

  return (
    <div className="topbar">
      <div className="navbar-inner">
        <div className="navbar-links">
          {links.map((item) => (
            <button
              key={item}
              className={active === item ? "nav-link active" : "nav-link"}
              onClick={() => setActive(item)}
            >
              {item}
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


