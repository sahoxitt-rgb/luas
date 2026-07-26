require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const { Client, GatewayIntentBits, REST, Routes, Collection, EmbedBuilder, ChannelType, PermissionFlagsBits, ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');
const Tesseract = require('tesseract.js'); 

const ayarlar = require('./roller.js');

const app = express();
app.use(express.json());

// ==========================================
// MONGODB BAĞLANTISI VE ŞEMA
// ==========================================
const MONGO_URI = process.env.MONGO_URI || "mongodb+srv://luas:luasorj@cluster0.i2qdv7n.mongodb.net/?appName=Cluster0";

mongoose.connect(MONGO_URI)
    .then(() => console.log("✅ MongoDB bağlantısı başarılı!"))
    .catch(err => console.error("⛔ MongoDB bağlantı hatası:", err));

const UserSchema = new mongoose.Schema({
    username: { type: String, required: true },
    password: { type: String, required: true },
    keyId: { type: String, required: true, unique: true }, 
    hwid: { type: String, default: null },
    plan: { type: String, default: "free" },
    duration: { type: String, default: "Sınırsız" },
    discordId: { type: String, default: null },
    creatorTag: { type: String, default: "Sistem / Bilinmiyor" }
});
const UserModel = mongoose.model('User', UserSchema);

const TicketSchema = new mongoose.Schema({
    id: { type: String, default: "ticket" },
    count: { type: Number, default: 0 }
});
const TicketModel = mongoose.model('TicketCounter', TicketSchema);

const ConfigSchema = new mongoose.Schema({
    id: { type: String, default: "config" },
    tr_ss_channel: { type: String, default: null },
    en_ss_channel: { type: String, default: null }
});
const ConfigModel = mongoose.model('Config', ConfigSchema);

// ==========================================
// EXPRESS API
// ==========================================
const handleLogin = async (req, res) => {
    const username = req.body.username || req.body.kullanici;
    const password = req.body.password || req.body.key || req.body.sifre;
    const hwid = req.body.hwid || req.body.HID || req.body.hardwareId;

    if (!username || !password) return res.json({ success: false, message: "Kullanıcı adı veya şifre boş bırakılamaz!" });

    try {
        const user = await UserModel.findOne({ username: username, password: password });
        if (!user) return res.json({ success: false, message: "Geçersiz kullanıcı adı veya şifre!" });

        if (hwid && hwid !== "" && hwid !== "nil") {
            if (!user.hwid || user.hwid === "" || user.hwid === "null") {
                user.hwid = hwid;
                await user.save();
            } else if (user.hwid !== hwid) {
                return res.json({ success: false, message: "Bu key başka bir cihaza (HWID) kayıtlı!" });
            }
        }
        res.json({ success: true, message: "Giriş başarılı!", plan: user.plan });
    } catch (error) {
        res.status(500).json({ success: false, message: "Veritabanı hatası!" });
    }
};

app.post('/login', handleLogin);
app.post('/api/login', handleLogin);
app.post('/api/verify', handleLogin);

// ==========================================
// DISCORD BOT & COMMAND HANDLER 
// ==========================================
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds, 
        GatewayIntentBits.GuildMessages, 
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers 
    ]
});

client.commands = new Collection();
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

const commandArray = [];
for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);
    if ('data' in command && 'execute' in command) {
        client.commands.set(command.data.name, command);
        commandArray.push(command.data.toJSON());
    }
}

client.once('ready', async () => {
    console.log(`🤖 Discord botu aktif edildi! Giriş: ${client.user.tag}`);

    const rest = new REST({ version: '10' }).setToken(process.env.BOT_TOKEN);
    try {
        if (process.env.GUILD_ID) {
            await rest.put(Routes.applicationGuildCommands(client.user.id, process.env.GUILD_ID), { body: commandArray });
        } else {
            await rest.put(Routes.applicationCommands(client.user.id), { body: commandArray });
        }
    } catch (error) { console.error("⛔ Komut yükleme hatası:", error); }
});

