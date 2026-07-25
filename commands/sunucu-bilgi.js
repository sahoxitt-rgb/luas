const { SlashCommandBuilder, EmbedBuilder, version } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('bot-bilgi')
        .setDescription('Botun anlık istatistiklerini ve teknik bilgilerini gösterir.'),

    async execute(interaction) {
        const client = interaction.client;
        
        // RAM kullanımını hesaplama (MB cinsinden)
        const memoryUsage = (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2);

        const embed = new EmbedBuilder()
            .setColor('#2B2D31')
            .setTitle(`🤖 | ${client.user.username} | Bot Bilgileri`)
            .setDescription(
                `👑 **Geliştirici -->** \`Luas Development\`\n` +
                `📡 **Gecikme (Ping) -->** \`${client.ws.ping}ms\`\n` +
                `⏱️ **Çalışma Süresi -->** <t:${Math.floor(client.readyTimestamp / 1000)}:R>\n` +
                `💾 **RAM Kullanımı -->** \`${memoryUsage} MB\`\n` +
                `📚 **Kütüphane -->** \`Discord.js v${version}\`\n` +
                `🟢 **Node.js Sürümü -->** \`${process.version}\``
            )
            .setThumbnail(client.user.displayAvatarURL({ dynamic: true }))
            .setFooter({ text: 'Luas • Bot Bilgi', iconURL: client.user.displayAvatarURL() })
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    }
};