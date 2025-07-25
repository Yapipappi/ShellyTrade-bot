const TelegramBot = require('node-telegram-bot-api');
const express = require('express');
const bodyParser = require('body-parser');

const token = process.env.TELEGRAM_TOKEN;  // Dein Bot Token
const bot = new TelegramBot(token, { polling: true });

// Express Webserver starten (für Render Webhook Ping)
const app = express();
app.use(bodyParser.json());

app.get('/', (req, res) => {
  res.send('ShellyTradeBot läuft! 🚀');
});

// Bot Befehle
bot.onText(/\/start/, (msg) => {
  bot.sendMessage(msg.chat.id, '🚀 ShellyTradeBot ist live, mein Herz!');
});

bot.on('message', (msg) => {
  const text = msg.text.toLowerCase();

  if (text.includes('kurs')) {
    bot.sendMessage(msg.chat.id, '📈 Kursdaten kommen bald live – bitte hab etwas Geduld!');
  } else if (text.includes('hallo')) {
    bot.sendMessage(msg.chat.id, `Hey ${msg.from.first_name}, wie geht's dir?`);
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`ShellyTradeBot läuft auf Port ${PORT}`));
