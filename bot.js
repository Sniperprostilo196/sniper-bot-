const express = require("express");

const app = express();

// ================= CONFIG =================

const API_KEY = "9de65d51224f432f8ba14beb5e4fa505";

const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;
const CHAT_ID = process.env.TELEGRAM_CHAT_ID;

// ================= LOG =================
console.log("API_KEY:", API_KEY ? "OK" : "ERRO");

// ================= SERVIDOR =================
app.get("/", (req, res) => {
  res.send("Bot online 🚀");
});

const PORT = process.env.PORT || 10000;

app.listen(PORT, () => {
  console.log("Servidor rodando na porta", PORT);
});

// ================= TESTE API =================
async function testarAPI() {
  const url = 'https://api.twelvedata.com/time_series?symbol=EUR/USD&interval=1min&outputsize=1&apikey=${API_KEY}';

  try {
    const res = await fetch(url);
    const data = await res.json();

    if (data.status === "error") {
      console.log("❌ API INVÁLIDA:", data);
      return false;
    }

    console.log("✅ API OK");
    return true;

  } catch (err) {
    console.log("Erro conexão API:", err);
    return false;
  }
}

// ================= TELEGRAM =================
async function enviarTelegram(msg) {
  if (!TELEGRAM_TOKEN || !CHAT_ID) {
    console.log("⚠️ Telegram não configurado");
    return;
  }

  try {
    await fetch('https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage', {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        chat_id: CHAT_ID,
        text: msg
      })
    });

  } catch (err) {
    console.log("Erro Telegram:", err);
  }
}

// ================= DADOS =================
async function getDados() {
  try {
    const url = 'https://api.twelvedata.com/time_series?symbol=EUR/USD&interval=1min&outputsize=50&apikey=${API_KEY}';

    const res = await fetch(url);
    const data = await res.json();

    if (data.status === "error") {
      console.log("❌ ERRO API:", data);

      if (data.code === 401) {
        console.log("⛔ BLOQUEADO - PARANDO BOT");
        process.exit(1);
      }

      return null;
    }

    return data.values;

  } catch (err) {
    console.log("Erro dados:", err);
    return null;
  }
}

// ================= ESTRATÉGIA =================
function analisar(dados) {
  if (!dados || dados.length < 2) return null;

  const atual = parseFloat(dados[0].close);
  const anterior = parseFloat(dados[1].close);

  if (atual > anterior) return "CALL";
  if (atual < anterior) return "PUT";

  return null;
}

// ================= LOOP =================
async function iniciar() {

  const apiOk = await testarAPI();

  if (!apiOk) {
    console.log("⛔ BOT NÃO INICIADO - PROBLEMA NA API");
    return;
  }

  console.log("🚀 BOT INICIADO");

  setInterval(async () => {

    console.log("RODANDO...");

    const dados = await getDados();

    if (!dados) return;

    const dir = analisar(dados);

    if (!dir) return;

    const msg = `🚀 SNIPER PRO
Par: EUR/USD
Direção: ${dir}
Expiração: 1min`;

    console.log(msg);

    await enviarTelegram(msg);

  }, 60000);
}

iniciar();
