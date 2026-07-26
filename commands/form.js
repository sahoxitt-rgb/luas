const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('form')
        .setDescription('Script tanıtım formu oluşturur (Türkçe).')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addStringOption(option => option.setName('isim').setDescription('Scriptin adını yazın.').setRequired(true))
        .addAttachmentOption(option => option.setName('foto').setDescription('Scriptin fotoğrafını bilgisayardan/galeriden seçin.').setRequired(true))
        .addStringOption(option => option.setName('ozellikler').setDescription('Özellikleri VİRGÜL (,) ile ayırarak yazın (Örn: Aimbot, ESP, Skeleton).').setRequired(true))
        .addStringOption(option => option.setName('loadstring').setDescription('Scriptin kodunu (Loadstring) buraya yapıştırın.').setRequired(true)),

    async execute(interaction) {
        const isim = interaction.options.getString('isim');
        const foto = interaction.options.getAttachment('foto'); // Dosyadan seçilen fotoğrafı yakaladık
        const ozelliklerRaw = interaction.options.getString('ozellikler');
        const loadstring = interaction.options.getString('loadstring');

        // Özellikleri virgüllerden bölüp temizliyoruz
        const ozelliklerDizi = ozelliklerRaw.split(',').map(o => o.trim()).filter(o => o.length > 0);

        // İki kolonlu (Yan yana) listeleme algoritması
        const solSutun = [];
        const sagSutun = [];
        for (let i = 0; i < ozelliklerDizi.length; i++) {
            // Şık görünmesi için alıntı ve kalın punto ekledik
            if (i % 2 === 0) solSutun.push(`> ✦ **${ozelliklerDizi[i]}**`);
            else sagSutun.push(`> ✦ **${ozelliklerDizi[i]}**`);
        }

        const embed = new EmbedBuilder()
            .setColor('#2b2d31') // Discord'un karanlık temasına çok iyi giden premium füme renk
            .setTitle(`🚀 ${isim}`)
            .setImage(foto.url) // Yüklenen fotoğrafın URL'sini embed'e basıyoruz
            .setFooter({ text: 'Luas • Script Tanıtım Sistemi', iconURL: interaction.guild.iconURL() })
            .setTimestamp();

        // Yan yana sütunları embed'e ekleme (\u200B görünmez karakterdir, iki sütunun birleşik durmasını sağlar)
        if (solSutun.length > 0) embed.addFields({ name: '✨ ÖZELLİKLER', value: solSutun.join('\n\n'), inline: true });
        if (sagSutun.length > 0) embed.addFields({ name: '\u200B', value: sagSutun.join('\n\n'), inline: true });

        // Loadstring Bloğunu ekleme
        embed.addFields({ name: '📜 SCRIPT KODU (Loadstring)', value: `\`\`\`lua\n${loadstring}\n\`\`\``, inline: false });

        await interaction.reply({ embeds: [embed] });
    }
};