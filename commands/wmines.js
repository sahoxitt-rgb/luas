module.exports = {
    name: 'wmines',
    description: 'Madene inip eşya kazanırsın.',
    async executeText(message, args, UserModel, TicketModel, ConfigModel, CountingModel, OwoModel) {
        let userOwo = await OwoModel.findOne({ userId: message.author.id });
        if (!userOwo) userOwo = new OwoModel({ userId: message.author.id });

        if (userOwo.coins < 50) return message.reply('❌ Madene inmek için en az **50 Coin** giriş ücreti ödemelisin!');
        userOwo.coins -= 50;

        const lootlar = [
            { isim: 'Taş', sans: 0.50 },
            { isim: 'Demir', sans: 0.30 },
            { isim: 'Altın', sans: 0.15 },
            { isim: 'Elmas', sans: 0.05 }
        ];

        const rng = Math.random();
        let kazanilan = 'Taş';
        let toplamSans = 0;

        for (const loot of lootlar) {
            toplamSans += loot.sans;
            if (rng <= toplamSans) {
                kazanilan = loot.isim;
                break;
            }
        }

        userOwo.inventory.push(kazanilan);
        await userOwo.save();
        return message.reply(`⛏️ Madene indin (50 Coin harcadın) ve kayaları kazdın...\n✨ Çıkan Ganimet: **${kazanilan}**! (Envanterine eklendi)`);
    }
};