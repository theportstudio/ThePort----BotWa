const axios = require("axios")

module.exports = {
  name: "gimage",
  alias: ["googleimage", "img"],
  loginRequired: true,

  async execute(ctx) {
    try {
      const text = ctx.args.join(" ")
      if (!text) return ctx.reply("💡 Contoh: *.gimage monyet*")

      await ctx.sock.sendMessage(ctx.from, {
        react: { text: "🔍", key: ctx.msg.key }
      })

      const url = `https://api-faa.my.id/faa/google-image?query=${encodeURIComponent(text)}`
      const { data } = await axios.get(url, { timeout: 15000 })

      if (!data?.status || !Array.isArray(data?.result) || data.result.length === 0) {
        return ctx.reply("❌ Gambar tidak ditemukan.")
      }

      const images = data.result.filter(v => typeof v === "string" && v.startsWith("http"))
      if (images.length === 0) return ctx.reply("❌ Tidak ada gambar valid.")

      const imageUrl = images[Math.floor(Math.random() * images.length)]

      await ctx.sock.sendMessage(ctx.from, {
        image: { url: imageUrl },
        caption: `🔍 Hasil: ${text}`
      }, { quoted: ctx.msg })

      await ctx.sock.sendMessage(ctx.from, {
        react: { text: "✅", key: ctx.msg.key }
      })

    } catch (err) {
      console.log("GIMAGE ERROR:", err?.message || err)

      await ctx.sock.sendMessage(ctx.from, {
        react: { text: "❌", key: ctx.msg.key }
      })

      return ctx.reply("⚠️ Gagal mengambil gambar.")
    }
  }
}