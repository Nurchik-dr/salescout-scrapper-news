// /Users/mac/Desktop/salescout-scrapper-codex-create-positive-news-feed-aggregator/server/src/news-server.ts
import path from "path";
import dotenv from "dotenv";
import express from "express";
import mongoose, { Schema } from "mongoose";
import cors from "cors";
import { execSync } from "child_process";

dotenv.config();

// ==========================================
// ✅ NEWS SCHEMA (with category)
// ==========================================
const newsSchema = new Schema(
  {
    source: { type: String, required: true },

    // ✅ NEW
    category: {
      type: String,
      enum: ["general", "sports", "tech", "business", "science"],
      required: false,
    },

    title: { type: String, required: true },
    text: { type: String, required: false },
    image: { type: String, required: false },
    url: { type: String, required: true },
    publishedAt: { type: String, required: true },

    sentiment: {
      type: String,
      enum: ["positive", "neutral", "negative"],
      required: true,
    },
  },
  { collection: "news", timestamps: true }
);

const NewsModel = mongoose.models.News || mongoose.model("News", newsSchema);

async function startServer() {
  await mongoose.connect(
    process.env.MONGO_URI || "mongodb://localhost:27017/positive_news"
  );

  const app = express();
  app.use(cors());
  app.use(express.json());

  // ==========================================
  // ✅ ONLY LAST 7 DAYS
  // ==========================================
  function last7DaysFilter() {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    return {
      publishedAt: { $gte: weekAgo.toISOString() },
    };
  }
  // ==========================================
  // ✅ SINGLE ARTICLE BY ID
  // ==========================================
  app.get("/api/news/:id", async (req, res) => {
    try {
      const { id } = req.params;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ error: "Invalid id" });
      }

      const item = await NewsModel.findOne({ _id: id }).lean();

      if (!item) {
        return res.status(404).json({ error: "Not found" });
      }

      res.json(item);
    } catch {
      res.status(500).json({ error: "Failed to load article" });
    }
  });


  // ==========================================
  // ✅ ALL NEWS + CATEGORY FILTER
  // ==========================================
  app.get("/api/news", async (req, res) => {
    try {
      const page = Math.max(1, Number(req.query.page || 1));
      const limit = Math.max(1, Math.min(50, Number(req.query.limit || 15)));

      const category = String(req.query.category || "all");

      const filter: any = {
        ...last7DaysFilter(),
      };

      // ✅ category works now
      if (category !== "all") {
        filter.category = category;
      }

      const [items, total] = await Promise.all([
        NewsModel.find(filter)
          .sort({ publishedAt: -1 })
          .skip((page - 1) * limit)
          .limit(limit)
          .lean(),

        NewsModel.countDocuments(filter),
      ]);

      res.json({ page, limit, total, items });
    } catch {
      res.status(500).json({ error: "Failed to load news" });
    }
  });

  // ==========================================
  // ✅ POSITIVE FEED
  // ==========================================
  app.get("/api/news/positive", async (req, res) => {
    try {
      const page = Math.max(1, Number(req.query.page || 1));
      const limit = Math.max(1, Math.min(50, Number(req.query.limit || 15)));

      const filter = {
        ...last7DaysFilter(),

        $or: [
          { source: "positivnews.ru" },
          { sentiment: { $ne: "negative" } },
        ],
      };

      const [items, total] = await Promise.all([
        NewsModel.find(filter)
          .sort({ publishedAt: -1 })
          .skip((page - 1) * limit)
          .limit(limit)
          .lean(),

        NewsModel.countDocuments(filter),
      ]);

      res.json({ page, limit, total, items });
    } catch {
      res.status(500).json({ error: "Failed to load positive news" });
    }
  });

  // ==========================================
  // ✅ REFRESH
  // ==========================================
  app.post("/api/refresh", async (_req, res) => {
    try {
      console.log("🔄 Refresh started...");

      execSync("npm run start", {
        cwd: path.resolve(process.cwd(), "../scraper"),
        stdio: "inherit",
      });

      execSync("npm run start", {
        cwd: path.resolve(process.cwd(), "../parser"),
        stdio: "inherit",
      });

      console.log("✅ Refresh done!");
      res.json({ ok: true });
    } catch (e) {
      console.log("❌ Refresh failed:", e);
      res.status(500).json({ ok: false });
    }
  });

  const port = Number(process.env.PORT || 4000);
  app.listen(port, () => {
    console.log(`✅ API running on http://localhost:${port}`);
  });
}

startServer().catch((err) => {
  console.error("❌ Server failed:", err);
  process.exit(1);
});
