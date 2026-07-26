const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits } = require('discord.js');
const mongoose = require('mongoose');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('abone-ss-kur')
        .setDescription('Abone SS atma panelini kurar ve bu kanalı sisteme kaydeder.')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        // Kanalı Veritabanına Kaydetme
        const ConfigModel = mongoose.model('Config');
        let config = await ConfigModel.findOne({ id: "config" });
        if (!config) config = new ConfigModel({ id: "config" });
        
        config.tr_ss_channel = interaction.channel.id;
        await config.save();

        const embed = new EmbedBuilder()
            .setColor('#FF0000') // YouTube Kırmızısı
            .setTitle('📸 YouTube Abone Onay Sistemi')
            .setURL('https://www.youtube.com/@LuaSscript')
            .setDescription(
                `Aşağıdaki butona tıklayarak **@LuaSscript** YouTube kanalına git, abone ol ve abone olduğunu gösteren tam ekran bir fotoğrafı (SS) bu kanala yükle!\n\n` +
                `🤖 **Yapay Zeka Sistemimiz** gönderdiğin fotoğrafı saniyeler içinde analiz edip onaylarsa otomatik olarak rolünü verecektir.\n\n` +
                `❗️ *Bu kanala fotoğraf dışında yazı yazmak, sohbet etmek veya alakasız şeyler atmak kesinlikle yasaktır.*`
            )
            .setImage('https://i.ibb.co/904c20/image-904c20.png') // Örnek Resim
            .setThumbnail('https://upload.wikimedia.org/wikipedia/commons/thumb/0/09/YouTube_full-color_icon_%282017%29.svg/1024px-YouTube_full-color_icon_%282017%29.svg.png') // YouTube Logosu
            .setFooter({ text: 'Luas • Yapay Zeka Abone Sistemi', iconURL: interaction.guild.iconURL() });

        // Tıklanabilir YouTube Butonu
        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setLabel('YouTube Kanalına Git')
                .setStyle(ButtonStyle.Link)
                .setURL('https://www.youtube.com/@LuaSscript')
                .setEmoji('▶️') // YouTube Oynat İkonu
        );

        await interaction.channel.send({ embeds: [embed], components: [row] });
        await interaction.reply({ content: '✅ **Kurulum başarılı! Artık bu kanal Türkçe SS kanalı olarak ayarlandı.**', ephemeral: true });
    }
};