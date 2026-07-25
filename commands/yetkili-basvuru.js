const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('yetkili-basvuru')
        .setDescription('Yetkili başvuru panelini kurar (Türkçe).')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        await interaction.deferReply({ ephemeral: true });

        const embed = new EmbedBuilder()
            .setColor('#2B2D31')
            .setTitle('🛡️ Luas Yetkili Başvuru Sistemi')
            .setDescription('Sunucumuzda ekibimize katılarak bize destek olmak ve yetkili olmak istiyorsan aşağıdaki **"Başvuru Yap"** butonuna tıklayarak formu doldurabilirsin.\n\nLütfen dürüst ve açıklayıcı yanıtlar ver.')
            .setImage('https://i.ibb.co/CKBR0hxp/Luas-Staff.png') // Luas Staff görseli
            .setFooter({ text: 'Luas • Yetkili Başvuru Sistemi', iconURL: interaction.guild.iconURL() });

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('open_staff_modal_tr')
                .setLabel('🛡️ Başvuru Yap')
                .setStyle(ButtonStyle.Success)
        );

        await interaction.channel.send({ embeds: [embed], components: [row] });
        await interaction.editReply({ content: '✅ **Yetkili başvuru paneli başarıyla kuruldu!**' });
    }
};