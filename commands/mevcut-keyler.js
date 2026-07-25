const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const mongoose = require('mongoose');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('mevcut-keyler')
        .setDescription('Veritabanındaki keyleri, şifreleri ve oluşturan yetkiliyi listeler.')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        await interaction.deferReply({ ephemeral: true });

        try {
            const UserModel = mongoose.models.User || mongoose.model('User');
            const keys = await UserModel.find().sort({ _id: -1 }).limit(10);

            if (keys.length === 0) {
                return interaction.editReply({ content: '📭 Veritabanında kayıtlı hiçbir key bulunmuyor.' });
            }

            const embed = new EmbedBuilder()
                .setColor('#00FFCC')
                .setTitle('📋 Veritabanı Kayıtları (Son 10 Key)')
                .setDescription(`Sistemdeki son kayıtlı keyler ve oluşturan yetkililer aşağıdadır:`);

            keys.forEach((key, index) => {
                embed.addFields({
                    name: `#${index + 1} | Kullanıcı: ${key.username}`,
                    value: `🔑 **Key:** \`${key.password}\`\n🆔 **ID:** \`${key.keyId}\` | 🌟 **Plan:** \`${key.plan.toUpperCase()}\`\n💻 **HWID:** ${key.hwid ? '`Dolu`' : '`Boş`'} | 🛠️ **Oluşturan:** \`${key.creatorTag || 'Bilinmiyor'}\``,
                    inline: false
                });
            });

            await interaction.editReply({ embeds: [embed] });
        } catch (error) {
            console.error(error);
            interaction.editReply({ content: '❌ Keyler listelenirken bir hata oluştu!' });
        }
    }
};