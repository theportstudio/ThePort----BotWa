const axios = require("axios")
const sharp = require("sharp")
const { Sticker, StickerTypes } = require("wa-sticker-formatter")

module.exports = {
  name: "emojimix",
  alias: ["emix", "mix"],
  loginRequired: true,

  async execute(ctx) {
    try {
      const text = ctx.args.join(" ")

      if (!text || !text.includes("+")) {
        return ctx.reply(
          "💡 Gunakan format:\n*.emojimix <emoji> + <emoji>*\n\nContoh:\n*.emojimix 🗿 + 😭*",
          { quoted: ctx.msg }
        )
      }

      const [emoji1, emoji2] = text.split("+").map(e => e.trim())

      await ctx.sock.sendMessage(ctx.from, {
        react: {
          text: "⏳",
          key: ctx.msg.key
        }
      })

      const apiUrl = `https://api.deline.web.id/maker/emojimix?emoji1=${encodeURIComponent(emoji1)}&emoji2=${encodeURIComponent(emoji2)}`

      const res = await axios.get(apiUrl)

      if (!res.data.status) {
        throw new Error("Gagal mengambil data dari API")
      }

      const pngUrl = res.data.result.png

      const imageRes = await axios.get(pngUrl, {
        responseType: "arraybuffer"
      })

      const webpBuffer = await sharp(imageRes.data)
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
          quality: 90
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
      console.error("EMOJIMIX ERROR:", err.message)

      await ctx.sock.sendMessage(ctx.from, {
        react: {
          text: "❌",
          key: ctx.msg.key
        }
      })

      await ctx.reply(
        "⚠️ Gagal menggabungkan emoji. Pastikan kedua emoji tersebut valid atau coba kombinasi lain.",
        {
          quoted: ctx.msg
        }
      )
    }
  }
}