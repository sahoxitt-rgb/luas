const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('unban')
        .setDescription('ID\'si belirtilen kullanıcının yasağını kaldırır.')
        .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
        .addStringOption(option => option.setName('id').setDescription('Yasağı kaldırılacak kullanıcının ID numarasını girin').setRequired(true)),
        
    async execute(interaction) {
        const targetId = interaction.options.getString('id');
        
        try {
            await interaction.guild.members.unban(targetId);
            const embed = new EmbedBuilder()
                .setColor('#00FF00')
                .setDescription(`✅ <@${targetId}> (\`${targetId}\`) **ID'li kullanıcının yasağı başarıyla kaldırıldı!** Artık sunucuya girebilir.`);
            await interaction.reply({ embeds: [embed] });
        } catch (e) {
            await interaction.reply({ content: '❌ Bu ID\'ye sahip yasaklı bir kullanıcı bulunamadı!', ephemeral: true });
        }
    }
};