// /Users/mac/Desktop/salescout-scrapper-codex-create-positive-news-feed-aggregator/ui/src/App.tsx
import { Routes, Route } from "react-router-dom";
import FeedScreen from "./screens/FeedScreen/FeedScreen";
import ArticleWebViewScreen from "./screens/ArticleWebViewScreen/ArticleWebViewScreen";
import "./styles.css"
export default function App() {
  return (
    <Routes>
      <Route path="/" element={<FeedScreen />} />
      <Route path="/article/:id" element={<ArticleWebViewScreen />} />
    </Routes>
  );
}
