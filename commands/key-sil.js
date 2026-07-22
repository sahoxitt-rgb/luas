const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, ComponentType, PermissionFlagsBits } = require('discord.js');
const mongoose = require('mongoose');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('key-sil')
        .setDescription('Veritabanındaki keyleri listeler ve seçtiğinizi silmenizi sağlar.')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator), // Sadece yetkililer kullanabilir

    async execute(interaction) {
        // İşlem uzun sürebileceği için botun "Düşünüyor..." yazmasını sağlıyoruz
        await interaction.deferReply({ ephemeral: true });
        
        const UserModel = mongoose.model('User'); // Veritabanı şemasını çekiyoruz
        
        try {
            // Veritabanından en son oluşturulan 25 keyi çekiyoruz.
            // (Discord'un açılır menü sınırı maksimum 25 seçenektir)
            const keys = await UserModel.find().sort({ _id: -1 }).limit(25);
            
            if (keys.length === 0) {
                return interaction.editReply({ content: '📭 Veritabanında silinecek hiçbir key bulunmuyor.' });
            }

            // Çekilen keyleri Select Menu seçeneklerine dönüştürüyoruz
            const options = keys.map((key, index) => {
                return {
                    label: `${index + 1}. ${key.username} - ${key.plan.toUpperCase()}`,
                    description: `ID: ${key.keyId} | Süre: ${key.duration}`,
                    value: key.keyId // Arka planda kullanılacak asıl değer (ID)
                };
            });

            const selectMenu = new StringSelectMenuBuilder()
                .setCustomId('select_key_to_delete')
                .setPlaceholder('🗑️ Silmek istediğiniz keyi seçin...')
                .addOptions(options);

            const row = new ActionRowBuilder().addComponents(selectMenu);

            const embed = new EmbedBuilder()
                .setColor('#FF0000') // Kırmızı tema (Silme işlemi olduğu için)
                .setTitle('🗑️ Luas Key Silme Paneli')
                .setDescription('Aşağıdaki menüyü kullanarak veritabanından tamamen silmek istediğiniz lisansı seçin.\n\n*⚠️ **DİKKAT:** Bu işlem geri alınamaz! Discord sınırları gereği sadece en yeni 25 key listelenmektedir.*')
                .setFooter({ text: 'Luas License System' });

            // Menüyü mesaja gönderiyoruz
            const response = await interaction.editReply({ embeds: [embed], components: [row] });

            // Kullanıcının menüden seçim yapmasını dinleyecek olan sistem (60 saniye bekler)
            const collector = response.createMessageComponentCollector({ 
                componentType: ComponentType.StringSelect, 
                time: 60000, // 60 saniye içinde işlem yapılmazsa iptal olur
                filter: i => i.user.id === interaction.user.id // Sadece komutu yazan tıklayabilir
            });

            collector.on('collect', async i => {
                const selectedKeyId = i.values[0]; // Kullanıcının seçtiği ID
                
                // Seçilen ID'yi veritabanından bul ve sil
                const deletedUser = await UserModel.findOneAndDelete({ keyId: selectedKeyId });
                
                if (deletedUser) {
                    const successEmbed = new EmbedBuilder()
                        .setColor('#00FF00')
                        .setTitle('✅ Başarıyla Silindi!')
                        .setDescription(`Aşağıdaki lisans veritabanından kalıcı olarak kaldırıldı:\n\n` +
                                        `🆔 **Silinen ID:** \`${deletedUser.keyId}\`\n` +
                                        `👤 **Kullanıcı:** \`${deletedUser.username}\`\n` +
                                        `🌟 **Plan:** \`${deletedUser.plan.toUpperCase()}\``);
                    
                    // Menüyü kaldır ve başarı mesajını göster
                    await i.update({ embeds: [successEmbed], components: [] });
                } else {
                    await i.update({ content: '❌ Key silinirken bir hata oluştu veya bu key zaten silinmiş.', embeds: [], components: [] });
                }
            });

            // 60 saniye dolduğunda kimse tıklamadıysa menüyü kilitler
            collector.on('end', collected => {
                if (collected.size === 0) {
                    interaction.editReply({ content: '⏳ İşlem süresi dolduğu için iptal edildi.', embeds: [], components: [] }).catch(() => {});
                }
            });

        } catch (error) {
            console.error(error);
            interaction.editReply({ content: '❌ Veritabanına bağlanırken veya veri çekerken bir hata oluştu!' });
        }
    }
};