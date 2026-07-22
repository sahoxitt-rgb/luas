const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const mongoose = require('mongoose');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('key-sorgula')
        .setDescription('Key ID veya doğrudan Key/Şifre ile detayları sorgular.')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addStringOption(option =>
            option.setName('sorgu')
                .setDescription('Key ID veya Key (Şifre) girin')
                .setRequired(true)),

    async execute(interaction) {
        await interaction.deferReply({ ephemeral: true });

        const query = interaction.options.getString('sorgu').trim();

        try {
            const UserModel = mongoose.models.User || mongoose.model('User');
            
            // Hem Key ID hem de Şifre (password) alanında arama yapar
            const targetUser = await UserModel.findOne({
                $or: [
                    { keyId: query },
                    { password: query },
                    { username: query }
                ]
            });

            if (!targetUser) {
                return interaction.editReply({ 
                    content: `❌ \`${query}\` ile eşleşen bir kayıt veritabanında bulunamadı!` 
                });
            }

            const embed = new EmbedBuilder()
                .setColor('#0099FF')
                .setTitle('🔍 Key Sorgulama Sonucu')
                .addFields(
                    { name: '👤 Kullanıcı Adı', value: `\`${targetUser.username}\``, inline: true },
                    { name: '🔑 Key / Şifre', value: `\`${targetUser.password}\``, inline: true },
                    { name: '🆔 Key ID', value: `\`${targetUser.keyId || 'Yok'}\``, inline: false },
                    { name: '📦 Paket / Plan', value: `\`${targetUser.plan ? targetUser.plan.toUpperCase() : 'FREE'}\``, inline: true },
                    { name: '⏳ Süre', value: `\`${targetUser.duration || 'Sınırsız'}\``, inline: true },
                    { name: '💻 HWID Durumu', value: targetUser.hwid ? `\`Kayıtlı: ${targetUser.hwid}\`` : '`Boş (Kullanılmamış)`', inline: false },
                    { name: 'Discord ID', value: targetUser.discordId ? `<@${targetUser.discordId}>` : '`Bilinmiyor`', inline: true }
                )
                .setTimestamp();

            await interaction.editReply({ embeds: [embed] });

        } catch (error) {
            console.error("Key sorgulama hatası:", error);
            await interaction.editReply({ content: `❌ Sorgulama sırasında bir veritabanı hatası oluştu!` });
        }
    }
};