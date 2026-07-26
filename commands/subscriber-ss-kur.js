const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
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
            .setColor('#2B2D31')
            .setTitle('📸 YouTube Subscriber Verification')
            .setDescription('Upload a full-screen screenshot showing you are subscribed to **@LuaSscript** here!\n\n🤖 **Our AI System** will analyze the image in seconds and give you the role automatically.\n\n❗️ *Sending text or irrelevant images in this channel is strictly forbidden.*')
            .setImage('https://i.ibb.co/904c20/image-904c20.png')
            .setFooter({ text: 'Luas • AI Subscriber System' });

        await interaction.channel.send({ embeds: [embed] });
        await interaction.reply({ content: '✅ **Setup successful! This channel is now the English SS channel.**', ephemeral: true });
    }
};