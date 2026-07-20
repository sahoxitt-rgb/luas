require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

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
    hwid: { type: String, default: null },
    plan: { type: String, default: "free" },
    discordId: { type: String, default: null } // 1 kez key hakkı için Discord ID takibi
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
// 3. DISCORD BOT & BUTON YÖNETİMİ
// ==========================================
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

client.once('ready', async () => {
    console.log(`🤖 Discord botu aktif edildi! Giriş: ${client.user.tag}`);

    // Eğer komutları harici (commands klasöründen) okutuyorsan burayı silebilirsin. 
    // Tek dosyada topladıysan /bedava-key buraya da eklenebilir.
});

// Buton ve Komut Etkileşimleri
client.on('interactionCreate', async interaction => {
    // 1) /bedava-key Komutu Çalıştırıldığında Paneli Gönderir
    if (interaction.isChatInputCommand() && interaction.commandName === 'bedava-key') {
        const embed = new EmbedBuilder()
            .setColor('#2B2D31')
            .setTitle('🚀 LUAPREMIUM • ÜCRETSİZ KEY PANELİ')
            .setDescription(
                '> 🎯 **Aşağıdaki butona basarak HWID kilitli ücretsiz keyini hemen alabilirsin!**\n\n' +
                '➔ **Sistem İşleyişi:**\n' +
                '   > 🔹 Butona tıkladığın anda sistem sana özel bir key oluşturur.\n' +
                '   > 🔹 Key ve **Key ID** bilgin doğrudan **DM (Özel Mesaj)** kutuna gönderilir.\n' +
                '   > 🔹 Key, giriş yaptığın ilk bilgisayara (HWID) güvenle kilitlenir.\n\n' +
                '⚠️ *Not: Botun sana mesaj atabilmesi için DM kutunun açık olması gerekir.*'
            )
            .setThumbnail(interaction.guild.iconURL({ dynamic: true }))
            .setFooter({ text: `${interaction.guild.name} • Güvenli Lisans Sistemi`, iconURL: interaction.client.user.displayAvatarURL() });

        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('get_free_key')
                    .setLabel('🎫 Hemen Ücretsiz Key Al')
                    .setStyle(ButtonStyle.Success)
            );

        await interaction.reply({ content: '✅ Şık key paneli kanala başarıyla kuruldu!', ephemeral: true });
        await interaction.channel.send({ embeds: [embed], components: [row] });
        return;
    }

    // 2) Kullanıcı "Hemen Ücretsiz Key Al" Butonuna Bastığında
    if (interaction.isButton() && interaction.customId === 'get_free_key') {
        await interaction.deferReply({ ephemeral: true });
        const discordId = interaction.user.id;

        try {
            // Kullanıcının daha önce key alıp almadığını kontrol et (1 kez hakkı var)
            let user = await UserModel.findOne({ discordId: discordId });

            if (user) {
                // Zaten varsa mevcut keyini tekrar DM at
                const existingEmbed = new EmbedBuilder()
                    .setTitle("🔑 Zaten Bir Keyin Bulunuyor!")
                    .setDescription(`Daha önce oluşturduğun bilgiler aşağıdadır:\n\n👤 **Kullanıcı Adı:** \`${user.username}\`\n🔑 **Key (Şifre):** \`${user.password}\`\n📌 **Plan:** \`${user.plan}\``)
                    .setColor(0xFFA500)
                    .setTimestamp();

                try {
                    await interaction.user.send({ embeds: [existingEmbed] });
                    await interaction.editReply({ content: "⚠️ Sistemde kayıtlı bir keyin zaten var! Bilgilerin özel mesaj (DM) olarak tekrar gönderildi." });
                } catch (dmErr) {
                    await interaction.editReply({ content: "⚠️ Zaten kayıtlı bir keyin var ancak DM kutun kapalı! Bilgilerin:", embeds: [existingEmbed] });
                }
                return;
            }

            // Yeni Free Key Oluştur ve Kaydet
            const username = "luas";
            const password = "Luas-" + generateRandomString(6);
            
            user = new UserModel({
                username: username,
                password: password,
                plan: "free",
                discordId: discordId
            });
            await user.save();

            const newEmbed = new EmbedBuilder()
                .setTitle("🔑 Ücretsiz Key'in Başarıyla Oluşturuldu!")
                .setDescription(`Giriş bilgileriniz aşağıdadır:\n\n👤 **Kullanıcı Adı:** \`${username}\`\n🔑 **Key (Şifre):** \`${password}\`\n📌 **Plan:** \`free\``)
                .setColor(0x00A0FF)
                .setTimestamp();

            try {
                await interaction.user.send({ embeds: [newEmbed] });
                await interaction.editReply({ content: "✅ Ücretsiz key'in başarıyla oluşturuldu ve özel mesaj (DM) olarak gönderildi!" });
            } catch (dmError) {
                await interaction.editReply({ content: "⚠️ Key oluşturuldu ancak DM kutun kapalı olduğu için buradan paylaşıldı:", embeds: [newEmbed] });
            }
        } catch (err) {
            console.error(err);
            await interaction.editReply({ content: "❌ İşlem sırasında bir veritabanı hatası oluştu!" });
        }
    }
});

if (!process.env.BOT_TOKEN) {
    console.error("⛔ BOT_TOKEN bulunamadı!");
} else {
    client.login(process.env.BOT_TOKEN).catch(err => {
        console.error("⛔ Discord bağlantı hatası:", err);
    });
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🌐 Web Sunucusu ${PORT} portunda çalışıyor.`);
});