const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ticket-kur')
        .setDescription('Destek bileti (Ticket) oluşturma panelini kurar.')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        await interaction.deferReply({ ephemeral: true });

        const embed = new EmbedBuilder()
            .setColor('#2B2D31')
            .setTitle('🎫 Destek Sistemi / Support System')
            .setDescription('Bizimle iletişime geçmek için aşağıdaki menüden ilgili kategoriyi seçerek bilet oluşturabilirsiniz.\n\nLütfen gereksiz yere bilet açmayınız, aksi takdirde ceza alabilirsiniz.')
            .setImage('https://i.ibb.co/Q4hNKq4/Luas-Ticket.png') // Yeni Ticket Resim Linki (Tam Kaplayan)
            .setFooter({ text: 'Luas • Destek Sistemi', iconURL: interaction.guild.iconURL() });

        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId('ticket_select')
            .setPlaceholder('🎫 Lütfen bir bilet kategorisi seçin...')
            .addOptions(
                new StringSelectMenuOptionBuilder().setLabel('Satın Alım').setValue('satin_alim').setEmoji('🛒').setDescription('Satın alım öncesi ve sonrası işlemler.'),
                new StringSelectMenuOptionBuilder().setLabel('Destek').setValue('destek').setEmoji('🛠️').setDescription('Teknik destek ve oyun içi yardımlar.'),
                new StringSelectMenuOptionBuilder().setLabel('İş Birliği').setValue('is_birligi').setEmoji('🤝').setDescription('Sponsorluk, reklam ve iş birliği teklifleri.')
            );

        const row = new ActionRowBuilder().addComponents(selectMenu);

        await interaction.channel.send({ embeds: [embed], components: [row] });
        await interaction.editReply({ content: '✅ **Ticket paneli başarıyla kuruldu!**' });
    }
};