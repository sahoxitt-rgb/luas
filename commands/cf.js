module.exports = {
    name: 'cf',
    description: 'Yazı tura atarak paranı katlarsın.',
    async executeText(message, args, UserModel, TicketModel, ConfigModel, CountingModel, OwoModel) {
        let userOwo = await OwoModel.findOne({ userId: message.author.id });
        if (!userOwo) userOwo = new OwoModel({ userId: message.author.id });

        const miktar = parseInt(args[0]);
        if (!miktar || isNaN(miktar) || miktar <= 0) return message.reply('❌ Ne kadar yatıracağını yazmalısın! Örnek: `.cf 100`');
        if (userOwo.coins < miktar) return message.reply(`❌ Fakir misin kanka? O kadar paran yok. Güncel bakiye: **${userOwo.coins}**`);

        const win = Math.random() < 0.5;
        if (win) {
            userOwo.coins += miktar;
            await userOwo.save();
            return message.reply(`🪙 Para havada döndü veee... **KAZANDIN!** 🎉 **${miktar} Coin** cebine girdi. Güncel Bakiye: **${userOwo.coins}**`);
        } else {
            userOwo.coins -= miktar;
            await userOwo.save();
            return message.reply(`🪙 Para havada döndü veee... **KAYBETTİN!** 💀 **${miktar} Coin** uçtu gitti. Güncel Bakiye: **${userOwo.coins}**`);
        }
    }
};