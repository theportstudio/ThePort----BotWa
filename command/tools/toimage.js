const sharp = require("sharp")
const fs = require("fs")
const path = require("path")
const ffmpeg = require("fluent-ffmpeg")
const ffmpegPath = require("ffmpeg-static")
const {
  downloadMediaMessage,
  downloadContentFromMessage
} = require("@whiskeysockets/baileys")

ffmpeg.setFfmpegPath(ffmpegPath)

module.exports = {
  name: "toimage",
  alias: ["toimg", "toimgfull", "tovid", "tovideo"],
  loginRequired: true,

  async execute(ctx) {
    let tmpWebp, tmpGif, tmpOut

    const tempDir = path.resolve(__dirname, "../../temp")
    if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true })

    try {
      const msg = ctx.msg
      const ext = msg.message?.extendedTextMessage
      const info = ext?.contextInfo
      const quoted = info?.quotedMessage

      const sticker =
        quoted?.stickerMessage || msg.message?.stickerMessage

      if (!sticker) {
        return ctx.reply("💡 Reply stiker yang ingin dikonversi.")
      }

      await ctx.sock.sendMessage(ctx.from, {
        react: { text: "⏳", key: msg.key }
      })

      let buffer
      try {
        buffer = await downloadMediaMessage(
          {
            key: quoted
              ? {
                  remoteJid: ctx.from,
                  id: info.stanzaId,
                  participant: info.participant
                }
              : msg.key,
            message: quoted || msg.message
          },
          "buffer",
          {},
          { reuploadRequest: ctx.sock.updateMediaMessage }
        )
      } catch {
        const stream = await downloadContentFromMessage(sticker, "sticker")
        const arr = []
        for await (const c of stream) arr.push(c)
        buffer = Buffer.concat(arr)
      }

      if (!buffer || buffer.length === 0) {
        throw new Error("Buffer kosong")
      }

      const animated = sticker.isAnimated === true
      const ts = Date.now()

      tmpWebp = path.join(tempDir, `in_${ts}.webp`)
      fs.writeFileSync(tmpWebp, buffer)

      if (animated) {
        tmpGif = path.join(tempDir, `mid_${ts}.gif`)
        tmpOut = path.join(tempDir, `out_${ts}.mp4`)

        await sharp(tmpWebp, { animated: true })
          .gif()
          .toFile(tmpGif)

        await new Promise((resolve, reject) => {
          ffmpeg(tmpGif)
            .outputOptions([
              "-movflags faststart",
              "-pix_fmt yuv420p",
              "-vf scale=trunc(iw/2)*2:trunc(ih/2)*2",
              "-r 30"
            ])
            .toFormat("mp4")
            .on("end", resolve)
            .on("error", reject)
            .save(tmpOut)
        })

        await ctx.sock.sendMessage(
          ctx.from,
          {
            video: fs.readFileSync(tmpOut),
            caption: "✅ Stiker animasi → video"
          },
          { quoted: msg }
        )
      } else {
        tmpOut = path.join(tempDir, `out_${ts}.png`)

        await sharp(tmpWebp)
          .png({ quality: 100 })
          .toFile(tmpOut)

        await ctx.sock.sendMessage(
          ctx.from,
          {
            image: fs.readFileSync(tmpOut),
            caption: "✅ Stiker → PNG"
          },
          { quoted: msg }
        )
      }

      await ctx.sock.sendMessage(ctx.from, {
        react: { text: "✅", key: msg.key }
      })

    } catch (e) {
      console.error("TOIMAGE ERROR:", e)
      await ctx.sock.sendMessage(ctx.from, {
        react: { text: "❌", key: ctx.msg.key }
      })
      ctx.reply("❌ Gagal mengonversi stiker.")
    } finally {
      try {
        if (tmpWebp && fs.existsSync(tmpWebp)) fs.unlinkSync(tmpWebp)
        if (tmpGif && fs.existsSync(tmpGif)) fs.unlinkSync(tmpGif)
        if (tmpOut && fs.existsSync(tmpOut)) fs.unlinkSync(tmpOut)
      } catch {}
    }
  }
}