const fs = require("fs")
const path = require("path")
const ffmpeg = require("fluent-ffmpeg")
const ffmpegPath = require("ffmpeg-static")
const { downloadMediaMessage } = require("@whiskeysockets/baileys")

ffmpeg.setFfmpegPath(ffmpegPath)

module.exports = {
  name: "toaudio",
  alias: ["toa", "video2audio"],
  loginRequired: true,

  async execute(ctx) {
    const tempDir = path.join(__dirname, "tmp")
    if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir)

    let videoPath, audioPath, convertedAudioPath

    try {
      const text =
        ctx.msg.message?.conversation ||
        ctx.msg.message?.extendedTextMessage?.text ||
        ""

      const args = text.trim().split(/\s+/)
      const isPTT = args[1]?.toLowerCase() === "true"

      const quoted =
        ctx.msg.message?.extendedTextMessage?.contextInfo?.quotedMessage

      if (!quoted) {
        return ctx.reply("💡 Reply video lalu gunakan `.toaudio true/false`")
      }

      if (quoted.stickerMessage) {
        return ctx.reply("❌ Sticker tidak bisa dikonversi ke audio")
      }

      if (quoted.audioMessage) {
        return ctx.reply("❌ Itu sudah audio")
      }

      if (!quoted.videoMessage) {
        return ctx.reply("❌ Media harus berupa video")
      }

      if (quoted.videoMessage.mimetype && !quoted.videoMessage.mimetype.startsWith("video/")) {
        return ctx.reply("❌ Media ini bukan video valid")
      }

      await ctx.sock.sendMessage(ctx.from, {
        react: { text: "🎧", key: ctx.msg.key }
      })

      const videoBuffer = await downloadMediaMessage(
        {
          key: ctx.msg.message.extendedTextMessage.contextInfo.stanzaId,
          message: quoted,
          messageTimestamp: ctx.msg.messageTimestamp
        },
        "buffer",
        {},
        { reuploadRequest: ctx.sock.updateMediaMessage }
      )

      videoPath = path.join(tempDir, `video-${Date.now()}.mp4`)
      fs.writeFileSync(videoPath, videoBuffer)

      audioPath = path.join(tempDir, `audio-${Date.now()}.wav`)

      await new Promise((res, rej) => {
        ffmpeg(videoPath)
          .noVideo()
          .audioChannels(1)
          .audioFrequency(48000)
          .toFormat("wav")
          .on("end", res)
          .on("error", rej)
          .save(audioPath)
      })

      if (isPTT) {
        convertedAudioPath = path.join(tempDir, `converted-${Date.now()}.opus`)

        await new Promise((res, rej) => {
          ffmpeg(audioPath)
            .toFormat("opus")
            .on("end", res)
            .on("error", rej)
            .save(convertedAudioPath)
        })

        await ctx.sock.sendMessage(
          ctx.from,
          {
            audio: fs.readFileSync(convertedAudioPath),
            mimetype: "audio/ogg; codecs=opus",
            ptt: true
          },
          { quoted: ctx.msg }
        )
      } else {
        const mp3Path = path.join(tempDir, `audio-${Date.now()}.mp3`)

        await new Promise((res, rej) => {
          ffmpeg(audioPath)
            .toFormat("mp3")
            .audioBitrate("128k")
            .on("end", res)
            .on("error", rej)
            .save(mp3Path)
        })

        await ctx.sock.sendMessage(
          ctx.from,
          {
            audio: fs.readFileSync(mp3Path),
            mimetype: "audio/mpeg"
          },
          { quoted: ctx.msg }
        )

        fs.unlinkSync(mp3Path)
      }

      if (fs.existsSync(videoPath)) fs.unlinkSync(videoPath)
      if (fs.existsSync(audioPath)) fs.unlinkSync(audioPath)
      if (convertedAudioPath && fs.existsSync(convertedAudioPath))
        fs.unlinkSync(convertedAudioPath)

    } catch (err) {
      console.error("TOAUDIO ERROR:", err)
      ctx.reply("❌ Gagal mengonversi video ke audio")

      if (videoPath && fs.existsSync(videoPath)) fs.unlinkSync(videoPath)
      if (audioPath && fs.existsSync(audioPath)) fs.unlinkSync(audioPath)
      if (convertedAudioPath && fs.existsSync(convertedAudioPath))
        fs.unlinkSync(convertedAudioPath)
    }
  }
}