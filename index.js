require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const { Client, GatewayIntentBits, REST, Routes, Collection, EmbedBuilder, ChannelType, PermissionFlagsBits, ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');

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

// ==========================================
// EXPRESS API (ROBLOX / GİRİŞ KÖPRÜSÜ & HWID)
// ==========================================
const handleLogin = async (req, res) => {
    const username = req.body.username || req.body.kullanici;
    const password = req.body.password || req.body.key || req.body.sifre;
    const hwid = req.body.hwid || req.body.HID || req.body.hardwareId;

    if (!username || !password) {
        return res.json({ success: false, message: "Kullanıcı adı veya şifre boş bırakılamaz!" });
    }

    try {
        const user = await UserModel.findOne({ username: username, password: password });

        if (!user) {
            return res.json({ success: false, message: "Geçersiz kullanıcı adı veya şifre!" });
        }

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
        console.error("API Giriş Hatası:", error);
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
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent]
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
    } catch (error) {
        console.error("⛔ Komut yükleme hatası:", error);
    }
});

client.on('interactionCreate', async interaction => {
    // 1. SLASH KOMUTLARI
    if (interaction.isChatInputCommand()) {
        const command = client.commands.get(interaction.commandName);
        if (!command) return;
        try {
            await command.execute(interaction);
        } catch (error) {
            console.error(error);
            const replyObj = { content: '❌ Komut çalıştırılırken bir hata oluştu!', ephemeral: true };
            if (interaction.deferred || interaction.replied) await interaction.editReply(replyObj).catch(() => {});
            else await interaction.reply(replyObj).catch(() => {});
        }
        return;
    }

    // 2. AÇILIR MENÜ (TICKET)
    if (interaction.isStringSelectMenu()) {
        if (interaction.customId === 'ticket_select') {
            const categoryValue = interaction.values[0]; 

            const modal = new ModalBuilder()
                .setCustomId(`ticketModal_${categoryValue}`)
                .setTitle('🎫 Bilet Oluşturma Formu');

            const reasonInput = new TextInputBuilder()
                .setCustomId('ticketReason')
                .setLabel('Lütfen sorununuzu detaylı açıklayın')
                .setStyle(TextInputStyle.Paragraph)
                .setPlaceholder('Örn: Satın aldığım ürün teslim edilmedi...')
                .setRequired(true)
                .setMinLength(10)
                .setMaxLength(1000);

            modal.addComponents(new ActionRowBuilder().addComponents(reasonInput));
            await interaction.showModal(modal);
        }
        return;
    }

    // 3. BUTON ETKİLEŞİMLERİ
    if (interaction.isButton()) {
        const { customId } = interaction;

        // --- YETKİLİ BAŞVURU FORMU AÇMA BUTONLARI ---
        if (customId === 'open_staff_modal_tr' || customId === 'open_staff_modal_en') {
            const lang = customId.endsWith('_tr') ? 'TR' : 'EN';
            const modal = new ModalBuilder()
                .setCustomId(`staffModal_${lang}`)
                .setTitle(lang === 'TR' ? '🛡️ Yetkili Başvuru Formu' : '🛡️ Staff Application Form');

            const nameAgeInput = new TextInputBuilder()
                .setCustomId('staffNameAge')
                .setLabel(lang === 'TR' ? 'İsminiz ve Yaşınız?' : 'Your Name & Age?')
                .setStyle(TextInputStyle.Short)
                .setPlaceholder('Örn: Ali, 18')
                .setRequired(true);

            const commandsInfoInput = new TextInputBuilder()
                .setCustomId('staffCommands')
                .setLabel(lang === 'TR' ? 'Komutlar hakkında bilgin var mı?' : 'Do you know about bot commands?')
                .setStyle(TextInputStyle.Short)
                .setPlaceholder('Örn: Evet, moderasyon komutlarını biliyorum...')
                .setRequired(true);

            const discordTimeInput = new TextInputBuilder()
                .setCustomId('staffDiscordTime')
                .setLabel(lang === 'TR' ? 'Discordu ne zamandan beri kullanıyorsun?' : 'How long have you been using Discord?')
                .setStyle(TextInputStyle.Short)
                .setPlaceholder('Örn: 2021\'den beri...')
                .setRequired(true);

            const whyUsInput = new TextInputBuilder()
                .setCustomId('staffWhyUs')
                .setLabel(lang === 'TR' ? 'Neden biz?' : 'Why us?')
                .setStyle(TextInputStyle.Paragraph)
                .setPlaceholder('Örn: Sunucunuzu çok beğeniyorum ve katkı sağlamak istiyorum...')
                .setRequired(true);

            modal.addComponents(
                new ActionRowBuilder().addComponents(nameAgeInput),
                new ActionRowBuilder().addComponents(commandsInfoInput),
                new ActionRowBuilder().addComponents(discordTimeInput),
                new ActionRowBuilder().addComponents(whyUsInput)
            );

            await interaction.showModal(modal);
            return;
        }

        // --- SCRIPT ÖNERİ FORMU AÇMA BUTONLARI ---
        if (customId === 'open_suggestion_modal_tr' || customId === 'open_suggestion_modal_en') {
            const lang = customId.endsWith('_tr') ? 'TR' : 'EN';
            const modal = new ModalBuilder()
                .setCustomId(`suggestionModal_${lang}`)
                .setTitle(lang === 'TR' ? '💡 Script Öneri Formu' : '💡 Script Suggestion Form');

            const gameInput = new TextInputBuilder()
                .setCustomId('suggGame')
                .setLabel(lang === 'TR' ? 'Hangi Oyun?' : 'Which Game?')
                .setStyle(TextInputStyle.Short)
                .setPlaceholder('Örn: Roblox, GTA V, Valorant...')
                .setRequired(true);

            const featuresInput = new TextInputBuilder()
                .setCustomId('suggFeatures')
                .setLabel(lang === 'TR' ? 'İstediğiniz Özellikler (Aimbot, ESP...)' : 'Desired Features (Aimbot, ESP...)')
                .setStyle(TextInputStyle.Paragraph)
                .setPlaceholder('Örn: Aimbot, ESP Box, Teleport...')
                .setRequired(true);

            modal.addComponents(
                new ActionRowBuilder().addComponents(gameInput),
                new ActionRowBuilder().addComponents(featuresInput)
            );

            await interaction.showModal(modal);
            return;
        }

        // --- YETKİLİ BAŞVURU ONAYLAMA (✅) VEYA REDDETME (❌) ---
        if (customId.startsWith('approve_staff_') || customId.startsWith('reject_staff_')) {
            const isAdmin = interaction.member.permissions.has(PermissionFlagsBits.Administrator);
            const hasSupportRole = interaction.member.roles.cache.has(ayarlar.DESTEK_EKIBI_ROL_ID);

            if (!isAdmin && !hasSupportRole) {
                return interaction.reply({ content: '❌ **Bu işlemi yapmak için yetkiniz yok!**', ephemeral: true });
            }

            const isApprove = customId.startsWith('approve_staff_');
            const targetUserId = customId.split('_')[2]; 

            const embed = interaction.message.embeds[0];
            const updatedEmbed = EmbedBuilder.from(embed)
                .setColor(isApprove ? '#00FF00' : '#FF0000')
                .addFields({ 
                    name: isApprove ? '✅ Onaylayan Yetkili' : '❌ Reddeden Yetkili', 
                    value: `<@${interaction.user.id}>`, 
                    inline: false 
                });

            const disabledRow = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId('dummy_app').setLabel('Onaylandı').setStyle(ButtonStyle.Success).setDisabled(true),
                new ButtonBuilder().setCustomId('dummy_rej').setLabel('Reddedildi').setStyle(ButtonStyle.Danger).setDisabled(true)
            );

            await interaction.message.edit({ embeds: [updatedEmbed], components: [disabledRow] });

            try {
                const targetUser = await client.users.fetch(targetUserId);
                if (targetUser) {
                    const dmEmbed = new EmbedBuilder()
                        .setColor(isApprove ? '#00FF00' : '#FF0000')
                        .setTitle(isApprove ? '🎉 Yetkili Başvurunuz Onaylandı!' : '❌ Yetkili Başvurunuz Reddedildi')
                        .setDescription(isApprove 
                            ? 'Tebrikler! Yetkili başvuru formunuz ekibimiz tarafından incelenmiş ve **onaylanmıştır**! Sizinle iletişime geçilecektir.' 
                            : 'Maalesef gönderdiğiniz yetkili başvuru formu şu an için uygun görülmemiş ve **reddedilmiştir**.')
                        .setTimestamp();
                    await targetUser.send({ embeds: [dmEmbed] }).catch(() => {});
                }
            } catch (e) {}

            await interaction.reply({ content: `✅ **Başvuru başarıyla ${isApprove ? 'onaylandı' : 'reddedildi'} ve kullanıcıya DM gönderildi.**`, ephemeral: true });
            return;
        }

        // --- SCRIPT ÖNERİ ONAYLAMA (✅) VEYA REDDETME (❌) ---
        if (customId.startsWith('approve_sugg_') || customId.startsWith('reject_sugg_')) {
            const isAdmin = interaction.member.permissions.has(PermissionFlagsBits.Administrator);
            const hasSupportRole = interaction.member.roles.cache.has(ayarlar.DESTEK_EKIBI_ROL_ID);

            if (!isAdmin && !hasSupportRole) {
                return interaction.reply({ content: '❌ **Bu işlemi yapmak için yetkiniz yok!**', ephemeral: true });
            }

            const isApprove = customId.startsWith('approve_sugg_');
            const targetUserId = customId.split('_')[2]; 

            const embed = interaction.message.embeds[0];
            const updatedEmbed = EmbedBuilder.from(embed)
                .setColor(isApprove ? '#00FF00' : '#FF0000')
                .addFields({ 
                    name: isApprove ? '✅ Onaylayan Yetkili' : '❌ Reddeden Yetkili', 
                    value: `<@${interaction.user.id}>`, 
                    inline: false 
                });

            const disabledRow = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId('dummy_app').setLabel('Onaylandı').setStyle(ButtonStyle.Success).setDisabled(true),
                new ButtonBuilder().setCustomId('dummy_rej').setLabel('Reddedildi').setStyle(ButtonStyle.Danger).setDisabled(true)
            );

            await interaction.message.edit({ embeds: [updatedEmbed], components: [disabledRow] });

            try {
                const targetUser = await client.users.fetch(targetUserId);
                if (targetUser) {
                    const dmEmbed = new EmbedBuilder()
                        .setColor(isApprove ? '#00FF00' : '#FF0000')
                        .setTitle(isApprove ? '🎉 Script Öneriniz Onaylandı!' : '❌ Script Öneriniz Reddedildi')
                        .setDescription(isApprove 
                            ? 'Gönderdiğiniz script önerisi yönetim ekibimiz tarafından incelenmiş ve **onaylanmıştır**! En yakın zamanda geliştirilmeye başlanacaktır.' 
                            : 'Maalesef gönderdiğiniz script önerisi şu an için uygun görülmemiş ve **reddedilmiştir**.')
                        .setTimestamp();
                    await targetUser.send({ embeds: [dmEmbed] }).catch(() => {});
                }
            } catch (e) {}

            await interaction.reply({ content: `✅ **Öneri başarıyla ${isApprove ? 'onaylandı' : 'reddedildi'} ve kullanıcıya DM gönderildi.**`, ephemeral: true });
            return;
        }

        // --- BİLET SAHİPLENME (CLAIM) ---
        if (customId === 'claim_ticket') {
            const hasRole = interaction.member.roles.cache.has(ayarlar.DESTEK_EKIBI_ROL_ID);
            const isAdmin = interaction.member.permissions.has(PermissionFlagsBits.Administrator);
            
            if (!hasRole && !isAdmin) {
                return interaction.reply({ content: '❌ **Bu bileti sahiplenmek için yetkiniz yok!**', ephemeral: true });
            }

            const embed = interaction.message.embeds[0];
            const updatedEmbed = EmbedBuilder.from(embed)
                .setColor('#00FF00') 
                .addFields({ name: '👤 Bileti Sahiplenen Yetkili', value: `<@${interaction.user.id}>`, inline: false });

            const components = interaction.message.components[0].components.map(btn => {
                if (btn.customId === 'claim_ticket') {
                    return ButtonBuilder.from(btn).setDisabled(true).setLabel(`Sahiplenildi: ${interaction.user.username}`);
                }
                return ButtonBuilder.from(btn);
            });

            await interaction.message.edit({ embeds: [updatedEmbed], components: [new ActionRowBuilder().addComponents(components)] });
            await interaction.reply({ content: `✅ **Bileti başarıyla sahiplendin.**`, ephemeral: true });
            return;
        }

        // --- BİLET KAPATMA ---
        if (customId === 'close_ticket') {
            await interaction.reply({ content: '🔒 Bilet 5 saniye içinde kapatılıyor...', ephemeral: true });
            setTimeout(() => { interaction.channel.delete().catch(() => {}); }, 5000);
            return;
        }

        // --- DOĞRULAMA (KAYIT) SİSTEMİ ---
        if (customId === 'verify_tr' || customId === 'verify_en') {
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
                        const verifyLogEmbed = new EmbedBuilder()
                            .setColor(isTR ? '#E60000' : '#00247D')
                            .setTitle('✅ Yeni Kullanıcı Kayıt Oldu')
                            .setDescription(`👤 **Kullanıcı -->** <@${interaction.user.id}>\n` +
                                            `🆔 **Kullanıcı ID -->** \`${interaction.user.id}\`\n` +
                                            `🌍 **Seçtiği Dil -->** \`${isTR ? 'Türkçe (TR)' : 'English (EN)'}\`\n` +
                                            `⏰ **Kayıt Zamanı -->** <t:${Math.floor(Date.now() / 1000)}:F>`)
                            .setThumbnail(interaction.user.displayAvatarURL({ dynamic: true }))
                            .setTimestamp();
                        await logChannel.send({ embeds: [verifyLogEmbed] }).catch(() => {});
                    }
                }
                return interaction.editReply({ content: msg });
            } catch (error) {
                return interaction.editReply({ content: '❌ **Botun yetkisi yetersiz!**' });
            }
        }

        // --- KEY SİSTEMİ ---
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

    // 4. MODAL SUBMIT (FORM GÖNDERİMLERİ)
    if (interaction.isModalSubmit()) {
        
        // --- YETKİLİ BAŞVURU FORMU GÖNDERİMİ ---
        if (interaction.customId.startsWith('staffModal_')) {
            await interaction.deferReply({ ephemeral: true });

            const lang = interaction.customId.split('_')[1]; // TR veya EN
            const nameAge = interaction.fields.getTextInputValue('staffNameAge');
            const commands = interaction.fields.getTextInputValue('staffCommands');
            const discordTime = interaction.fields.getTextInputValue('staffDiscordTime');
            const whyUs = interaction.fields.getTextInputValue('staffWhyUs');

            const targetChannelId = lang === 'TR' ? ayarlar.TR_BASVURU_KANAL_ID : ayarlar.EN_BASVURU_KANAL_ID;

            if (targetChannelId) {
                const logChannel = interaction.client.channels.cache.get(targetChannelId);
                if (logChannel) {
                    const joinedTimestamp = Math.floor(interaction.member.joinedTimestamp / 1000);

                    const staffEmbed = new EmbedBuilder()
                        .setColor('#9400D3')
                        .setTitle(lang === 'TR' ? '🛡️ Yeni Yetkili Başvurusu' : '🛡️ New Staff Application')
                        .setDescription(`👤 **Başvuran Kullanıcı -->** <@${interaction.user.id}>\n` +
                                        `🆔 **Discord ID -->** \`${interaction.user.id}\`\n` +
                                        `📥 **Sunucuya Katılım Tarihi -->** <t:${joinedTimestamp}:F>\n` +
                                        `🌍 **Dil -->** \`${lang}\`\n\n` +
                                        `📝 **İsim ve Yaş:**\n\`\`\`${nameAge}\`\`\`\n` +
                                        `🛠️ **Komutlar Hakkında Bilgi:**\n\`\`\`${commands}\`\`\`\n` +
                                        `⏰ **Discord'u Ne Zamandan Beri Kullanıyor:**\n\`\`\`${discordTime}\`\`\`\n` +
                                        `⭐ **Neden Biz?:**\n\`\`\`${whyUs}\`\`\`\n\n` +
                                        `❗️ \`İşlem:\` **Aşağıdaki butonları kullanarak başvuruyu onaylayabilir veya reddedebilirsiniz.**`)
                        .setThumbnail(interaction.user.displayAvatarURL({ dynamic: true }))
                        .setFooter({ text: 'Luas • Yetkili Başvuru Sistemi' })
                        .setTimestamp();

                    const actionRow = new ActionRowBuilder().addComponents(
                        new ButtonBuilder()
                            .setCustomId(`approve_staff_${interaction.user.id}`)
                            .setLabel('✅ Onayla')
                            .setStyle(ButtonStyle.Success),
                        new ButtonBuilder()
                            .setCustomId(`reject_staff_${interaction.user.id}`)
                            .setLabel('❌ Reddet')
                            .setStyle(ButtonStyle.Danger)
                    );

                    await logChannel.send({ embeds: [staffEmbed], components: [actionRow] }).catch(() => {});
                }
            }

            await interaction.editReply({ content: lang === 'TR' ? '✅ **Yetkili başvurunuz başarıyla yetkili kanalına iletildi!**' : '✅ **Your staff application has been successfully sent to the staff channel!**' });
            return;
        }

        // --- SCRIPT ÖNERİ FORMU GÖNDERİMİ ---
        if (interaction.customId.startsWith('suggestionModal_')) {
            await interaction.deferReply({ ephemeral: true });

            const lang = interaction.customId.split('_')[1]; 
            const game = interaction.fields.getTextInputValue('suggGame');
            const features = interaction.fields.getTextInputValue('suggFeatures');

            const targetChannelId = lang === 'TR' ? ayarlar.TR_ONERI_KANAL_ID : ayarlar.EN_ONERI_KANAL_ID;

            if (targetChannelId) {
                const logChannel = interaction.client.channels.cache.get(targetChannelId);
                if (logChannel) {
                    const joinedTimestamp = Math.floor(interaction.member.joinedTimestamp / 1000);

                    const suggestionEmbed = new EmbedBuilder()
                        .setColor(lang === 'TR' ? '#E60000' : '#00247D')
                        .setTitle(lang === 'TR' ? '💡 Yeni Türkçe Script Önerisi' : '💡 New English Script Suggestion')
                        .setDescription(`👤 **Öneren Kullanıcı -->** <@${interaction.user.id}>\n` +
                                        `🆔 **Discord ID -->** \`${interaction.user.id}\`\n` +
                                        `📥 **Sunucuya Katılım Tarihi -->** <t:${joinedTimestamp}:F>\n` +
                                        `🌍 **Dil -->** \`${lang}\`\n\n` +
                                        `🎮 **Oynanan / İstenen Oyun:**\n\`\`\`${game}\`\`\`\n` +
                                        `⚡ **İstenen Özellikler:**\n\`\`\`${features}\`\`\`\n\n` +
                                        `❗️ \`İşlem:\` **Aşağıdaki butonları kullanarak öneriyi onaylayabilir veya reddedebilirsiniz.**`)
                        .setThumbnail(interaction.user.displayAvatarURL({ dynamic: true }))
                        .setFooter({ text: 'Luas • Öneri Sistemi' })
                        .setTimestamp();

                    const actionRow = new ActionRowBuilder().addComponents(
                        new ButtonBuilder()
                            .setCustomId(`approve_sugg_${interaction.user.id}`)
                            .setLabel('✅ Onayla')
                            .setStyle(ButtonStyle.Success),
                        new ButtonBuilder()
                            .setCustomId(`reject_sugg_${interaction.user.id}`)
                            .setLabel('❌ Reddet')
                            .setStyle(ButtonStyle.Danger)
                    );

                    await logChannel.send({ embeds: [suggestionEmbed], components: [actionRow] }).catch(() => {});
                }
            }

            await interaction.editReply({ content: lang === 'TR' ? '✅ **Script öneriniz başarıyla Türkçe öneri kanalına iletildi!**' : '✅ **Your script suggestion has been successfully sent to the English suggestion channel!**' });
            return;
        }

        // --- BİLET OLUŞTURMA FORMU ---
        if (interaction.customId.startsWith('ticketModal_')) {
            await interaction.deferReply({ ephemeral: true });
            const categoryValue = interaction.customId.replace('ticketModal_', ''); 
            const reason = interaction.fields.getTextInputValue('ticketReason'); 
            
            let prefix = "destek";
            let baslik = "🛠️ Destek Bileti";
            if (categoryValue === "satin_alim") { prefix = "satınalım"; baslik = "🛒 Satın Alım Bileti"; }
            else if (categoryValue === "is_birligi") { prefix = "işbirliği"; baslik = "🤝 İş Birliği Bileti"; }

            try {
                let counter = await TicketModel.findOne({ id: "ticket" });
                if (!counter) counter = new TicketModel({ id: "ticket", count: 0 });
                
                counter.count += 1;
                await counter.save();

                const ticketNo = counter.count.toString().padStart(3, '0'); 
                const channelName = `${prefix}-${interaction.user.username}-${ticketNo}`;

                const permissionOverwrites = [
                    { id: interaction.guild.id, deny: [PermissionFlagsBits.ViewChannel] }, 
                    { id: interaction.user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.AttachFiles] }, 
                    { id: client.user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ManageChannels] } 
                ];

                if (ayarlar.DESTEK_EKIBI_ROL_ID && ayarlar.DESTEK_EKIBI_ROL_ID.length > 5) {
                    permissionOverwrites.push({ id: ayarlar.DESTEK_EKIBI_ROL_ID, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] });
                }

                const ticketChannel = await interaction.guild.channels.create({
                    name: channelName,
                    type: ChannelType.GuildText,
                    parent: ayarlar.TICKET_KATEGORI_ID && ayarlar.TICKET_KATEGORI_ID.length > 5 ? ayarlar.TICKET_KATEGORI_ID : null,
                    permissionOverwrites: permissionOverwrites
                });

                const ticketEmbed = new EmbedBuilder()
                    .setColor('#0099FF')
                    .setTitle(baslik)
                    .setDescription(`Merhaba <@${interaction.user.id}>,\n\nDestek ekibimiz en kısa sürede seninle ilgilenecektir.\n\n📝 **Kullanıcının Belirttiği Sorun:**\n\`\`\`${reason}\`\`\`\n\n\`Bilet Numarası:\` **#${ticketNo}**`)
                    .setImage('https://i.ibb.co/Q4hNKq4/Luas-Ticket.png') 
                    .setFooter({ text: 'Luas • Destek Sistemi' })
                    .setTimestamp();

                const ticketButtons = new ActionRowBuilder().addComponents(
                    new ButtonBuilder().setCustomId('claim_ticket').setLabel('✋ Sahiplen').setStyle(ButtonStyle.Success),
                    new ButtonBuilder().setCustomId('close_ticket').setLabel('🔒 Bileti Kapat').setStyle(ButtonStyle.Danger)
                );

                await ticketChannel.send({ content: `<@${interaction.user.id}> | <@&${ayarlar.DESTEK_EKIBI_ROL_ID}>`, embeds: [ticketEmbed], components: [ticketButtons] });
                await interaction.editReply({ content: `✅ **Biletiniz başarıyla oluşturuldu: ${ticketChannel}**` });
            } catch (err) {
                await interaction.editReply({ content: '❌ Bilet oluşturulurken hata oluştu.' });
            }
            return;
        }

        // --- ÖZEL KEY OLUŞTURMA ---
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

                const replyEmbed = new EmbedBuilder()
                    .setColor('#FFD700')
                    .setTitle('💎 Özel Key Oluşturuldu')
                    .setDescription(`🚀 **Key:** \`${password}\`\n🆔 **ID:** \`${uniqueKeyId}\`\n👑 **Sahip:** \`${username}\``);

                const logChannelId = process.env.LOG_CHANNEL_ID;
                if (logChannelId) {
                    const logChannel = interaction.client.channels.cache.get(logChannelId);
                    if (logChannel) await logChannel.send({ embeds: [replyEmbed] }).catch(() => {});
                }

                await interaction.editReply({ embeds: [replyEmbed] });
            } catch (err) {
                await interaction.editReply({ content: '❌ **Veritabanı hatası!**' });
            }
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