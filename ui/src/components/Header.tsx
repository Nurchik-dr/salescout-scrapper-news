type Props = {
  loading: boolean;
  onRefresh: () => void;
};

export default function Header({ loading, onRefresh }: Props) {
  return (
    <div className="header">
      <div className="header-inner">
        <div className="logo">informburo</div>

        <button className="refresh-btn" onClick={onRefresh}>
          {loading ? "Updating..." : "🔄 Update"}
        </button>
      </div>
    </div>
  );
}