const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const ayarlar = require('../roller.js');

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

        let msSure = 0; let birimYazi = '';
        if (birim === 'saniye') { msSure = sure * 1000; birimYazi = 'Saniye'; }
        if (birim === 'dakika') { msSure = sure * 60 * 1000; birimYazi = 'Dakika'; }
        if (birim === 'saat') { msSure = sure * 60 * 60 * 1000; birimYazi = 'Saat'; }
        if (birim === 'gun') { msSure = sure * 24 * 60 * 60 * 1000; birimYazi = 'Gün'; }

        if (msSure > 28 * 24 * 60 * 60 * 1000) {
            return interaction.reply({ content: '❌ **Discord kısıtlaması:** Maksimum **28 gün** susturabilirsin.', ephemeral: true });
        }

        await target.timeout(msSure, reason);
        const bitisZamani = Math.floor((Date.now() + msSure) / 1000);
        
        // Kanala giden sade mesaj (Resimdeki gibi)
        const embed = new EmbedBuilder()
            .setColor('#2B2D31')
            .setDescription(`🔇 <@${target.user.id}> **başarıyla susturuldu!**\n\n⏳ **Cezanın Biteceği Zaman:** <t:${bitisZamani}:R>\n📝 **Sebep:** \`${reason}\``);
            
        await interaction.reply({ embeds: [embed] });

        // Log Kanalına giden detaylı mesaj
        const logChannelId = ayarlar.MUTE_LOG_KANAL_ID;
        if (logChannelId) {
            const logChannel = interaction.guild.channels.cache.get(logChannelId);
            if (logChannel) {
                const logEmbed = new EmbedBuilder()
                    .setColor('#FFA500')
                    .setTitle('🔇 Yeni Susturma (Mute) İşlemi')
                    .setDescription(`👮 **İşlemi Yapan Yetkili -->** <@${interaction.user.id}>\n` +
                                    `🆔 **Yetkili ID -->** \`${interaction.user.id}\`\n\n` +
                                    `👤 **Susturulan Kullanıcı -->** <@${target.user.id}>\n` +
                                    `🆔 **Kullanıcı ID -->** \`${target.user.id}\`\n\n` +
                                    `⏳ **Ceza Süresi -->** \`${sure} ${birimYazi}\`\n` +
                                    `🔓 **Cezanın Biteceği Zaman -->** <t:${bitisZamani}:F>\n` +
                                    `📝 **Ceza Sebebi -->** \`${reason}\`\n` +
                                    `⏰ **İşlem Tarihi -->** <t:${Math.floor(Date.now() / 1000)}:F>`)
                    .setThumbnail(target.user.displayAvatarURL({ dynamic: true }))
                    .setFooter({ text: 'Luas • Moderasyon Sistemi' })
                    .setTimestamp();
                await logChannel.send({ embeds: [logEmbed] }).catch(() => {});
            }
        }
    }
};