const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('forms')
        .setDescription('Creates a script presentation form (English).')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addStringOption(option => option.setName('name').setDescription('Enter the script name.').setRequired(true))
        .addStringOption(option => option.setName('photo_url').setDescription('Paste the script photo URL.').setRequired(true))
        .addStringOption(option => option.setName('features').setDescription('Write features separated by a COMMA (,).').setRequired(true)),

    async execute(interaction) {
        const isim = interaction.options.getString('name');
        const foto = interaction.options.getString('photo_url');
        const ozelliklerRaw = interaction.options.getString('features');

        const ozelliklerDizi = ozelliklerRaw.split(',').map(o => o.trim()).filter(o => o.length > 0);

        const solSutun = [];
        const sagSutun = [];
        for (let i = 0; i < ozelliklerDizi.length; i++) {
            if (i % 2 === 0) solSutun.push(`✦ ${ozelliklerDizi[i]}`);
            else sagSutun.push(`✦ ${ozelliklerDizi[i]}`);
        }

        const embed = new EmbedBuilder()
            .setColor('#0099FF')
            .setTitle(`🚀 ${isim} - Script Features`)
            .setImage(foto)
            .setFooter({ text: 'Luas • Script Presentation System', iconURL: interaction.guild.iconURL() })
            .setTimestamp();

        if (solSutun.length > 0) embed.addFields({ name: '✨ Features', value: solSutun.join('\n'), inline: true });
        if (sagSutun.length > 0) embed.addFields({ name: '⚡ Extra Features', value: sagSutun.join('\n'), inline: true });

        await interaction.reply({ embeds: [embed] });
    }
};