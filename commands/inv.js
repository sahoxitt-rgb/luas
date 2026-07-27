const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'inv',
    description: 'Envanterini ve profilini gösterir.',
    async executeText(message, args, UserModel, TicketModel, ConfigModel, CountingModel, OwoModel) {
        let userOwo = await OwoModel.findOne({ userId: message.author.id });
        if (!userOwo) userOwo = new OwoModel({ userId: message.author.id });

        const itemCounts = userOwo.inventory.reduce((acc, item) => {
            acc[item] = (acc[item] || 0) + 1;
            return acc;
        }, {});

        const invText = Object.keys(itemCounts).length > 0 
            ? Object.entries(itemCounts).map(([item, count]) => `> **${item}**: ${count} adet`).join('\n')
            : "> *Envanterin bomboş, biraz madene in!*";

        const invEmbed = new EmbedBuilder()
            .setColor('#FF00FF')
            .setTitle(`🎒 ${message.author.username} - Profil ve Envanter`)
            .addFields(
                { name: '🪙 Luas Coins', value: `\`${userOwo.coins}\``, inline: true },
                { name: '🙏 Pray Puanı', value: `\`${userOwo.pray}\``, inline: true },
                { name: '📦 Eşyalar', value: invText, inline: false }
            )
            .setThumbnail(message.author.displayAvatarURL({ dynamic: true }))
            .setTimestamp();

        return message.reply({ embeds: [invEmbed] });
    }
};