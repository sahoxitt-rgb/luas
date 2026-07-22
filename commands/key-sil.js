const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, ComponentType, PermissionFlagsBits } = require('discord.js');
const mongoose = require('mongoose');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('key-sil')
        .setDescription('Veritabanındaki keyleri listeler ve seçtiğinizi silmenizi sağlar.')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        await interaction.deferReply({ ephemeral: true });
        const UserModel = mongoose.model('User');
        
        try {
            const keys = await UserModel.find().sort({ _id: -1 }).limit(25);
            
            if (keys.length === 0) {
                return interaction.editReply({ content: '📭 Veritabanında silinecek hiçbir key bulunmuyor.' });
            }

            const options = keys.map((key, index) => {
                return {
                    label: `${index + 1}. ${key.username} - ${key.plan.toUpperCase()}`,
                    description: `ID: ${key.keyId} | Süre: ${key.duration}`,
                    value: key.keyId
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
                .setDescription('Aşağıdaki menüyü kullanarak veritabanından silmek istediğiniz lisansı seçin.\n\n*⚠️ Sadece en yeni 25 key listelenmektedir.*');

            const response = await interaction.editReply({ embeds: [embed], components: [row] });

            const collector = response.createMessageComponentCollector({ 
                componentType: ComponentType.StringSelect, 
                time: 60000,
                filter: i => i.user.id === interaction.user.id
            });

            collector.on('collect', async i => {
                if (i.customId === 'select_key_to_delete') {
                    const selectedKeyId = i.values[0];
                    const deletedUser = await UserModel.findOneAndDelete({ keyId: selectedKeyId });
                    
                    if (deletedUser) {
                        const successEmbed = new EmbedBuilder()
                            .setColor('#00FF00')
                            .setTitle('✅ Başarıyla Silindi!')
                            .setDescription(`🆔 **ID:** \`${deletedUser.keyId}\`\n👤 **Kullanıcı:** \`${deletedUser.username}\``);
                        
                        await i.update({ embeds: [successEmbed], components: [] });
                    } else {
                        await i.update({ content: '❌ Key bulunamadı veya zaten silinmiş.', embeds: [], components: [] });
                    }
                }
            });
        } catch (error) {
            console.error(error);
            interaction.editReply({ content: '❌ Veritabanı hatası oluştu!' });
        }
    }
};