import { useEffect, useState } from "react";
import "./CurrencyWidget.css";

type Rates = {
  USD: string;
  EUR: string;
  RUB: string;
};

export default function CurrencyWidget() {
  const [rates, setRates] = useState<Rates | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadRates() {
      try {
        const res = await fetch("http://localhost:4000/api/rates");
        const data = await res.json();

        setRates(data);
      } catch (e) {
        console.error("Ошибка загрузки валют", e);
      } finally {
        setLoading(false);
      }
    }

    loadRates();
  }, []);

  return (
    <div className="widget">
      <h3 className="widget-title">💱 Курс валют</h3>

      <div className="widget-box">
        {loading && <div>Загрузка...</div>}

        {!loading && rates && (
          <>
            <div>USD: {rates.USD} ₸</div>
            <div>EUR: {rates.EUR} ₸</div>
            <div>RUB: {rates.RUB} ₸</div>
          </>
        )}

        {!loading && !rates && <div>Нет данных</div>}
      </div>
    </div>
  );
}
