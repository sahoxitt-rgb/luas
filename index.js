const express = require('express');
const mongoose = require('mongoose');
const app = express();

app.use(express.json());

// MongoDB Bağlantı Adresi (Render'da Environment Variables kısmına MONGO_URI ekleyebilirsin)
const MONGO_URI = process.env.MONGO_URI || "mongodb+srv://luas:luasorj@cluster0.i2qdv7n.mongodb.net/?appName=Cluster0";

mongoose.connect(MONGO_URI)
    .then(() => console.log("MongoDB bağlantısı başarılı!"))
    .catch(err => console.error("MongoDB bağlantı hatası:", err));

// Kullanıcı / Key Şeması
const UserSchema = new mongoose.Schema({
    username: { type: String, required: true },
    password: { type: String, required: true },
    plan: { type: String, default: "free" } // "free" veya "premium"
});
const UserModel = mongoose.model('User', UserSchema);
 
// Rastgele 6 karakter üreten fonksiyon (Harf ve Rakam karışık)
function generateRandomString(length) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

// 1. KEY OLUŞTURMA ENDPOINT'İ (Kullanıcı adı sabit: luas, Şifre: Luas-XXXXXX)
app.post('/api/create-key', async (req, res) => {
    try {
        const { planType } = req.body; // İsteğe bağlı 'free' veya 'premium' gönderebilirsin
        const username = "luas"; // Kullanıcı adı her zaman sabit
        const randomPart = generateRandomString(6); // 6 rastgele karakter
        const password = "Luas-" + randomPart; // Örn: Luas-A9x2K1
        
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

// 2. GİRİŞ / DOĞRULAMA ENDPOINT'İ (Roblox UI'dan gelen isteği MongoDB'de arayan kısım)
app.post('/api/verify', async (req, res) => {
    const { username, password, hwid } = req.body;

    if (!username || !password) {
        return res.json({ success: false, message: "Kullanıcı adı veya şifre boş bırakılamaz!" });
    }

    try {
        // MongoDB'de kullanıcı adı ve şifreyi aratıyoruz
        const user = await UserModel.findOne({ username: username, password: password });

        if (user) {
            res.json({
                success: true,
                message: "Giriş başarılı!",
                plan: user.plan // 'free' veya 'premium' döner
            });
        } else {
            res.json({
                success: false,
                message: "Geçersiz kullanıcı adı veya şifre!"
            });
        }
    } catch (error) {
        res.status(500).json({ success: false, message: "Veritabanı hatası!" });
    }
});

// Sunucuyu başlatma
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Sunucu ${PORT} portunda çalışıyor.`);
}); 