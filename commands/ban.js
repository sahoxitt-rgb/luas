const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ban')
        .setDescription('Belirtilen kullanıcıyı sunucudan kalıcı olarak yasaklar (Ban).')
        .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
        .addUserOption(option => option.setName('kullanici').setDescription('Yasaklanacak kullanıcıyı seçin').setRequired(true))
        .addStringOption(option => option.setName('sebep').setDescription('Kullanıcıyı neden yasaklıyorsun?').setRequired(false)),
        
    async execute(interaction) {
        const target = interaction.options.getMember('kullanici') || interaction.options.getUser('kullanici');
        const reason = interaction.options.getString('sebep') || 'Sebep belirtilmedi.';
        
        if (!target) return interaction.reply({ content: '❌ Kullanıcı bulunamadı.', ephemeral: true });
        
        try {
            await interaction.guild.members.ban(target, { reason });
            const embed = new EmbedBuilder()
                .setColor('#FF0000')
                .setDescription(`🔨 <@${target.id}> (\`${target.tag || target.user.tag}\`) **sunucudan kalıcı olarak yasaklandı!**\n\n📝 **Sebep:** \`${reason}\``);
            await interaction.reply({ embeds: [embed] });
        } catch (e) {
            await interaction.reply({ content: '❌ Bu kullanıcıyı yasaklamaya yetkim yok!', ephemeral: true });
        }
    }
};