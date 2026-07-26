const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('kick')
        .setDescription('Belirtilen kullanıcıyı sunucudan atar (Kick).')
        .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers)
        .addUserOption(option => option.setName('kullanici').setDescription('Atılacak kullanıcıyı seçin').setRequired(true))
        .addStringOption(option => option.setName('sebep').setDescription('Kullanıcıyı neden atıyorsun?').setRequired(false)),
        
    async execute(interaction) {
        const target = interaction.options.getMember('kullanici');
        const reason = interaction.options.getString('sebep') || 'Sebep belirtilmedi.';
        
        if (!target) return interaction.reply({ content: '❌ Kullanıcı bulunamadı veya sunucuda değil.', ephemeral: true });
        if (!target.kickable) return interaction.reply({ content: '❌ Bu kullanıcının yetkisi benden yüksek, onu atamam!', ephemeral: true });

        await target.kick(reason);
        
        const embed = new EmbedBuilder()
            .setColor('#FF8C00')
            .setDescription(`👢 <@${target.user.id}> (\`${target.user.tag}\`) **sunucudan atıldı!**\n\n📝 **Sebep:** \`${reason}\``);
            
        await interaction.reply({ embeds: [embed] });
    }
};