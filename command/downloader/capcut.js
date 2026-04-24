const axios = require("axios")

module.exports = {
  name: "capcut",
  alias: ["cc", "ccdl"],

  async execute(ctx) {
    try {
      const args = ctx.args || []
      const url = args[0]

      if (!url || !url.includes("capcut.com")) {
        return ctx.reply(
          "💡 Gunakan format:\n.capcut <link template capcut>\n\nContoh:\n.capcut https://www.capcut.com/tv2/ZSUSEwbge/",
          { quoted: ctx.msg }
        )
      }

      await ctx.reply("⏳ Waitt Kakk...", {
        quoted: ctx.msg
      })

      const apiUrl = `https://api.deline.web.id/downloader/capcut?url=${encodeURIComponent(url)}`
      const res = await axios.get(apiUrl, { timeout: 30000 })

      if (!res.data.status || !res.data.result) {
        throw new Error("API Error")
      }

      const result = res.data.result
      
      const videoSources = [
        result.links?.video?.[0]?.url,
        result.videoUrl,
        result.url,
        result.downloadUrl,
        result.video
      ].filter(Boolean)

      if (videoSources.length === 0) {
        throw new Error("Video URL tidak ditemukan")
      }

      let videoBuffer = null
      let successUrl = ""

      for (const rawUrl of videoSources) {
        try {
          let videoUrl = rawUrl
          
          if (!rawUrl.startsWith('http')) {
            videoUrl = `https://dl1.mnmnmnnnrmnmnnm.shop/${rawUrl}`
          }

          const headRes = await axios.head(videoUrl, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
              'Referer': 'https://www.capcut.com/'
            },
            timeout: 10000,
            maxRedirects: 5
          })

          const contentType = headRes.headers['content-type'] || ''
          const contentLength = parseInt(headRes.headers['content-length'] || '0')

          if (!contentType.includes('video') && !contentType.includes('octet-stream')) {
            continue
          }

          if (contentLength > 0 && contentLength < 50000) {
            continue
          }

          const response = await axios.get(videoUrl, {
            responseType: 'arraybuffer',
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
              'Referer': 'https://www.capcut.com/',
              'Accept': 'video/webm,video/mp4,video/*,*/*;q=0.9'
            },
            timeout: 120000,
            maxContentLength: 100 * 1024 * 1024,
            maxBodyLength: 100 * 1024 * 1024
          })

          const buffer = Buffer.from(response.data)
          
          if (buffer.length < 10000) {
            continue
          }

          const isMp4 = buffer[4] === 0x66 && buffer[5] === 0x74 && buffer[6] === 0x79 && buffer[7] === 0x70
          const isWebm = buffer[0] === 0x1A && buffer[1] === 0x45 && buffer[2] === 0xDF && buffer[3] === 0xA3
          
          if (!isMp4 && !isWebm && !contentType.includes('video')) {
            continue
          }

          videoBuffer = buffer
          successUrl = videoUrl
          break

        } catch (e) {
          continue
        }
      }

      if (!videoBuffer) {
        throw new Error("Semua sumber video gagal diunduh")
      }

      await ctx.sock.sendMessage(
        ctx.from,
        {
          video: videoBuffer,
          caption: `🎬 *CapCut Downloader*\n\n📌 *Judul:* ${result.title || "CapCut Video"}\n🔗 *Source:* ${url}\n\n_Berhasil mengunduh tanpa watermark._`,
          mimetype: "video/mp4"
        },
        { quoted: ctx.msg }
      )

    } catch (err) {
      console.error("CAPCUT ERROR:", err.message)

      await ctx.sock.sendMessage(ctx.from, {
        react: { text: "❌", key: ctx.msg.key }
      })

      await ctx.reply(
        `⚠️ Gagal mendownload video: ${err.message}`,
        { quoted: ctx.msg }
      )
    }
  }
}