require('dotenv').config(); // .env dosyasını okuması için

const express = require('express');
const mongoose = require('mongoose');
const { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder, EmbedBuilder } = require('discord.js');

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

// Key Oluşturma API
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

// Ortak Giriş/Doğrulama Fonksiyonu (Kod tekrarı olmasın diye)
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

// 404 hatasını kalıcı olarak yok etmek için hem /login hem /api/login yollarını aktif ettik!
app.post('/login', handleLogin);
app.post('/api/login', handleLogin);
app.post('/api/verify', handleLogin);

// ==========================================
// 3. DISCORD BOT BAĞLANTISI & KOMUTLAR
// ==========================================
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

// Bot aktif olduğunda slash komutlarını Discord'a kaydet
client.once('ready', async () => {
    console.log(`🤖 Discord botu başarıyla aktif edildi! Giriş yapılan hesap: ${client.user.tag}`);

    const commands = [
        new SlashCommandBuilder().setName('bedava-key').setDescription('Ücretsiz key oluşturur.'),
        new SlashCommandBuilder().setName('ozel-key').setDescription('Özel/Premium key oluşturur.'),
        new SlashCommandBuilder().setName('hwid-sifirla').setDescription('Keyinize bağlı HWID sıfırlar.')
            .addStringOption(option => option.setName('key').setDescription('Sıfırlanacak Key').setRequired(true))
    ].map(command => command.toJSON());

    const rest = new REST({ version: '10' }).setToken(process.env.BOT_TOKEN);
    try {
        await rest.put(Routes.applicationCommands(client.user.id), { body: commands });
        console.log('✨ Discord Slash komutları başarıyla yüklendi.');
    } catch (error) {
        console.error('Komut yükleme hatası:', error);
    }
});

// Key oluşturup kullanıcıya gönderme fonksiyonu (Zaman aşımını önlemek için deferReply kullanır)
async function createAndSendKey(interaction, planType) {
    await interaction.deferReply({ ephemeral: true });

    try {
        const username = "luas";
        const password = "Luas-" + generateRandomString(6);
        
        const newKey = new UserModel({
            username: username,
            password: password,
            plan: planType
        });
        await newKey.save();

        const embed = new EmbedBuilder()
            .setTitle("🔑 Başarıyla Key Oluşturuldu!")
            .setDescription(`Aşağıdaki bilgileri kullanarak giriş yapabilirsin.\n\n👤 **Kullanıcı Adı:** \`${username}\`\n🔑 **Key (Şifre):** \`${password}\`\n📌 **Plan:** \`${planType}\``)
            .setColor(0x00A0FF)
            .setTimestamp();

        try {
            await interaction.user.send({ embeds: [embed] });
            await interaction.editReply({ content: "✅ Key'in başarıyla özel mesaj (DM) olarak gönderildi!" });
        } catch (dmError) {
            await interaction.editReply({ content: "⚠️ DM kutun kapalı olduğu için gizli mesaj olarak buraya gönderildi:", embeds: [embed] });
        }
    } catch (err) {
        console.error(err);
        await interaction.editReply({ content: "❌ Key oluşturulurken veritabanı hatası oluştu!" });
    }
}

// Komut ve Etkileşim Yönetimi
client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;

    const { commandName } = interaction;

    if (commandName === 'bedava-key') {
        await createAndSendKey(interaction, 'free');
    } 
    else if (commandName === 'ozel-key') {
        await createAndSendKey(interaction, 'premium');
    }
    else if (commandName === 'hwid-sifirla') {
        await interaction.deferReply({ ephemeral: true });
        const keyToReset = interaction.options.getString('key');
        
        try {
            const user = await UserModel.findOne({ password: keyToReset });
            if (!user) {
                return interaction.editReply({ content: "❌ Böyle bir key bulunamadı!" });
            }
            user.hwid = null;
            await user.save();
            await interaction.editReply({ content: `✅ **${keyToReset}** adlı keyin HWID kilidi başarıyla sıfırlandı!` });
        } catch (err) {
            await interaction.editReply({ content: "❌ Veritabanı hatası oluştu." });
        }
    }
});

// Eski tip ping komutu (Test için)
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