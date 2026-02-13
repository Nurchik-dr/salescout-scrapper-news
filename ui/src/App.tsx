import { Routes, Route } from "react-router-dom";
import FeedScreen from "./screens/FeedScreen/FeedScreen";
import ArticleScreen from "./screens/ArticleScreen/ArticleScreen";
import ScrollToTop from "./components/ScrollToTop/ScrollToTop";

export default function App() {
  return (
    <>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<FeedScreen />} />
        <Route path="/news/:id" element={<ArticleScreen />} />
      </Routes>
    </>
  );
}
