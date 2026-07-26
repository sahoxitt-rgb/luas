const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const ayarlar = require('../roller.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('lock')
        .setDescription('Mevcut kanalı üyelerin mesaj gönderimine kapatır.')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),
        
    async execute(interaction) {
        await interaction.channel.permissionOverwrites.edit(interaction.guild.id, { SendMessages: false });
        
        const embed = new EmbedBuilder()
            .setColor('#2B2D31')
            .setDescription('🔒 **Bu kanal yetkililer tarafından kilitlendi!**\nŞu an kimse mesaj gönderemez.');
        await interaction.reply({ embeds: [embed] });

        // Log Kanalı
        const logChannelId = ayarlar.LOCK_LOG_KANAL_ID;
        if (logChannelId) {
            const logChannel = interaction.guild.channels.cache.get(logChannelId);
            if (logChannel) {
                const logEmbed = new EmbedBuilder()
                    .setColor('#FF0000')
                    .setTitle('🔒 Kanal Kilitlendi (Lock)')
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