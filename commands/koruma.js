const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    name: 'koruma',
    description: 'Spam/Bot koruma (honeypot) kanalını ayarlar.',
    async executeText(message, args, UserModel, TicketModel, ConfigModel, CountingModel, OwoModel) {
        if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) {
            return message.reply({ content: '❌ Bu komutu kullanmak için yetkin yok kanka!' }).catch(() => {});
        }

        let config = await ConfigModel.findOne({ id: "config" });
        if (!config) {
            config = new ConfigModel({ id: "config" });
            await config.save();
        }

        const action = args[0] ? args[0].toLowerCase() : null;
        const lang = args[1] ? args[1].toLowerCase() : 'tr'; // Varsayılan TR

        if (action === 'kur') {
            
            // 👇 KANKA İŞTE O İKONUN LİNKİNİ BURAYA YAPIŞTIRACAKSIN 👇
            // Discord'a o ikonu at, sağ tıkla "Bağlantıyı Kopyala" de ve buraya yapıştır.
            const gpxIkonLinki = 'IKON_LINKI_BURAYA_GELECEK'; 

            const embed = new EmbedBuilder()
                .setColor('#2B2D31') // Discord arkaplan rengiyle uyumlu siyahımsı
                .setThumbnail(gpxIkonLinki !== 'IKON_LINKI_BURAYA_GELECEK' ? gpxIkonLinki : 'https://cdn-icons-png.flaticon.com/512/10155/10155823.png'); // Link girmezsen geçici karanlık bir dosya ikonu koyar

            if (lang === 'en') {
                embed.setTitle('DO NOT SEND MESSAGES IN THIS CHANNEL')
                     .setDescription('This channel is used to catch spam bots. Any messages sent here will result in a **1 hour mute**.')
                     .addFields({ name: 'Mute', value: `${config.koruma_mutes || 0}`, inline: true });
            } else {
                embed.setTitle('BU KANALA MESAJ GÖNDERMEYİN')
                     .setDescription('Bu kanal spam botlarını ve kuralları ihlal edenleri yakalamak için kullanılmaktadır. Buraya gönderilen herhangi bir mesaj doğrudan **1 saatlik susturulma (mute)** ile sonuçlanacaktır.')
                     .addFields({ name: 'Mute', value: `${config.koruma_mutes || 0}`, inline: true });
            }

            const honeypotMsg = await message.channel.send({ embeds: [embed] });

            config.koruma_channel = message.channel.id;
            config.koruma_message_id = honeypotMsg.id;
            config.koruma_lang = lang; 
            await config.save();

            message.delete().catch(() => {}); 
        } 
        else if (action === 'kaldır' || action === 'kaldir') {
            config.koruma_channel = null;
            config.koruma_message_id = null;
            await config.save();
            return message.reply('✅ Koruma kalkanı bu kanaldan başarıyla kaldırıldı!');
        } 
        else {
            return message.reply('❌ Kullanım: `.koruma kur tr` | `.koruma kur en` | `.koruma kaldır`');
        }
    }
};