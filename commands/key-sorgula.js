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
            const targetUser = await UserModel.findOne({
                $or: [{ keyId: query }, { password: query }, { username: query }]
            });

            if (!targetUser) {
                return interaction.editReply({ content: `❌ \`${query}\` ile eşleşen bir kayıt bulunamadı!` });
            }

            const embed = new EmbedBuilder()
                .setColor('#0099FF')
                .setTitle('🔍 Key Sorgulama Sonucu')
                .setDescription(`👤 **Kullanıcı Adı -->** \`${targetUser.username}\`\n` +
                                `🔑 **Key / Şifre -->** \`${targetUser.password}\`\n` +
                                `🆔 **Key ID -->** \`${targetUser.keyId || 'Yok'}\`\n` +
                                `📦 **Paket / Plan -->** \`${targetUser.plan ? targetUser.plan.toUpperCase() : 'FREE'}\`\n` +
                                `⏳ **Süre -->** \`${targetUser.duration || 'Sınırsız'}\`\n` +
                                `💻 **HWID Durumu -->** ${targetUser.hwid ? `\`Kayıtlı: ${targetUser.hwid}\`` : '\`Boş (Kullanılmamış)\`'}\n` +
                                `👑 **Discord Profili -->** ${targetUser.discordId ? `<@${targetUser.discordId}>` : '\`Bilinmiyor\`'}`)
                .setFooter({ text: 'Luas • Veritabanı Sistemi' })
                .setTimestamp();

            await interaction.editReply({ embeds: [embed] });
        } catch (error) {
            console.error(error);
            await interaction.editReply({ content: `❌ Sorgulama sırasında bir hata oluştu!` });
        }
    }
};