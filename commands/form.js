const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('form')
        .setDescription('Script tanıtım formu oluşturur (Türkçe).')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addStringOption(option => option.setName('isim').setDescription('Scriptin adını yazın.').setRequired(true))
        .addStringOption(option => option.setName('foto_linki').setDescription('Scriptin fotoğraf URL\'sini (Linkini) yapıştırın.').setRequired(true))
        .addStringOption(option => option.setName('ozellikler').setDescription('Özellikleri aralarına VİRGÜL (,) koyarak yazın.').setRequired(true)),

    async execute(interaction) {
        const isim = interaction.options.getString('isim');
        const foto = interaction.options.getString('foto_linki');
        const ozelliklerRaw = interaction.options.getString('ozellikler');

        // Özellikleri virgüllerden bölüp temizliyoruz
        const ozelliklerDizi = ozelliklerRaw.split(',').map(o => o.trim()).filter(o => o.length > 0);

        // İki kolonlu (Yan yana) listeleme algoritması
        const solSutun = [];
        const sagSutun = [];
        for (let i = 0; i < ozelliklerDizi.length; i++) {
            if (i % 2 === 0) solSutun.push(`✦ ${ozelliklerDizi[i]}`);
            else sagSutun.push(`✦ ${ozelliklerDizi[i]}`);
        }

        const embed = new EmbedBuilder()
            .setColor('#0099FF')
            .setTitle(`🚀 ${isim} - Script Özellikleri`)
            .setImage(foto)
            .setFooter({ text: 'Luas • Script Tanıtım Sistemi', iconURL: interaction.guild.iconURL() })
            .setTimestamp();

        // Yan yana sütunları embed'e ekleme
        if (solSutun.length > 0) embed.addFields({ name: '✨ Özellikler', value: solSutun.join('\n'), inline: true });
        if (sagSutun.length > 0) embed.addFields({ name: '⚡ Ekstra Özellikler', value: sagSutun.join('\n'), inline: true });

        await interaction.reply({ embeds: [embed] });
    }
};