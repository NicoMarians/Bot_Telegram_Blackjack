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
        initializeData: (newData) => {
            connData = newData;
        },
        hand:[],
        drawFirstHand: async () => {
            let drawUrl = urls.draw.replace("<<$DECK_ID>>",connData.deckId);
            drawUrl = drawUrl.replace("$CARD_COUNT",2);
            await fetch(drawUrl).then(r => r.json()).then((newData) => {
                this.hand = newData.cards;
                connData.bot.sendMessage(connData.chatId,"Carte del dealer")
                connData.bot.sendPhoto(connData.chatId,this.hand[0].image)
                connData.bot.sendPhoto(connData.chatId,"https://deckofcardsapi.com/static/img/back.png");
            });
            if (this.hand[0].value == "ACE"){
                player.canInsure = true;
            }

            for (let i = 0;i < this.hand.length;i ++){
                let value = functions.convertCardValue(this.hand[i]);
                this.hand[i].value = value;
            };

        },
        drawCard: async () => {
            let drawUrl = urls.draw.replace("<<$DECK_ID>>",connData.deckId);
            drawUrl = drawUrl.replace("$CARD_COUNT",1);
            await fetch(drawUrl).then(r => r.json()).then((newData) => {
                let newCard = newData.cards[0];
                let value = functions.convertCardValue(newCard);
                newCard.value = value;
                this.hand.push(newCard);
                setTimeout(() => {
                    connData.bot.sendPhoto(connData.chatId,card.image);
                },500);
            });  
        },
        showCards: () => {
            connData.bot.sendMessage(connData.chatId,"Carte del dealer");
            setTimeout(() => {
                this.hand.forEach((card) => {
                    connData.bot.sendPhoto(connData.chatId,card.image)
                });
            },1000);
            
        },
        checkSum: () => {
            let sum = 0
            this.hand.forEach((card) => {
                sum += card.value; 
            })
            return sum;
        },
        endTurn: () => {
            this.hand = [];
        }
    }
}
const dealer = createDealer();

const createPlayer = () => {
    connData = {};
    return {
        initializeData: (newData) => {
            connData = newData;
        },
        canHit: true,
        canInsure: false,
        balance: 0,
        betAmount:0,
        hand: [],
        drawFirstHand: () => {
            let drawUrl = urls.draw.replace("<<$DECK_ID>>",connData.deckId);
            drawUrl = drawUrl.replace("$CARD_COUNT",2);
            fetch(drawUrl).then(r => r.json()).then((newData) => {
                this.hand = newData.cards;
                connData.bot.sendMessage(connData.chatId,"Le tue carte").then(() => {
                    for (let i = 0;i < this.hand.length;i ++){
                        let value = functions.convertCardValue(this.hand[i]);
                        this.hand[i].value = value;
                        connData.bot.sendPhoto(connData.chatId,this.hand[i].image);
                    };
                    let sum = 0;
                    this.hand.forEach((card) => {
                        sum += card.value;
                        if (sum < 21) this.canHit = true
                    });
                });
            });   
        },
        drawCard: () => {
            let drawUrl = urls.draw.replace("<<$DECK_ID>>",connData.deckId);
            drawUrl = drawUrl.replace("$CARD_COUNT",1);
            fetch(drawUrl).then(r => r.json()).then((newData) => {
                let newCard = newData.cards[0];
                let value = functions.convertCardValue(newCard);
                newCard.value = value;
                this.hand.push(newCard);
                connData.bot.sendMessage(connData.chatId,"Le tue carte:");
                setTimeout(() => {
                    this.hand.forEach((card) => {
                        connData.bot.sendPhoto(connData.chatId,card.image);
                    });
                },500);
            });  
        },
        checkSum: () => {
            let sum = 0
            this.hand.forEach((card) => {
                sum += card.value; 
            })
            return sum;
        },
        endTurn: () => {
           this.hand = [];
           this.betAmount = 0;
           this.canHit = true;
           this.canInsure = false; 
           turnOngoing = false;
        }
    }
    
}
const player = createPlayer();

let turnOngoing = false;

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
                /bet [Amount] - Gioca una mano\n
                /hit - Chiedi una carta\n
                /stay - Conferma la mano\n
                /double - Raddoppia la mano (Se possibile)\n
                /split - Splitta la mano (Se possibile)\n
                /insure - Fa l'assicurazione (Se possibile)\n
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
        });
        bot.sendMessage(chatId, "Fai /bet [amount] per iniziare il turno");
    }

    if (text.includes("/bet")) {
        let amount = text.split(" ");
        if (amount.length == 2){
            amount = parseInt(amount[1]);
            if (amount > player.balance){
                bot.sendMessage(chatId, "Non hai abbastanza soldi, SI VA ALL IN!!");
                amount = player.balance;
            }
            if (amount == NaN){
                bot.sendMessage(chatId, "Errore, SI VA ALL IN!!");
                amount = player.balance;
            }
        } else {
            bot.sendMessage(chatId, "Errore, SI VA ALL IN!!");
            amount = player.balance
        }

        player.balance -= amount;
        player.betAmount = amount;
        functions.startTurn(player,dealer,bot,chatId);
    }

    if (text === "/hit") {
        if (turnOngoing) {
            if (player.canHit){
                player.drawCard();
                let sum = player.checkSum();
                if (sum > 21) {
                    bot.sendMessage(chatId,"Bust!");
                    player.endTurn();
                    dealer.endTurn();
                }
            }
        } else bot.sendMessage(chatId,"Iniziare prima il turno con /bet [amount]");
    }

    if (text === "/stand") {
        if (turnOngoing){
            dealer.showCards();
            console.log(dealer.hand);
            let condition = true;
            while (condition == true){
                let sum = dealer.checkSum();
                if (sum < 17) {
                    console.log("DEALER DRAWING");
                    async () => await dealer.drawCard();
                } else condition = false;
            }
            const dealerSum = dealer.checkSum();
            console.log(dealer.hand);
            console.log("DEALER SUM: ",dealerSum);
            const playerSum = player.checkSum();

            if (playerSum > dealerSum) {
                if (playerSum < 22) {
                    player.balance += player.betAmount * 2;
                    bot.sendMessage(chatId,"Hai vinto!");
                    bot.sendMessage(chatId,`Soldi Rimanenti:${player.balance}`);
                    player.endTurn();
                } else {
                    bot.sendMessage(chatId,"Hai perso");
                    bot.sendMessage(chatId,`Soldi Rimanenti:${player.balance}`);
                    player.endTurn();
                }
            } else {
                if (dealerSum > 21) {
                    player.balance += player.betAmount * 2;
                    bot.sendMessage(chatId,"Hai vinto!");
                    bot.sendMessage(chatId,`Soldi Rimanenti:${player.balance}`);
                    player.endTurn();
                } else {
                    bot.sendMessage(chatId,"Hai perso");
                    bot.sendMessage(chatId,`Soldi Rimanenti:${player.balance}`);
                    player.endTurn();
                }
            }
        } else bot.sendMessage(chatId,"Iniziare prima il turno con /bet [amount]");
    }
});