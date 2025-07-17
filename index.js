const TelegramBot = require('node-telegram-bot-api');
const token = process.env.TELEGRAM_TOKEN;
const chatId = process.env.TELEGRAM_CHAT_ID;

const bot = new TelegramBot(token, { polling: true });

bot.onText(/\/start/, (msg) => {
  bot.sendMessage(msg.chat.id, '🚀 ShellyTradeBot ist jetzt live, mein Herz!');
});

bot.on('message', (msg) => {
  if (msg.text.toLowerCase().includes('kurs')) {
    bot.sendMessage(msg.chat.id, '📊 Kursdaten kommen bald live – bitte etwas Geduld 🕒');
  }
});
