const axios = require("axios")

module.exports = {
  name: "tiktok",
  alias: ["tt"],

  async execute(ctx) {
    try {
      const url = ctx.args.join(" ").trim()
      if (!url) {
        return ctx.reply("💡 Gunakan: *.tiktok <url>*")
      }

      await ctx.reply("⏳ Waitt Kakk...", {
        quoted: ctx.msg
      })

      const response = await axios.post(
        "https://puruboy-api.vercel.app/api/downloader/tiktok",
        { url: url },
        {
          headers: {
            "Content-Type": "application/json",
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
          },
          timeout: 30000
        }
      )

      const detail = response.data?.result?.detail
      if (!detail) throw new Error("Response tidak valid")

      const title = detail.title || "Video TikTok"
      const author = detail.author?.nickname || "-"
      const duration = detail.duration || "-"
      const cover = detail.cover
      const playUrl = detail.play_url
      const downloadUrl = detail.download_url
      const musicUrl = detail.music_info?.play

      const caption = `🎬 *${title}*\n👤 ${author}\n🕓 ${duration} detik`

      if (playUrl && downloadUrl) {
        const videoRes = await axios.get(downloadUrl, {
          responseType: "arraybuffer",
          headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
            "Referer": "https://puruboy-api.vercel.app/"
          },
          timeout: 120000,
          maxContentLength: 100 * 1024 * 1024,
          maxBodyLength: 100 * 1024 * 1024
        })

        const videoBuffer = Buffer.from(videoRes.data)

        if (videoBuffer.length < 10000) {
          throw new Error("Video terlalu kecil atau rusak")
        }

        await ctx.sock.sendMessage(
          ctx.from,
          {
            video: videoBuffer,
            caption: caption
          },
          { quoted: ctx.msg }
        )
      }

      else if (detail.images && Array.isArray(detail.images) && detail.images.length > 0) {
        for (let i = 0; i < detail.images.length; i++) {
          await ctx.sock.sendMessage(
            ctx.from,
            {
              image: { url: detail.images[i] },
              caption: i === detail.images.length - 1 ? caption : undefined
            },
            { quoted: ctx.msg }
          )
        }
      }

      else if (cover) {
        await ctx.sock.sendMessage(
          ctx.from,
          {
            image: { url: cover },
            caption: caption + "\n\n⚠️ Hanya cover tersedia"
          },
          { quoted: ctx.msg }
        )
      }

      else {
        throw new Error("Tidak ada video atau foto ditemukan")
      }

      if (musicUrl) {
        try {
          const audioRes = await axios.get(musicUrl, {
            responseType: "arraybuffer",
            headers: {
              "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
              "Referer": "https://puruboy-api.vercel.app/"
            },
            timeout: 60000,
            maxContentLength: 50 * 1024 * 1024,
            maxBodyLength: 50 * 1024 * 1024
          })

          const audioBuffer = Buffer.from(audioRes.data)

          if (audioBuffer.length > 10000) {
            await ctx.sock.sendMessage(
              ctx.from,
              {
                audio: audioBuffer,
                mimetype: "audio/mpeg",
                ptt: false,
                fileName: `${detail.music_info?.title || "tiktok_audio"}.mp3`
              },
              { quoted: ctx.msg }
            )
          }
        } catch (audioErr) {
          console.error("❌ Gagal kirim audio:", audioErr.message)
        }
      }

    } catch (err) {
      console.error("❌ TikTok Error:", err.message)
      await ctx.reply(`⚠️ Gagal memproses TikTok: ${err.message}`)
    }
  }
}