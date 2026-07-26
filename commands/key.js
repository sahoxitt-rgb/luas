const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('key')
        .setDescription('Script keyi almak için rehberi gösterir. / Shows key guide.'),

    async execute(interaction) {
        const embed = new EmbedBuilder()
            .setColor('#FFD700')
            .setTitle('🔑 Luas Key Sistemi | Luas Key System')
            .setDescription(
                `🇹🇷 **Merhaba <@${interaction.user.id}>,**\n` +
                `Scripti kullanabilmek için key almanız gerekiyor. Öncelikle aşağıdaki sunucu kanalına gidin, key oluşturun ve scripte giriş yapın. İyi kullanımlar!\n` +
                `👉 **Key Alma Kanalı:** <#1531003000154488952>\n\n` +
                `───────────────\n\n` +
                `🇬🇧 **Hello <@${interaction.user.id}>,**\n` +
                `You need to get a key to use the script. First, go to the server channel below, generate your key, and log in to the script. Enjoy!\n` +
                `👉 **Key Channel:** <#1530996048254734499>`
            )
            .setThumbnail(interaction.user.displayAvatarURL({ dynamic: true }))
            .setFooter({ text: 'Luas • Key Sistemi', iconURL: interaction.guild.iconURL() })
            .setTimestamp();

        // Sadece komutu yazan kişinin göreceği şekilde (görsel kirlilik yapmaması için) yanıtlar
        await interaction.reply({ embeds: [embed] });
    }
};