const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('bedava-key')
        .setDescription('Ücretsiz key paneli kurar.')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        await interaction.deferReply({ ephemeral: true });

        const embed = new EmbedBuilder()
            .setColor('#2B2D31')
            .setTitle('Ücretsiz Erişim Paneli')
            .setDescription(`🚀 **Sistem** --> \`Luas Free\`\n` +
                            `ID **Erişim Türü** --> \`Herkese Açık\`\n` +
                            `🪄 **Kullanım Süresi** --> \`Sınırsız\`\n` +
                            `👑 **Durum** --> \`Aktif ve Çalışıyor\`\n` +
                            `📝 **Nasıl Alınır?** --> \`Aşağıdaki butona tıkla\`\n` +
                            `⏰ **Panel Kurulum Zamanı** --> <t:${Math.floor(Date.now() / 1000)}:F>\n\n` +
                            `❗️ **Dikkat!!** \`ALACAĞINIZ KEY TEK KULLANIMLIKTIR VE BİLGİSAYARINIZA (HWID) KİLİTLENİR\``)
            .setThumbnail(interaction.guild.iconURL({ dynamic: true }))
            .setFooter({ text: 'Luas • Otomatik Teslimat Sistemi', iconURL: interaction.guild.iconURL() });

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('get_free_key')
                .setLabel('🎁 Ücretsiz Key Al')
                .setStyle(ButtonStyle.Success)
        );

        await interaction.channel.send({ embeds: [embed], components: [row] });
        await interaction.editReply({ content: '✅ **Ücretsiz key paneli yepyeni tasarımıyla kanala atıldı!**' });
    },

    async handleButton(interaction, UserModel) {
        if (interaction.customId !== 'get_free_key') return;
        await interaction.deferReply({ ephemeral: true });

        try {
            let existingUser = await UserModel.findOne({ discordId: interaction.user.id, plan: 'free' });
            if (existingUser) {
                return interaction.editReply({ content: `⚠️ **Zaten aktif bir ücretsiz keyin bulunuyor!**\n\n🆔 **Key ID:** \`${existingUser.keyId}\`\n🔑 **Key:** \`${existingUser.password}\`` });
            }

            const randomLetters = Array.from({length: 6}, () => String.fromCharCode(65 + Math.floor(Math.random() * 26))).join('');
            const password = `LUAS-FREE-${randomLetters}`;
            const uniqueKeyId = Math.floor(100000 + Math.random() * 900000).toString(); 
            
            const newUser = new UserModel({
                username: "luas",
                password: password,
                keyId: uniqueKeyId,
                plan: "free",
                duration: "Sınırsız",
                discordId: interaction.user.id
            });
            await newUser.save();

            const dmEmbed = new EmbedBuilder()
                .setColor('#2B2D31')
                .setTitle('🎉 Ücretsiz Key Oluşturuldu')
                .setDescription(`🚀 **Key -->** \`${password}\`\n` +
                                `ID **Key ID -->** \`${uniqueKeyId}\`\n` +
                                `🪄 **Key'i Oluşturan Kişi -->** <@${interaction.user.id}>\n` +
                                `👑 **Key Sahibi -->** <@${interaction.user.id}>\n` +
                                `📝 **Key'in Oluşturulma Sebebi -->** Ücretsiz Erişim (Free)\n` +
                                `⏰ **Key'in Oluşturulma Zamanı -->** <t:${Math.floor(Date.now() / 1000)}:F>\n` +
                                `⏱️ **Key'in Bitiş Zamanı -->** \`Sınırsız\`\n\n` +
                                `❗️ **Dikkat!!** \`KEY TEK KULLANIMLIKTIR KİMSE İLE PAYLAŞMAYIN\``)
                .setFooter({ text: 'Luas • Otomatik Teslimat Sistemi' })
                .setTimestamp();

            const logChannelId = process.env.LOG_CHANNEL_ID;
            if (logChannelId) {
                const logChannel = interaction.client.channels.cache.get(logChannelId);
                if (logChannel) await logChannel.send({ embeds: [dmEmbed] }).catch(() => {});
            }

            try {
                await interaction.user.send({ embeds: [dmEmbed] });
                await interaction.editReply({ content: "✅ **Key başarıyla oluşturuldu! Lütfen DM kutunu kontrol et.**" });
            } catch (e) {
                await interaction.editReply({ embeds: [dmEmbed] });
            }
        } catch (err) {
            console.error(err);
            await interaction.editReply({ content: "❌ **Bir hata oluştu.**" });
        }
    }
};