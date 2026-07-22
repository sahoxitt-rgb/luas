const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const mongoose = require('mongoose');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('key-sorgula')
        .setDescription('Key ID kullanarak o keyin kime ait olduğunu ve detaylarını gösterir.')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addStringOption(option =>
            option.setName('keyid')
                .setDescription('Sorgulamak istediğiniz Key ID (Örn: KID-PREM-XXXXXX)')
                .setRequired(true)),

    async execute(interaction) {
        await interaction.deferReply({ ephemeral: true });

        const searchKeyId = interaction.options.getString('keyid').trim();

        try {
            const UserModel = mongoose.models.User || mongoose.model('User');
            const targetUser = await UserModel.findOne({ keyId: searchKeyId });

            if (!targetUser) {
                return interaction.editReply({ 
                    content: `❌ \`${searchKeyIdunas}\` ID'sine sahip bir key veritabanında bulunamadı!` 
                });
            }

            const embed = new EmbedBuilder()
                .setColor('#0099FF')
                .setTitle('🔍 Key Sorgulama Sonucu')
                .addFields(
                    { name: '👤 Kullanıcı Adı', value: `\`${targetUser.username}\``, inline: true },
                    { name: '🔑 Şifre / Key', value: `\`${targetUser.password}\``, inline: true },
                    { name: '🆔 Key ID', value: `\`${targetUser.keyId}\``, inline: false },
                    { name: '📦 Paket / Plan', value: `\`${targetUser.plan ? targetUser.plan.toUpperCase() : 'FREE'}\``, inline: true },
                    { name: '⏳ Süre', value: `\`${targetUser.duration || 'Sınırsız'}\``, inline: true },
                    { name: '💻 HWID Durumu', value: targetUser.hwid ? `\`Kayıtlı (${targetUser.hwid.substring(0, 10)}...)\`` : '`Boş (Kullanılmamış)`', inline: false },
                    { name: 'discord ID', value: targetUser.discordId ? `<@${targetUser.discordId}>` : '`Bilinmiyor`', inline: true }
                )
                .setTimestamp();

            await interaction.editReply({ embeds: [embed] });

        } catch (error) {
            console.error("Key sorgulama hatası:", error);
            await interaction.editReply({ content: `❌ Sorgulama sırasında bir veritabanı hatası oluştu!` });
        }
    }
};