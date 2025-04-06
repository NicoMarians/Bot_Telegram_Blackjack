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
        dealerHand:[],
        drawFirstHand: () => {
            let drawUrl = urls.draw.replace("<<$DECK_ID>>",connData.deckId);
            drawUrl = drawUrl.replace("$CARD_COUNT",2);
            fetch(drawUrl).then(r => r.json()).then((newData) => {
                this.dealerHand = newData.cards;
                connData.bot.sendMessage(connData.chatId,"Carte del dealer")
                connData.bot.sendPhoto(connData.chatId,this.dealerHand[0].image)
                connData.bot.sendPhoto(connData.chatId,"https://deckofcardsapi.com/static/img/back.png");
                if (this.dealerHand[0].value == "ACE"){
                    player.canInsure = true;
                }
    
                for (let i = 0;i < this.dealerHand.length;i ++){
                    let value = functions.convertCardValue(this.dealerHand[i]);
                    this.dealerHand[i].value = value;
                };
            });
        },
        drawCards: async () => {
            let drawUrl = urls.draw.replace("<<$DECK_ID>>",connData.deckId);
            drawUrl = drawUrl.replace("$CARD_COUNT",1);

            let sum = 0
            this.dealerHand.forEach((card) => {
                sum += card.value;
            })
            console.log("DEALER SUM 44   ",sum);

            while (sum < 17) {
                console.log("DEALER DRAWING");
                await fetch(drawUrl).then(r => r.json()).then((newData) => {
                    let card = newData.cards[0]
                    let value = functions.convertCardValue(card);
                    sum += value;
                    card.value = value;
                    connData.bot.sendPhoto(connData.chatId,card.image);
                    this.dealerHand.push(card);
                });
            }
            console.log("DEALER DREW");
        },
        showCards: async () => {
            console.log("59   ", this.dealerHand)
            await connData.bot.sendMessage(connData.chatId,"Carte del dealer");
            this.dealerHand.forEach(async (card) => {
                console.log("SHOWING ",card.value, card.suit)
                await connData.bot.sendPhoto(connData.chatId,card.image)
            });
        },
        checkSum: () => {
            let sum = 0
            this.dealerHand.forEach((card) => {
                sum += card.value; 
            })
            return sum;
        },
        endTurn: () => {
            this.dealerHand = [];
        },
        getHand: () => {
            return this.dealerHand;
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
        playerHand: [],
        drawFirstHand: () => {
            let drawUrl = urls.draw.replace("<<$DECK_ID>>",connData.deckId);
            drawUrl = drawUrl.replace("$CARD_COUNT",2);
            fetch(drawUrl).then(r => r.json()).then((newData) => {
                this.playerHand = newData.cards;
                connData.bot.sendMessage(connData.chatId,"Le tue carte").then(() => {
                    for (let i = 0;i < this.playerHand.length;i ++){
                        let value = functions.convertCardValue(this.playerHand[i]);
                        this.playerHand[i].value = value;
                        connData.bot.sendPhoto(connData.chatId,this.playerHand[i].image);
                    };
                    let sum = 0;
                    this.playerHand.forEach((card) => {
                        sum += card.value;
                        if (sum > 21) this.canHit = false;
                    });
                });
            });   
        },
        drawCard: async () => {
            let drawUrl = urls.draw.replace("<<$DECK_ID>>",connData.deckId);
            drawUrl = drawUrl.replace("$CARD_COUNT",1);
            fetch(drawUrl).then(r => r.json()).then((newData) => {
                let newCard = newData.cards[0];
                let value = functions.convertCardValue(newCard);
                newCard.value = value;
                this.playerHand.push(newCard);
                connData.bot.sendMessage(connData.chatId,"Le tue carte:").then(() => {
                    this.playerHand.forEach(async (card) => {
                        await connData.bot.sendPhoto(connData.chatId,card.image);
                    });

                    let sum = 0;
                    this.playerHand.forEach((card) => {
                        sum += card.value; 
                    })

                    //CONTROLLA PER PAREGGIO
                    if (sum == 21) {
                        if (dealer.checkSum() == 21){
                            dealer.showCards().then(() => {
                                connData.bot.sendMessage(connData.chatId,"Paerggio");
                                this.balance += this.betAmount;
                            })
                        } else {
                            connData.bot.sendMessage(connData.chatId,"Hai vinto!");
                            this.balance += this.betAmount * 2;
                        }
                        this.playerHand = [];
                        this.betAmount = 0;
                        this.canHit = true;
                        this.canInsure = false; 
                        turnOngoing = false;
                        dealer.endTurn();
                        connData.bot.sendMessage(connData.chatId, "Fai /bet [amount] per iniziare il turno");
                    } else {
                        if (sum > 21) {
                            let found = false;
                            for (let i = 0;i < this.playerHand.length;i ++){
                                if (this.playerHand[i].value == 11){
                                    this.playerHand[i].value = 1;
                                    found = true;
                                    connData.bot.sendMessage(connData.chatId,"Cosa vorresti fare?\n/hit\n/stand");
                                    break
                                }
                            };
                            if (!found){
                                connData.bot.sendMessage(connData.chatId,"Bust!");
                                this.playerHand = [];
                                this.betAmount = 0;
                                this.canHit = true;
                                this.canInsure = false; 
                                turnOngoing = false;
                                dealer.endTurn();
                                connData.bot.sendMessage(connData.chatId, "Fai /bet [amount] per iniziare il turno");
                            }
                        } else {
                            connData.bot.sendMessage(connData.chatId,"Cosa vorresti fare?\n/hit\n/stand");
                        }
                    }

                    
                });         
            });
        },
        checkSum: () => {
            let sum = 0
            this.playerHand.forEach((card) => {
                sum += card.value; 
            })
            return sum;
        },
        endTurn: () => {
            this.playerHand = [];
            this.betAmount = 0;
            this.canHit = true;
            this.canInsure = false; 
            turnOngoing = false;
        },
        getHand: () => {
            return this.playerHand;
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
            Questo bot serve per imparare a giocare, quindi le funzioni piu' avanzate non sono presenti.\n
            Comandi:\n
                /play [Amount] - Inizia una nuova partita\n
                /bet [Amount] - Gioca una mano\n
                /hit - Chiedi una carta\n
                /stay - Conferma la mano\n
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
        if (player.balance > 0){
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
            turnOngoing = true;
            functions.startTurn(player,dealer,bot,chatId);
        } else {
            bot.sendMessage(chatId, "Hai finito i soldi.\nFai /play[amount] per iniziare un'altra partita."); 
        }
        
    }

    if (text === "/hit") {
        if (turnOngoing) {
            if (player.canHit) player.drawCard()
        } else bot.sendMessage(chatId,"Iniziare prima il turno con /bet [amount]");
    }

    if (text === "/stand") {
        if (turnOngoing){
            console.log(dealer.getHand());
            dealer.showCards().then(() => {
                dealer.drawCards().then(() => {
                    const dealerSum = dealer.checkSum();
                    const playerSum = player.checkSum();
    
                    if (playerSum > dealerSum) {
                        if (playerSum < 22) {
                            if (playerSum != dealerSum){
                                player.balance += player.betAmount * 2;
                                bot.sendMessage(chatId,"Hai vinto!");
                                bot.sendMessage(chatId,`Soldi Rimanenti:${player.balance}`);
                                player.endTurn();
                            } else {
                                bot.sendMessage(chatId,"Pareggio!");
                                player.balance += player.betAmount;
                            }
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
                });
            });
            
            
        } else bot.sendMessage(chatId,"Iniziare prima il turno con /bet [amount]");
    }

    if (text === "/balance") {
        bot.sendMessage(chatId,`Hai ancora ${player.balance}`);
    }
});