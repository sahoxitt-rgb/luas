require('dotenv').config(); // .env dosyasını okuması için en üste ekledik

const express = require('express');
const mongoose = require('mongoose');
const { Client, GatewayIntentBits } = require('discord.js');

const app = express();
app.use(express.json());

// ==========================================
// 1. MONGODB BAĞLANTISI VE ŞEMA
// ==========================================
const MONGO_URI = process.env.MONGO_URI || "mongodb+srv://luas:luasorj@cluster0.i2qdv7n.mongodb.net/?appName=Cluster0";

mongoose.connect(MONGO_URI)
    .then(() => console.log("MongoDB bağlantısı başarılı!"))
    .catch(err => console.error("MongoDB bağlantı hatası:", err));

const UserSchema = new mongoose.Schema({
    username: { type: String, required: true },
    password: { type: String, required: true },
    hwid: { type: String, default: null }, // İlk giren cihaza kilitlenir
    plan: { type: String, default: "free" } // "free" veya "premium"
});
const UserModel = mongoose.model('User', UserSchema);

function generateRandomString(length) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

// ==========================================
// 2. EXPRESS API (ROBLOX KÖPRÜSÜ)
// ==========================================
app.post('/api/create-key', async (req, res) => {
    try {
        const { planType } = req.body;
        const username = "luas"; 
        const randomPart = generateRandomString(6); 
        const password = "Luas-" + randomPart; 
        
        const newKey = new UserModel({
            username: username,
            password: password,
            plan: planType || "free" 
        });

        await newKey.save();

        res.json({
            success: true,
            message: "Key başarıyla oluşturuldu!",
            username: username,
            password: password,
            plan: newKey.plan
        });
    } catch (error) {
        res.status(500).json({ success: false, message: "Sunucu hatası: " + error.message });
    }
});

app.post('/api/verify', async (req, res) => {
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
});

// ==========================================
// 3. DISCORD BOT BAĞLANTISI
// ==========================================
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

// Bot aktif olduğunda loga yazdır
client.once('ready', () => {
    console.log(`🤖 Discord botu başarıyla aktif edildi! Giriş yapılan hesap: ${client.user.tag}`);
});

// Örnek bir komut: Discord'dan bota "!ping" yazarsan cevap verir (Çalıştığını test etmek için)
client.on('messageCreate', (message) => {
    if (message.author.bot) return;

    if (message.content === '!ping') {
        message.reply('Pong! Bot sorunsuz çalışıyor 🏓');
    }
});

// Ortamdan (Environment) BOT_TOKEN'ı çekip giriş yaptırma
if (!process.env.BOT_TOKEN) {
    console.error("⛔ HATA: BOT_TOKEN bulunamadı! .env dosyasını veya Render Environment Variables kısmını kontrol et.");
} else {
    client.login(process.env.BOT_TOKEN).catch(err => {
        console.error("⛔ Discord'a bağlanırken hata oluştu (Token yanlış veya Intent'ler kapalı olabilir):", err);
    });
}

// ==========================================
// 4. SUNUCUYU BAŞLAT
// ==========================================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🌐 Web Sunucusu ${PORT} portunda çalışıyor.`);
});