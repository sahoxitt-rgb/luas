const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('bedava-key')
        .setDescription('Ucretsiz key paneli kurar.')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        await interaction.deferReply({ ephemeral: true });

        const embed = new EmbedBuilder()
            .setColor('#2B2D31')
            .setTitle('LUAPREMIUM • UCRETSIZ KEY PANELI')
            .setDescription('Asagidaki butona basarak ucretsiz keyini hemen alabilirsin.')
            .setThumbnail(interaction.guild.iconURL({ dynamic: true }))
            .setFooter({ text: `${interaction.guild.name} • Guvenli Lisans Sistemi` });

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('get_free_key').setLabel('Ucretsiz Key Al').setStyle(ButtonStyle.Primary)
        );

        await interaction.channel.send({ embeds: [embed], components: [row] });
        await interaction.editReply({ content: 'Ucretsiz key paneli kanala kuruldu.' });
    },

    async handleButton(interaction, UserModel) {
        if (interaction.customId !== 'get_free_key') return;
        await interaction.deferReply({ ephemeral: true });

        try {
            // Kullanicinin zaten bir ucretsiz keyi var mi kontrol et
            let existingUser = await UserModel.findOne({ discordId: interaction.user.id, plan: 'free' });
            if (existingUser) {
                return interaction.editReply({ content: `Zaten aktif bir ucretsiz keyin bulunuyor!\nKullanici Adi: \`${existingUser.username}\`\nKey: \`${existingUser.password}\`` });
            }

            const password = "Luas-" + Math.random().toString(36).substring(2, 8);
            const newUser = new UserModel({
                username: "luas",
                password: password,
                plan: "free",
                duration: "Sinirsiz",
                discordId: interaction.user.id
            });
            await newUser.save();

            const dmEmbed = new EmbedBuilder()
                .setTitle("Ucretsiz Key'in Olusturuldu")
                .setDescription(`Kullanici Adi: \`luas\`\nKey: \`${password}\``)
                .setColor(0x00A0FF);

            try {
                await interaction.user.send({ embeds: [dmEmbed] });
                await interaction.editReply({ content: "Key'in basariyla olusturuldu ve DM kutuna gonderildi." });
            } catch (e) {
                await interaction.editReply({ content: `Key olusturuldu ancak DM kutun kapali:\n\`luas\` / \`${password}\`` });
            }
        } catch (err) {
            console.error(err);
            await interaction.editReply({ content: "Bir hata olustu." });
        }
    }
};