const { SlashCommandBuilder, EmbedBuilder, ChannelType } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('sunucu-bilgi')
        .setDescription('Sunucunun detaylı istatistiklerini gösterir.'),

    async execute(interaction) {
        const guild = interaction.guild;

        // Kanal sayılarını hesaplama
        const textChannels = guild.channels.cache.filter(c => c.type === ChannelType.GuildText).size;
        const voiceChannels = guild.channels.cache.filter(c => c.type === ChannelType.GuildVoice).size;
        const categoryChannels = guild.channels.cache.filter(c => c.type === ChannelType.GuildCategory).size;
        const totalChannels = guild.channels.cache.size;

        const embed = new EmbedBuilder()
            .setColor('#2B2D31')
            .setTitle(`⚡ | ${guild.name} | Sunucu Bilgileri`)
            .setDescription(
                `👑 **Sunucu Sahibi -->** <@${guild.ownerId}>\n` +
                `🆔 **Sunucu ID -->** \`${guild.id}\`\n` +
                `📅 **Oluşturulma Tarihi -->** <t:${Math.floor(guild.createdTimestamp / 1000)}:d> (<t:${Math.floor(guild.createdTimestamp / 1000)}:R>)\n\n` +
                `📜 **Kanal Sayısı [${totalChannels}] -->** \`${textChannels} Yazı | ${voiceChannels} Ses | ${categoryChannels} Kategori\`\n` +
                `👥 **Üye Sayısı -->** \`${guild.memberCount}\`\n` +
                `🎉 **Rol Sayısı -->** \`${guild.roles.cache.size}\`\n` +
                `💎 **Boost Sayısı -->** \`${guild.premiumSubscriptionCount || 0}\``
            )
            .setThumbnail(guild.iconURL({ dynamic: true, size: 1024 }))
            .setFooter({ text: `Luas • Sunucu Bilgi`, iconURL: guild.iconURL() })
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    }
};