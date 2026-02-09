type Props = {
  mode: "all" | "positive";
  setMode: (m: "all" | "positive") => void;
};

export default function Tabs({ mode, setMode }: Props) {
  return (
    <div className="tabs">
      <button
        className={mode === "all" ? "tab active" : "tab"}
        onClick={() => setMode("all")}
      >
        All News
      </button>

      <button
        className={mode === "positive" ? "tab active" : "tab"}
        onClick={() => setMode("positive")}
      >
        Positive news
      </button>
    </div>
  );
}

