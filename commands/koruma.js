const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits } = require('discord.js');

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

        if (action === 'kur') {
            
            // Senin attığın ikonun direkt linki
            const gpxIkonLinki = 'https://i.ibb.co/mFX524Zp/image.png'; 

            const embed = new EmbedBuilder()
                .setColor('#2B2D31') // Discord arkaplan rengiyle uyumlu
                .setThumbnail(gpxIkonLinki)
                // Başlıkta her iki dil
                .setTitle('BU KANALA MESAJ GÖNDERMEYİN / DO NOT SEND MESSAGES')
                // Açıklamada her iki dil alt alta
                .setDescription('Bu kanal spam botlarını ve kuralları ihlal edenleri yakalamak için kullanılmaktadır. Buraya gönderilen herhangi bir mesaj doğrudan **1 saatlik susturulma (mute)** ile sonuçlanacaktır.\n\nThis channel is used to catch spam bots. Any messages sent here will result in a **1 hour mute**.');

            // Sadece Mute yazan alt butonumuz
            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId('dummy_mutes')
                    .setLabel(`Mute: ${config.koruma_mutes || 0}`)
                    .setStyle(ButtonStyle.Secondary)
                    .setDisabled(true)
            );

            const honeypotMsg = await message.channel.send({ embeds: [embed], components: [row] });

            config.koruma_channel = message.channel.id;
            config.koruma_message_id = honeypotMsg.id;
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
            return message.reply('❌ Kullanım: `.koruma kur` | `.koruma kaldır`');
        }
    }
};