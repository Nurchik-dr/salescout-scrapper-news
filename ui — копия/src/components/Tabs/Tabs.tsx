// /Users/mac/Desktop/salescout-scrapper-codex-create-positive-news-feed-aggregator/ui/src/components/Tabs.tsx

type Props = {
  mode: "all" | "positive";
  setMode: (v: "all" | "positive") => void;
};

export default function Tabs({ mode, setMode }: Props) {
  return (
    <div className="tabs">
      <button
        className={`tab ${mode === "all" ? "active" : ""}`}
        onClick={() => setMode("all")}
      >
        All News
      </button>

      <button
        className={`tab ${mode === "positive" ? "active" : ""}`}
        onClick={() => setMode("positive")}
      >
        {mode === "positive" ? "⏳ Loading..." : "Positive news"}
      </button>
    </div>
  );
}
