module.exports = {
    name: 'daily',
    description: 'Günlük Luas Coin ödülünü alırsın.',
    async executeText(message, args, UserModel, TicketModel, ConfigModel, CountingModel, OwoModel) {
        let userOwo = await OwoModel.findOne({ userId: message.author.id });
        if (!userOwo) userOwo = new OwoModel({ userId: message.author.id });

        const now = new Date();
        if (userOwo.lastDaily && (now - userOwo.lastDaily) < 86400000) {
            const kalanSaat = Math.ceil((86400000 - (now - userOwo.lastDaily)) / 3600000);
            return message.reply(`❌ Kanka yavaş, günlük ödülünü zaten almışsın! **${kalanSaat} saat** sonra tekrar gel.`);
        }
        const dailyCoins = Math.floor(Math.random() * 500) + 500;
        userOwo.coins += dailyCoins;
        userOwo.lastDaily = now;
        await userOwo.save();
        return message.reply(`🎉 Günlük ödülünü topladın! Cüzdanına **${dailyCoins} Luas Coin** eklendi. Güncel bakiye: **${userOwo.coins}**`);
    }
};