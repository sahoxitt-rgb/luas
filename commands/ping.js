const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ping')
        .setDescription('Botun gecikme sürelerini ve aktif çalışma süresini gösterir.'),

    async execute(interaction) {
        const client = interaction.client;
        
        // Gecikme sürelerini hesaplama
        const ping = Date.now() - interaction.createdTimestamp;
        const apiPing = client.ws.ping;

        // Çalışma süresini (Uptime) dinamik Discord zaman damgasına çevirme
        const uptimeTimestamp = Math.floor((Date.now() - client.uptime) / 1000);

        const embed = new EmbedBuilder()
            .setColor('#2B2D31')
            .setTitle('🏓 | Bot Gecikme ve Durum Raporu')
            .setDescription(
                `📡 **Bot Gecikmesi -->** \`${ping}ms\`\n` +
                `🌐 **API Gecikmesi -->** \`${apiPing}ms\`\n` +
                `⏱️ **Çalışma Süresi -->** <t:${uptimeTimestamp}:R>\n` +
                `🟢 **Sistem Durumu -->** \`Stabil ve Kesintisiz\``
            )
            .setThumbnail(client.user.displayAvatarURL({ dynamic: true }))
            .setFooter({ text: 'Luas • Ping Sistemi', iconURL: client.user.displayAvatarURL() })
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    }
};