const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const mongoose = require('mongoose');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('mevcut-keyler')
        .setDescription('Veritabanındaki tüm keyleri detaylı bir şekilde listeler.')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        await interaction.deferReply({ ephemeral: true });

        const UserModel = mongoose.model('User'); // index.js'deki ana şemayı çekiyoruz
        
        try {
            // Veritabanındaki tüm kullanıcıları (keyleri) çek
            const allKeys = await UserModel.find({});
            const totalKeys = allKeys.length;

            if (totalKeys === 0) {
                return interaction.editReply({ content: '📭 Veritabanında henüz oluşturulmuş hiçbir key bulunmuyor.' });
            }

            let description = `📊 **Sistemdeki Toplam Key Sayısı:** \`${totalKeys}\`\n\n`;
            
            // Discord karakter sınırını (4096) aşmamak için en yeni 15 keyi listeliyoruz
            const displayKeys = allKeys.slice(-15); 

            displayKeys.forEach((key, index) => {
                // HWID Boş mu, dolu mu kontrolü
                const hwidStatus = key.hwid ? 'Kilitli 🔒' : 'Boşta 🟢';
                
                // discordId varsa kişiyi etiketle, yoksa (sistem atamışsa) bilinmiyor yaz
                const creator = key.discordId ? `<@${key.discordId}>` : 'Sistem / Bilinmiyor';
                
                // Gerçek sırasını bul (Örn: 100 key varsa son 15'i 86, 87, 88... diye sayar)
                const realIndex = totalKeys - displayKeys.length + index + 1;

                description += `**#${realIndex}** | 🆔 \`${key.keyId || 'Eski Sistem Keyi'}\`\n`;
                description += `👤 **Kullanıcı:** \`${key.username}\` | 🌟 **Plan:** \`${key.plan.toUpperCase()}\`\n`;
                description += `💻 **HWID:** ${hwidStatus} | 🛠️ **Oluşturan:** ${creator}\n`;
                description += `───────────────\n`;
            });

            if (totalKeys > 15) {
                description += `\n*⚠️ Discord mesaj sınırı nedeniyle sadece en son oluşturulan 15 lisans gösterilmektedir.*`;
            }

            const embed = new EmbedBuilder()
                .setColor('#0099FF')
                .setTitle('📋 Veritabanı Kayıtları (Mevcut Keyler)')
                .setDescription(description)
                .setFooter({ text: 'Luas License System' })
                .setTimestamp();

            await interaction.editReply({ embeds: [embed] });
        } catch (err) {
            console.error(err);
            await interaction.editReply({ content: '❌ Veritabanından veriler çekilirken bir hata oluştu!' });
        }
    }
};