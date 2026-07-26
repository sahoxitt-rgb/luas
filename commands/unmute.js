const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('unmute')
        .setDescription('Susturulan (Timeout yiyen) kullanıcının cezasını kaldırır.')
        .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
        .addUserOption(option => option.setName('kullanici').setDescription('Cezası kaldırılacak kullanıcıyı seçin').setRequired(true)),
        
    async execute(interaction) {
        const target = interaction.options.getMember('kullanici');
        
        if (!target) return interaction.reply({ content: '❌ Kullanıcı bulunamadı.', ephemeral: true });
        if (!target.moderatable) return interaction.reply({ content: '❌ Bu kullanıcının cezasını kaldırmaya yetkim yok!', ephemeral: true });
        
        // Adam zaten susturulmamışsa hata ver
        if (!target.isCommunicationDisabled()) {
            return interaction.reply({ content: '⚠️ Bu kullanıcı zaten susturulmamış durumda!', ephemeral: true });
        }

        // Timeout'u sıfırlıyoruz (Kaldırıyoruz)
        await target.timeout(null);
        
        const embed = new EmbedBuilder()
            .setColor('#00FF00')
            .setDescription(`🔊 <@${target.user.id}> kullanıcısının **susturması kaldırıldı!** Artık konuşabilir.`);
            
        await interaction.reply({ embeds: [embed] });
    }
};