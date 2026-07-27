module.exports = {
    name: 'send',
    description: 'Birine para gönderirsin.',
    async executeText(message, args, UserModel, TicketModel, ConfigModel, CountingModel, OwoModel) {
        let userOwo = await OwoModel.findOne({ userId: message.author.id });
        if (!userOwo) userOwo = new OwoModel({ userId: message.author.id });

        const target = message.mentions.users.first();
        const miktar = parseInt(args[1]);

        if (!target || !miktar || isNaN(miktar) || miktar <= 0) return message.reply('❌ Hatalı kullanım! Örnek: `.send @kullanici 100`');
        if (userOwo.coins < miktar) return message.reply('❌ O kadar paran yok kanka!');
        if (target.id === message.author.id) return message.reply('❌ Kendine para mı göndericen manyak?');

        let targetOwo = await OwoModel.findOne({ userId: target.id });
        if (!targetOwo) targetOwo = new OwoModel({ userId: target.id });

        userOwo.coins -= miktar;
        targetOwo.coins += miktar;
        await userOwo.save();
        await targetOwo.save();

        return message.reply(`💸 Başarıyla **${target.username}** kullanıcısına **${miktar} Coin** gönderdin!`);
    }
};