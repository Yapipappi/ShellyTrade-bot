// =========================
// ShellyTradeBot - index.js
// =========================

// Telegram & Finnhub
const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');
const express = require('express');
const bodyParser = require('body-parser');

// Bot-Konfiguration aus Environment Variablen
const token = process.env.TELEGRAM_TOKEN; // Telegram Bot Token
const chatId = process.env.TELEGRAM_CHAT_ID; // Dein Chat ID
const botUsername = process.env.BOT_USERNAME; // Bot Name
const finnhubToken = process.env.FINNHUB_TOKEN; // Finnhub API-Key

// Telegram Bot initialisieren
const bot = new TelegramBot(token, { polling: true });

// Express Webserver starten (wichtig für Render)
const app = express();
app.use(bodyParser.json());

// Test-Route für Render (einfacher Ping)
app.get('/', (req, res) => {
  res.send('ShellyTradeBot ist aktiv!');
});

// ===================
// Telegram Befehle
// ===================

// Start-Kommando
bot.onText(/\/start/, (msg) => {
  bot.sendMessage(msg.chat.id, `🚀 ${botUsername} ist jetzt live, mein Herz!`);
});

// Kurs-Kommando
bot.onText(/\/kurs (.+)/, async (msg, match) => {
  const symbol = match[1].toUpperCase(); // z.B. AAPL oder TSLA
  try {
    const response = await axios.get(`https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${finnhubToken}`);
    const price = response.data.c;
    bot.sendMessage(msg.chat.id, `📊 Aktueller Kurs von ${symbol}: ${price} USD`);
  } catch (error) {
    console.error(error);
    bot.sendMessage(msg.chat.id, `❌ Konnte den Kurs von ${symbol} nicht abrufen.`);
  }
});

// Nachricht mit dem Wort 'kurs' (ohne Symbol)
bot.on('message', (msg) => {
  const text = msg.text.toLowerCase();
  if (text === 'kurs') {
    bot.sendMessage(msg.chat.id, 'Bitte nutze den Befehl: /kurs SYMBOL (z.B. /kurs TSLA)');
  }
});

// ===================
// Mini-Webserver für Render
// ===================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server läuft auf Port ${PORT}`);
});

// Info beim Start
if (chatId) {
  bot.sendMessage(chatId, `🤖 ${botUsername} wurde erfolgreich gestartet und ist einsatzbereit!`);
}
