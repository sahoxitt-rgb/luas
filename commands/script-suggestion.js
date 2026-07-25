const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('script-suggestion')
        .setDescription('Sets up the script suggestion panel (English).')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        await interaction.deferReply({ ephemeral: true });

        const embed = new EmbedBuilder()
            .setColor('#2B2D31')
            .setTitle('💡 Script Suggestion System')
            .setDescription('You can suggest scripts, games, and features you want to see in our server by clicking the button below.\n\nOur team will review your suggestions.')
            .setImage('https://i.ibb.co/jk1kcWDw/Luas-Suggestion.png') // Yeni Öneri Görseli Eklendi
            .setFooter({ text: 'Luas • Suggestion System', iconURL: interaction.guild.iconURL() });

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('open_suggestion_modal_en')
                .setLabel('💡 Suggest Script')
                .setStyle(ButtonStyle.Success)
        );

        await interaction.channel.send({ embeds: [embed], components: [row] });
        await interaction.editReply({ content: '✅ **Script suggestion panel has been successfully set up with new image!**' });
    }
};