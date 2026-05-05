// ================= CONFIG =================
const API_KEY = process.env.TWELVEDATA_API_KEY;
const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;
const CHAT_ID = process.env.CHAT_ID;

console.log("API KEY TESTE:", API_KEY);

// ================= SERVER (RENDER) =================
const http = require("http");

const server = http.createServer((req, res) => {
  res.end("SNIPER BOT ONLINE 🚀");
});

server.listen(process.env.PORT || 3000, () => {
  console.log("Servidor rodando...");
});

// ================= VALIDAÇÃO DA API =================
async function validarAPI() {
  const url = 'https://api.twelvedata.com/time_series?symbol=EURUSD&interval=5min&outputsize=1&apikey=${API_KEY}';

  try {
    const res = await fetch(url);
    const data = await res.json();

    if (data.status === "error") {
      console.log("❌ API BLOQUEADA:", data);
      return false;
    }

    console.log("✅ API OK");
    return true;
  } catch (e) {
    console.log("❌ ERRO NA API:", e);
    return false;
  }
}

// ================= BUSCAR DADOS =================
async function getDados(symbol, interval) {
  try {
    const safeSymbol = encodeURIComponent(symbol);

    const url = 'https://api.twelvedata.com/time_series?symbol=${safeSymbol}&interval=${interval}&outputsize=50&apikey=${API_KEY}';

    const res = await fetch(url);
    const data = await res.json();

    if (data.status === "error") {
      console.log("❌ ERRO API:", data);
      return null;
    }

    return data.values;
  } catch (e) {
    console.log("❌ ERRO FETCH:", e);
    return null;
  }
}

// ================= TELEGRAM =================
async function enviarTelegram(msg) {
  try {
    const url = 'https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage';

    await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        chat_id: CHAT_ID,
        text: msg
      })
    });
  } catch (e) {
    console.log("❌ ERRO TELEGRAM:", e);
  }
}

// ================= LÓGICA =================
async function analisar() {
  const symbol = "EURUSD"; // SEM BARRA

  const dados = await getDados(symbol, "5min");
  if (!dados) return;

  const close = parseFloat(dados[0].close);
  const open = parseFloat(dados[0].open);

  let dir = "NEUTRO";

  if (close > open) dir = "CALL";
  if (close < open) dir = "PUT";

  const msg = `SNIPER PRO 🚀
Par: ${symbol}
Direção: ${dir}`;

  console.log(msg);
  await enviarTelegram(msg);
}

// ================= LOOP =================
async function iniciar() {
  const apiOK = await validarAPI();

  if (!apiOK) {
    console.log("⛔ PARANDO BOT - API INVÁLIDA");
    return;
  }

  setInterval(() => {
    console.log("RODANDO...");
    analisar();
  }, 60000);
}

iniciar();
