require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const { Client, GatewayIntentBits, REST, Routes, Collection, EmbedBuilder } = require('discord.js');

// ID'leri tuttuğumuz dosyayı içeri aktarıyoruz
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

        // HWID Kontrolü
        if (hwid && hwid !== "" && hwid !== "nil") {
            if (!user.hwid || user.hwid === "" || user.hwid === "null") {
                user.hwid = hwid;
                await user.save();
            } else if (user.hwid !== hwid) {
                return res.json({ success: false, message: "Bu key başka bir cihaza (HWID) kayıtlı!" });
            }
        }

        res.json({
            success: true,
            message: "Giriş başarılı!",
            plan: user.plan
        });
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
            console.log('🧹 Eski global ve guild komut kalıntıları tamamen temizleniyor...');
            await rest.put(Routes.applicationCommands(client.user.id), { body: [] });
            await rest.put(Routes.applicationGuildCommands(client.user.id, process.env.GUILD_ID), { body: [] });
            
            await rest.put(Routes.applicationGuildCommands(client.user.id, process.env.GUILD_ID), { body: commandArray });
            console.log('✨ Komutlar tertemiz bir şekilde sadece sunucuya yüklendi ve tekrarlar yok edildi!');
        } else {
            await rest.put(Routes.applicationCommands(client.user.id), { body: commandArray });
            console.log('✨ Slash komutları global olarak yüklendi.');
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

    // 2. BUTON ETKİLEŞİMLERİ (DOGRULAMA VE KEY SİSTEMİ)
    if (interaction.isButton()) {
        const { customId } = interaction;

        // --- KAYIT (DOGRULAMA) SİSTEMİ ---
        if (customId === 'verify_tr' || customId === 'verify_en') {
            await interaction.deferReply({ ephemeral: true });
            
            const isTR = customId === 'verify_tr';
            const roleId = isTR ? ayarlar.TR_ROL_ID : ayarlar.EN_ROL_ID; 
            const role = interaction.guild.roles.cache.get(roleId);

            if (!role) {
                return interaction.editReply({ content: '❌ **Sistem hatası: Ayarlanan rol sunucuda bulunamadı! Lütfen roller.js dosyasındaki ID\'leri kontrol et.**' });
            }

            try {
                await interaction.member.roles.add(role);
                
                const msg = isTR 
                    ? '✅ **Başarıyla doğrulandınız! Türkçe rolünüz verildi ve kanallar açıldı.**' 
                    : '✅ **Successfully verified! English role added and channels unlocked.**';
                
                // Kayıt Logunu Gönderme
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
                console.error(error);
                return interaction.editReply({ content: '❌ **Rol verilirken bir hata oluştu. Botun rolünün, verilecek rolden daha ÜSTTE olduğundan emin olun!**' });
            }
        }

        // --- KEY SİSTEMİ ---
        let commandName = '';
        if (customId === 'get_free_key') {
            commandName = 'bedava-key';
        } else if (customId === 'get_free_key_en') {
            commandName = 'free-key';
        } else if (customId === 'open_custom_modal') {
            commandName = 'ozel-key';
        }
        
        if (commandName !== '') {
            const command = client.commands.get(commandName);
            if (command && typeof command.handleButton === 'function') {
                await command.handleButton(interaction, UserModel);
            }
        }
        return;
    }

    // 3. MODAL (FORM) KONTROLÜ - ÖZEL KEY OLUŞTURMA
    if (interaction.isModalSubmit()) {
        if (interaction.customId === 'customKeyModal') {
            await interaction.deferReply({ ephemeral: true });
            
            const username = interaction.fields.getTextInputValue('usernameInput');
            const password = interaction.fields.getTextInputValue('keyInput');
            const duration = interaction.fields.getTextInputValue('durationInput');

            try {
                const existing = await UserModel.findOne({ username: username, password: password });
                if (existing) {
                    return interaction.editReply({ content: '⚠️ **Bu kullanıcı adı ve key zaten veritabanında kayıtlı!**' });
                }

                // 6 haneli rastgele ID
                const uniqueKeyId = Math.floor(100000 + Math.random() * 900000).toString();

                const newUser = new UserModel({
                    username: username,
                    password: password,
                    keyId: uniqueKeyId,
                    plan: "premium",
                    duration: duration,
                    discordId: interaction.user.id,
                    creatorTag: interaction.user.tag
                });
                await newUser.save();

                // YENİ TASARIMLI LOG MESAJI
                const replyEmbed = new EmbedBuilder()
                    .setColor('#FFD700') // Premium Sarısı
                    .setTitle('💎 Özel Key Oluşturuldu')
                    .setDescription(`🚀 **Sistem -->** \`Luas Premium\`\n` +
                                    `🔑 **Özel Key -->** \`${password}\`\n` +
                                    `🆔 **Özel Key ID -->** \`${uniqueKeyId}\`\n` +
                                    `🪄 **Oluşturan Kişi -->** <@${interaction.user.id}>\n` +
                                    `👑 **Key Sahibi -->** \`${username}\`\n` +
                                    `📝 **Oluşturulma Sebebi -->** Premium Erişim\n` +
                                    `⏰ **Oluşturulma Zamanı -->** <t:${Math.floor(Date.now() / 1000)}:F>\n` +
                                    `⏱️ **Bitiş Zamanı -->** \`${duration}\`\n\n` +
                                    `❗️ \`Dikkat!!\` __**KEY TEK KULLANIMLIKTIR KİMSE İLE PAYLAŞMAYIN**__`)
                    .setFooter({ text: 'Luas • Premium Lisans Sistemi' })
                    .setTimestamp();

                const logChannelId = process.env.LOG_CHANNEL_ID;
                if (logChannelId) {
                    const logChannel = interaction.client.channels.cache.get(logChannelId);
                    if (logChannel) await logChannel.send({ embeds: [replyEmbed] }).catch(() => {});
                }

                await interaction.editReply({ embeds: [replyEmbed] });
            } catch (err) {
                console.error(err);
                await interaction.editReply({ content: '❌ **Veritabanına kayıt eklenirken hata oluştu!**' });
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