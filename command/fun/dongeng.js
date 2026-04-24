const axios = require("axios")

module.exports = {
  name: "dongeng",
  alias: ["cerita", "fairytale"],
  groupOnly: false,
  loginRequired: false,

  async execute(ctx) {
    try {
      await ctx.reply("⏳ Sedang mengambil dongeng...")

      const response = await axios.get("https://zellapi.autos/random/dongeng", {
        timeout: 10000
      })

      const data = response.data

      if (!data || !data.storyContent) {
        return ctx.reply("❌ Gagal mengambil dongeng. Coba lagi nanti.")
      }

      const caption = `📖 *${data.title}*\n\n` +
        `${data.storyContent}\n\n`

      if (data.image && data.image.startsWith("http")) {
        await ctx.sock.sendMessage(ctx.from, {
          image: { url: data.image },
          caption: caption
        })
      } else {
        await ctx.reply(caption)
      }

    } catch (err) {
      console.error("DONGENG ERROR:", err.message)
      await ctx.reply("⚠️ Terjadi kesalahan saat mengambil dongeng.")
    }
  }
}