// ==========================================
// YAZI ENGEL VE YAPAY ZEKA ABONE SS KONTROLÜ
// ==========================================
let queueCount = 0; 
client.on('messageCreate', async message => {
    if (message.author.bot) return;

    const config = await ConfigModel.findOne({ id: "config" });
    if (!config) return;

    if (message.channel.id === config.tr_ss_channel || message.channel.id === config.en_ss_channel) {
        const isTR = message.channel.id === config.tr_ss_channel;

        // 1. Resim yoksa uyarıp sil (Dile göre ayarlı)
        if (message.attachments.size === 0) {
            await message.delete().catch(() => {});
            const warnContent = isTR 
                ? `<@${message.author.id}>, ❌ **Bu kanala fotoğraf dışında bir şey atılamaz! Mesajınız silindi.**`
                : `<@${message.author.id}>, ❌ **You can only send images in this channel! Your message was deleted.**`;
            const warnMsg = await message.channel.send({ content: warnContent });
            setTimeout(() => warnMsg.delete().catch(() => {}), 5000);
            return;
        }

        const attachment = message.attachments.first();
        // 2. Eklenen dosya resim değilse veya GIF ise (Dile göre ayarlı)
        if (!attachment.contentType || !attachment.contentType.startsWith('image/') || attachment.contentType === 'image/gif') {
            await message.delete().catch(() => {});
            const warnContent = isTR
                ? `<@${message.author.id}>, ❌ **Geçersiz dosya veya GIF! Sadece fotoğraf (PNG/JPG) yükleyebilirsiniz.**`
                : `<@${message.author.id}>, ❌ **Invalid file or GIF! You can only upload photos (PNG/JPG).**`;
            const warnMsg = await message.channel.send({ content: warnContent });
            setTimeout(() => warnMsg.delete().catch(() => {}), 5000);
            return;
        }

        queueCount++;
        const processingContent = isTR
            ? `🤖 **Luas Yapay Zeka** tarafından SS'iniz inceleniyor...\n⏳ *Lütfen bekleyiniz. Tahmini bekleme süresi: 5-15 saniye.*\n📊 *Resim Sırası: ${queueCount}*`
            : `🤖 **Luas AI** is analyzing your screenshot...\n⏳ *Please wait. Estimated time: 5-15 seconds.*\n📊 *Queue Position: ${queueCount}*`;
            
        const processingMsg = await message.reply({ content: processingContent });

        try {
            const { data: { text } } = await Tesseract.recognize(attachment.url, isTR ? 'tur' : 'eng');
            
            // YENİ VE DAHA GÜÇLÜ ALGORİTMA: Bütün boşlukları ve gereksiz sembolleri siliyoruz! 
            // Bu sayede siyah temalı zor okunan PC ekranlarını (L u a S vb.) bile hatasız anlar.
            const cleanText = text.toLowerCase().replace(/[^a-z0-9ğüşıöç]/g, ''); 
            
            const hasName = cleanText.includes('luas');
            const hasSub = cleanText.includes('abone') || cleanText.includes('sub');

            const logChannel = message.guild.channels.cache.get(ayarlar.ABONE_LOG_KANAL_ID);
            const joinedTimestamp = Math.floor(message.member.joinedTimestamp / 1000);
            const isTurkishUser = message.member.roles.cache.has(ayarlar.TR_ROL_ID);
            const langText = isTurkishUser ? 'Türkçe (TR)' : 'English (EN)';

            if (hasName && hasSub) {
                // BAŞARILI DURUM
                const roleId = isTR ? ayarlar.ABONE_ROL_ID : ayarlar.SUBSCRIBER_ROL_ID;
                const role = message.guild.roles.cache.get(roleId);
                if (role) await message.member.roles.add(role).catch(() => {});

                // Sade DM
                const dmEmbed = new EmbedBuilder()
                    .setColor('#00FF00')
                    .setTitle(isTR ? '🎉 Aboneliğiniz Onaylandı!' : '🎉 Subscription Verified!')
                    .setDescription(isTR 
                        ? `Tebrikler! Gönderdiğiniz ekran görüntüsü **Yapay Zeka** tarafından onaylandı ve \`Abone\` rolünüz verildi.`
                        : `Congratulations! Your screenshot has been verified by **AI** and you received the \`Subscriber\` role.`)
                    .setTimestamp();
                await message.author.send({ embeds: [dmEmbed] }).catch(() => {});

                // Detaylı Log (AI Çıktısı Kaldırıldı)
                if (logChannel) {
                    const logEmbed = new EmbedBuilder()
                        .setColor('#00FF00')
                        .setTitle('✅ Başarılı Abone Onayı')
                        .setDescription(`👤 **Kullanıcı:** <@${message.author.id}>\n` +
                                        `🏷️ **İsim:** \`${message.author.tag}\`\n` +
                                        `🆔 **ID:** \`${message.author.id}\`\n` +
                                        `📥 **Sunucuya Giriş:** <t:${joinedTimestamp}:F>\n` +
                                        `🌍 **Kayıtlı Dil:** \`${langText}\`\n` +
                                        `⏰ **Atılan Saat:** <t:${Math.floor(Date.now() / 1000)}:T>`)
                        .setImage(attachment.url)
                        .setTimestamp();
                    await logChannel.send({ embeds: [logEmbed] }).catch(() => {});
                }

                const successMsg = isTR 
                    ? `✅ **Onaylandı!** Rolünüz başarıyla verildi. <@${message.author.id}>`
                    : `✅ **Verified!** Your role has been given. <@${message.author.id}>`;
                await processingMsg.edit({ content: successMsg });
                
                setTimeout(() => {
                    processingMsg.delete().catch(() => {});
                    message.delete().catch(() => {});
                }, 5000);

            } else {
                // BAŞARISIZ DURUM
                const dmEmbed = new EmbedBuilder()
                    .setColor('#FF0000')
                    .setTitle(isTR ? '❌ Aboneliğiniz Onaylanmadı' : '❌ Subscription Failed')
                    .setDescription(isTR 
                        ? `Maalesef gönderdiğiniz görsel yapay zeka tarafından reddedildi.\n\nLütfen görselin doğruluğunu kontrol edip geçerli bir SS ile tekrar deneyin.`
                        : `Unfortunately, your screenshot was rejected by the AI.\n\nPlease check the image and try again with a valid screenshot.`)
                    .setTimestamp();
                await message.author.send({ embeds: [dmEmbed] }).catch(() => {});

                if (logChannel) {
                    const logEmbed = new EmbedBuilder()
                        .setColor('#FF0000')
                        .setTitle('❌ Reddedilen Abone İşlemi')
                        .setDescription(`👤 **Kullanıcı:** <@${message.author.id}>\n` +
                                        `🏷️ **İsim:** \`${message.author.tag}\`\n` +
                                        `🆔 **ID:** \`${message.author.id}\`\n` +
                                        `📥 **Sunucuya Giriş:** <t:${joinedTimestamp}:F>\n` +
                                        `🌍 **Kayıtlı Dil:** \`${langText}\`\n` +
                                        `⏰ **Atılan Saat:** <t:${Math.floor(Date.now() / 1000)}:T>`)
                        .setImage(attachment.url)
                        .setTimestamp();
                    await logChannel.send({ embeds: [logEmbed] }).catch(() => {});
                }

                const failMsg = isTR
                    ? `❌ **Onaylanmadı!** SS yapay zeka tarafından reddedildi. DM'nizi kontrol edin. <@${message.author.id}>`
                    : `❌ **Failed!** Screenshot rejected by AI. Check your DMs. <@${message.author.id}>`;
                await processingMsg.edit({ content: failMsg });
                
                setTimeout(() => {
                    processingMsg.delete().catch(() => {});
                    message.delete().catch(() => {}); 
                }, 7000);
            }
            queueCount--; 
        } catch (error) {
            console.error('OCR Hata:', error);
            const errorMsg = isTR 
                ? `❌ Sistemsel bir hata oluştu, işlemi daha sonra tekrar deneyin.`
                : `❌ A system error occurred, please try again later.`;
            await processingMsg.edit({ content: errorMsg });
            queueCount--;
        }
    }
});

