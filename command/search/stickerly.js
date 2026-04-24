const axios = require("axios")
const sharp = require("sharp")
const { Sticker, StickerTypes } = require("wa-sticker-formatter")

module.exports = {
  name: "stickerly",
  alias: ["stly"],
  loginRequired: true,

  async execute(ctx) {
    try {
      const text = ctx.args.join(" ").trim()
      if (!text) return ctx.reply("💡 Contoh: *.stickerly anime*")

      await ctx.sock.sendMessage(ctx.from, {
        react: { text: "🔍", key: ctx.msg.key }
      })

      const { data } = await axios.get(
        `https://api-faa.my.id/faa/stickerly?q=${encodeURIComponent(text)}`
      )

      if (!data?.status || !Array.isArray(data.results) || data.results.length === 0) {
        return ctx.reply("❌ Sticker tidak ditemukan.")
      }

      const result = data.results[Math.floor(Math.random() * data.results.length)]

      if (!result?.url) return ctx.reply("❌ Data sticker tidak valid.")

      const media = await axios.get(result.url, {
        responseType: "arraybuffer",
        timeout: 20000
      })

      const buffer = Buffer.from(media.data)

      const webp = await sharp(buffer, { animated: true })
        .resize(512, 512, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
        .webp({ quality: 90 })
        .toBuffer()

      const sticker = await new Sticker(webp)
        .setPack("ThePort • Bot")
        .setAuthor("By Farel Dev")
        .setType(StickerTypes.FULL)
        .setQuality(70)
        .build()

      await ctx.sock.sendMessage(ctx.from, {
        sticker
      }, { quoted: ctx.msg })

      await ctx.sock.sendMessage(ctx.from, {
        react: { text: "✅", key: ctx.msg.key }
      })

    } catch (err) {
      console.log("STICKERLY ERROR:", err?.message || err)

      await ctx.sock.sendMessage(ctx.from, {
        react: { text: "❌", key: ctx.msg.key }
      })

      return ctx.reply("⚠️ Gagal membuat sticker.")
    }
  }
}