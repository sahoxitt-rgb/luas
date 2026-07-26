const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('mute')
        .setDescription('Kullanıcıyı belirli bir süreliğine susturur (Timeout).')
        .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
        .addUserOption(option => option.setName('kullanici').setDescription('Susturulacak kullanıcı').setRequired(true))
        .addNumberOption(option => option.setName('sure').setDescription('Süre miktarını yazın (Örn: 5)').setRequired(true))
        .addStringOption(option => 
            option.setName('birim')
            .setDescription('Süre birimi (Max 28 gün)')
            .setRequired(true)
            .addChoices(
                { name: 'Saniye', value: 'saniye' },
                { name: 'Dakika', value: 'dakika' },
                { name: 'Saat', value: 'saat' },
                { name: 'Gün', value: 'gun' }
            )
        )
        .addStringOption(option => option.setName('sebep').setDescription('Susturma sebebi').setRequired(false)),
        
    async execute(interaction) {
        const target = interaction.options.getMember('kullanici');
        const sure = interaction.options.getNumber('sure');
        const birim = interaction.options.getString('birim');
        const reason = interaction.options.getString('sebep') || 'Sebep belirtilmedi.';
        
        if (!target) return interaction.reply({ content: '❌ Kullanıcı bulunamadı.', ephemeral: true });
        if (!target.moderatable) return interaction.reply({ content: '❌ Bu kullanıcının yetkisi benden yüksek, onu susturamam!', ephemeral: true });

        // Süreyi milisaniyeye (ms) çevirme
        let msSure = 0;
        if (birim === 'saniye') msSure = sure * 1000;
        if (birim === 'dakika') msSure = sure * 60 * 1000;
        if (birim === 'saat') msSure = sure * 60 * 60 * 1000;
        if (birim === 'gun') msSure = sure * 24 * 60 * 60 * 1000;

        // Discord maksimum 28 gün sınırına takılmaması için koruma
        if (msSure > 28 * 24 * 60 * 60 * 1000) {
            return interaction.reply({ content: '❌ **Discord kısıtlaması:** Bir kullanıcıyı tek seferde maksimum **28 gün** susturabilirsin.', ephemeral: true });
        }

        await target.timeout(msSure, reason);
        const bitisZamani = Math.floor((Date.now() + msSure) / 1000); // Discord sayaç formatı için
        
        const embed = new EmbedBuilder()
            .setColor('#FFA500')
            .setDescription(`🔇 <@${target.user.id}> **başarıyla susturuldu!**\n\n⏳ **Cezanın Biteceği Zaman:** <t:${bitisZamani}:R>\n📝 **Sebep:** \`${reason}\``);
            
        await interaction.reply({ embeds: [embed] });
    }
};