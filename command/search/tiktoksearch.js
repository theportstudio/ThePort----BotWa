const axios = require("axios")

const sentVideos = new Map()

module.exports = {
  name: "tiktoksearch",
  alias: ["ttsearch", "tiktok"],
  loginRequired: true,

  async execute(ctx) {
    try {
      const text = ctx.args.join(" ")
      if (!text) {
        return ctx.reply("💡 Masukkan kata kunci pencarian!\nContoh: *.tiktoksearch dance*")
      }

      await ctx.sock.sendMessage(ctx.from, {
        react: { text: "🔍", key: ctx.msg.key }
      })

      const apiUrl = `https://api.danzy.web.id/api/search/tiktok?q=${encodeURIComponent(text)}`
      const res = await axios.get(apiUrl)

      if (!res.data.status || !res.data.result || res.data.result.length === 0) {
        return ctx.reply("❌ Video TikTok tidak ditemukan.")
      }

      const videos = res.data.result
      const cacheKey = `${ctx.from}_${text.toLowerCase()}`
      const lastSentIndex = sentVideos.get(cacheKey) || -1

      let selectedVideo = null
      let selectedIndex = 0

      for (let i = 0; i < videos.length; i++) {
        const index = (lastSentIndex + 1 + i) % videos.length
        const video = videos[index]
        const rawUrl = video.link || video.watermark_link || ""
        const videoId = rawUrl.replace("https://tikwm.com", "")

        if (!sentVideos.has(videoId)) {
          selectedVideo = video
          selectedIndex = index
          sentVideos.set(videoId, true)
          break
        }
      }

      if (!selectedVideo) {
        sentVideos.clear()
        selectedVideo = videos[0]
        selectedIndex = 0
        const rawUrl = selectedVideo.link || selectedVideo.watermark_link || ""
        const videoId = rawUrl.replace("https://tikwm.com", "")
        sentVideos.set(videoId, true)
      }

      sentVideos.set(cacheKey, selectedIndex)

      const title = selectedVideo.title || "No Title"
      const author = selectedVideo.author?.nickname || "Unknown"
      const plays = selectedVideo.stats?.plays || 0
      const likes = selectedVideo.stats?.likes || 0
      const comments = selectedVideo.stats?.comments || 0
      const shares = selectedVideo.stats?.shares || 0
      const cover = selectedVideo.cover || ""

      let videoUrl = selectedVideo.link || selectedVideo.watermark_link || ""
      videoUrl = videoUrl.replace("https://tikwm.comhttps://", "https://")
      videoUrl = videoUrl.replace("https://tikwm.comhttp://", "http://")

      const videoResponse = await axios.get(videoUrl, {
        responseType: "arraybuffer",
        timeout: 30000,
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
        }
      })

      const videoBuffer = Buffer.from(videoResponse.data)

      const caption = `🎵 *TikTok Search*

📌 ${title}
👤 ${author}

📊 *Stats:*
▸ 👁️ ${plays.toLocaleString()} views
▸ ❤️ ${likes.toLocaleString()} likes
▸ 💬 ${comments.toLocaleString()} comments
▸ 🔄 ${shares.toLocaleString()} shares

AutoBot • FarelDev`

      const mentions = []

      await ctx.sock.sendMessage(
        ctx.from,
        {
          video: videoBuffer,
          caption: caption,
          mentions: mentions,
          contextInfo: {
            mentionedJid: mentions,
            externalAdReply: {
              title: `AutoBot v1.0`,
              body: `Made By Farel Alfareza`,
              thumbnailUrl: cover,
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
      console.error("TIKTOK SEARCH ERROR:", err)
      await ctx.sock.sendMessage(ctx.from, {
        react: { text: "❌", key: ctx.msg.key }
      })
      await ctx.reply("⚠️ Gagal mengambil video TikTok.")
    }
  }
}