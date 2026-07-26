const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('lock')
        .setDescription('Mevcut kanalı üyelerin mesaj gönderimine kapatır.')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),
        
    async execute(interaction) {
        // @everyone rolünün mesaj atma iznini kapatır
        await interaction.channel.permissionOverwrites.edit(interaction.guild.id, { SendMessages: false });
        
        const embed = new EmbedBuilder()
            .setColor('#FF0000')
            .setDescription('🔒 **Bu kanal yetkililer tarafından kilitlendi!**\nŞu an kimse mesaj gönderemez.');
            
        await interaction.reply({ embeds: [embed] });
    }
};