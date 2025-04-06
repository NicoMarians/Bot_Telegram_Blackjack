const functions = {
    startTurn: (player,dealer,bot,chatId) => {
        dealer.drawFirstHand();
        setTimeout(() => player.drawFirstHand(),1000)
        setTimeout( () => {
            if (player.canHit){
                bot.sendMessage(chatId,"Cosa vorresti fare?\n/hit\n/stand");
            } else {
                const dealerSum = dealer.checkSum();
                if (dealerSum < 21){
                    bot.sendMessage(chatId,"BlackJack!");
                    player.balance += player.betAmount * 2.5;
                    player.endTurn();
                    dealer.endTurn();
                } else {
                    dealer.showCards().then(() => {
                        player.balance += player.betAmount;
                        player.endTurn();
                        dealer.endTurn();
                        bot.sendMessage(chatId,"Pareggio");
                    });
                }
            }
        },2000);
        
    },
    convertCardValue: (card) => {
        if (card.value == "KING" || card.value == "QUEEN" || card.value == "JACK") return 10;
        if (card.value == "ACE") return 11;
        return parseInt(card.value);
    }
}

module.exports = functions; 