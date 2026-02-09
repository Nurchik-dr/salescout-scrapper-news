import path from "path";
import dotenv from "dotenv";
import express from "express";
import mongoose, { Schema } from "mongoose";
import cors from "cors";
import { execSync } from "child_process";

dotenv.config();

const newsSchema = new Schema(
  {
    source: { type: String, required: true },
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

  // ==============================
  // ✅ ALL NEWS (pagination)
  // ==============================
  app.get("/api/news", async (req, res) => {
    const page = Number(req.query.page || 1);
    const limit = Number(req.query.limit || 15);

    const items = await NewsModel.find()
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    res.json({ items });
  });

  // ==============================
  // ✅ POSITIVE NEWS = all кроме negative
  // ==============================
  app.get("/api/news/positive", async (req, res) => {
    const page = Number(req.query.page || 1);
    const limit = Number(req.query.limit || 15);

    const items = await NewsModel.find({
      sentiment: { $ne: "negative" },
    })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    res.json({ items });
  });

  // ==============================
  // ✅ REFRESH
  // ==============================

app.post("/api/refresh", async (_req, res) => {
  try {
    console.log("🔄 Refresh started...");

    execSync("npm run start", {
      cwd: path.join(__dirname, "../../scraper"),
      stdio: "inherit",
    });

    execSync("npm run start", {
      cwd: path.join(__dirname, "../../parser"),
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

startServer();