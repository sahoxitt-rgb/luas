const { PermissionFlagsBits } = require('discord.js');

module.exports = {
    name: 'duyuru',
    description: 'Webhook ile şık bir duyuru gönderir.',
    async executeText(message, args) {
        if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) {
            return message.reply({ content: '❌ Bu komutu kullanmak için yetkin yok kanka!' }).catch(() => {});
        }

        const duyuruMetni = args.join(' ');
        const resimDosyasi = message.attachments.first();

        if (!duyuruMetni && !resimDosyasi) {
            return message.reply({ content: '❌ Kanka duyuru metni yazmalısın veya bir görsel eklemelisin!' }).catch(() => {});
        }

        const webhookUrl = "https://canary.discord.com/api/webhooks/1531299789726023962/OC1RWIlWqrlMSWsdDRSC6LVK7N6ZX6P64hEE0jOkjaPuIEcciqIgsa4jlV0IZ4AcpnSg";

        try {
            const formData = new FormData();
            
            let payloadJson = {
                username: "Luas Duyuru Sistemi",
                avatar_url: message.client.user.displayAvatarURL(),
                content: duyuruMetni ? `📢 **YENİ DUYURU**\n\n${duyuruMetni}` : "📢 **YENİ DUYURU**"
            };

            formData.append('payload_json', JSON.stringify(payloadJson));

            if (resimDosyasi) {
                const imgRes = await fetch(resimDosyasi.url);
                const blob = await imgRes.blob();
                formData.append('file0', blob, resimDosyasi.name);
            }

            const response = await fetch(webhookUrl, {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                return message.channel.send({ content: '❌ Webhook üzerinden resim gönderilemedi kanka.' }).catch(() => {});
            }

            await message.delete().catch(() => {});
        } catch (error) {
            console.error("Duyuru Komutu Hatası:", error);
            message.channel.send({ content: '❌ Duyuru gönderilirken bir hata oluştu.' }).catch(() => {});
        }
    }
};