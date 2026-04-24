const axios = require("axios")
const { generateWAMessageFromContent } = require("@whiskeysockets/baileys")

module.exports = {
  name: "gimage",
  alias: ["googleimage", "img"],
  loginRequired: true,

  async execute(ctx) {
    try {
      const text = ctx.args.join(" ")
      if (!text) {
        return ctx.reply("💡 Masukkan kata kunci pencarian!\nContoh: *.gimage anime boy*")
      }

      await ctx.sock.sendMessage(ctx.from, {
        react: { text: "🔍", key: ctx.msg.key }
      })

      await ctx.reply("⏳ Mencari gambar di Google...");

      const apiUrl = `https://api.danzy.web.id/api/search/gimage?query=${encodeURIComponent(text)}`
      const res = await axios.get(apiUrl)

      if (!res.data.status || !res.data.result || res.data.result.length === 0) {
        return ctx.reply("❌ Gambar tidak ditemukan.")
      }

      const imageUrl = res.data.result[0]

      await ctx.sock.sendMessage(ctx.from, {
        image: { url: imageUrl },
        caption: `🔍 Hasil pencarian: *${text}*`
      },  { quoted: ctx.msg })

      await ctx.sock.sendMessage(ctx.from, {
        react: { text: "✅", key: ctx.msg.key }
      })

    } catch (err) {
      console.error("GIMAGE ERROR:", err)
      await ctx.sock.sendMessage(ctx.from, {
        react: { text: "❌", key: ctx.msg.key }
      })
      await ctx.reply("⚠️ Gagal mengambil gambar.")
    }
  }
}