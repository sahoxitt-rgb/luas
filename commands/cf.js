module.exports = {
    name: 'cf',
    description: 'Yazı tura atarak paranı katlarsın. (.cf 100 veya .cf all)',
    async executeText(message, args, UserModel, TicketModel, ConfigModel, CountingModel, OwoModel) {
        let userOwo = await OwoModel.findOne({ userId: message.author.id });
        if (!userOwo) userOwo = new OwoModel({ userId: message.author.id });

        let miktarArg = args[0];
        if (!miktarArg) return message.reply('❌ Ne kadar yatıracağını yazmalısın! Örnek: `.cf 100` veya `.cf all`');

        let miktar = 0;
        if (miktarArg.toLowerCase() === 'all') {
            miktar = userOwo.coins; // Tüm parayı basar
        } else {
            miktar = parseInt(miktarArg);
        }

        if (isNaN(miktar) || miktar <= 0) return message.reply('❌ Geçerli bir miktar girmelisin kanka!');
        if (userOwo.coins < miktar) return message.reply(`❌ Fakir misin kanka? O kadar paran yok. Güncel bakiye: **${userOwo.coins}**`);

        // Animasyon başlangıcı (İlk mesaj gönderilir)
        const msg = await message.reply('🪙 **Para havaya atıldı, fırıl fırıl dönüyor...** 💫');

        // 2.5 saniye sonra sonucu belirle ve mesajı düzenle
        setTimeout(async () => {
            const win = Math.random() < 0.5; // %50 şans
            
            if (win) {
                userOwo.coins += miktar;
                await userOwo.save();
                msg.edit(`🪙 Para yere düştü veee... **KAZANDIN!** 🎉\n> 💰 **+${miktar} Coin** cebine girdi.\n> 💳 Güncel Bakiye: **${userOwo.coins}**`);
            } else {
                userOwo.coins -= miktar;
                await userOwo.save();
                msg.edit(`🪙 Para yere düştü veee... **KAYBETTİN!** 💀\n> 💸 **-${miktar} Coin** uçtu gitti.\n> 📉 Güncel Bakiye: **${userOwo.coins}**`);
            }
        }, 2500); 
    }
};