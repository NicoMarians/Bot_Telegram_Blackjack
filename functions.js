const functions = {
    startTurn: async (deckId,player,dealer,bot,chatId) => {
        //AGGIUSTARE ORDINE MESSAGGI
        await dealer.drawFirstHand();
        await player.drawFirstHand();
        console.log("AAAA")
        if (player.canHit){
            bot.sendMessage(chatId,"Cosa vorresti fare?\n/hit\n/stand\n/double\n/split");
        } else {
            bot.sendMessage(chatId,"BlackJack!");
        }
    }
}

module.exports = functions;