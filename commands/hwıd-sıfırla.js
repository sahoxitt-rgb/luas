const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const mongoose = require('mongoose');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('hwid-sifirla')
        .setDescription('Key ID kullanarak belirtilen lisansın HWID kilidini sıfırlar.')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addStringOption(option =>
            option.setName('key_id')
                .setDescription('Sıfırlanacak keyin ID si (Örn: 123456)')
                .setRequired(true)),

    async execute(interaction) {
        const keyIdInput = interaction.options.getString('key_id').trim();
        const UserModel = mongoose.model('User');
        const userData = await UserModel.findOne({ keyId: keyIdInput });

        if (!userData) {
            return interaction.reply({ content: '❌ Bu Key ID ile eşleşen bir sistem kaydı bulunamadı!', ephemeral: true });
        }

        userData.hwid = null;
        await userData.save();

        const embed = new EmbedBuilder()
            .setColor('#00FF00')
            .setTitle('🔄 HWID Başarıyla Sıfırlandı!')
            .setDescription(`🆔 **Key ID -->** \`${userData.keyId}\`\n` +
                            `👤 **Kullanıcı Adı -->** \`${userData.username}\`\n` +
                            `🔑 **Şifre -->** ||${userData.password}|| (Gizli)\n` +
                            `🌟 **Plan -->** \`${userData.plan.toUpperCase()}\`\n\n` +
                            `❗️ \`Bilgi:\` __**Donanım kilidi kaldırıldı. Yeni bilgisayardan giriş yapılabilir.**__`)
            .setFooter({ text: 'Luas • Donanım Sistemi' })
            .setTimestamp();

        await interaction.reply({ embeds: [embed], ephemeral: true });
    }
};