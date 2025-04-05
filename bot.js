const fs = require('fs');
const TelegramBot = require("node-telegram-bot-api");
const conf = JSON.parse(fs.readFileSync('conf.json')).telegramConfiguration;
const urls = JSON.parse(fs.readFileSync('conf.json')).cardsApi;
const token = conf.key;

const bot = new TelegramBot(token, {polling: true});

const functions = require("./functions");

let deckId = "";

const dealer = {
    "hand":[],
    "draw": async (deckId) => {
        let drawUrl = urls.draw.replace("$DECK_ID",deckId);
        drawUrl = drawUrl.replace("$CARD_COUNT","2");
        fetch(drawUrl).then(r => r.json()).then((newData) => console.log(newData))
    }
}

const player = {
    "hand":[],
    "draw": (deckId) => {
        let drawUrl = urls.draw.replace("$DECK_ID",deckId);
        drawUrl = drawUrl.replace("$CARD_COUNT","2")
        fetch(drawUrl).then(r => r.json()).then((newData) => console.log(newData))
    }
}

let balance = 0;

bot.on("message",(msg) => {
    const chatId = msg.chat.id;
    const text = msg.text;

    if (text === "/start"){
        bot.sendMessage(chatId, "Benvenuto!\nPer vedere i comandi fai /help");
    }

    if (text === "/help"){
        bot.sendMessage(chatId, `Per le regole del Blackjack visita il sito: https://www.pokerstars.it/casino/how-to-play/blackjack/rules/ \n
            Comandi:\n
                /play [Amount(100 - 10.000)] - Inizia una nuova partita\n
                /load - Carica una partita iniziata in precedenza\n
                /hit - Chiedi una carta\n
                /stay - Conferma la mano\n
                /double - Raddoppia la mano (Se possibile)\n
                /split - Splitta la mano (Se possibile)\n
                /insure - Fa l'assicurazione (Se possibile)\n
                /bet [Amount] - Scommetti\n
                /balance - Mostra i soldi correnti\n
        `)
    }

    if (text.includes("/play")){
        
        //cambiare
        let balance = text.split(" ");
        if (balance.length == 2){
            balance = parseInt(balance[1]);
            if (balance == NaN){
                bot.sendMessage(chatId, "Errore, Soldi impostati automaticamente a 4000");
                balance = 4000;
            }
        } else {
            bot.sendMessage(chatId, "Errore, Soldi impostati automaticamente a 4000");
            balance = 4000;
        } 

        const newDeckUrl = urls.newDeck.replace("$DECK_COUNT","6");
        fetch(newDeckUrl).then(r => r.json()).then((newData) =>{
            deckId = newData.deck_id;
            dealer.draw(deckId)
        });

        



        

        //dealer.draw();
        //bot.sendMessage(chatId, dealer.hand[0]);
        //bot.sendMessage(chatId, "Playing");
    }
});