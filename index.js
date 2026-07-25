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

// KULLANICI ŞEMASI
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

// TICKET SAYAÇ ŞEMASI (001, 002 için)
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

    // 2. BİLET MENÜSÜ KONTROLÜ (Açılır Menü) -> FORM ÇIKARTIR
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

            const firstActionRow = new ActionRowBuilder().addComponents(reasonInput);
            modal.addComponents(firstActionRow);

            await interaction.showModal(modal);
        }
        return;
    }

    // 3. BUTON ETKİLEŞİMLERİ (Sahiplenme, Kapatma, Doğrulama, Key vs.)
    if (interaction.isButton()) {
        const { customId } = interaction;

        // --- BİLET SAHİPLENME (CLAIM) ---
        if (customId === 'claim_ticket') {
            const hasRole = interaction.member.roles.cache.has(ayarlar.DESTEK_EKIBI_ROL_ID);
            const isAdmin = interaction.member.permissions.has(PermissionFlagsBits.Administrator);
            
            if (!hasRole && !isAdmin) {
                return interaction.reply({ content: '❌ **Bu bileti sahiplenmek için yetkiniz yok! Sadece destek ekibi sahiplenebilir.**', ephemeral: true });
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
            const newActionRow = new ActionRowBuilder().addComponents(components);

            await interaction.message.edit({ embeds: [updatedEmbed], components: [newActionRow] });
            await interaction.reply({ content: `✅ **Bileti başarıyla sahiplendin. Artık müşteriyle ilgilenebilirsin.**`, ephemeral: true });
            return;
        }

        // --- BİLET KAPATMA ---
        if (customId === 'close_ticket') {
            await interaction.reply({ content: '🔒 Bilet 5 saniye içinde kalıcı olarak kapatılıyor...', ephemeral: true });
            setTimeout(() => {
                interaction.channel.delete().catch(() => {});
            }, 5000);
            return;
        }

        // --- KAYIT (DOGRULAMA) SİSTEMİ ---
        if (customId === 'verify_tr' || customId === 'verify_en') {
            await interaction.deferReply({ ephemeral: true });
            
            const isTR = customId === 'verify_tr';
            const roleId = isTR ? ayarlar.TR_ROL_ID : ayarlar.EN_ROL_ID; 
            const role = interaction.guild.roles.cache.get(roleId);

            if (!role) return interaction.editReply({ content: '❌ **Sistem hatası: Ayarlanan rol sunucuda bulunamadı!**' });

            try {
                await interaction.member.roles.add(role);
                
                const msg = isTR ? '✅ **Başarıyla doğrulandınız! Türkçe rolünüz verildi.**' : '✅ **Successfully verified! English role added.**';
                
                // ESKİ JİLET LOG FORMATINA GERİ DÖNDÜRÜLDÜ
                const logChannelId = ayarlar.KAYIT_LOG_KANAL_ID;
                if (logChannelId) {
                    const logChannel = interaction.client.channels.cache.get(logChannelId);
                    if (logChannel) {
                        const langText = isTR ? '🇹🇷 Türkçe (TR)' : '🇬🇧 İngilizce (EN)';
                        
                        const verifyLogEmbed = new EmbedBuilder()
                            .setColor(isTR ? '#E60000' : '#00247D')
                            .setTitle('✅ Yeni Kullanıcı Kayıt Oldu')
                            .setDescription(`👤 **Kullanıcı -->** <@${interaction.user.id}>\n` +
                                            `🆔 **Kullanıcı ID -->** \`${interaction.user.id}\`\n` +
                                            `🌍 **Seçtiği Dil -->** \`${langText}\`\n` +
                                            `⏰ **Kayıt Zamanı -->** <t:${Math.floor(Date.now() / 1000)}:F>\n\n` +
                                            `❗️ \`Bilgi:\` **İlgili rol kullanıcıya başarıyla tanımlandı.**`)
                            .setThumbnail(interaction.user.displayAvatarURL({ dynamic: true }))
                            .setFooter({ text: 'Luas • Doğrulama Sistemi' })
                            .setTimestamp();

                        await logChannel.send({ embeds: [verifyLogEmbed] }).catch(() => {});
                    }
                }
                
                return interaction.editReply({ content: msg });
            } catch (error) {
                return interaction.editReply({ content: '❌ **Botun yetkisi yok!**' });
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

    // 4. MODAL (FORM) KONTROLÜ - (Özel Key ve Bilet Açma)
    if (interaction.isModalSubmit()) {
        
        // --- BİLET OLUŞTURMA İŞLEMİ (Form Onaylandıktan Sonra) ---
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

                // Bilet içine atılacak mesaj (Afili Ticket Resmiyle)
                const ticketEmbed = new EmbedBuilder()
                    .setColor('#0099FF')
                    .setTitle(baslik)
                    .setDescription(`Merhaba <@${interaction.user.id}>,\n\nDestek ekibimiz en kısa sürede seninle ilgilenecektir.\n\n📝 **Kullanıcının Belirttiği Sorun:**\n\`\`\`${reason}\`\`\`\n\n\`Bilet Numarası:\` **#${ticketNo}**`)
                    .setImage('https://i.ibb.co/Q4hNKq4/Luas-Ticket.png') 
                    .setFooter({ text: 'Luas • Destek Sistemi' })
                    .setTimestamp();

                const ticketButtons = new ActionRowBuilder().addComponents(
                    new ButtonBuilder()
                        .setCustomId('claim_ticket')
                        .setLabel('✋ Sahiplen')
                        .setStyle(ButtonStyle.Success),
                    new ButtonBuilder()
                        .setCustomId('close_ticket')
                        .setLabel('🔒 Bileti Kapat')
                        .setStyle(ButtonStyle.Danger)
                );

                await ticketChannel.send({ content: `<@${interaction.user.id}> | <@&${ayarlar.DESTEK_EKIBI_ROL_ID}>`, embeds: [ticketEmbed], components: [ticketButtons] });

                await interaction.editReply({ content: `✅ **Biletiniz başarıyla oluşturuldu! Buraya tıklayarak gidebilirsiniz: ${ticketChannel}**` });
            } catch (err) {
                console.error(err);
                await interaction.editReply({ content: '❌ Bilet oluşturulurken bir hata meydana geldi.' });
            }
            return;
        }

        // --- ÖZEL KEY OLUŞTURMA (Modal) ---
        if (interaction.customId === 'customKeyModal') {
            await interaction.deferReply({ ephemeral: true });
            
            const username = interaction.fields.getTextInputValue('usernameInput');
            const password = interaction.fields.getTextInputValue('keyInput');
            const duration = interaction.fields.getTextInputValue('durationInput');

            try {
                const existing = await UserModel.findOne({ username, password });
                if (existing) return interaction.editReply({ content: '⚠️ **Bu kullanıcı adı ve key zaten veritabanında kayıtlı!**' });

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