const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('script-onerici')
        .setDescription('Script öneri panelini kurar (Türkçe).')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        await interaction.deferReply({ ephemeral: true });

        const embed = new EmbedBuilder()
            .setColor('#2B2D31')
            .setTitle('💡 Script Öneri Sistemi')
            .setDescription('Sunucumuzda görmek istediğiniz scriptleri, oyunları ve özellikleri aşağıdaki butona tıklayarak bize bildirebilirsiniz.\n\nEkibimiz önerilerinizi inceleyip değerlendirecektir.')
            .setImage('https://i.ibb.co/jk1kcWDw/Luas-Suggestion.png') // Yeni Öneri Görseli Eklendi
            .setFooter({ text: 'Luas • Öneri Sistemi', iconURL: interaction.guild.iconURL() });

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('open_suggestion_modal_tr')
                .setLabel('💡 Script Öner')
                .setStyle(ButtonStyle.Success)
        );

        await interaction.channel.send({ embeds: [embed], components: [row] });
        await interaction.editReply({ content: '✅ **Script öneri paneli yeni görseliyle başarıyla kuruldu!**' });
    }
};