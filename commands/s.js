module.exports = {
    name: 's',
    description: 'Slot makinesi oynarsın.',
    async executeText(message, args, UserModel, TicketModel, ConfigModel, CountingModel, OwoModel) {
        let userOwo = await OwoModel.findOne({ userId: message.author.id });
        if (!userOwo) userOwo = new OwoModel({ userId: message.author.id });

        const miktar = parseInt(args[0]);
        if (!miktar || isNaN(miktar) || miktar <= 0) return message.reply('❌ Ne kadar basacağını yaz! Örnek: `.s 50`');
        if (userOwo.coins < miktar) return message.reply('❌ Yeterli paran yok kanka!');

        const semboller = ['🍎', '💎', '🍒', '🔔', '🍉'];
        const slot1 = semboller[Math.floor(Math.random() * semboller.length)];
        const slot2 = semboller[Math.floor(Math.random() * semboller.length)];
        const slot3 = semboller[Math.floor(Math.random() * semboller.length)];

        let carpan = 0;
        if (slot1 === slot2 && slot2 === slot3) carpan = 10;
        else if (slot1 === slot2 || slot2 === slot3 || slot1 === slot3) carpan = 2;

        let sonucMesaji = `🎰 **SLOT MAKİNESİ** 🎰\n[ ${slot1} | ${slot2} | ${slot3} ]\n`;

        if (carpan > 0) {
            const kazanc = miktar * carpan;
            userOwo.coins += kazanc;
            sonucMesaji += `🎉 **KAZANDIN!** Yatırımın ${carpan} katladı! **+${kazanc} Coin**`;
        } else {
            userOwo.coins -= miktar;
            sonucMesaji += `💀 **KAYBETTİN!** Hiçbiri tutmadı. **-${miktar} Coin**`;
        }

        await userOwo.save();
        return message.reply(sonucMesaji);
    }
};