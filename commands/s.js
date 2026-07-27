module.exports = {
    name: 's',
    description: 'Slot makinesi oynarsın. (.s 50 veya .s all)',
    async executeText(message, args, UserModel, TicketModel, ConfigModel, CountingModel, OwoModel) {
        let userOwo = await OwoModel.findOne({ userId: message.author.id });
        if (!userOwo) userOwo = new OwoModel({ userId: message.author.id });

        let miktarArg = args[0];
        if (!miktarArg) return message.reply('❌ Ne kadar basacağını yaz! Örnek: `.s 50` veya `.s all`');

        let miktar = 0;
        if (miktarArg.toLowerCase() === 'all') {
            miktar = userOwo.coins; // Kasa basılır
        } else {
            miktar = parseInt(miktarArg);
        }

        if (isNaN(miktar) || miktar <= 0) return message.reply('❌ Geçerli bir miktar gir kanka!');
        if (userOwo.coins < miktar) return message.reply(`❌ Yeterli paran yok kanka! Güncel Bakiye: **${userOwo.coins}**`);

        // Animasyon başlangıcı
        const msg = await message.reply('🎰 **Slot kolu çekildi, çarklar deli gibi dönüyor...**\n> [ ⏳ | ⏳ | ⏳ ]');

        // 3 saniye bekle
        setTimeout(async () => {
            const semboller = ['🍎', '💎', '🍒', '🔔', '🍉'];
            const slot1 = semboller[Math.floor(Math.random() * semboller.length)];
            const slot2 = semboller[Math.floor(Math.random() * semboller.length)];
            const slot3 = semboller[Math.floor(Math.random() * semboller.length)];

            let carpan = 0;
            if (slot1 === slot2 && slot2 === slot3) carpan = 10; // 3'ü aynıysa 10 Katı
            else if (slot1 === slot2 || slot2 === slot3 || slot1 === slot3) carpan = 2; // 2'si aynıysa 2 Katı

            let sonucMesaji = `🎰 **SLOT MAKİNESİ DURDU** 🎰\n> [ ${slot1} | ${slot2} | ${slot3} ]\n`;

            if (carpan > 0) {
                const netKazanc = (miktar * carpan) - miktar; 
                userOwo.coins += netKazanc;
                sonucMesaji += `🎉 **KAZANDIN!** Yatırımın ${carpan} katladı!\n> 💰 **+${miktar * carpan} Coin** kazandın. Güncel Bakiye: **${userOwo.coins}**`;
            } else {
                userOwo.coins -= miktar;
                sonucMesaji += `💀 **KAYBETTİN!** Hiçbiri tutmadı.\n> 💸 **-${miktar} Coin** gitti. Güncel Bakiye: **${userOwo.coins}**`;
            }

            await userOwo.save();
            msg.edit(sonucMesaji);
        }, 3000); 
    }
};