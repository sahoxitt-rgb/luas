const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('unlock')
        .setDescription('Kilitli kanalı mesaj gönderimine tekrar açar.')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),
        
    async execute(interaction) {
        // @everyone rolünün mesaj atma iznini varsayılana döndürür
        await interaction.channel.permissionOverwrites.edit(interaction.guild.id, { SendMessages: null });
        
        const embed = new EmbedBuilder()
            .setColor('#00FF00')
            .setDescription('🔓 **Kanalın kilidi açıldı!**\nArtık herkes mesaj gönderebilir.');
            
        await interaction.reply({ embeds: [embed] });
    }
};