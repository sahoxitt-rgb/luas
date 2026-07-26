const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits } = require('discord.js');
const mongoose = require('mongoose');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('subscriber-ss-kur')
        .setDescription('Subscriber SS panel (English). Sets this channel in DB.')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        // Kanalı Veritabanına Kaydetme
        const ConfigModel = mongoose.model('Config');
        let config = await ConfigModel.findOne({ id: "config" });
        if (!config) config = new ConfigModel({ id: "config" });
        
        config.en_ss_channel = interaction.channel.id;
        await config.save();

        const embed = new EmbedBuilder()
            .setColor('#FF0000') // YouTube Kırmızısı
            .setTitle('📸 YouTube Subscriber Verification')
            .setURL('https://www.youtube.com/@LuaSscript')
            .setDescription(
                `Click the button below to go to the **@LuaSscript** YouTube channel, subscribe, and upload a full-screen screenshot (SS) here showing your subscription!\n\n` +
                `🤖 **Our AI System** will analyze your image in seconds and automatically assign your role if verified.\n\n` +
                `❗️ *Sending text, chatting, or uploading irrelevant images in this channel is strictly forbidden.*`
            )
            .setImage('https://i.ibb.co/904c20/image-904c20.png') // Örnek Resim
            .setThumbnail('https://upload.wikimedia.org/wikipedia/commons/thumb/0/09/YouTube_full-color_icon_%282017%29.svg/1024px-YouTube_full-color_icon_%282017%29.svg.png') // YouTube Logosu
            .setFooter({ text: 'Luas • AI Subscriber System', iconURL: interaction.guild.iconURL() });

        // Tıklanabilir YouTube Butonu
        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setLabel('Go to YouTube Channel')
                .setStyle(ButtonStyle.Link)
                .setURL('https://www.youtube.com/@LuaSscript')
                .setEmoji('▶️') // YouTube Oynat İkonu
        );

        await interaction.channel.send({ embeds: [embed], components: [row] });
        await interaction.reply({ content: '✅ **Setup successful! This channel is now the English SS channel.**', ephemeral: true });
    }
};