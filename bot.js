const fs = require('fs');
const TelegramBot = require("node-telegram-bot-api");
const conf = JSON.parse(fs.readFileSync('conf.json')).telegramConfiguration;
const token = conf.key;

const bot = new TelegramBot(token, {polling: true});

bot.on("message",(msg) => {
    const chatId = msg.chat.id;

    const text = msg.text;

    if (text === "/start"){
        bot.sendMessage(chatId, "Benvenuto!\nPer vedere i comandi fai /help");
    }

    if (text === "/help"){
        bot.sendMessage(chatId, `Per le regole del Blackjack visita il sito: https://www.pokerstars.it/casino/how-to-play/blackjack/rules/ \n
            Comandi:\n
                /play - Inizia una nuova partita\n
                /load - Carica una partita iniziata in precedenza\n
                /hit - Chiedi una carta\n
                /stay - Conferma la mano\n
                /double - Raddoppia la mano (Se possibile)\n
                /split - Splitta la mano (Se possibile)\n
                /insure - Fa l'assicurazione (Se possibile)\n
                /balance - Mostra i soldi correnti\n
            `)
    }
})