require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const { Client, GatewayIntentBits, REST, Routes, Collection } = require('discord.js');

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
    discordId: { type: String, default: null }
});
const UserModel = mongoose.model('User', UserSchema);

// ==========================================
// EXPRESS API (ROBLOX / GİRİŞ KÖPRÜSÜ)
// ==========================================
const handleLogin = async (req, res) => {
    const { username, password, hwid } = req.body;

    if (!username || !password) {
        return res.json({ success: false, message: "Kullanıcı adı veya şifre boş bırakılamaz!" });
    }

    try {
        const user = await UserModel.findOne({ username: username, password: password });

        if (!user) {
            return res.json({ success: false, message: "Geçersiz kullanıcı adı veya şifre!" });
        }

        if (hwid) {
            if (!user.hwid) {
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
        // ÇİFT KOMUT GÖRÜNMESİNİ ENGELLEYEN AKILLI SİSTEM
        if (process.env.GUILD_ID) {
            console.log('🔄 Eski global komut kalıntıları temizleniyor...');
            // Önce eski global komutların tamamını sıfırlıyoruz ki sunucu komutlarıyla çakışıp çiftlemesin
            await rest.put(Routes.applicationCommands(client.user.id), { body: [] });
            
            // Komutları doğrudan test ettiğin sunucuya yüklüyoruz (Böylece değişiklikler anında yansır)
            await rest.put(Routes.applicationGuildCommands(client.user.id, process.env.GUILD_ID), { body: commandArray });
            console.log('✨ Komutlar SUNUCUYA özel olarak yüklendi ve tekrarlar temizlendi!');
        } else {
            // Eğer .env dosyasında GUILD_ID yoksa mecburen global yükler (Discord yansıması 1 saati bulabilir)
            await rest.put(Routes.applicationCommands(client.user.id), { body: commandArray });
            console.log('✨ Slash komutları GLOBAL olarak yüklendi. (Not: Değişikliklerin sunucunuza gelmesi biraz zaman alabilir)');
        }
    } catch (error) {
        console.error("⛔ Komut pushlanırken hata oluştu:", error);
    }
});

client.on('interactionCreate', async interaction => {
    // 1) Slash Komutları
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

    // 2) Buton Etkileşimleri (Bedava veya Özel Key İstekleri)
    if (interaction.isButton()) {
        const commandName = interaction.customId.includes('free') ? 'bedava-key' : 'ozel-key';
        const command = client.commands.get(commandName);
        if (command && typeof command.handleButton === 'function') {
            await command.handleButton(interaction, UserModel);
        }
        return;
    }

    // 3) Modal (Form) Gönderimleri (Özel Premium Key Oluşturma)
    if (interaction.isModalSubmit()) {
        if (interaction.customId === 'customKeyModal') {
            await interaction.deferReply({ ephemeral: true });
            
            const username = interaction.fields.getTextInputValue('usernameInput');
            const password = interaction.fields.getTextInputValue('keyInput');
            const duration = interaction.fields.getTextInputValue('durationInput');

            try {
                const existing = await UserModel.findOne({ username: username, password: password });
                if (existing) {
                    return interaction.editReply({ content: '⚠️ Bu kullanıcı adı ve key zaten veritabanında kayıtlı!' });
                }

                // Premium için benzersiz harf ve sayı karışık Key ID oluşturma
                const uniqueKeyId = "KID-PREM-" + Math.random().toString(36).substring(2, 8).toUpperCase();

                const newUser = new UserModel({
                    username: username,
                    password: password,
                    keyId: uniqueKeyId,
                    plan: "premium",
                    duration: duration,
                    discordId: interaction.user.id
                });
                await newUser.save();

                await interaction.editReply({ 
                    content: `✅ **Özel Key Başarıyla Oluşturuldu!**\n\n🆔 **Key ID:** \`${uniqueKeyId}\`\n👤 **Kullanıcı Adı:** \`${username}\`\n🔑 **Key:** \`${password}\`\n⏳ **Süre:** \`${duration}\`\n\n*Not: HWID sıfırlamak veya key silmek için bu Key ID'yi kullanın.*` 
                });
            } catch (err) {
                console.error(err);
                await interaction.editReply({ content: '❌ Veritabanına kayıt eklenirken hata oluştu!' });
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