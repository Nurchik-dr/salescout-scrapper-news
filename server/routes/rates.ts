import express from "express";
import axios from "axios";

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const url =
      "https://api.exchangerate.host/latest?base=KZT&symbols=USD,EUR,RUB";

    const response = await axios.get(url);

    const rates = response.data.rates;

    res.json({
      USD: (1 / rates.USD).toFixed(2),
      EUR: (1 / rates.EUR).toFixed(2),
      RUB: (1 / rates.RUB).toFixed(2),
    });
  } catch (err) {
    console.log("RATES ERROR:", err);
    res.status(500).json({ error: "Failed to fetch rates" });
  }
});

export default router;
