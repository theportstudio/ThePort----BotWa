const fs = require("fs")
const path = require("path")
const axios = require("axios")
const settings = require("../../settings")

module.exports = {
  name: "rules",
  alias: ["aturan", "larangan"],
  loginRequired: false,

  async execute(ctx) {
    try {
      const userJid = ctx.sender || ctx.msg?.key?.participant || ctx.msg?.key?.remoteJid || "unknown@s.whatsapp.net"
      const username = userJid.split("@")[0]
      const mentions = [userJid]

      const rules_txt = `*📜 RULES BOT*

Halo @${username} 👋  
Dengan menggunakan *${settings.botName}*,  
Anda dianggap telah menyetujui semua aturan berikut:

*📌 Aturan Umum*
• Gunakan bot dengan bijak dan seperlunya  
• Dilarang menggunakan bot untuk hal ilegal  
• Segala aktivitas adalah tanggung jawab user 
• Share nomor bot atas izin owner

*🚫 Larangan Keras*
• Dilarang spam command secara berlebihan  
• Dilarang berkata kasar, toxic, atau hate speech  
• Dilarang menyalahgunakan fitur bot  

*⚠️ Sistem Peringatan*
• Pelanggaran pertama → Peringatan  
• Pelanggaran kedua → Banned sementara  
• Pelanggaran berat → Banned permanen  

Keputusan owner bersifat mutlak dan tidak dapat diganggu gugat.

*💰 Transaksi & Premium*
• Tidak ada refund kecuali dalam kondisi darurat  
• Pastikan transfer sesuai instruksi  
• Kesalahan transfer bukan tanggung jawab owner  
• Premium memberikan fitur & limit lebih besar  

*⏳ Sistem Limit*
• Setiap user memiliki batas penggunaan  
• Limit akan reset setiap 24 jam  
• Jika habis, tunggu reset atau upgrade premium  

*🛠 Bantuan*
• Jika menemukan bug/error, hubungi *.owner*  
• Bot akan dimonitor dan diperbaiki secara berkala  

*📢 Penutup*
Dengan menggunakan bot ini, Anda setuju  
dengan seluruh aturan yang berlaku.

Terima kasih telah menggunakan bot ini 🙏`

      await ctx.sock.sendMessage(
        ctx.from,
        {
          text: rules_txt,
          mentions: mentions,
          contextInfo: {
            mentionedJid: mentions,
            externalAdReply: {
              title: `${settings.botName} v1.0`,
              body: "ThePort • Bot",
              thumbnailUrl: settings.menuImage || "",
              sourceUrl: "https://fareldev.vercel.app",
              mediaType: 1,
              renderLargerThumbnail: true
            }
          }
        },
        { quoted: ctx.msg }
      )

    } catch (err) {
      await ctx.sock.sendMessage(
        ctx.from,
        { text: "❌ Terjadi kesalahan" },
        { quoted: ctx.msg }
      )
    }
  }
}