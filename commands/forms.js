const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('forms')
        .setDescription('Creates a script presentation form (English).')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addStringOption(option => option.setName('name').setDescription('Enter the script name.').setRequired(true))
        .addAttachmentOption(option => option.setName('photo').setDescription('Upload the script photo from your device.').setRequired(true))
        .addStringOption(option => option.setName('features').setDescription('Write features separated by a COMMA (,).').setRequired(true))
        .addStringOption(option => option.setName('loadstring').setDescription('Paste the script loadstring code here.').setRequired(true)),

    async execute(interaction) {
        const isim = interaction.options.getString('name');
        const foto = interaction.options.getAttachment('photo'); // Dosyadan seçilen fotoğrafı yakaladık
        const ozelliklerRaw = interaction.options.getString('features');
        const loadstring = interaction.options.getString('loadstring');

        const ozelliklerDizi = ozelliklerRaw.split(',').map(o => o.trim()).filter(o => o.length > 0);

        const solSutun = [];
        const sagSutun = [];
        for (let i = 0; i < ozelliklerDizi.length; i++) {
            if (i % 2 === 0) solSutun.push(`> ✦ **${ozelliklerDizi[i]}**`);
            else sagSutun.push(`> ✦ **${ozelliklerDizi[i]}**`);
        }

        const embed = new EmbedBuilder()
            .setColor('#2b2d31')
            .setTitle(`🚀 ${isim}`)
            .setImage(foto.url)
            .setFooter({ text: 'Luas • Script Presentation System', iconURL: interaction.guild.iconURL() })
            .setTimestamp();

        if (solSutun.length > 0) embed.addFields({ name: '✨ FEATURES', value: solSutun.join('\n\n'), inline: true });
        if (sagSutun.length > 0) embed.addFields({ name: '\u200B', value: sagSutun.join('\n\n'), inline: true });
        
        embed.addFields({ name: '📜 SCRIPT CODE (Loadstring)', value: `\`\`\`lua\n${loadstring}\n\`\`\``, inline: false });

        await interaction.reply({ embeds: [embed] });
    }
};