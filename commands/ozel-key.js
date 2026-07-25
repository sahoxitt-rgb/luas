const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits, ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ozel-key')
        .setDescription('Özel/Premium key oluşturma paneli kurar.')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        await interaction.deferReply({ ephemeral: true });

        const embed = new EmbedBuilder()
            .setColor('#FFD700')
            .setTitle('💎 Özel Key Oluşturma Paneli')
            .setDescription(`🚀 **Sistem** --> \`Luas Premium\`\n` +
                            `ID **Erişim Türü** --> \`Yönetici Özel\`\n` +
                            `🪄 **Yetki** --> \`Sadece Yetkililer\`\n` +
                            `👑 **Durum** --> \`Aktif\`\n` +
                            `📝 **Nasıl Oluşturulur?** --> \`Aşağıdaki butona tıkla\`\n` +
                            `⏰ **Panel Kurulum Zamanı** --> <t:${Math.floor(Date.now() / 1000)}:F>\n\n` +
                            `❗️ **Dikkat!!** \`SADECE YETKİLİ KULLANIMI İÇİNDİR\``)
            .setThumbnail(interaction.guild.iconURL({ dynamic: true }))
            .setFooter({ text: `${interaction.guild.name} • Premium Lisans Sistemi` });

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('open_custom_modal')
                .setLabel('🛠️ Formu Aç')
                .setStyle(ButtonStyle.Primary)
        );

        await interaction.channel.send({ embeds: [embed], components: [row] });
        await interaction.editReply({ content: '✅ **Özel key paneli başarıyla kuruldu!**' });
    },

    async handleButton(interaction) {
        if (interaction.customId !== 'open_custom_modal') return;

        const modal = new ModalBuilder()
            .setCustomId('customKeyModal')
            .setTitle('💎 Lisans Tanımlama Formu');

        const usernameInput = new TextInputBuilder()
            .setCustomId('usernameInput')
            .setLabel('Kullanıcı Adı')
            .setPlaceholder('Örn: Noxy')
            .setValue('luas')
            .setStyle(TextInputStyle.Short)
            .setRequired(true);

        const keyInput = new TextInputBuilder()
            .setCustomId('keyInput')
            .setLabel('Key (Şifre)')
            .setPlaceholder('Örn: Luas-Premium2026')
            .setStyle(TextInputStyle.Short)
            .setRequired(true);

        const durationInput = new TextInputBuilder()
            .setCustomId('durationInput')
            .setLabel('Süre (Örn: 30 Gün / Lifetime)')
            .setPlaceholder('Lifetime')
            .setValue('Lifetime')
            .setStyle(TextInputStyle.Short)
            .setRequired(true);

        modal.addComponents(
            new ActionRowBuilder().addComponents(usernameInput),
            new ActionRowBuilder().addComponents(keyInput),
            new ActionRowBuilder().addComponents(durationInput)
        );

        await interaction.showModal(modal);
    }
};