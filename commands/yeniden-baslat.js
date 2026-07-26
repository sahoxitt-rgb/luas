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

        await interaction.reply({ embeds: [embed] });

        // Bat dosyası olmadan Node.js üzerinden kendi kendini yeniden başlatan özel algoritma
        setTimeout(() => {
            interaction.client.destroy(); // Bağlantıyı güvenlice kopar
            
            const child = spawn(process.argv[0], process.argv.slice(1), {
                detached: true,
                stdio: 'inherit' // VS Code terminalinde logları görmeni sağlar
            });
            child.unref();
            process.exit(); // Eski botu kapat, yenisi çoktan ayaklandı!
        }, 2000);
    }
};