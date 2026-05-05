// ===== CONFIG ===== //
const API_KEY = process.env.TWELVEDATA_API_KEY;
const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;
const ONESIGNAL_APP_ID = process.env.ONESIGNAL_APP_ID;
const ONESIGNAL_API_KEY = process.env.ONESIGNAL_API_KEY;

const ativos = ["EUR/USD","GBP/USD","USD/JPY","AUD/USD","USD/CAD"];

// ===== INDICADORES ===== //
function EMA(periodo, valores) {
  const k = 2 / (periodo + 1);
  let ema = valores[0];
  for (let i = 1; i < valores.length; i++) {
    ema = valores[i] * k + ema * (1 - k);
  }
  return ema;
}

function RSI(periodo, valores) {
  let ganhos = 0;
  let perdas = 0;

  for (let i = 1; i < valores.length; i++) {
    const diff = valores[i] - valores[i - 1];
    if (diff >= 0) ganhos += diff;
    else perdas -= diff;
  }

  if (perdas === 0) return 100;
  const rs = ganhos / perdas;
  return 100 - (100 / (1 + rs));
}

// ===== BUSCAR DADOS ===== //
async function getDados(symbol, interval) {
  const url = 'https://api.twelvedata.com/time_series?symbol=${symbol}&interval=${interval}&outputsize=100&apikey=${API_KEY}';

  const res = await fetch(url);
  const data = await res.json();

  if (!data.values) {
    console.log("Erro dados:", data);
    return null;
  }

  return data.values.reverse();
}

// ===== TELEGRAM ===== //
async function enviarTelegram(msg) {
  const url = 'https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage';

  await fetch(url, {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify({
      chat_id: TELEGRAM_CHAT_ID,
      text: msg
    })
  });
}

// ===== ONESIGNAL ===== //
async function enviarPush(msg) {
  await fetch("https://onesignal.com/api/v1/notifications", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": 'Basic ${ONESIGNAL_API_KEY}'
    },
    body: JSON.stringify({
      app_id: ONESIGNAL_APP_ID,
      included_segments: ["All"],
      contents: { en: msg }
    })
  });
}

// ===== LÓGICA ===== //
async function analisar(symbol) {
  try {
    const m5 = await getDados(symbol, "5min");
    const m15 = await getDados(symbol, "15min");
    const h1 = await getDados(symbol, "1h");
    const h4 = await getDados(symbol, "4h");

    if (!m5 || !m15 || !h1 || !h4) return;

    const close = m5.map(c => parseFloat(c.close));

    const ema50 = EMA(50, close);
    const ema200 = EMA(200, close);

    const rsiAtual = RSI(14, close.slice(-15));
    const rsiAnterior = RSI(14, close.slice(-16, -1));

    const ema50_15 = EMA(50, m15.map(c => parseFloat(c.close)));
    const ema200_15 = EMA(200, m15.map(c => parseFloat(c.close)));

    const ema50_h1 = EMA(50, h1.map(c => parseFloat(c.close)));
    const ema200_h1 = EMA(200, h1.map(c => parseFloat(c.close)));

    const ema50_h4 = EMA(50, h4.map(c => parseFloat(c.close)));
    const ema200_h4 = EMA(200, h4.map(c => parseFloat(c.close)));

    let score = 0;
    let dir = null;

    // ANTI LATERAL
    if (Math.abs(ema50 - ema200) < 0.0005) return;

    // CALL
    if (ema50_15 > ema200_15 && ema50_h1 > ema200_h1 && ema50_h4 > ema200_h4) {
      score += 3;
      if (rsiAtual > 50 && rsiAtual > rsiAnterior) score++;
      if (close.at(-1) > ema50) score++;
      if (score >= 5) dir = "CALL";
    }

    // PUT
    if (ema50_15 < ema200_15 && ema50_h1 < ema200_h1 && ema50_h4 < ema200_h4) {
      score += 3;
      if (rsiAtual < 50 && rsiAtual < rsiAnterior) score++;
      if (close.at(-1) < ema50) score++;
      if (score >= 5) dir = "PUT";
    }

    if (dir) {
      const msg = 'SNIPER PRO\nPar: ${symbol}\nDireção: ${dir}\nScore: ${score}';
      console.log(msg);

      await enviarTelegram(msg);
      await enviarPush(msg);
    }

  } catch (err) {
    console.log("Erro:", err.message);
  }
}

// ===== LOOP ===== //
setInterval(async () => {
  for (let ativo of ativos) {
    await analisar(ativo);
  }
}, 60000);

console.log("BOT SNIPER ONLINE 🚀");