// ==========================================
// JOIN & LEAVE 
// ==========================================
client.on('guildMemberAdd', async member => {
    try {
        const dmEmbed = new EmbedBuilder()
            .setColor('#00FF00')
            .setTitle(`🎉 Luas'a Hoş Geldiniz!`)
            .setDescription(`Merhaba **${member.user.username}**,\n\n**Luas** sunucumuza hoş geldin! Script hakkında daha fazla bilgi almak ve ayrıcalıklardan yararlanmak için sunucumuza göz atabilirsin. İyi eğlenceler!`)
            .setTimestamp();
        
        await member.send({ embeds: [dmEmbed] }).catch(() => {});
    } catch (err) {}

    const joinChannelId = ayarlar.JOIN_LOG_KANAL_ID;
    if (joinChannelId) {
        const channel = member.guild.channels.cache.get(joinChannelId);
        if (channel) {
            const joinedTimestamp = Math.floor(member.joinedTimestamp / 1000);
            const createdTimestamp = Math.floor(member.user.createdTimestamp / 1000);
            const joinEmbed = new EmbedBuilder()
                .setColor('#00FF00')
                .setTitle('📥 Sunucuya Yeni Üye Katıldı (Join)')
                .setDescription(`👤 **Kullanıcı -->** <@${member.id}>\n🏷️ **Kullanıcı Adı -->** \`${member.user.tag}\`\n🆔 **Kullanıcı ID -->** \`${member.id}\`\n📥 **Sunucuya Katılım -->** <t:${joinedTimestamp}:F>\n📅 **Discord Hesap Açılışı -->** <t:${createdTimestamp}:F>\n👥 **Toplam Üye Sayısı -->** \`${member.guild.memberCount}\``)
                .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
                .setFooter({ text: 'Luas • Giriş Sistemi' })
                .setTimestamp();
            await channel.send({ embeds: [joinEmbed] }).catch(() => {});
        }
    }
});

