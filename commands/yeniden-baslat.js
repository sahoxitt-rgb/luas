const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');

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

        await interaction.reply({ embeds: [embed] });

        // Mesaj gittikten 2 saniye sonra botu kapatır, VDS/Host otomatik geri açar.
        setTimeout(() => {
            console.log('🔄 Bot yeniden başlatılıyor...');
            process.exit(1); 
        }, 2000);
    }
};