module.exports = {
    name: 'createbox',
    description: 'Lootbox üretirsin.',
    async executeText(message, args, UserModel, TicketModel, ConfigModel, CountingModel, OwoModel) {
        let userOwo = await OwoModel.findOne({ userId: message.author.id });
        if (!userOwo) userOwo = new OwoModel({ userId: message.author.id });

        if (userOwo.coins < 1000) return message.reply('❌ Gizemli bir Kutu (Lootbox) üretmek için **1000 Coin** lazım!');
        userOwo.coins -= 1000;
        userOwo.inventory.push('Gizemli Kutu 🎁');
        await userOwo.save();
        return message.reply('📦 **1000 Coin** harcadın ve **Gizemli Kutu 🎁** ürettin! Envanterine eklendi.');
    }
};