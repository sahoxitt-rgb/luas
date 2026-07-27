module.exports = {
    name: 'pray',
    description: 'Birine dua edersin.',
    async executeText(message, args, UserModel, TicketModel, ConfigModel, CountingModel, OwoModel) {
        let userOwo = await OwoModel.findOne({ userId: message.author.id });
        if (!userOwo) userOwo = new OwoModel({ userId: message.author.id });

        const target = message.mentions.users.first();
        if (!target) return message.reply('❌ Kime dua edeceğini etiketlemelisin! Örnek: `.pray @kullanici`');
        
        const now = new Date();
        if (userOwo.lastPray && (now - userOwo.lastPray) < 300000) { 
            return message.reply('❌ Dua etmek için biraz beklemelisin (5 dakika cooldown var).');
        }

        let targetOwo = await OwoModel.findOne({ userId: target.id });
        if (!targetOwo) targetOwo = new OwoModel({ userId: target.id });

        targetOwo.pray += 1;
        userOwo.lastPray = now;
        await targetOwo.save();
        await userOwo.save();

        return message.reply(`🙏 Başarıyla **${target.username}** adlı kullanıcıya dua ettin! Çocuğun Pray puanı arttı.`);
    }
};