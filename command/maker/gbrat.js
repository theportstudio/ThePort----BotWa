const axios = require("axios")
const sharp = require("sharp")
const { Sticker, StickerTypes } = require("wa-sticker-formatter")

module.exports = {
  name: "gbrat",
  alias: ["girlbrat", "gbratgen"],
  loginRequired: true,

  async execute(ctx) {
    try {
      const text = ctx.args.join(" ").trim()

      if (!text) {
        return ctx.reply(
          "💡 Gunakan:\n*.gbrat <teks>*\n\nContoh:\n*.gbrat amel cantik*",
          { quoted: ctx.msg }
        )
      }

      await ctx.sock.sendMessage(ctx.from, {
        react: { text: "⏳", key: ctx.msg.key }
      })

      // 🔥 API GIRL BRAT
      const apiUrl = "https://api.deline.web.id/maker/cewekbrat"

      const res = await axios.get(apiUrl, {
        params: {
          text: text
        },
        responseType: "arraybuffer",
        timeout: 60000
      })

      // 🔥 convert image → sticker ready
      const webpBuffer = await sharp(res.data)
        .resize(512, 512, {
          fit: "contain",
          background: { r: 0, g: 0, b: 0, alpha: 0 }
        })
        .webp({ quality: 90 })
        .toBuffer()

      const sticker = await new Sticker(webpBuffer)
        .setPack("ThePort • Bot")
        .setAuthor("By Farel Dev")
        .setType(StickerTypes.FULL)
        .setCategories(["💖"])
        .setID(ctx.msg.key.id)
        .setQuality(80)
        .build()

      await ctx.sock.sendMessage(ctx.from, {
        react: { text: "✅", key: ctx.msg.key }
      })

      await ctx.sock.sendMessage(
        ctx.from,
        {
          sticker: sticker
        },
        { quoted: ctx.msg }
      )

    } catch (err) {
      console.error("GIRLBRAT ERROR:", err?.response?.data || err.message)

      await ctx.sock.sendMessage(ctx.from, {
        react: { text: "❌", key: ctx.msg.key }
      })

      await ctx.reply(
        "⚠️ Gagal membuat GirlBrat sticker, coba lagi nanti.",
        { quoted: ctx.msg }
      )
    }
  }
}