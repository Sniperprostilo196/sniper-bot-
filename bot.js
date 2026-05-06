// ================= CONFIG =================

// 🔥 COLOCA SUA CHAVE AQUI
const API_KEY = "9de65d51224f432f8ba14beb5e4fa505";

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

// ================= BUSCAR DADOS =================
async function getDados() {
  try {
    const url = 'https://api.twelvedata.com/time_series?symbol=EUR/USD&interval=1min&outputsize=50&apikey=${API_KEY}';

    const res = await fetch(url);
    const data = await res.json();

    if (data.status === "error") {
      console.log("❌ ERRO API:", data);

      if (data.code === 401) {
        console.log("⛔ API BLOQUEADA - PARANDO BOT");
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
    console.log("⛔ BOT NÃO INICIADO");
    return;
  }

  console.log("🚀 BOT RODANDO");

  setInterval(async () => {

    console.log("RODANDO...");

    const dados = await getDados();

    if (!dados) return;

    const dir = analisar(dados);

    if (!dir) return;

    console.log('🚀 SINAL: EUR/USD | ${dir}');

  }, 60000);
}

iniciar();
