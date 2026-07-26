const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
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
            .setColor('#2B2D31')
            .setTitle('📸 YouTube Abone Onay Sistemi')
            .setDescription('**@LuaSscript** kanalına abone olduğunu gösteren tam ekran bir fotoğrafı (SS) bu kanala yükle!\n\n🤖 **Yapay Zeka Sistemimiz** fotoğrafı saniyeler içinde okuyup otomatik olarak rolünü verecektir.\n\n❗️ *Bu kanala fotoğraf dışında yazı yazmak veya alakasız şeyler atmak yasaktır.*')
            .setImage('https://i.ibb.co/904c20/image-904c20.png')
            .setFooter({ text: 'Luas • Yapay Zeka Abone Sistemi' });

        await interaction.channel.send({ embeds: [embed] });
        await interaction.reply({ content: '✅ **Kurulum başarılı! Artık bu kanal Türkçe SS kanalı olarak ayarlandı.**', ephemeral: true });
    }
};