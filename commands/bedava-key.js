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
            .setImage('https://i.imgur.com/Line.png') // İsteğe bağlı şık bir çizgi eklenebilir
            .setThumbnail(interaction.guild.iconURL({ dynamic: true }))
            .setFooter({ text: `${interaction.guild.name} • Otomatik Teslimat Sistemi`, iconURL: interaction.guild.iconURL() });

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

            const uniqueKeyId = "KID-FREE-" + Math.random().toString(36).substring(2, 8).toUpperCase();
            const password = "Luas-" + Math.random().toString(36).substring(2, 8);
            
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
                .setTitle("🎉 Ücretsiz Keyin Hazır!")
                .setDescription("Luas Free sürümüne erişmek için aşağıdaki bilgileri kullanabilirsin. Lütfen bu bilgileri kimseyle paylaşma.\n\n" +
                                `🆔 **Key ID:** \`${uniqueKeyId}\`\n` +
                                `👤 **Kullanıcı Adı:** \`luas\`\n` +
                                `🔑 **Key:** \`${password}\`\n\n` +
                                "⚠️ *Hesabın ilk girdiğin bilgisayara (HWID) kilitlenecektir.*")
                .setColor('#00FF00')
                .setFooter({ text: 'Luas License System' })
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