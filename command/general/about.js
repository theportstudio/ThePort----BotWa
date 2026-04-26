const fs = require("fs")
const path = require("path")
const axios = require("axios")
const settings = require("../../settings")

module.exports = {
  name: "about",
  alias: ["tentang", "info"],
  loginRequired: false,

  async execute(ctx) {
    try {
      const userJid = ctx.sender || ctx.msg?.key?.participant || ctx.msg?.key?.remoteJid || "unknown@s.whatsapp.net"
      const username = userJid.split("@")[0]
      const mentions = [userJid]

      const about_txt = `*📌 ABOUT BOT*

Halo @${username} 👋
Saya adalah *${settings.botName}*  
Bot yang dikembangkan oleh *${settings.ownerName}*

*👨‍💻 Developer*
• Nama   : Farel Alfareza  
• Umur   : 18 Tahun  
• Asal   : Sulawesi Selatan  
• Negara : Indonesia  

*🤖 Bot Info*
• Programmer : Farel Alfareza  
• Developer  : Farel Alfareza  

*🌐 API Digunakan*
• https://api.deline.web.id  
• https://puruboy-api.vercel.app  
• https://api.nexray.web.id  
• https://api.yupra.my.id  
• https://gen.pollinations.ai  
• https://groq.com  
• https://api-faa.my.id  

*📢 Note*
Jika limit habis, silakan hubungi *.owner*  
untuk mendapatkan akses premium.

Terima kasih telah menggunakan bot ini 🙏`

      await ctx.sock.sendMessage(
        ctx.from,
        {
          text: about_txt,
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