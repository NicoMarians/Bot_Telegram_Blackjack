const functions = {
    startTurn: async (player,dealer,bot,chatId) => {
        setTimeout(() => dealer.drawFirstHand(),1000);
        setTimeout(() => player.drawFirstHand(),2000);
        setTimeout(() => {
            if (player.canHit){
                bot.sendMessage(chatId,"Cosa vorresti fare?\n/hit\n/stand\n/double\n/split");
            } else {
                const dealerSum = dealer.checkSum();
                if (dealerSum < 21){
                    bot.sendMessage(chatId,"BlackJack!");
                    player.balance += player.betAmount * 2.5;
                    player.endTurn();
                    dealer.endTurn();
                } else {
                    async () => await dealer.showCards();
                    player.balance += player.betAmount;
                    player.endTurn();
                    dealer.endTurn();
                    bot.sendMessage(chatId,"Pareggio");
                }
            }
        },3000);
        
    },
    convertCardValue: (card) => {
        if (card.value == "KING" || card.value == "QUEEN" || card.value == "JACK") return 10;
        if (card.value == "ACE") return 11;
        return parseInt(card.value);
    }
}

module.exports = functions; 