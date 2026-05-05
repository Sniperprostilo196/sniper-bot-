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

// ================= FUNÇÃO DADOS =================
async function getDados(symbol, interval) {
  try {
    const url = 'https://api.twelvedata.com/time_series?symbol=${symbol}&interval=${interval}&outputsize=100&apikey=${API_KEY}';

    const res = await fetch(url);
    const data = await res.json();

    if (data.status === "error") {
      console.log("Erro dados:", data);
      return null;
    }

    return data.values;
  } catch (e) {
    console.log("Erro fetch:", e);
    return null;
  }
}

// ================= TELEGRAM =================
async function enviarTelegram(msg) {
  try {
    const url = 'https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage';

    await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: CHAT_ID,
        text: msg,
      }),
    });
  } catch (e) {
    console.log("Erro Telegram:", e);
  }
}

// ================= LÓGICA SIMPLES =================
async function analisar() {
  const symbol = "EUR/USD";

  const dados = await getDados(symbol, "5min");
  if (!dados) return;

  const close = parseFloat(dados[0].close);
  const open = parseFloat(dados[0].open);

  let dir = "NEUTRO";

  if (close > open) dir = "CALL";
  if (close < open) dir = "PUT";

  const msg = `SNIPER PRO 🚀
Par: ${symbol}
Direção: ${dir}
`;

  console.log(msg);
  await enviarTelegram(msg);
}

// ================= LOOP =================
setInterval(() => {
  console.log("RODANDO...");
  analisar();
}, 60000);
