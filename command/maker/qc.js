const axios = require("axios")
const sharp = require("sharp")
const { Sticker, StickerTypes } = require("wa-sticker-formatter")

module.exports = {
  name: "qc",
  alias: ["quotec", "quotechat"],
  category: "sticker",
  loginRequired: true,

  async execute(ctx) {
    try {
      const text = ctx.args.join(" ").trim()

      if (!text) {
        return ctx.reply(
          "💡 Gunakan:\n*.qc <teks>*\n\nContoh:\n*.qc halo semuanya*",
          { quoted: ctx.msg }
        )
      }

      if (text.length > 200) {
        return ctx.reply(
          "⚠️ Pesan terlalu panjang. Maksimal 200 karakter.",
          { quoted: ctx.msg }
        )
      }

      await ctx.sock.sendMessage(ctx.from, {
        react: {
          text: "⏳",
          key: ctx.msg.key
        }
      })

      const userId = ctx.sender
      const pushName = ctx.pushName || "User"

      let profileUrl = ""

      try {
        profileUrl = await ctx.sock.profilePictureUrl(userId, "image")
      } catch {
        profileUrl = "https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEjCX5TOKkOk3MBt8V-f8PbmGrdLHCi4BoUOs_yuZ1pekOp8U_yWcf40t66JZ4_e_JYpRTOVCl0m8ozEpLrs9Ip2Cm7kQz4fUnUFh8Jcv8fMFfPbfbyWEEKne0S9e_U6fWEmcz0oihuJM6sP1cGFqdJZbLjaEQnGdgJvcxctqhMbNw632OKuAMBMwL86/s414/pp%20kosong%20wa%20default.jpg"
      }

      const apiUrl = `https://rynekoo-api.hf.space/canvas/quote-chat?text=${encodeURIComponent(text)}&name=${encodeURIComponent(pushName)}&profile=${encodeURIComponent(profileUrl)}&color=%23333`

      const res = await axios.get(apiUrl, {
        responseType: "arraybuffer",
        timeout: 30000
      })

      const webpBuffer = await sharp(res.data)
        .resize(512, 512, {
          fit: "contain",
          background: {
            r: 0,
            g: 0,
            b: 0,
            alpha: 0
          }
        })
        .webp({
          quality: 95,
          nearLossless: true
        })
        .toBuffer()

      const sticker = await new Sticker(webpBuffer)
        .setPack("ThePort • Bot")
        .setAuthor("By Farel Dev")
        .setType(StickerTypes.FULL)
        .setCategories(["✨"])
        .setID(ctx.msg.key.id)
        .setQuality(50)
        .build()

      await ctx.sock.sendMessage(ctx.from, {
        react: {
          text: "✅",
          key: ctx.msg.key
        }
      })

      await ctx.sock.sendMessage(
        ctx.from,
        {
          sticker: sticker
        },
        {
          quoted: ctx.msg
        }
      )
    } catch (err) {
      console.error("QC ERROR:", err)

      await ctx.sock.sendMessage(ctx.from, {
        react: {
          text: "❌",
          key: ctx.msg.key
        }
      })

      await ctx.reply(
        "❌ Gagal membuat stiker quote. Coba lagi nanti ya",
        {
          quoted: ctx.msg
        }
      )
    }
  }
}