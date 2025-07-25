const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');

// ==== Env Vars ====
const token        = process.env.TELEGRAM_TOKEN;
const chatId       = process.env.TELEGRAM_CHAT_ID;   // optional, für Start-Ping
const botUsername  = process.env.BOT_USERNAME || 'ShellyTradeBot';
const finnhubKey   = process.env.FINNHUB_KEY;

if (!token) {
  console.error('❌ TELEGRAM_TOKEN fehlt!');
  process.exit(1);
}
if (!finnhubKey) {
  console.warn('⚠️ FINNHUB_KEY fehlt – /kurs wird nicht funktionieren.');
}

const bot = new TelegramBot(token, { polling: true });

// ---------- Helper ----------
function fmt(n, digits = 2) {
  if (typeof n !== 'number' || isNaN(n)) return '-';
  return n.toLocaleString('de-DE', { minimumFractionDigits: digits, maximumFractionDigits: digits });
}

async function fetchQuote(symbol) {
  const url = `https://finnhub.io/api/v1/quote?symbol=${encodeURIComponent(symbol)}&token=${finnhubKey}`;
  const { data } = await axios.get(url, { timeout: 8000 });
  // data: { c, h, l, o, pc, t }
  if (!data || typeof data.c !== 'number' || data.c === 0) {
    throw new Error('Keine oder ungültige Daten');
  }
  return data;
}

// ---------- Commands ----------
bot.onText(/\/start/, (msg) => {
  bot.sendMessage(
    msg.chat.id,
    `🚀 ${botUsername} ist jetzt live, mein Herz!\n\nTippe */hilfe*, */status* oder */kurs NVDA*.`,
    { parse_mode: 'Markdown' }
  );
});

bot.onText(/\/hilfe/, (msg) => {
  const help =
`📘 *Hilfe – ${botUsername}*
  
/ start   – Begrüßung
/ status  – Kurzer Gesundheitscheck
/ kurs TICKER – Holt den aktuellen Kurs (z. B. */kurs NVDA*, */kurs TSLA*, */kurs AAPL*)

Weitere Module (SATRA, Alerts, DCA, Watchlist) hängen wir gleich an. 💜`;
  bot.sendMessage(msg.chat.id, help, { parse_mode: 'Markdown' });
});

bot.onText(/\/status/, (msg) => {
  bot.sendMessage(msg.chat.id, `✅ ${botUsername} läuft stabil. Finnhub-Key: ${finnhubKey ? '✔️ gesetzt' : '❌ fehlt'}`);
});

// /kurs <ticker>
bot.onText(/\/kurs(?:@\w+)?\s+([A-Za-z0-9\.\-:]+)/i, async (msg, match) => {
  const chatId = msg.chat.id;
  const ticker = (match && match[1]) ? match[1].toUpperCase() : null;

  if (!ticker) {
    return bot.sendMessage(chatId, '❗ Bitte benutze: `/kurs TICKER` (z. B. `/kurs NVDA`)', { parse_mode: 'Markdown' });
  }
  if (!finnhubKey) {
    return bot.sendMessage(chatId, '❌ Es ist kein FINNHUB_KEY gesetzt – bitte in Render hinzufügen.');
  }

  bot.sendMessage(chatId, `📡 Hole Kursdaten für *${ticker}*…`, { parse_mode: 'Markdown' });

  try {
    const q = await fetchQuote(ticker);
    const changeAbs = q.c - q.pc;
    const changePct = q.pc ? (changeAbs / q.pc) * 100 : 0;
    const when = q.t ? new Date(q.t * 1000).toLocaleString('de-DE') : '-';

    const msgText =
`📈 *${ticker}*
Aktuell: *${fmt(q.c)}*
Vortag:  ${fmt(q.pc)}
Δ:       ${changeAbs >= 0 ? '🟢' : '🔴'} ${fmt(changeAbs)} (${fmt(changePct)}%)
High:    ${fmt(q.h)}
Low:     ${fmt(q.l)}
Open:    ${fmt(q.o)}
Zeit:    ${when}`;

    bot.sendMessage(chatId, msgText, { parse_mode: 'Markdown' });
  } catch (err) {
    console.error(err);
    bot.sendMessage(chatId, `❌ Konnte Kurs für *${ticker}* nicht abrufen. (${err.message})`, { parse_mode: 'Markdown' });
  }
});

// ---------- Simple free-text replies (optional) ----------
bot.on('message', (msg) => {
  // Kommandos ignorieren
  if (!msg.text || msg.text.startsWith('/')) return;

  const text = msg.text.toLowerCase();
  if (text.includes('hey') || text.includes('hallo')) {
    bot.sendMessage(msg.chat.id, '💜 Hey mein Herz! Schreib */hilfe*, wenn du etwas brauchst.');
  } else if (text.includes('kurs')) {
    bot.sendMessage(msg.chat.id, '📈 Nutze bitte das Kommando: `/kurs TICKER` (z. B. `/kurs NVDA`)', { parse_mode: 'Markdown' });
  }
});

// ---------- Startup ping ----------
if (chatId) {
  bot.sendMessage(chatId, `✅ ${botUsername} wurde erfolgreich gestartet und ist einsatzbereit!`);
}
