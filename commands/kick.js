const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const ayarlar = require('../roller.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('kick')
        .setDescription('Belirtilen kullanıcıyı sunucudan atar (Kick).')
        .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers)
        .addUserOption(option => option.setName('kullanici').setDescription('Atılacak kullanıcıyı seçin').setRequired(true))
        .addStringOption(option => option.setName('sebep').setDescription('Kullanıcıyı neden atıyorsun?').setRequired(false)),
        
    async execute(interaction) {
        const target = interaction.options.getMember('kullanici');
        const reason = interaction.options.getString('sebep') || 'Sebep belirtilmedi.';
        
        if (!target) return interaction.reply({ content: '❌ Kullanıcı bulunamadı veya sunucuda değil.', ephemeral: true });
        if (!target.kickable) return interaction.reply({ content: '❌ Bu kullanıcının yetkisi benden yüksek, onu atamam!', ephemeral: true });

        await target.kick(reason);
        
        // Kanala giden sade mesaj
        const embed = new EmbedBuilder()
            .setColor('#2B2D31')
            .setDescription(`👢 <@${target.user.id}> **sunucudan atıldı!**\n\n📝 **Sebep:** \`${reason}\``);
        await interaction.reply({ embeds: [embed] });

        // Log Kanalı
        const logChannelId = ayarlar.KICK_LOG_KANAL_ID;
        if (logChannelId) {
            const logChannel = interaction.guild.channels.cache.get(logChannelId);
            if (logChannel) {
                const logEmbed = new EmbedBuilder()
                    .setColor('#FF8C00')
                    .setTitle('👢 Kullanıcı Atıldı (Kick)')
                    .setDescription(`👮 **İşlemi Yapan Yetkili -->** <@${interaction.user.id}>\n` +
                                    `🆔 **Yetkili ID -->** \`${interaction.user.id}\`\n\n` +
                                    `👤 **Atılan Kullanıcı -->** <@${target.user.id}>\n` +
                                    `🆔 **Kullanıcı ID -->** \`${target.user.id}\`\n\n` +
                                    `📝 **Atılma Sebebi -->** \`${reason}\`\n` +
                                    `⏰ **İşlem Tarihi -->** <t:${Math.floor(Date.now() / 1000)}:F>`)
                    .setThumbnail(target.user.displayAvatarURL({ dynamic: true }))
                    .setFooter({ text: 'Luas • Moderasyon Sistemi' })
                    .setTimestamp();
                await logChannel.send({ embeds: [logEmbed] }).catch(() => {});
            }
        }
    }
};