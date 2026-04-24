const { downloadMediaMessage } = require("@whiskeysockets/baileys")
const ffmpeg = require("fluent-ffmpeg")
const fs = require("fs")
const path = require("path")

module.exports = {
  name: "tovn",
  alias: ["tovoice", "vn", "voice"],
  loginRequired: true,

  async execute(ctx) {
    let inputPath = null
    let outputPath = null
    
    try {
      const quotedMsg = ctx.msg.message?.extendedTextMessage?.contextInfo?.quotedMessage
      
      if (!quotedMsg) {
        return ctx.reply("💡 Reply audio yang ingin diubah menjadi voice note!")
      }

      const hasAudio = quotedMsg.audioMessage || quotedMsg.documentMessage
      if (!hasAudio) {
        return ctx.reply("❌ Reply harus berupa audio!")
      }

      await ctx.sock.sendMessage(ctx.from, {
        react: { text: "🎙️", key: ctx.msg.key }
      })

      const buffer = await downloadMediaMessage(
        {
          key: ctx.msg.message.extendedTextMessage.contextInfo.stanzaId,
          message: quotedMsg,
          messageTimestamp: ctx.msg.messageTimestamp
        },
        "buffer",
        {},
        {
          logger: ctx.sock.logger,
          reuploadRequest: ctx.sock.updateMediaMessage
        }
      )

      const tempDir = path.join(process.cwd(), "temp")
      if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true })
      
      const timestamp = Date.now()
      inputPath = path.join(tempDir, `tovn-input-${timestamp}.mp3`)
      outputPath = path.join(tempDir, `tovn-output-${timestamp}.opus`)
      
      fs.writeFileSync(inputPath, buffer)

      await new Promise((resolve, reject) => {
        ffmpeg(inputPath)
          .audioCodec("libopus")
          .audioBitrate("128k")
          .format("opus")
          .on("error", reject)
          .on("end", resolve)
          .save(outputPath)
      })

      const opusBuffer = fs.readFileSync(outputPath)

      await ctx.sock.sendMessage(ctx.from, {
        audio: opusBuffer,
        mimetype: "audio/ogg; codecs=opus",
        ptt: true
      }, { quoted: ctx.msg })

      await ctx.sock.sendMessage(ctx.from, {
        react: { text: "✅", key: ctx.msg.key }
      })

    } catch (err) {
      console.error("TOVN ERROR:", err)
      await ctx.sock.sendMessage(ctx.from, {
        react: { text: "❌", key: ctx.msg.key }
      })
      await ctx.reply("⚠️ Gagal mengubah audio menjadi voice note.")
    } finally {
      try {
        if (inputPath && fs.existsSync(inputPath)) fs.unlinkSync(inputPath)
        if (outputPath && fs.existsSync(outputPath)) fs.unlinkSync(outputPath)
      } catch (cleanupErr) {
        console.error("Cleanup error:", cleanupErr)
      }
    }
  }
}