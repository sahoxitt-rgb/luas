const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    name: 'duyuru',
    description: 'Webhook ile şık bir duyuru gönderir.',
    async executeText(message, args) {
        if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) {
            return message.reply({ content: '❌ Bu komutu kullanmak için yetkin yok kanka!' }).catch(() => {});
        }

        const duyuruMetni = args.join(' ');
        const resimDosyasi = message.attachments.first();

        if (!duyuruMetni && !resimDosyasi) {
            return message.reply({ content: '❌ Kanka duyuru metni yazmalısın veya bir görsel eklemelisin! Örnek: `.duyuru Merhaba millet`' }).catch(() => {});
        }

        const webhookUrl = "https://canary.discord.com/api/webhooks/1531299789726023962/OC1RWIlWqrlMSWsdDRSC6LVK7N6ZX6P64hEE0jOkjaPuIEcciqIgsa4jlV0IZ4AcpnSg";

        try {
            const embed = new EmbedBuilder()
                .setColor('#FFD700')
                .setTitle('📢 **YENİ DUYURU**')
                .setDescription(duyuruMetni || '*Görsel Duyurusu*')
                .setFooter({ text: `Yetkili: ${message.author.tag}`, iconURL: message.author.displayAvatarURL({ dynamic: true }) })
                .setTimestamp();

            if (resimDosyasi) {
                embed.setImage(resimDosyasi.url);
            }

            // Komut yazılan orijinal mesajı ortalıktan kaldıralım ki temiz dursun
            await message.delete().catch(() => {});

            const response = await fetch(webhookUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    username: "Luas Duyuru Sistemi",
                    avatar_url: message.client.user.displayAvatarURL(),
                    embeds: [embed.toJSON()]
                })
            });

            if (!response.ok) {
                return message.channel.send({ content: '❌ Webhook üzerinden duyuru gönderilemedi kanka.' }).catch(() => {});
            }
        } catch (error) {
            console.error("Duyuru Komutu Hatası:", error);
            message.channel.send({ content: '❌ Duyuru gönderilirken bir hata oluştu.' }).catch(() => {});
        }
    }
};