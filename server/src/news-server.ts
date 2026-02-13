// /Users/mac/Desktop/salescout-scrapper-news/server/src/news-server.ts
import path from "path";
import dotenv from "dotenv";
import express from "express";
import mongoose, { Schema } from "mongoose";
import cors from "cors";
import { execSync } from "child_process";
import cron from "node-cron";

dotenv.config();

const newsSchema = new Schema(
  {
    source: { type: String, required: true },

    title: { type: String, required: true },
    text: { type: String, required: false },

    titleRu: { type: String, required: false },
    textRu: { type: String, required: false },

    image: { type: String, required: false },
    url: { type: String, required: true, unique: true },

    publishedAt: { type: Date, required: true },

    region: {
      type: String,
      enum: ["kz", "world"],
      required: true,
    },

    sentiment: {
      type: String,
      enum: ["positive"],
      required: true,
    },
  },
  { collection: "news", timestamps: true }
);

const NewsModel = mongoose.models.News || mongoose.model("News", newsSchema);

function doRefresh() {
  console.log("🔄 Refresh started...");

  const scraperPath = path.resolve(__dirname, "../../scraper");
  const parserPath = path.resolve(__dirname, "../../parser");

  execSync("npm run start", {
    cwd: scraperPath,
    stdio: "inherit",
  });

  execSync("npm run start", {
    cwd: parserPath,
    stdio: "inherit",
  });

  console.log("✅ Refresh done!");
}

async function startServer() {
  await mongoose.connect(
    process.env.MONGO_URI || "mongodb://localhost:27017/positive_news"
  );

  const app = express();
  app.use(cors());
  app.use(express.json());

  let refreshing = false;

  async function safeRefresh() {
    if (refreshing) return;
    refreshing = true;
    try {
      doRefresh();
    } catch (e: any) {
      console.log("❌ Auto refresh failed:", e?.message || e);
    } finally {
      refreshing = false;
    }
  }

  cron.schedule("*/10 * * * *", () => {
    safeRefresh();
  });

  setTimeout(() => {
    safeRefresh();
  }, 3000);

  app.get("/api/news/:id", async (req, res) => {
    try {
      const { id } = req.params;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ error: "Invalid id" });
      }

      const item = await NewsModel.findById(id).lean();
      if (!item) return res.status(404).json({ error: "Not found" });

      res.json(item);
    } catch {
      res.status(500).json({ error: "Failed to load article" });
    }
  });

  app.get("/api/news", async (req, res) => {
    try {
      const page = Math.max(1, Number(req.query.page || 1));
      const limit = Math.max(1, Math.min(50, Number(req.query.limit || 25)));

      const region = String(req.query.region || "kz");

      const query = region === "all" ? {} : { region };

      const [items, total] = await Promise.all([
        NewsModel.find(query)
          .sort({ publishedAt: -1 })
          .skip((page - 1) * limit)
          .limit(limit)
          .lean(),
        NewsModel.countDocuments(query),
      ]);

      res.json({ page, limit, total, items });
    } catch {
      res.status(500).json({ error: "Failed to load news" });
    }
  });

  app.post("/api/refresh", async (_req, res) => {
    try {
      await safeRefresh();
      res.json({ ok: true });
    } catch (e: any) {
      res.status(500).json({ ok: false, error: String(e?.message || e) });
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
