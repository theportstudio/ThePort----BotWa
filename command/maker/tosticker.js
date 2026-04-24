const sharp = require("sharp")
const fs = require("fs")
const path = require("path")
const ffmpeg = require("fluent-ffmpeg")
const ffmpegPath = require("ffmpeg-static")
const { Sticker, StickerTypes } = require("wa-sticker-formatter")
const {
  downloadMediaMessage,
  downloadContentFromMessage
} = require("@whiskeysockets/baileys")

ffmpeg.setFfmpegPath(ffmpegPath)

module.exports = {
  name: "sticker",
  alias: ["s", "stiker", "tosticker"],
  loginRequired: true,

  async execute(ctx) {
    let tmpMp4 = null
    let tmpWebp = null

    try {
      const msg = ctx.msg
      const extendedText = msg.message?.extendedTextMessage
      const contextInfo = extendedText?.contextInfo
      const quoted = contextInfo?.quotedMessage
      const isQuoted = !!quoted

      const mediaMsg = isQuoted
        ? (quoted.imageMessage || quoted.videoMessage)
        : (msg.message?.imageMessage || msg.message?.videoMessage)

      if (!mediaMsg) {
        return ctx.reply(
          "💡 Reply foto / video (maksimal 10 detik) untuk dijadikan stiker.",
          { quoted: msg }
        )
      }

      await ctx.sock.sendMessage(ctx.from, {
        react: {
          text: "⏳",
          key: msg.key
        }
      })

      let mediaBuffer = null
      let downloadSuccess = false

      try {
        const messageToDownload = isQuoted
          ? {
              key: {
                remoteJid: ctx.from,
                id: contextInfo.stanzaId,
                participant: contextInfo.participant
              },
              message: quoted
            }
          : {
              key: msg.key,
              message: msg.message
            }

        mediaBuffer = await downloadMediaMessage(
          messageToDownload,
          "buffer",
          {},
          {
            reuploadRequest: ctx.sock.updateMediaMessage
          }
        )

        downloadSuccess = true
      } catch (err1) {
        console.log("Method 1 failed:", err1.message)
      }

      if (!downloadSuccess) {
        try {
          const type = mediaMsg.mimetype?.includes("image")
            ? "image"
            : "video"

          const stream = await downloadContentFromMessage(
            mediaMsg,
            type
          )

          const chunks = []

          for await (const chunk of stream) {
            chunks.push(chunk)
          }

          mediaBuffer = Buffer.concat(chunks)
          downloadSuccess = true
        } catch (err2) {
          console.error("Method 2 failed:", err2.message)
        }
      }

      if (!downloadSuccess || !mediaBuffer || mediaBuffer.length === 0) {
        throw new Error("Gagal mengunduh media.")
      }

      const isVideo =
        mediaMsg.mimetype?.includes("video") ||
        (mediaMsg.seconds && mediaMsg.seconds > 0)

      if (!isVideo) {
        const webpBuffer = await sharp(mediaBuffer)
          .resize(512, 512, {
            fit: "contain",
            background: {
              r: 0,
              g: 0,
              b: 0,
              alpha: 0
            }
          })
          .webp({
            quality: 90
          })
          .toBuffer()

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
            key: msg.key
          }
        })

        return await ctx.sock.sendMessage(
          ctx.from,
          {
            sticker: sticker
          },
          {
            quoted: msg
          }
        )
      }

      const duration = mediaMsg.seconds || 0

      if (duration > 10) {
        return ctx.reply(
          "⚠️ Durasi video maksimal 10 detik!",
          { quoted: msg }
        )
      }

      const timestamp = Date.now()

      tmpMp4 = path.join(__dirname, `vid_${timestamp}.mp4`)
      tmpWebp = path.join(__dirname, `vid_${timestamp}.webp`)

      fs.writeFileSync(tmpMp4, mediaBuffer)

      await new Promise((resolve, reject) => {
        ffmpeg(tmpMp4)
          .outputOptions([
            "-vcodec", "libwebp",
            "-vf", "scale=512:512:force_original_aspect_ratio=decrease,fps=15,pad=512:512:(ow-iw)/2:(oh-ih)/2:color=#00000000",
            "-loop", "0",
            "-an",
            "-vsync", "0",
            "-t", "10"
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
          key: msg.key
        }
      })

      await ctx.sock.sendMessage(
        ctx.from,
        {
          sticker: sticker
        },
        {
          quoted: msg
        }
      )
    } catch (err) {
      console.error("STICKER ERROR:", err)

      await ctx.sock.sendMessage(ctx.from, {
        react: {
          text: "❌",
          key: ctx.msg.key
        }
      })

      await ctx.reply(
        "❌ Gagal membuat stiker. Pastikan format media benar.",
        {
          quoted: ctx.msg
        }
      )
    } finally {
      try {
        if (tmpMp4 && fs.existsSync(tmpMp4)) {
          fs.unlinkSync(tmpMp4)
        }

        if (tmpWebp && fs.existsSync(tmpWebp)) {
          fs.unlinkSync(tmpWebp)
        }
      } catch (e) {}
    }
  }
}