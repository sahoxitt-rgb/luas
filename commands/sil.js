const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const ayarlar = require('../roller.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('sil')
        .setDescription('Belirtilen miktarda mesajı kanaldan temizler.')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
        .addIntegerOption(option => 
            option.setName('miktar')
            .setDescription('Silinecek mesaj sayısı (1-100 arası)')
            .setRequired(true)
            .setMinValue(1)
            .setMaxValue(100)
        ),

    async execute(interaction) {
        const miktar = interaction.options.getInteger('miktar');

        try {
            // true ayarı 14 günden eski mesajlarda hata vermesini engeller
            const deletedMessages = await interaction.channel.bulkDelete(miktar, true);
            
            const embed = new EmbedBuilder()
                .setColor('#00FF00')
                .setDescription(`✅ **${deletedMessages.size}** mesaj başarıyla silindi!`);
            
            await interaction.reply({ embeds: [embed], ephemeral: true });

            // Toplu silme logu
            const logChannelId = ayarlar.MESAJ_LOG_KANAL_ID;
            if (logChannelId) {
                const logChannel = interaction.guild.channels.cache.get(logChannelId);
                if (logChannel) {
                    const logEmbed = new EmbedBuilder()
                        .setColor('#FFA500')
                        .setTitle('🧹 Toplu Mesaj Silindi (Purge)')
                        .setDescription(`👮 **İşlemi Yapan Yetkili -->** <@${interaction.user.id}>\n` +
                                        `📁 **İşlem Yapılan Kanal -->** <#${interaction.channel.id}>\n` +
                                        `🔢 **Silinen Mesaj Sayısı -->** \`${deletedMessages.size}\`\n` +
                                        `⏰ **İşlem Tarihi -->** <t:${Math.floor(Date.now() / 1000)}:F>`)
                        .setFooter({ text: 'Luas • Moderasyon Sistemi' })
                        .setTimestamp();
                    await logChannel.send({ embeds: [logEmbed] }).catch(() => {});
                }
            }

        } catch (error) {
            console.error(error);
            await interaction.reply({ content: '❌ Mesajları silerken bir hata oluştu.', ephemeral: true });
        }
    }
};