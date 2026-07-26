const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const ayarlar = require('../roller.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('unlock')
        .setDescription('Kilitli kanalı mesaj gönderimine tekrar açar.')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),
        
    async execute(interaction) {
        await interaction.channel.permissionOverwrites.edit(interaction.guild.id, { SendMessages: null });
        
        const embed = new EmbedBuilder()
            .setColor('#2B2D31')
            .setDescription('🔓 **Kanalın kilidi açıldı!**\nArtık herkes mesaj gönderebilir.');
        await interaction.reply({ embeds: [embed] });

        // Log Kanalı
        const logChannelId = ayarlar.UNLOCK_LOG_KANAL_ID;
        if (logChannelId) {
            const logChannel = interaction.guild.channels.cache.get(logChannelId);
            if (logChannel) {
                const logEmbed = new EmbedBuilder()
                    .setColor('#00FF00')
                    .setTitle('🔓 Kanal Kilidi Açıldı (Unlock)')
                    .setDescription(`👮 **İşlemi Yapan Yetkili -->** <@${interaction.user.id}>\n` +
                                    `🆔 **Yetkili ID -->** \`${interaction.user.id}\`\n\n` +
                                    `📁 **İşlem Yapılan Kanal -->** <#${interaction.channel.id}>\n` +
                                    `⏰ **İşlem Tarihi -->** <t:${Math.floor(Date.now() / 1000)}:F>`)
                    .setFooter({ text: 'Luas • Moderasyon Sistemi' })
                    .setTimestamp();
                await logChannel.send({ embeds: [logEmbed] }).catch(() => {});
            }
        }
    }
};