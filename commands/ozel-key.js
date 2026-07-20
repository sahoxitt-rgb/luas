const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const KeyModel = require('../models/Key');
const crypto = require('crypto');

module.exports = {
    // Discord açılır menüsünde görünecek ayarlar
    data: new SlashCommandBuilder()
        .setName('ozel-key')
        .setDescription('Premium hesap ve key oluşturur.')
        // Sadece Yönetici (Administrator) yetkisi olanlar görebilir/kullanabilir
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        // 1. Kutucuk: Kullanıcı Adı
        .addStringOption(option => 
            option.setName('kullanici_adi')
                .setDescription('Oluşturulacak hesabın kullanıcı adını girin.')
                .setRequired(true))
        // 2. Kutucuk: Şifre
        .addStringOption(option => 
            option.setName('sifre')
                .setDescription('Oluşturulacak hesabın şifresini girin.')
                .setRequired(true)),

    async execute(interaction) {
        // Kullanıcının kutucuklara yazdığı verileri çekiyoruz
        const username = interaction.options.getString('kullanici_adi');
        const password = interaction.options.getString('sifre');
        
        const newKey = `PREM-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;

        // Veritabanına kaydet
        await KeyModel.create({ key: newKey, type: 'premium', username, password });

        const embed = new EmbedBuilder()
            .setColor('#00A0FF')
            .setTitle('💎 Premium Hesap Oluşturuldu')
            .addFields(
                { name: 'Kullanıcı Adı', value: username, inline: true },
                { name: 'Şifre', value: password, inline: true },
                { name: 'Özel Key', value: newKey, inline: false }
            )
            .setFooter({ text: 'Sistem başarıyla veritabanına kaydedildi.' });

        await interaction.reply({ embeds: [embed] });
    }
};