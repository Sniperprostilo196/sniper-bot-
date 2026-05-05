const https = require("https");

// ===== VARIÁVEIS =====
const API_KEY = process.env.TWELVEDATA_API_KEY;
const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;
const CHAT_ID = process.env.TELEGRAM_CHAT_ID;

// ===== ATIVOS =====
const pares = ["EUR/USD", "GBP/USD", "USD/JPY"];

// ===== FUNÇÃO API =====
function getData(symbol, interval) {
  return new Promise((resolve, reject) => {
    const url = 'https://api.twelvedata.com/time_series?symbol=${symbol}&interval=${interval}&outputsize=50&apikey=${API_KEY}';

    https.get(url, (res) => {
      let data = "";

      res.on("data", (chunk) => (data += chunk));

      res.on("end", () => {
        try {
          const json = JSON.parse(data);
          resolve(json);
        } catch (e) {
          reject(e);
        }
      });
    }).on("error", reject);
  });
}

// ===== TELEGRAM =====
function enviarTelegram(msg) {
  const text = encodeURIComponent(msg);

  const url = 'https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage?chat_id=${CHAT_ID}&text=${text}';

  https.get(url, (res) => {
    res.on("data", () => {});
  });
}

// ===== LÓGICA SIMPLES (TESTE) =====
async function analisar() {
  for (let symbol of pares) {
    try {
      const data = await getData(symbol, "5min");

      if (!data.values) {
        console.log("Erro dados:", data);
        continue;
      }

      const close = parseFloat(data.values[0].close);
      const open = parseFloat(data.values[0].open);

      let dir = close > open ? "CALL" : "PUT";
      let score = Math.floor(Math.random() * 5) + 1;

      if (score >= 4) {
        const msg = `SNIPER PRO

Par: ${symbol}
Direção: ${dir}
Score: ${score}/5`;

        console.log(msg);
        enviarTelegram(msg);
      }

    } catch (err) {
      console.log("Erro:", err.message);
    }
  }
}

// ===== LOOP =====
setInterval(() => {
  console.log("RODANDO...");
  analisar();
}, 60000);

// ===== SERVIDOR (OBRIGATÓRIO RENDER) =====
const express = require("express");
const app = express();

app.get("/", (req, res) => {
  res.send("SNIPER BOT ONLINE 🚀");
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("Servidor rodando na porta " + PORT);
});
