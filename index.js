require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

const app = express();
app.use(express.json());

const MONGO_URI = process.env.MONGO_URI || "mongodb+srv://luas:luasorj@cluster0.i2qdv7n.mongodb.net/?appName=Cluster0";

mongoose.connect(MONGO_URI)
    .then(() => console.log("MongoDB bağlantısı başarılı!"))
    .catch(err => console.error("MongoDB bağlantı hatası:", err));

const UserSchema = new mongoose.Schema({
    username: { type: String, required: true },
    password: { type: String, required: true },
    hwid: { type: String, default: null },
    plan: { type: String, default: "free" },
    discordId: { type: String, default: null }
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

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

client.once('ready', async () => {
    console.log(`🤖 Discord botu aktif edildi! Giriş: ${client.user.tag}`);

    const commands = [
        new SlashCommandBuilder().setName('bedava-key').setDescription('Ücretsiz key paneli kurar.'),
        new SlashCommandBuilder().setName('ozel-key').setDescription('Özel/Premium key paneli kurar.')
    ].map(command => command.toJSON());

    const rest = new REST({ version: '10' }).setToken(process.env.BOT_TOKEN);
    try {
        await rest.put(Routes.applicationCommands(client.user.id), { body: commands });
        console.log('✨ Discord Slash komutları yüklendi.');
    } catch (error) {
        console.error('Komut yükleme hatası:', error);
    }
});

// Güvenli Komut İşleyicisi (Zaman aşımını önler)
client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;

    if (interaction.commandName === 'bedava-key' || interaction.commandName === 'ozel-key') {
        try {
            await interaction.deferReply({ ephemeral: true });

            const isPremium = interaction.commandName === 'ozel-key';
            const titleText = isPremium ? '🚀 LUAPREMIUM • ÖZEL / PREMIUM KEY PANELİ' : '🚀 LUAPREMIUM • ÜCRETSİZ KEY PANELİ';
            const customIdVal = isPremium ? 'get_premium_key' : 'get_free_key';

            const embed = new EmbedBuilder()
                .setColor(isPremium ? '#FFD700' : '#2B2D31')
                .setTitle(titleText)
                .setDescription(
                    '> 🎯 **Aşağıdaki butona basarak HWID kilitli keyini hemen alabilirsin!**\n\n' +
                    '➔ **Sistem İşleyişi:**\n' +
                    '   > 🔹 Butona tıkladığın anda sistem sana özel bir key oluşturur.\n' +
                    '   > 🔹 Key ve bilgilerin doğrudan **DM (Özel Mesaj)** kutuna gönderilir.\n' +
                    '   > 🔹 Key, giriş yaptığın ilk bilgisayara (HWID) güvenle kilitlenir.\n\n' +
                    '⚠️ *Not: Botun sana mesaj atabilmesi için DM kutunun açık olması gerekir.*'
                )
                .setThumbnail(interaction.guild.iconURL({ dynamic: true }))
                .setFooter({ text: `${interaction.guild.name} • Güvenli Lisans Sistemi`, iconURL: interaction.client.user.displayAvatarURL() });

            const row = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId(customIdVal)
                        .setLabel(isPremium ? '💎 Hemen Premium Key Al' : '🎫 Hemen Ücretsiz Key Al')
                        .setStyle(isPremium ? ButtonStyle.Success : ButtonStyle.Primary)
                );

            await interaction.channel.send({ embeds: [embed], components: [row] });
            await interaction.editReply({ content: '✅ Şık key paneli kanala başarıyla kuruldu!' });
        } catch (err) {
            console.error(err);
            if (!interaction.replied && !interaction.deferred) {
                await interaction.reply({ content: '❌ Bir hata oluştu!', ephemeral: true }).catch(() => {});
            } else {
                await interaction.editReply({ content: '❌ Komut işlenirken bir hata oluştu!' }).catch(() => {});
            }
        }
        return;
    }
});

client.on('interactionCreate', async interaction => {
    if (!interaction.isButton()) return;
    if (interaction.customId !== 'get_free_key' && interaction.customId !== 'get_premium_key') return;

    try {
        await interaction.deferReply({ ephemeral: true });
        const discordId = interaction.user.id;
        const planType = interaction.customId === 'get_premium_key' ? 'premium' : 'free';

        let user = await UserModel.findOne({ discordId: discordId });

        if (user) {
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

        const username = "luas";
        const password = "Luas-" + generateRandomString(6);
        
        user = new UserModel({
            username: username,
            password: password,
            plan: planType,
            discordId: discordId
        });
        await user.save();

        const newEmbed = new EmbedBuilder()
            .setTitle("🔑 Key'in Başarıyla Oluşturuldu!")
            .setDescription(`Giriş bilgileriniz aşağıdadır:\n\n👤 **Kullanıcı Adı:** \`${username}\`\n🔑 **Key (Şifre):** \`${password}\`\n📌 **Plan:** \`${planType}\``)
            .setColor(0x00A0FF)
            .setTimestamp();

        try {
            await interaction.user.send({ embeds: [newEmbed] });
            await interaction.editReply({ content: "✅ Key'in başarıyla oluşturuldu ve özel mesaj (DM) olarak gönderildi!" });
        } catch (dmError) {
            await interaction.editReply({ content: "⚠️ Key oluşturuldu ancak DM kutun kapalı olduğu için buradan paylaşıldı:", embeds: [newEmbed] });
        }
    } catch (err) {
        console.error(err);
        await interaction.editReply({ content: "❌ İşlem sırasında bir veritabanı hatası oluştu!" });
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