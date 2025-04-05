const fs = require('fs');
const TelegramBot = require("node-telegram-bot-api");
const conf = JSON.parse(fs.readFileSync('conf.json')).telegramConfiguration;
const urls = JSON.parse(fs.readFileSync('conf.json')).cardsApi;
const token = conf.key;

const bot = new TelegramBot(token, {polling: true});

const functions = require("./functions");

const createDealer = () => {
    let connData = {}
    return{
        "initializeData": (newData) => {
            connData = newData;
        },
        "hand":[],
        "drawFirstHand": async () => {
            let drawUrl = urls.draw.replace("<<$DECK_ID>>",connData.deckId);
            drawUrl = drawUrl.replace("$CARD_COUNT",2);
            await fetch(drawUrl).then(r => r.json()).then((newData) => {
                this.hand = newData.cards;
                console.log(this.hand);
                connData.bot.sendMessage(connData.chatId,"Carte del dealer").then(() => {
                    connData.bot.sendPhoto(connData.chatId,this.hand[0].image).then(() => {
                        connData.bot.sendPhoto(connData.chatId,"https://deckofcardsapi.com/static/img/back.png");
                    });
                });
            });
            if (this.hand[0].value == "ACE"){
                player.canInsure = true;
            }
        }
    }
}

const dealer = createDealer();

const createPlayer = () => {
    connData = {};
    return {
        "initializeData": (newData) => {
            connData = newData;
        },
        "canHit": true,
        "canInsure": false,
        "balance": 0,
        "hand": [],
        "drawFirstHand": async () => {
            let drawUrl = urls.draw.replace("<<$DECK_ID>>",connData.deckId);
            drawUrl = drawUrl.replace("$CARD_COUNT",2);
            await fetch(drawUrl).then(r => r.json()).then((newData) => {
                this.hand = newData.cards;
                connData.bot.sendMessage(connData.chatId,"Le tue carte").then(() => {
                    this.hand.forEach((card) => {
                        connData.bot.sendPhoto(connData.chatId,card.image);  
                    });
                });
            });

            let sum = 0;
            this.hand.forEach((card) => {
                if (card.value == "ACE") card.value = 11;
                sum += card.value;
                if (sum < 21) this.canHit = true
            })
        }
    }
    
}

const player = createPlayer();

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

        player.balance = balance;

        const newDeckUrl = urls.newDeck.replace("$DECK_COUNT","6");
        fetch(newDeckUrl).then(r => r.json()).then((newData) =>{
            const deckId = newData.deck_id;
            dealer.initializeData({"deckId":deckId,"chatId":chatId,"bot":bot});
            player.initializeData({"deckId":deckId,"chatId":chatId,"bot":bot});
            functions.startTurn(deckId,player,dealer,bot,chatId);
        });

        //dealer.draw();
        //bot.sendMessage(chatId, dealer.hand[0]);
        //bot.sendMessage(chatId, "Playing");
    }
});