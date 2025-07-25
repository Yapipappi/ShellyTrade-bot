// ==============================
// ShellyTradeBot – index.js
// ==============================

// Telegram & Finnhub
const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');
const express = require('express');
const bodyParser = require('body-parser');

// ==============================
// Environment Variablen
// ==============================
const token = process.env.TELEGRAM_TOKEN;      // Telegram Bot Token
const chatId = process.env.TELEGRAM_CHAT_ID;   // Dein Chat ID
const botUsername = process.env.BOT_USERNAME;  // Bot Name
const finnKey = process.env.FINNHUB_KEY;       // Finnhub API Key

if (!token) {
  console.error('❌ TELEGRAM_TOKEN fehlt!');
  process.exit(1);
}
if (!finnKey) {
  console.warn('⚠️ FINNHUB_KEY fehlt – Kursabfragen werden nicht funktionieren!');
}

// ==============================
// Telegram Bot initialisieren
// ==============================
const bot = new TelegramBot(token, { polling: true });

// ==============================
// Express Webserver starten
// ==============================
const app = express();
app.use(bodyParser.json());
app.get('/', (req, res) => res.send('ShellyTradeBot läuft!'));

// ==============================
// Telegram Befehle
// ==============================

// Start-Kommando
bot.onText(/\/start/, (msg) => {
  bot.sendMessage(msg.chat.id, `🚀 ${botUsername} ist jetzt live, mein Herz!`);
});

// Testbefehl für API-Key
bot.onText(/\/testkey/, async (msg) => {
  try {
    const url = `https://finnhub.io/api/v1/quote?symbol=AAPL&token=${finnKey}`;
    const response = await axios.get(url);
    if (response.data && response.data.c) {
      bot.sendMessage(msg.chat.id, `✅ Finnhub-Key ist gültig! Beispielkurs AAPL: ${response.data.c} USD`);
    } else {
      bot.sendMessage(msg.chat.id, `⚠️ Finnhub-Key reagiert, aber keine Daten empfangen.`);
    }
  } catch (err) {
    bot.sendMessage(msg.chat.id, `❌ Fehler beim Finnhub-Key-Test: ${err.response?.status || err.message}`);
  }
});

// Kurs-Kommando
bot.onText(/\/kurs (.+)/, async (msg, match) => {
  const symbol = match[1].toUpperCase();
  if (!finnKey) {
    bot.sendMessage(msg.chat.id, '❌ Kein Finnhub-Key gesetzt. Bitte in Render eintragen.');
    return;
  }

  bot.sendMessage(msg.chat.id, `🔍 Hole Kursdaten für ${symbol}...`);
  try {
    const url = `https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${finnKey}`;
    const response = await axios.get(url);

    if (!response.data || response.data.c === 0) {
      bot.sendMessage(msg.chat.id, `⚠️ Kein gültiger Kurs für ${symbol} gefunden.`);
      return;
    }

    const data = response.data;
    bot.sendMessage(
      msg.chat.id,
      `📈 Kursdaten für ${symbol}:\n\nAktuell: ${data.c} USD\nTageshoch: ${data.h} USD\nTagestief: ${data.l} USD\nEröffnung: ${data.o} USD`
    );
  } catch (err) {
    console.error(err);
    bot.sendMessage(msg.chat.id, `❌ Konnte Kurs für ${symbol} nicht abrufen. (Status: ${err.response?.status || err.message})`);
  }
});

// ==============================
// Server starten (Render benötigt Port)
// ==============================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`ShellyTradeBot läuft auf Port ${PORT}`));

// Info beim Start
if (chatId) {
  bot.sendMessage(chatId, `🤖 ${botUsername} wurde erfolgreich gestartet und ist einsatzbereit!`);
}
