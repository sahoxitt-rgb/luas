const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('counting-setup')
        .setDescription('Sets the current channel as the English Counting channel.')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction, UserModel, TicketModel, ConfigModel, CountingModel) {
        let countData = await CountingModel.findOne({ guildId: interaction.guild.id, language: 'en' });
        
        if (!countData) {
            countData = new CountingModel({
                guildId: interaction.guild.id,
                channelId: interaction.channel.id,
                language: 'en',
                currentCount: 0,
                lastUserId: null
            });
        } else {
            countData.channelId = interaction.channel.id;
            countData.currentCount = 0;
            countData.lastUserId = null;
        }
        
        await countData.save();

        const embed = new EmbedBuilder()
            .setColor('#00FF00')
            .setTitle('🔢 Counting Channel Setup!')
            .setDescription('This channel is now set for **English** counting.\n\nRules:\n1️⃣ Start counting from `1` sequentially.\n2️⃣ You cannot count twice in a row.\n3️⃣ If you mess up, you get **muted for 5 seconds** but counting **CONTINUES FROM WHERE IT LEFT OFF.**')
            .setFooter({ text: 'Luas • Entertainment System' });

        await interaction.reply({ embeds: [embed] });
    }
};