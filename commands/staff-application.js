const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('staff-application')
        .setDescription('Sets up the staff application panel (English).')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        await interaction.deferReply({ ephemeral: true });

        const embed = new EmbedBuilder()
            .setColor('#2B2D31')
            .setTitle('🛡️ Luas Staff Application System')
            .setDescription('If you want to join our team and become a staff member, click the **"Apply Now"** button below to fill out the form.\n\nPlease provide honest and detailed answers.')
            .setImage('https://i.ibb.co/CKBR0hxp/Luas-Staff.png') // Luas Staff görseli
            .setFooter({ text: 'Luas • Staff Application System', iconURL: interaction.guild.iconURL() });

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('open_staff_modal_en')
                .setLabel('🛡️ Apply Now')
                .setStyle(ButtonStyle.Success)
        );

        await interaction.channel.send({ embeds: [embed], components: [row] });
        await interaction.editReply({ content: '✅ **Staff application panel has been successfully set up!**' });
    }
};