const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const ayarlar = require('../roller.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('unban')
        .setDescription('ID\'si belirtilen kullanıcının yasağını kaldırır.')
        .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
        .addStringOption(option => option.setName('id').setDescription('Yasağı kaldırılacak kullanıcının ID numarasını girin').setRequired(true)),
        
    async execute(interaction) {
        const targetId = interaction.options.getString('id');
        
        try {
            await interaction.guild.members.unban(targetId);
            
            // Kanala giden sade mesaj
            const embed = new EmbedBuilder()
                .setColor('#2B2D31')
                .setDescription(`✅ <@${targetId}> (\`${targetId}\`) **ID'li kullanıcının yasağı başarıyla kaldırıldı!**`);
            await interaction.reply({ embeds: [embed] });

            // Log Kanalı
            const logChannelId = ayarlar.UNBAN_LOG_KANAL_ID;
            if (logChannelId) {
                const logChannel = interaction.guild.channels.cache.get(logChannelId);
                if (logChannel) {
                    const logEmbed = new EmbedBuilder()
                        .setColor('#00FF00')
                        .setTitle('✅ Yasak Kaldırıldı (Unban)')
                        .setDescription(`👮 **İşlemi Yapan Yetkili -->** <@${interaction.user.id}>\n` +
                                        `🆔 **Yetkili ID -->** \`${interaction.user.id}\`\n\n` +
                                        `👤 **Yasağı Kaldırılan ID -->** <@${targetId}> (\`${targetId}\`)\n` +
                                        `⏰ **İşlem Tarihi -->** <t:${Math.floor(Date.now() / 1000)}:F>`)
                        .setFooter({ text: 'Luas • Moderasyon Sistemi' })
                        .setTimestamp();
                    await logChannel.send({ embeds: [logEmbed] }).catch(() => {});
                }
            }
        } catch (e) {
            await interaction.reply({ content: '❌ Bu ID\'ye sahip yasaklı bir kullanıcı bulunamadı!', ephemeral: true });
        }
    }
};