const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits, ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ozel-key')
        .setDescription('Ozel/Premium key olusturma paneli kurar.')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        await interaction.deferReply({ ephemeral: true });

        const embed = new EmbedBuilder()
            .setColor('#FFD700')
            .setTitle('LUAPREMIUM • OZEL KEY OLUSTURMA PANELI')
            .setDescription('Asagidaki butona tiklayarak acilan formdan isim, key ve sure belirleyip ozel key olusturabilirsin.')
            .setThumbnail(interaction.guild.iconURL({ dynamic: true }))
            .setFooter({ text: `${interaction.guild.name} • Ozel Lisans Sistemi` });

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('open_custom_modal').setLabel('Ozel Key Olustur (Form)').setStyle(ButtonStyle.Success)
        );

        await interaction.channel.send({ embeds: [embed], components: [row] });
        await interaction.editReply({ content: 'Ozel key paneli basariyla kuruldu.' });
    },

    async handleButton(interaction) {
        if (interaction.customId !== 'open_custom_modal') return;

        const modal = new ModalBuilder()
            .setCustomId('customKeyModal')
            .setTitle('Ozel Key Tanimlama Formu');

        const usernameInput = new TextInputBuilder()
            .setCustomId('usernameInput')
            .setLabel('Kullanici Adi')
            .setPlaceholder('Orn: luas')
            .setValue('luas')
            .setStyle(TextInputStyle.Short)
            .setRequired(true);

        const keyInput = new TextInputBuilder()
            .setCustomId('keyInput')
            .setLabel('Key (Sifre)')
            .setPlaceholder('Orn: Luas-OzelKey123')
            .setStyle(TextInputStyle.Short)
            .setRequired(true);

            const durationInput = new TextInputBuilder()
            .setCustomId('durationInput')
            .setLabel('Sure (Orn: 30 Gun / Lifetime)')
            .setPlaceholder('30 Gun')
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