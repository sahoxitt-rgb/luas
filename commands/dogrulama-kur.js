const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('dogrulama-kur')
        .setDescription('Dil seçimi ve doğrulama panelini kurar.')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        await interaction.deferReply({ ephemeral: true });

        const embed = new EmbedBuilder()
            .setColor('#2B2D31')
            .setTitle('🌍 Welcome / Hoş Geldiniz')
            .setDescription('**[TR]** Sunucuya erişmek ve kanalları görmek için lütfen dilinizi seçin.\n\n**[EN]** Please select your language to access the server and view channels.')
            .setThumbnail(interaction.guild.iconURL({ dynamic: true }))
            .setFooter({ text: 'Luas • Verification System', iconURL: interaction.guild.iconURL() });

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('verify_tr')
                .setLabel('🇹🇷 Türkçe (TR)')
                .setStyle(ButtonStyle.Secondary),
            new ButtonBuilder()
                .setCustomId('verify_en')
                .setLabel('🇬🇧 English (EN)')
                .setStyle(ButtonStyle.Secondary)
        );

        await interaction.channel.send({ embeds: [embed], components: [row] });
        await interaction.editReply({ content: '✅ **Doğrulama paneli başarıyla kuruldu!**' });
    }
};