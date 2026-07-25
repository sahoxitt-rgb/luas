const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('subscriber-ss-kur')
        .setDescription('Subscriber SS panel (English).')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        const embed = new EmbedBuilder()
            .setColor('#2B2D31')
            .setTitle('📸 YouTube Subscriber Verification')
            .setDescription('Upload a full-screen screenshot showing you are subscribed to **@LuaSscript** here!\n\n🤖 **Our AI System** will analyze the image in seconds and give you the role automatically.\n\n❗️ *Sending text or irrelevant images in this channel is strictly forbidden.*')
            .setImage('https://i.ibb.co/904c20/image-904c20.png')
            .setFooter({ text: 'Luas • AI Subscriber System' });

        await interaction.channel.send({ embeds: [embed] });
        await interaction.reply({ content: '✅ Setup successful.', ephemeral: true });
    }
};