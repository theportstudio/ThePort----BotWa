const axios = require("axios")

module.exports = {
  name: "tiktokplay",
  alias: ["ttplay", "playtt"],
  loginRequired: true,

  async execute(ctx) {
    try {
      const text = ctx.args.join(" ").trim()

      if (!text) {
        return ctx.reply("💡 Contoh: *.tiktokplay anime edit*")
      }

      await ctx.sock.sendMessage(ctx.from, {
        react: {
          text: "🔍",
          key: ctx.msg.key
        }
      })

      const { data } = await axios.get(
        `https://api-faa.my.id/faa/tiktok-search?q=${encodeURIComponent(text)}`,
        {
          timeout: 20000
        }
      )

      if (!data?.status || !Array.isArray(data.result) || data.result.length === 0) {
        return ctx.reply("❌ Video TikTok tidak ditemukan.")
      }

      const validVideos = data.result.filter(
        item =>
          item &&
          item.url_nowm &&
          typeof item.url_nowm === "string" &&
          item.url_nowm.startsWith("http")
      )

      if (validVideos.length === 0) {
        return ctx.reply("❌ Tidak ada video yang valid.")
      }

      const selected =
        validVideos[Math.floor(Math.random() * validVideos.length)]

      const videoRes = await axios.get(selected.url_nowm, {
        responseType: "arraybuffer",
        timeout: 60000,
        headers: {
          "User-Agent": "Mozilla/5.0"
        }
      })

      const videoBuffer = Buffer.from(videoRes.data)

      const stats = selected.stats || {}

      const caption =
`🎵 *TikTok Play*

📌 ${selected.title || "No Title"}
👤 ${selected.author?.nickname || "Unknown"}

📊 Stats
👁️ ${stats.views || 0}
❤️ ${stats.likes || 0}
💬 ${stats.comments || 0}
🔄 ${stats.shares || 0}

⏱️ ${selected.duration || "-"}

> ThePort`

      await ctx.sock.sendMessage(
        ctx.from,
        {
          video: videoBuffer,
          caption: caption
        },
        {
          quoted: ctx.msg
        }
      )

      await ctx.sock.sendMessage(ctx.from, {
        react: {
          text: "✅",
          key: ctx.msg.key
        }
      })

    } catch (err) {
      console.log("TIKTOKPLAY ERROR:", err?.message || err)

      await ctx.sock.sendMessage(ctx.from, {
        react: {
          text: "❌",
          key: ctx.msg.key
        }
      })

      return ctx.reply("⚠️ Gagal mengambil video TikTok.")
    }
  }
}