const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { spawn } = require('child_process');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('yeniden-baslat')
        .setDescription('Botu yeniden başlatarak sistemleri günceller (Sadece Yöneticiler).')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        const embed = new EmbedBuilder()
            .setColor('#FFA500')
            .setTitle('🔄 Sistem Yeniden Başlatılıyor...')
            .setDescription('🤖 **Luas Bot** kapatılıp yeniden başlatılıyor.\nLütfen bekleyiniz, bot birkaç saniye içinde tekrar aktif olacaktır.')
            .addFields(
                { name: '👮 İşlemi Başlatan', value: `<@${interaction.user.id}>`, inline: true },
                { name: '🆔 Yetkili ID', value: `\`${interaction.user.id}\``, inline: true }
            )
            .setThumbnail(interaction.user.displayAvatarURL({ dynamic: true }))
            .setFooter({ text: 'Luas • Sistem Yönetimi' })
            .setTimestamp();

        // Mesajı gönder ve mesaj nesnesini yakala
        const sentMessage = await interaction.reply({ embeds: [embed], fetchReply: true });

        // 2 saniye sonra mesajı başarı durumuna çevirip botu yeniden başlat
        setTimeout(async () => {
            try {
                const successEmbed = new EmbedBuilder()
                    .setColor('#00FF00')
                    .setTitle('✅ Sistem Başarıyla Yeniden Başlatıldı!')
                    .setDescription('🤖 **Luas Bot** başarıyla yeniden başlatıldı ve aktif durumda.')
                    .addFields(
                        { name: '👮 İşlemi Başlatan', value: `<@${interaction.user.id}>`, inline: true },
                        { name: '🆔 Yetkili ID', value: `\`${interaction.user.id}\``, inline: true }
                    )
                    .setThumbnail(interaction.user.displayAvatarURL({ dynamic: true }))
                    .setFooter({ text: 'Luas • Sistem Yönetimi' })
                    .setTimestamp();

                // Mesajı güncelle
                await sentMessage.edit({ embeds: [successEmbed] });
            } catch (e) {}

            // 1 saniye sonra güvenlice yeniden başlat
            setTimeout(() => {
                interaction.client.destroy();
                
                const child = spawn(process.argv[0], process.argv.slice(1), {
                    detached: true,
                    stdio: 'inherit'
                });
                child.unref();
                process.exit(); 
            }, 1000);
        }, 2000);
    }
};