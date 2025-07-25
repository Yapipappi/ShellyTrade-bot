const TelegramBot = require('node-telegram-bot-api');

// Bot-Konfiguration aus Environment Variablen
const token = process.env.TELEGRAM_TOKEN;
const chatId = process.env.TELEGRAM_CHAT_ID;
const botUsername = process.env.BOT_USERNAME;

const bot = new TelegramBot(token, { polling: true });

// Startkommando
bot.onText(/\/start/, (msg) => {
    bot.sendMessage(msg.chat.id, `🚀 ${botUsername} ist jetzt live, mein Herz! 💖`);
});

// Beispielantwort für Nachrichten mit dem Wort 'kurs'
bot.on('message', (msg) => {
    const text = msg.text.toLowerCase();
    if (text.includes('kurs')) {
        bot.sendMessage(msg.chat.id, "📈 Kursdaten kommen bald live – bitte etwas Geduld! 🙌");
    }
});

// Testnachricht beim Start
if (chatId) {
    bot.sendMessage(chatId, `✅ ${botUsername} wurde erfolgreich gestartet und ist einsatzbereit!`);
}
