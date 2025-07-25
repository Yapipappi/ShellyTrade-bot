// ================================
// ShellyTradeBot – index.js
// ================================

// Telegram & Finnhub
const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');
const express = require('express');
const bodyParser = require('body-parser');

// Bot-Konfiguration aus Environment Variablen
const token = process.env.TELEGRAM_TOKEN;        // Telegram Bot Token
const chatId = process.env.TELEGRAM_CHAT_ID;     // Dein Chat ID
const botUsername = process.env.BOT_USERNAME;    // Bot Name
const finnhubKey = process.env.FINNHUB_KEY;      // Finnhub API-Key

if (!token) {
  console.error('❌ TELEGRAM_TOKEN fehlt!');
  process.exit(1);
}

if (!finnhubKey) {
  console.warn('⚠️ FINNHUB_KEY fehlt – Kursabfragen werden nicht funktionieren!');
}

// Telegram Bot initialisieren
const bot = new TelegramBot(token, { polling: true });

// Express Webserver starten (wichtig für Render)
const app = express();
app.use(bodyParser.json());

// Test-Route für Render (Ping)
app.get('/', (req, res) => {
  res.send('ShellyTradeBot ist aktiv!');
});

// ================================
// Telegram Befehle
// ================================

// Start-Kommando
bot.onText(/\/start/, (msg) => {
  bot.sendMessage(msg.chat.id, `🚀 ${botUsername} ist jetzt live, mein Herz!`);
});

// Kurs-Kommando: /kurs SYMBOL (z.B. /kurs NVDA)
bot.onText(/\/kurs (.+)/i, async (msg, match) => {
  const symbol = match[1].toUpperCase();

  if (!finnhubKey) {
    return bot.sendMessage(msg.chat.id, '❌ Kein FINNHUB_KEY gesetzt. Bitte in Render eintragen.');
  }

  try {
    bot.sendMessage(msg.chat.id, `🔍 Hole Kursdaten für ${symbol}...`);

    const { data } = await axios.get('https://finnhub.io/api/v1/quote', {
      params: { symbol, token: finnhubKey },
      timeout: 8000
    });

    if (!data || typeof data.c !== 'number' || data.c === 0) {
      throw new Error('Keine gültigen Kursdaten von Finnhub erhalten.');
    }

    const price = data.c;
    bot.sendMessage(msg.chat.id, `📊 Aktueller Kurs von ${symbol}: ${price} USD`);
  } catch (err) {
    console.error('Finnhub Error:', err.message);
    bot.sendMessage(msg.chat.id, `❌ Konnte Kurs für ${symbol} nicht abrufen. (${err.message})`);
  }
});

// Fallback-Nachricht für "kurs"
bot.on('message', (msg) => {
  const text = msg.text.toLowerCase();
  if (text.includes('kurs')) {
    bot.sendMessage(msg.chat.id, 'ℹ️ Bitte nutze den Befehl: /kurs SYMBOL (z.B. /kurs TSLA)');
  }
});

// Mini-Server für Render aktiv halten
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server läuft auf Port ${PORT}`));

// Startmeldung
if (chatId) {
  bot.sendMessage(chatId, `✅ ${botUsername} wurde erfolgreich gestartet und ist einsatzbereit!`);
}
