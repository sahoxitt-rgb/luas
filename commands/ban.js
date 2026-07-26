const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const ayarlar = require('../roller.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ban')
        .setDescription('Belirtilen kullanıcıyı sunucudan kalıcı olarak yasaklar (Ban).')
        .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
        .addUserOption(option => option.setName('kullanici').setDescription('Yasaklanacak kullanıcıyı seçin').setRequired(true))
        .addStringOption(option => option.setName('sebep').setDescription('Kullanıcıyı neden yasaklıyorsun?').setRequired(false)),
        
    async execute(interaction) {
        const target = interaction.options.getMember('kullanici') || interaction.options.getUser('kullanici');
        const reason = interaction.options.getString('sebep') || 'Sebep belirtilmedi.';
        
        if (!target) return interaction.reply({ content: '❌ Kullanıcı bulunamadı.', ephemeral: true });
        
        try {
            await interaction.guild.members.ban(target, { reason });
            
            // Kanala giden sade mesaj
            const embed = new EmbedBuilder()
                .setColor('#2B2D31')
                .setDescription(`🔨 <@${target.id}> **sunucudan kalıcı olarak yasaklandı!**\n\n📝 **Sebep:** \`${reason}\``);
            await interaction.reply({ embeds: [embed] });

            // Log Kanalı
            const logChannelId = ayarlar.BAN_LOG_KANAL_ID;
            if (logChannelId) {
                const logChannel = interaction.guild.channels.cache.get(logChannelId);
                if (logChannel) {
                    const logEmbed = new EmbedBuilder()
                        .setColor('#FF0000')
                        .setTitle('🔨 Kullanıcı Yasaklandı (Ban)')
                        .setDescription(`👮 **İşlemi Yapan Yetkili -->** <@${interaction.user.id}>\n` +
                                        `🆔 **Yetkili ID -->** \`${interaction.user.id}\`\n\n` +
                                        `👤 **Yasaklanan Kullanıcı -->** <@${target.id}>\n` +
                                        `🆔 **Kullanıcı ID -->** \`${target.id}\`\n\n` +
                                        `📝 **Yasaklanma Sebebi -->** \`${reason}\`\n` +
                                        `⏰ **İşlem Tarihi -->** <t:${Math.floor(Date.now() / 1000)}:F>`)
                        .setFooter({ text: 'Luas • Moderasyon Sistemi' })
                        .setTimestamp();
                    await logChannel.send({ embeds: [logEmbed] }).catch(() => {});
                }
            }
        } catch (e) {
            await interaction.reply({ content: '❌ Bu kullanıcıyı yasaklamaya yetkim yok!', ephemeral: true });
        }
    }
};