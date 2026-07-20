const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const KeyModel = require('../models/Key');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('hwid-sıfırla')
        .setDescription('Key ID kullanarak belirtilen keyin HWID kilidini sıfırlar.')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addStringOption(option =>
            option.setName('key_id')
                .setDescription('Sıfırlanacak keyin ID si (Örn: KID-A1B2C3)')
                .setRequired(true)),

    async execute(interaction) {
        const keyId = interaction.options.getString('key_id').trim();

        const keyData = await KeyModel.findOne({ keyId: keyId });

        if (!keyData) {
            return interaction.reply({ content: '❌ Bu Key ID ile eşleşen bir sistem kaydı bulunamadı!', ephemeral: true });
        }

        // HWID ve kullanım durumunu sıfırla
        keyData.hwid = null;
        keyData.isUsed = false;
        await keyData.save();

        const embed = new EmbedBuilder()
            .setColor('#00FF00')
            .setTitle('🔄 HWID Başarıyla Sıfırlandı!')
            .setDescription(`**Key ID:** \`${keyId}\`\n**Key:** \`${keyData.key}\`\n\nBu keyin donanım kilidi kaldırıldı, artık başka bir bilgisayarda kullanılabilir!`);

        await interaction.reply({ embeds: [embed], ephemeral: true });
    }
};