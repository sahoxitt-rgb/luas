const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const ayarlar = require('../roller.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('unmute')
        .setDescription('Susturulan (Timeout yiyen) kullanıcının cezasını kaldırır.')
        .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
        .addUserOption(option => option.setName('kullanici').setDescription('Cezası kaldırılacak kullanıcıyı seçin').setRequired(true)),
        
    async execute(interaction) {
        const target = interaction.options.getMember('kullanici');
        if (!target) return interaction.reply({ content: '❌ Kullanıcı bulunamadı.', ephemeral: true });
        if (!target.moderatable) return interaction.reply({ content: '❌ Bu kullanıcının cezasını kaldırmaya yetkim yok!', ephemeral: true });
        
        if (!target.isCommunicationDisabled()) {
            return interaction.reply({ content: '⚠️ Bu kullanıcı zaten susturulmamış durumda!', ephemeral: true });
        }

        await target.timeout(null);
        
        // Kanala giden sade mesaj
        const embed = new EmbedBuilder()
            .setColor('#2B2D31')
            .setDescription(`🔊 <@${target.user.id}> kullanıcısının **susturması kaldırıldı!** Artık konuşabilir.`);
        await interaction.reply({ embeds: [embed] });

        // Log Kanalına giden detaylı mesaj
        const logChannelId = ayarlar.UNMUTE_LOG_KANAL_ID;
        if (logChannelId) {
            const logChannel = interaction.guild.channels.cache.get(logChannelId);
            if (logChannel) {
                const logEmbed = new EmbedBuilder()
                    .setColor('#00FF00')
                    .setTitle('🔊 Susturma Kaldırıldı (Unmute)')
                    .setDescription(`👮 **İşlemi Yapan Yetkili -->** <@${interaction.user.id}>\n` +
                                    `🆔 **Yetkili ID -->** \`${interaction.user.id}\`\n\n` +
                                    `👤 **Cezası Kaldırılan -->** <@${target.user.id}>\n` +
                                    `🆔 **Kullanıcı ID -->** \`${target.user.id}\`\n\n` +
                                    `⏰ **İşlem Tarihi -->** <t:${Math.floor(Date.now() / 1000)}:F>`)
                    .setThumbnail(target.user.displayAvatarURL({ dynamic: true }))
                    .setFooter({ text: 'Luas • Moderasyon Sistemi' })
                    .setTimestamp();
                await logChannel.send({ embeds: [logEmbed] }).catch(() => {});
            }
        }
    }
};