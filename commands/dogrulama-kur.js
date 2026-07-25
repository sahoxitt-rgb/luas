const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('dogrulama-kur')
        .setDescription('Dil seçimi ve doğrulama panelini kurar.')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        // Senin göreceğin onay mesajını gizli yapıyoruz, paneli herkese açık atacağız
        await interaction.deferReply({ ephemeral: true });

        const embed = new EmbedBuilder()
            .setColor('#2B2D31')
            .setTitle('🌍 Sunucuya Hoş Geldiniz / Welcome to the Server')
            .setDescription(
                `🇹🇷 **Türkçe (TR)**\n` +
                `> Sunucuya tam erişim sağlamak ve tüm kanallara ulaşmak için aşağıdaki **🇹🇷 Türkçe (TR)** butonuna tıklayarak doğrulama yapınız.\n\n` +
                `🇬🇧 **English (EN)**\n` +
                `> To gain full access to the server and view all channels, please verify by clicking the **🇬🇧 English (EN)** button below.\n\n` +
                `❗️ \`Bilgi / Info\` __**SEÇTİĞİNİZ DİLE GÖRE KANALLAR AÇILACAKTIR / CHANNELS WILL BE UNLOCKED BASED ON YOUR LANGUAGE**__`
            )
            .setImage('https://i.imgur.com/Line.png') // Araya o şık mor çizgiyi çeker
            .setThumbnail(interaction.guild.iconURL({ dynamic: true }))
            .setFooter({ text: 'Luas • Doğrulama Sistemi / Verification System', iconURL: interaction.guild.iconURL() });

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('verify_tr')
                .setLabel('🇹🇷 Türkçe (TR)')
                .setStyle(ButtonStyle.Danger), // Türk bayrağına uyumlu kırmızı buton
            new ButtonBuilder()
                .setCustomId('verify_en')
                .setLabel('🇬🇧 English (EN)')
                .setStyle(ButtonStyle.Primary) // İngiliz bayrağına uyumlu mavi buton
        );

        // Paneli kanala gönderiyoruz
        await interaction.channel.send({ embeds: [embed], components: [row] });
        
        // Sana onay mesajı atıyoruz
        await interaction.editReply({ content: '✅ **Doğrulama paneli yepyeni ve şık tasarımıyla kanala atıldı!**' });
    }
};