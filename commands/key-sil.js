const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, ComponentType, PermissionFlagsBits } = require('discord.js');
const mongoose = require('mongoose');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('key-sil')
        .setDescription('Veritabanından seçtiğiniz keyi siler ve paneli açık tutar.')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        await interaction.deferReply({ ephemeral: true });
        await sendDeletePanel(interaction);
    }
};

async function sendDeletePanel(interaction, statusMessage = null) {
    try {
        const UserModel = mongoose.models.User || mongoose.model('User');
        const keys = await UserModel.find().sort({ _id: -1 }).limit(25);
        
        if (keys.length === 0) {
            const emptyEmbed = new EmbedBuilder().setColor('#FF0000').setTitle('🗑️ Luas Key Silme Paneli').setDescription('📭 Veritabanında silinecek hiçbir key kalmadı.');
            if (interaction.deferred || interaction.replied) {
                return interaction.editReply({ embeds: [emptyEmbed], components: [] });
            }
            return;
        }

        const options = keys.map((key, index) => {
            return {
                label: `${index + 1}. ${key.username} (${key.keyId})`.substring(0, 100),
                description: `Key: ${key.password} | Plan: ${key.plan.toUpperCase()}`.substring(0, 100),
                value: key._id.toString()
            };
        });

        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId('select_key_to_delete')
            .setPlaceholder('🗑️ Silmek istediğiniz keyi seçin...')
            .addOptions(options);

        const row = new ActionRowBuilder().addComponents(selectMenu);

        const embed = new EmbedBuilder()
            .setColor('#FF0000')
            .setTitle('🗑️ Luas Key Silme Paneli')
            .setDescription(statusMessage ? `**${statusMessage}**\n\nBaşka bir key seçerek silmeye devam edebilirsin:` : 'Aşağıdaki menüden silmek istediğin keyi seç. Sildiğinde panel kapanmaz.');

        const response = await interaction.editReply({ embeds: [embed], components: [row] });

        const collector = response.createMessageComponentCollector({ 
            componentType: ComponentType.StringSelect, 
            time: 120000, // 2 dakika aktif kalır
            filter: i => i.user.id === interaction.user.id
        });

        collector.on('collect', async i => {
            if (i.customId === 'select_key_to_delete') {
                await i.deferUpdate();
                const selectedMongoId = i.values[0];
                const deletedUser = await UserModel.findByIdAndDelete(selectedMongoId);
                
                if (deletedUser) {
                    const msg = `✅ Başarıyla Silindi! (ID: ${deletedUser.keyId} - ${deletedUser.username})`;
                    await sendDeletePanel(interaction, msg);
                } else {
                    await sendDeletePanel(interaction, '❌ Key bulunamadı veya zaten silinmiş.');
                }
            }
        });
    } catch (error) {
        console.error("Key silme hatası:", error);
    }
}