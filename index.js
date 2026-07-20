const express = require('express');
const mongoose = require('mongoose');
const app = express();

app.use(express.json());

// MongoDB Bağlantı Adresi
const MONGO_URI = process.env.MONGO_URI || "mongodb+srv://luas:luasorj@cluster0.i2qdv7n.mongodb.net/?appName=Cluster0";

mongoose.connect(MONGO_URI)
    .then(() => console.log("MongoDB bağlantısı başarılı!"))
    .catch(err => console.error("MongoDB bağlantı hatası:", err));

// Kullanıcı / Key Şeması (HWID Alanı Eklendi)
const UserSchema = new mongoose.Schema({
    username: { type: String, required: true },
    password: { type: String, required: true },
    hwid: { type: String, default: null }, // İlk giren cihaza kilitlenir
    plan: { type: String, default: "free" } // "free" veya "premium"
});
const UserModel = mongoose.model('User', UserSchema);

// Rastgele 6 karakter üreten fonksiyon
function generateRandomString(length) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

// 1. KEY OLUŞTURMA ENDPOINT'İ
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

// 2. GİRİŞ / DOĞRULAMA ENDPOINT'İ (HWID Korumalı)
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

        // HWID Kontrolü ve Kilitleme
        if (hwid) {
            if (!user.hwid) {
                // Key ilk defa kullanılıyor, bu cihaza kilitle
                user.hwid = hwid;
                await user.save();
            } else if (user.hwid !== hwid) {
                // Başka bir cihaza aitse girişine izin verme
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

// Sunucuyu başlatma
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Sunucu ${PORT} portunda çalışıyor.`);
});