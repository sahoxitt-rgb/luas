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
            .setTitle('🟢 LUAS • ÜCRETSİZ ERİŞİM PANELİ')
            .setDescription('Aşağıdaki butona tıklayarak ücretsiz versiyon için anında key alabilirsin.\n\n✨ **Özellikler:**\n• Temel özelliklere erişim\n• Reklamlı sürüm\n• Sınırsız kullanım süresi')
            .setImage('https://i.imgur.com/Line.png') // Kırmızı logolu veya mor arkaplanlı resmin linkini buraya koyabilirsin
            .setThumbnail(interaction.guild.iconURL({ dynamic: true }))
            .setFooter({ text: 'Luas • Otomatik Teslimat Sistemi', iconURL: interaction.guild.iconURL() });

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('get_free_key')
                .setLabel('🎁 Ücretsiz Key Al')
                .setStyle(ButtonStyle.Success)
        );

        await interaction.channel.send({ embeds: [embed], components: [row] });
        await interaction.editReply({ content: '✅ Ücretsiz key paneli kanala kuruldu.' });
    },

    async handleButton(interaction, UserModel) {
        if (interaction.customId !== 'get_free_key') return;
        await interaction.deferReply({ ephemeral: true });

        try {
            let existingUser = await UserModel.findOne({ discordId: interaction.user.id, plan: 'free' });
            if (existingUser) {
                return interaction.editReply({ content: `⚠️ **Zaten aktif bir ücretsiz keyin bulunuyor!**\n\n🆔 **Key ID:** \`${existingUser.keyId}\`\n👤 **Kullanıcı Adı:** \`${existingUser.username}\`\n🔑 **Key:** \`${existingUser.password}\`` });
            }

            // LUAS-FREE-XXXXXX Formatında (6 Rastgele Harf)
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

            // === LOG SİSTEMİ ===
            const logChannelId = process.env.LOG_CHANNEL_ID;
            if (logChannelId) {
                const logChannel = interaction.client.channels.cache.get(logChannelId);
                if (logChannel) {
                    const logEmbed = new EmbedBuilder()
                        .setColor('#2B2D31')
                        .setTitle('Free Key Oluşturuldu')
                        .setDescription(`🗝️ **Free Key -->** \`${password}\`\n🆔 **Free Key ID -->** \`${uniqueKeyId}\`\n🪄 **Free Key'i Oluşturan Kişi -->** <@${interaction.user.id}>\n👑 **Free Key Sahibi -->** <@${interaction.user.id}>\n📝 **Free Key'in Oluşturulma Sebebi -->** Free Key\n⏰ **Free Key'in Oluşturulma Zamanı -->** <t:${Math.floor(Date.now() / 1000)}:F>\n⏱️ **Free Key'in Bitiş Zamanı -->** \`Sınırsız\`\n\n❗️ **Dikkat!!** \`KEY TEK KULLANIMLIKTIR KİMSE İLE PAYLAŞMAYIN\``);
                    await logChannel.send({ embeds: [logEmbed] }).catch(() => {});
                }
            }

            const dmEmbed = new EmbedBuilder()
                .setTitle("🎉 Ücretsiz Keyin Hazır!")
                .setDescription("Luas Free sürümüne erişmek için aşağıdaki bilgileri kullanabilirsin. Lütfen bu bilgileri kimseyle paylaşma.\n\n" +
                                `🆔 **Key ID:** \`${uniqueKeyId}\`\n` +
                                `👤 **Kullanıcı Adı:** \`luas\`\n` +
                                `🔑 **Key:** \`${password}\`\n\n` +
                                "⚠️ *Hesabın ilk girdiğin bilgisayara (HWID) kilitlenecektir.*")
                .setColor('#00FF00')
                .setFooter({ text: 'Luas • Otomatik Teslimat Sistemi' })
                .setTimestamp();

            try {
                await interaction.user.send({ embeds: [dmEmbed] });
                await interaction.editReply({ content: "✅ Key başarıyla oluşturuldu! Lütfen **DM kutunu** kontrol et." });
            } catch (e) {
                await interaction.editReply({ content: `✅ Key oluşturuldu ancak DM kutun kapalı olduğu için buradan iletiyorum:\n\n🆔 **Key ID:** \`${uniqueKeyId}\`\n👤 **Kullanıcı Adı:** \`luas\`\n🔑 **Key:** \`${password}\`` });
            }
        } catch (err) {
            console.error(err);
            await interaction.editReply({ content: "❌ Bir hata oluştu." });
        }
    }
};