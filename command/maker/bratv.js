const axios = require("axios")
const fs = require("fs")
const path = require("path")
const ffmpeg = require("fluent-ffmpeg")
const ffmpegPath = require("ffmpeg-static")
const { Sticker, StickerTypes } = require("wa-sticker-formatter")

ffmpeg.setFfmpegPath(ffmpegPath)

module.exports = {
  name: "bratv",
  alias: ["bratvideo"],
  loginRequired: true,

  async execute(ctx) {
    let tmpMp4 = null
    let tmpWebp = null

    try {
      const text = ctx.args.join(" ").trim()

      if (!text) {
        return ctx.reply(
          "💡 Gunakan:\n*.bratv <teks>*\n\nContoh:\n*.bratv halo dunia*",
          { quoted: ctx.msg }
        )
      }

      await ctx.sock.sendMessage(ctx.from, {
        react: {
          text: "⏳",
          key: ctx.msg.key
        }
      })

      const apiUrl = `https://api.yupra.my.id/api/video/bratv?text=${encodeURIComponent(text)}`

      const res = await axios.get(apiUrl, {
        responseType: "arraybuffer",
        timeout: 60000
      })

      const timestamp = Date.now()

      tmpMp4 = path.join(__dirname, `brat_${timestamp}.mp4`)
      tmpWebp = path.join(__dirname, `brat_${timestamp}.webp`)

      fs.writeFileSync(tmpMp4, res.data)

      await new Promise((resolve, reject) => {
        ffmpeg(tmpMp4)
          .outputOptions([
            "-vcodec", "libwebp",
            "-vf", "scale=512:512:force_original_aspect_ratio=decrease,fps=15,pad=512:512:(ow-iw)/2:(oh-ih)/2:color=#00000000",
            "-loop", "0",
            "-preset", "default",
            "-an",
            "-vsync", "0"
          ])
          .save(tmpWebp)
          .on("end", resolve)
          .on("error", reject)
      })

      const webpBuffer = fs.readFileSync(tmpWebp)

      const sticker = await new Sticker(webpBuffer)
        .setPack("ThePort • Bot")
        .setAuthor("By Farel Dev")
        .setType(StickerTypes.FULL)
        .setCategories(["✨"])
        .setID(ctx.msg.key.id)
        .setQuality(50)
        .build()

      await ctx.sock.sendMessage(ctx.from, {
        react: {
          text: "✅",
          key: ctx.msg.key
        }
      })

      await ctx.sock.sendMessage(
        ctx.from,
        {
          sticker: sticker
        },
        {
          quoted: ctx.msg
        }
      )
    } catch (err) {
      console.error("❌ BRATV ERROR:", err)

      await ctx.sock.sendMessage(ctx.from, {
        react: {
          text: "❌",
          key: ctx.msg.key
        }
      })

      await ctx.reply(
        "⚠️ Gagal membuat brat video.",
        {
          quoted: ctx.msg
        }
      )
    } finally {
      if (tmpMp4 && fs.existsSync(tmpMp4)) {
        fs.unlinkSync(tmpMp4)
      }

      if (tmpWebp && fs.existsSync(tmpWebp)) {
        fs.unlinkSync(tmpWebp)
      }
    }
  }
}