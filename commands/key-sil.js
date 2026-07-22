const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, ComponentType, PermissionFlagsBits } = require('discord.js');
const mongoose = require('mongoose');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('key-sil')
        .setDescription('Veritabanındaki keyleri listeler ve seçtiğinizi silmenizi sağlar.')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        await interaction.deferReply({ ephemeral: true });
        
        try {
            const UserModel = mongoose.models.User || mongoose.model('User');
            const keys = await UserModel.find().sort({ _id: -1 }).limit(25);
            
            if (keys.length === 0) {
                return interaction.editReply({ content: '📭 Veritabanında silinecek hiçbir key bulunmuyor.' });
            }

            const options = keys.map((key, index) => {
                const labelText = `${index + 1}. ${key.username || 'İsimsiz'} - ${key.plan ? key.plan.toUpperCase() : 'FREE'}`;
                const descText = `ID: ${key.keyId || 'Yok'} | Şifre: ${key.password || 'Yok'}`;
                
                return {
                    label: labelText.substring(0, 100),
                    description: descText.substring(0, 100),
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
                .setDescription('Aşağıdaki menüyü kullanarak veritabanından silmek istediğiniz lisansı seçin.');

            const response = await interaction.editReply({ embeds: [embed], components: [row] });

            const collector = response.createMessageComponentCollector({ 
                componentType: ComponentType.StringSelect, 
                time: 60000,
                filter: i => i.user.id === interaction.user.id
            });

            collector.on('collect', async i => {
                if (i.customId === 'select_key_to_delete') {
                    const selectedMongoId = i.values[0];
                    const deletedUser = await UserModel.findByIdAndDelete(selectedMongoId);
                    
                    if (deletedUser) {
                        const successEmbed = new EmbedBuilder()
                            .setColor('#00FF00')
                            .setTitle('✅ Başarıyla Silindi!')
                            .setDescription(`🆔 **Key ID:** \`${deletedUser.keyId || 'Yok'}\`\n👤 **Kullanıcı:** \`${deletedUser.username}\``);
                        
                        await i.update({ embeds: [successEmbed], components: [] });
                    } else {
                        await i.update({ content: '❌ Key bulunamadı veya zaten silinmiş.', embeds: [], components: [] });
                    }
                }
            });
        } catch (error) {
            console.error("Key silme hatası:", error);
            await interaction.editReply({ content: `❌ Veritabanı hatası oluştu! Detay: \`${error.message}\`` });
        }
    }
};