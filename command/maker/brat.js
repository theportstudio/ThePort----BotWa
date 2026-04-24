const axios = require("axios")
const sharp = require("sharp")
const { Sticker, StickerTypes } = require("wa-sticker-formatter")

module.exports = {
  name: "brat",
  alias: ["bratgen"],
  loginRequired: true,

  async execute(ctx) {
    try {
      const text = ctx.args.join(" ").trim()
      if (!text) {
        return ctx.reply(
          "💡 Gunakan:\n*.brat <teks>*\n\nContoh:\n*.brat halo dunia*",
          { quoted: ctx.msg }
        )
      }

      await ctx.sock.sendMessage(ctx.from, {
        react: { text: "⏳", key: ctx.msg.key }
      })

      const apiUrl = `https://api.yupra.my.id/api/image/brat?text=${encodeURIComponent(text)}`

      const res = await axios.get(apiUrl, {
        responseType: "arraybuffer",
        timeout: 60000
      })

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
        .setCategories(["✨"])
        .setID(ctx.msg.key.id)
        .setQuality(50)
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
      console.error("❌ BRAT ERROR:", err)
      
      await ctx.sock.sendMessage(ctx.from, {
        react: { text: "❌", key: ctx.msg.key }
      })

      await ctx.reply(
        "⚠️ Gagal membuat stiker brat. Coba teks lain.",
        { quoted: ctx.msg }
      )
    }
  }
}