const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const mongoose = require('mongoose');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('sayi-sayma-kur')
        .setDescription('Bulunduğunuz kanalı Türkçe Sayı Sayma kanalı olarak ayarlar.')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction, UserModel, TicketModel, ConfigModel, CountingModel) {
        let countData = await CountingModel.findOne({ guildId: interaction.guild.id, language: 'tr' });
        
        if (!countData) {
            countData = new CountingModel({
                guildId: interaction.guild.id,
                channelId: interaction.channel.id,
                language: 'tr',
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
            .setTitle('🔢 Sayı Sayma Kanalı Kuruldu!')
            .setDescription('Bu kanal **Türkçe** sayı sayma kanalı olarak ayarlandı.\n\nKurallar:\n1️⃣ `1` den başlayarak sırayla saymalısınız.\n2️⃣ Art arda iki sayı yazamazsınız.\n3️⃣ Yanlış yazan **5 saniye susturulur** ve sayım başa döner.')
            .setFooter({ text: 'Luas • Eğlence Sistemi' });

        await interaction.reply({ embeds: [embed] });
    }
};