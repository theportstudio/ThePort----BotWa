const axios = require("axios")
const settings = require("../../settings")

module.exports = {
  name: "lyric",
  alias: ["lirik", "lyrics"],
  loginRequired: true,

  async execute(ctx) {
    try {
      const text = ctx.args.join(" ")
      if (!text) {
        return ctx.reply("💡 Masukkan judul lagu!\nContoh: *.lyric Alan Walker Faded*")
      }

      await ctx.sock.sendMessage(ctx.from, {
        react: { text: "🎵", key: ctx.msg.key }
      })

      const apiUrl = `https://api.danzy.web.id/api/search/lyrics?q=${encodeURIComponent(text)}`
      const res = await axios.get(apiUrl)

      if (!res.data.status || !res.data.result || res.data.result.length === 0) {
        return ctx.reply("❌ Lirik lagu tidak ditemukan.")
      }

      const song = res.data.result[0]
      const lyrics = song.plainLyrics || "Lirik tidak tersedia"
      const title = song.trackName || song.name || text
      const artist = song.artistName || "Unknown Artist"
      const album = song.albumName || "Unknown Album"
      const duration = song.duration ? `${Math.floor(song.duration / 60)}:${(song.duration % 60).toString().padStart(2, '0')}` : "Unknown"

      const caption = `🎵 *${title}*
🎤 *${artist}*
💿 *${album}*
⏱️ *${duration}*

${lyrics}

AutoBot • FarelDev`

      const mentions = []

      await ctx.sock.sendMessage(
        ctx.from,
        {
          text: caption,
          mentions: mentions,
          contextInfo: {
            mentionedJid: mentions,
            externalAdReply: {
              title: `AutoBot v1.0`,
              body: `Made By Farel Alfareza`,
              thumbnailUrl: settings.menuImage,
              sourceUrl: "https://github.com/fareldev-hub",
              mediaType: 1,
              renderLargerThumbnail: true
            }
          }
        },
        { quoted: ctx.msg }
      )

      await ctx.sock.sendMessage(ctx.from, {
        react: { text: "✅", key: ctx.msg.key }
      })

    } catch (err) {
      console.error("LYRIC ERROR:", err)
      await ctx.sock.sendMessage(ctx.from, {
        react: { text: "❌", key: ctx.msg.key }
      })
      await ctx.reply("⚠️ Gagal mengambil lirik lagu.")
    }
  }
}