client.on('guildMemberRemove', async member => {
    const leaveChannelId = ayarlar.LEAVE_LOG_KANAL_ID;
    if (leaveChannelId) {
        const channel = member.guild.channels.cache.get(leaveChannelId);
        if (channel) {
            const leaveEmbed = new EmbedBuilder()
                .setColor('#FF0000')
                .setTitle('📤 Sunucudan Üye Ayrıldı (Leave)')
                .setDescription(`👤 **Ayrılan Kullanıcı -->** <@${member.id}>\n🏷️ **Kullanıcı Adı -->** \`${member.user.tag}\`\n🆔 **Kullanıcı ID -->** \`${member.id}\`\n👥 **Kalan Üye Sayısı -->** \`${member.guild.memberCount}\``)
                .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
                .setFooter({ text: 'Luas • Çıkış Sistemi' })
                .setTimestamp();
            await channel.send({ embeds: [leaveEmbed] }).catch(() => {});
        }
    }
});

// ==========================================
// INTERACTION (ETKİLEŞİM) KONTROLÜ
// ==========================================
client.on('interactionCreate', async interaction => {
    if (interaction.isChatInputCommand()) {
        const command = client.commands.get(interaction.commandName);
        if (!command) return;
        try { await command.execute(interaction); } 
        catch (error) { console.error(error); }
        return;
    }

    if (interaction.isStringSelectMenu()) {
        if (interaction.customId === 'ticket_select') {
            const categoryValue = interaction.values[0]; 
            const modal = new ModalBuilder().setCustomId(`ticketModal_${categoryValue}`).setTitle('🎫 Bilet Oluşturma Formu');
            const reasonInput = new TextInputBuilder().setCustomId('ticketReason').setLabel('Lütfen sorununuzu detaylı açıklayın').setStyle(TextInputStyle.Paragraph).setRequired(true).setMinLength(10).setMaxLength(1000);
            modal.addComponents(new ActionRowBuilder().addComponents(reasonInput));
            await interaction.showModal(modal);
        }
        return;
    }

    if (interaction.isButton()) {
        const { customId } = interaction;

        if (customId === 'open_staff_modal_tr' || customId === 'open_staff_modal_en') {
            const lang = customId.endsWith('_tr') ? 'TR' : 'EN';
            const modal = new ModalBuilder().setCustomId(`staffModal_${lang}`).setTitle(lang === 'TR' ? '🛡️ Yetkili Başvuru Formu' : '🛡️ Staff Application Form');
            const nameAgeInput = new TextInputBuilder().setCustomId('staffNameAge').setLabel(lang === 'TR' ? 'İsminiz ve Yaşınız?' : 'Your Name & Age?').setStyle(TextInputStyle.Short).setRequired(true);
            const commandsInfoInput = new TextInputBuilder().setCustomId('staffCommands').setLabel(lang === 'TR' ? 'Komutlar hakkında bilgin var mı?' : 'Do you know about bot commands?').setStyle(TextInputStyle.Short).setRequired(true);
            const discordTimeInput = new TextInputBuilder().setCustomId('staffDiscordTime').setLabel(lang === 'TR' ? 'Discordu ne zamandan beri kullanıyorsun?' : 'How long have you been using Discord?').setStyle(TextInputStyle.Short).setRequired(true);
            const whyUsInput = new TextInputBuilder().setCustomId('staffWhyUs').setLabel(lang === 'TR' ? 'Neden biz?' : 'Why us?').setStyle(TextInputStyle.Paragraph).setRequired(true);
            modal.addComponents(new ActionRowBuilder().addComponents(nameAgeInput), new ActionRowBuilder().addComponents(commandsInfoInput), new ActionRowBuilder().addComponents(discordTimeInput), new ActionRowBuilder().addComponents(whyUsInput));
            await interaction.showModal(modal);
            return;
        }

        if (customId === 'open_suggestion_modal_tr' || customId === 'open_suggestion_modal_en') {
            const lang = customId.endsWith('_tr') ? 'TR' : 'EN';
            const modal = new ModalBuilder().setCustomId(`suggestionModal_${lang}`).setTitle(lang === 'TR' ? '💡 Script Öneri Formu' : '💡 Script Suggestion Form');
            const gameInput = new TextInputBuilder().setCustomId('suggGame').setLabel(lang === 'TR' ? 'Hangi Oyun?' : 'Which Game?').setStyle(TextInputStyle.Short).setRequired(true);
            const featuresInput = new TextInputBuilder().setCustomId('suggFeatures').setLabel(lang === 'TR' ? 'İstediğiniz Özellikler (Aimbot, ESP...)' : 'Desired Features (Aimbot, ESP...)').setStyle(TextInputStyle.Paragraph).setRequired(true);
            modal.addComponents(new ActionRowBuilder().addComponents(gameInput), new ActionRowBuilder().addComponents(featuresInput));
            await interaction.showModal(modal);
            return;
        }

        if (customId.startsWith('approve_staff_') || customId.startsWith('reject_staff_') || customId.startsWith('approve_sugg_') || customId.startsWith('reject_sugg_')) {
            const isAdmin = interaction.member.permissions.has(PermissionFlagsBits.Administrator);
            const hasSupportRole = interaction.member.roles.cache.has(ayarlar.DESTEK_EKIBI_ROL_ID);
            if (!isAdmin && !hasSupportRole) return interaction.reply({ content: '❌ **Bu işlemi yapmak için yetkiniz yok!**', ephemeral: true });

            const isApprove = customId.startsWith('approve_');
            const targetUserId = customId.split('_')[2]; 

            const embed = interaction.message.embeds[0];
            const updatedEmbed = EmbedBuilder.from(embed).setColor(isApprove ? '#00FF00' : '#FF0000').addFields({ name: isApprove ? '✅ Onaylayan Yetkili' : '❌ Reddeden Yetkili', value: `<@${interaction.user.id}>`, inline: false });
            const disabledRow = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId('dummy_app').setLabel('Onaylandı').setStyle(ButtonStyle.Success).setDisabled(true),
                new ButtonBuilder().setCustomId('dummy_rej').setLabel('Reddedildi').setStyle(ButtonStyle.Danger).setDisabled(true)
            );
            await interaction.message.edit({ embeds: [updatedEmbed], components: [disabledRow] });

            try {
                const targetUser = await client.users.fetch(targetUserId);
                if (targetUser) {
                    const dmEmbed = new EmbedBuilder().setColor(isApprove ? '#00FF00' : '#FF0000').setTitle(isApprove ? '🎉 İşleminiz Onaylandı!' : '❌ İşleminiz Reddedildi').setDescription(isApprove ? 'Gönderdiğiniz form ekibimiz tarafından incelenmiş ve **onaylanmıştır**!' : 'Maalesef gönderdiğiniz form reddedilmiştir.').setTimestamp();
                    await targetUser.send({ embeds: [dmEmbed] }).catch(() => {});
                }
            } catch (e) {}
            await interaction.reply({ content: `✅ **İşlem başarıyla ${isApprove ? 'onaylandı' : 'reddedildi'}.**`, ephemeral: true });
            return;
        }

        if (customId === 'claim_ticket' || customId === 'close_ticket' || customId === 'verify_tr' || customId === 'verify_en') {
            if (customId === 'claim_ticket') {
                const hasRole = interaction.member.roles.cache.has(ayarlar.DESTEK_EKIBI_ROL_ID);
                const isAdmin = interaction.member.permissions.has(PermissionFlagsBits.Administrator);
                if (!hasRole && !isAdmin) return interaction.reply({ content: '❌ **Bu bileti sahiplenmek için yetkiniz yok!**', ephemeral: true });
                const embed = interaction.message.embeds[0];
                const updatedEmbed = EmbedBuilder.from(embed).setColor('#00FF00').addFields({ name: '👤 Bileti Sahiplenen Yetkili', value: `<@${interaction.user.id}>`, inline: false });
                const components = interaction.message.components[0].components.map(btn => {
                    if (btn.customId === 'claim_ticket') return ButtonBuilder.from(btn).setDisabled(true).setLabel(`Sahiplenildi: ${interaction.user.username}`);
                    return ButtonBuilder.from(btn);
                });
                await interaction.message.edit({ embeds: [updatedEmbed], components: [new ActionRowBuilder().addComponents(components)] });
                await interaction.reply({ content: `✅ **Bileti başarıyla sahiplendin.**`, ephemeral: true });
            } else if (customId === 'close_ticket') {
                await interaction.reply({ content: '🔒 Bilet 5 saniye içinde kapatılıyor...', ephemeral: true });
                setTimeout(() => { interaction.channel.delete().catch(() => {}); }, 5000);
            } else if (customId === 'verify_tr' || customId === 'verify_en') {
                await interaction.deferReply({ ephemeral: true });
                const isTR = customId === 'verify_tr';
                const roleId = isTR ? ayarlar.TR_ROL_ID : ayarlar.EN_ROL_ID; 
                const role = interaction.guild.roles.cache.get(roleId);
                if (!role) return interaction.editReply({ content: '❌ **Rol bulunamadı!**' });
                try {
                    await interaction.member.roles.add(role);
                    const msg = isTR ? '✅ **Başarıyla doğrulandınız!**' : '✅ **Successfully verified!**';
                    const logChannelId = ayarlar.KAYIT_LOG_KANAL_ID;
                    if (logChannelId) {
                        const logChannel = interaction.client.channels.cache.get(logChannelId);
                        if (logChannel) {
                            const verifyLogEmbed = new EmbedBuilder().setColor(isTR ? '#E60000' : '#00247D').setTitle('✅ Yeni Kullanıcı Kayıt Oldu').setDescription(`👤 **Kullanıcı -->** <@${interaction.user.id}>\n🆔 **Kullanıcı ID -->** \`${interaction.user.id}\`\n🌍 **Seçtiği Dil -->** \`${isTR ? 'Türkçe (TR)' : 'English (EN)'}\`\n⏰ **Kayıt Zamanı -->** <t:${Math.floor(Date.now() / 1000)}:F>`).setThumbnail(interaction.user.displayAvatarURL({ dynamic: true })).setTimestamp();
                            await logChannel.send({ embeds: [verifyLogEmbed] }).catch(() => {});
                        }
                    }
                    return interaction.editReply({ content: msg });
                } catch (error) { return interaction.editReply({ content: '❌ **Botun yetkisi yetersiz!**' }); }
            }
            return;
        }

        let commandName = '';
        if (customId === 'get_free_key') commandName = 'bedava-key';
        else if (customId === 'get_free_key_en') commandName = 'free-key';
        else if (customId === 'open_custom_modal') commandName = 'ozel-key';
        
        if (commandName !== '') {
            const command = client.commands.get(commandName);
            if (command && typeof command.handleButton === 'function') await command.handleButton(interaction, UserModel);
        }
        return;
    }

    if (interaction.isModalSubmit()) {
        if (interaction.customId.startsWith('staffModal_') || interaction.customId.startsWith('suggestionModal_')) {
            await interaction.deferReply({ ephemeral: true });
            const lang = interaction.customId.split('_')[1]; 
            const isStaff = interaction.customId.startsWith('staffModal_');
            const targetChannelId = lang === 'TR' ? (isStaff ? ayarlar.TR_BASVURU_KANAL_ID : ayarlar.TR_ONERI_KANAL_ID) : (isStaff ? ayarlar.EN_BASVURU_KANAL_ID : ayarlar.EN_ONERI_KANAL_ID);

            if (targetChannelId) {
                const logChannel = interaction.client.channels.cache.get(targetChannelId);
                if (logChannel) {
                    const joinedTimestamp = Math.floor(interaction.member.joinedTimestamp / 1000);
                    const embed = new EmbedBuilder().setColor(isStaff ? '#9400D3' : (lang === 'TR' ? '#E60000' : '#00247D')).setTitle(lang === 'TR' ? (isStaff ? '🛡️ Yeni Yetkili Başvurusu' : '💡 Yeni Script Önerisi') : (isStaff ? '🛡️ New Staff Application' : '💡 New Script Suggestion')).setDescription(`👤 **Gönderen Kullanıcı -->** <@${interaction.user.id}>\n🆔 **Discord ID -->** \`${interaction.user.id}\`\n📥 **Sunucuya Katılım Tarihi -->** <t:${joinedTimestamp}:F>\n🌍 **Dil -->** \`${lang}\`\n\n`);

                    if (isStaff) {
                        embed.setDescription(embed.data.description + `📝 **İsim ve Yaş:**\n\`\`\`${interaction.fields.getTextInputValue('staffNameAge')}\`\`\`\n🛠️ **Komutlar:**\n\`\`\`${interaction.fields.getTextInputValue('staffCommands')}\`\`\`\n⏰ **Discord Süresi:**\n\`\`\`${interaction.fields.getTextInputValue('staffDiscordTime')}\`\`\`\n⭐ **Neden Biz?:**\n\`\`\`${interaction.fields.getTextInputValue('staffWhyUs')}\`\`\`\n\n❗️ \`İşlem:\` **Aşağıdan onaylayın veya reddedin.**`);
                    } else {
                        embed.setDescription(embed.data.description + `🎮 **İstenen Oyun:**\n\`\`\`${interaction.fields.getTextInputValue('suggGame')}\`\`\`\n⚡ **İstenen Özellikler:**\n\`\`\`${interaction.fields.getTextInputValue('suggFeatures')}\`\`\`\n\n❗️ \`İşlem:\` **Aşağıdan onaylayın veya reddedin.**`);
                    }
                    embed.setThumbnail(interaction.user.displayAvatarURL({ dynamic: true })).setTimestamp();

                    const actionRow = new ActionRowBuilder().addComponents(
                        new ButtonBuilder().setCustomId(`approve_${isStaff ? 'staff' : 'sugg'}_${interaction.user.id}`).setLabel('✅ Onayla').setStyle(ButtonStyle.Success),
                        new ButtonBuilder().setCustomId(`reject_${isStaff ? 'staff' : 'sugg'}_${interaction.user.id}`).setLabel('❌ Reddet').setStyle(ButtonStyle.Danger)
                    );
                    await logChannel.send({ embeds: [embed], components: [actionRow] }).catch(() => {});
                }
            }
            await interaction.editReply({ content: '✅ **Form başarıyla iletildi!**' });
            return;
        }

        if (interaction.customId.startsWith('ticketModal_')) {
            await interaction.deferReply({ ephemeral: true });
            const categoryValue = interaction.customId.replace('ticketModal_', ''); 
            const reason = interaction.fields.getTextInputValue('ticketReason'); 
            let prefix = "destek"; let baslik = "🛠️ Destek Bileti";
            if (categoryValue === "satin_alim") { prefix = "satınalım"; baslik = "🛒 Satın Alım Bileti"; }
            else if (categoryValue === "is_birligi") { prefix = "işbirliği"; baslik = "🤝 İş Birliği Bileti"; }

            try {
                let counter = await TicketModel.findOne({ id: "ticket" });
                if (!counter) counter = new TicketModel({ id: "ticket", count: 0 });
                counter.count += 1; await counter.save();
                const ticketNo = counter.count.toString().padStart(3, '0'); 
                const channelName = `${prefix}-${interaction.user.username}-${ticketNo}`;

                const permissionOverwrites = [
                    { id: interaction.guild.id, deny: [PermissionFlagsBits.ViewChannel] }, 
                    { id: interaction.user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.AttachFiles] }, 
                    { id: client.user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ManageChannels] } 
                ];
                if (ayarlar.DESTEK_EKIBI_ROL_ID && ayarlar.DESTEK_EKIBI_ROL_ID.length > 5) permissionOverwrites.push({ id: ayarlar.DESTEK_EKIBI_ROL_ID, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] });

                const ticketChannel = await interaction.guild.channels.create({ name: channelName, type: ChannelType.GuildText, parent: ayarlar.TICKET_KATEGORI_ID && ayarlar.TICKET_KATEGORI_ID.length > 5 ? ayarlar.TICKET_KATEGORI_ID : null, permissionOverwrites: permissionOverwrites });
                const ticketEmbed = new EmbedBuilder().setColor('#0099FF').setTitle(baslik).setDescription(`Merhaba <@${interaction.user.id}>,\n\nDestek ekibimiz en kısa sürede seninle ilgilenecektir.\n\n📝 **Sorun:**\n\`\`\`${reason}\`\`\`\n\n\`Bilet Numarası:\` **#${ticketNo}**`).setImage('https://i.ibb.co/Q4hNKq4/Luas-Ticket.png').setFooter({ text: 'Luas • Destek Sistemi' }).setTimestamp();
                const ticketButtons = new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId('claim_ticket').setLabel('✋ Sahiplen').setStyle(ButtonStyle.Success), new ButtonBuilder().setCustomId('close_ticket').setLabel('🔒 Bileti Kapat').setStyle(ButtonStyle.Danger));

                await ticketChannel.send({ content: `<@${interaction.user.id}> | <@&${ayarlar.DESTEK_EKIBI_ROL_ID}>`, embeds: [ticketEmbed], components: [ticketButtons] });
                await interaction.editReply({ content: `✅ **Biletiniz oluşturuldu: ${ticketChannel}**` });
            } catch (err) { await interaction.editReply({ content: '❌ Bilet oluşturulurken hata oluştu.' }); }
            return;
        }

        if (interaction.customId === 'customKeyModal') {
            await interaction.deferReply({ ephemeral: true });
            const username = interaction.fields.getTextInputValue('usernameInput');
            const password = interaction.fields.getTextInputValue('keyInput');
            const duration = interaction.fields.getTextInputValue('durationInput');

            try {
                const existing = await UserModel.findOne({ username, password });
                if (existing) return interaction.editReply({ content: '⚠️ **Bu kullanıcı adı ve key zaten kayıtlı!**' });
                const uniqueKeyId = Math.floor(100000 + Math.random() * 900000).toString();
                const newUser = new UserModel({ username, password, keyId: uniqueKeyId, plan: "premium", duration, discordId: interaction.user.id, creatorTag: interaction.user.tag });
                await newUser.save();
                const replyEmbed = new EmbedBuilder().setColor('#FFD700').setTitle('💎 Özel Key Oluşturuldu').setDescription(`🚀 **Key:** \`${password}\`\n🆔 **ID:** \`${uniqueKeyId}\`\n👑 **Sahip:** \`${username}\``);
                const logChannelId = process.env.LOG_CHANNEL_ID;
                if (logChannelId) {
                    const logChannel = interaction.client.channels.cache.get(logChannelId);
                    if (logChannel) await logChannel.send({ embeds: [replyEmbed] }).catch(() => {});
                }
                await interaction.editReply({ embeds: [replyEmbed] });
            } catch (err) { await interaction.editReply({ content: '❌ **Veritabanı hatası!**' }); }
        }
    }
});

if (!process.env.BOT_TOKEN) {
    console.error("⛔ BOT_TOKEN bulunamadı!");
} else {
    client.login(process.env.BOT_TOKEN).catch(err => console.error("⛔ Discord bağlantı hatası:", err));
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🌐 Web Sunucusu ${PORT} portunda çalışıyor.`);
});