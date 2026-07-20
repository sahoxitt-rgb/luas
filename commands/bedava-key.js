const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('bedava-key')
        .setDescription('Oklar ve emojilerle süslenmiş şık ücretsiz key paneli kurar.')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        const embed = new EmbedBuilder()
            .setColor('#2B2D31')
            .setTitle('🚀 LUAPREMIUM • ÜCRETSİZ KEY PANELİ')
            .setDescription(
                '> 🎯 **Aşağıdaki butona basarak HWID kilitli ücretsiz keyini hemen alabilirsin!**\n\n' +
                '➔ **Sistem İşleyişi:**\n' +
                '   > 🔹 Butona tıkladığın anda sistem sana özel bir key oluşturur.\n' +
                '   > 🔹 Key ve **Key ID** bilgin doğrudan **DM (Özel Mesaj)** kutuna gönderilir.\n' +
                '   > 🔹 Key, giriş yaptığın ilk bilgisayara (HWID) güvenle kilitlenir.\n\n' +
                '⚠️ *Not: Botun sana mesaj atabilmesi için DM kutunun açık olması gerekir.*'
            )
            .setThumbnail(interaction.guild.iconURL({ dynamic: true }))
            .setFooter({ text: `${interaction.guild.name} • Güvenli Lisans Sistemi`, iconURL: interaction.client.user.displayAvatarURL() });

        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('get_free_key')
                    .setLabel('🎫 Hemen Ücretsiz Key Al')
                    .setStyle(ButtonStyle.Success) // Yeşil şık buton
            );

        await interaction.reply({ content: '✅ Şık key paneli kanala başarıyla kuruldu!', ephemeral: true });
        await interaction.channel.send({ embeds: [embed], components: [row] });
    }
};