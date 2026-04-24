const axios = require("axios")
const { downloadMediaMessage } = require("@whiskeysockets/baileys")

module.exports = {
  name: "hd",
  alias: ["upscale", "remini", "hdr"],
  loginRequired: true,

  async execute(ctx) {
    try {
      const msg = ctx.msg
      const extendedText = msg.message?.extendedTextMessage
      const contextInfo = extendedText?.contextInfo
      const quoted = contextInfo?.quotedMessage
      const isQuoted = !!quoted

      const imageMsg = isQuoted 
        ? quoted.imageMessage 
        : msg.message?.imageMessage

      if (!imageMsg) {
        return ctx.reply("💡 Reply foto atau kirim foto dengan caption .hd untuk meningkatkan kualitas gambar.")
      }

      await ctx.sock.sendMessage(ctx.from, {
        react: { text: "⏳", key: msg.key }
      })

      await ctx.reply("⏳ Sedang memproses HD, mohon tunggu sebentar...", {
        quoted: msg
      })

      const mediaBuffer = await downloadMediaMessage(
        isQuoted 
          ? { 
              key: {
                remoteJid: ctx.from,
                id: contextInfo.stanzaId,
                participant: contextInfo.participant
              },
              message: quoted 
            }
          : msg,
        "buffer"
      )

      const base64Image = "data:image/jpeg;base64," + mediaBuffer.toString("base64")
      const apiUrl = "https://puruboy-api.vercel.app/api/tools/upscale"

      console.log("Base64 length:", base64Image.length)
      console.log("Base64 preview:", base64Image.substring(0, 100))

      const res = await axios.post(apiUrl, {
        url: base64Image
      }, {
        headers: {
          "Content-Type": "application/json"
        },
        timeout: 300000,
        responseType: "text"
      })

      const lines = res.data.split("\n").filter(line => line.trim())
      let outputUrl = null

      for (const line of lines) {
        console.log("SSE Line:", line)
        if (line.startsWith("[true]")) {
          outputUrl = line.replace("[true]", "").trim()
          break
        }
      }

      if (!outputUrl) {
        try {
          const parsed = JSON.parse(res.data)
          outputUrl = parsed.output
        } catch {
          throw new Error("Gagal mendapatkan URL hasil")
        }
      }

      const finalRes = await axios.get(outputUrl, {
        timeout: 30000
      })

      const finalData = finalRes.data
      const imageUrl = finalData.output || finalData

      const imageRes = await axios.get(imageUrl, {
        responseType: "arraybuffer",
        timeout: 60000
      })

      await ctx.sock.sendMessage(ctx.from, {
        react: { text: "✅", key: msg.key }
      })

      await ctx.sock.sendMessage(
        ctx.from,
        {
          image: Buffer.from(imageRes.data),
          caption: "✨ Gambar berhasil ditingkatkan ke kualitas HD!"
        },
        { quoted: msg }
      )

    } catch (err) {
      console.error("HD ERROR:", err.message)
      if (err.response) {
        console.error("Status:", err.response.status)
        console.error("Data:", err.response.data)
      }
      await ctx.sock.sendMessage(ctx.from, {
        react: { text: "❌", key: ctx.msg.key }
      })
      await ctx.reply("⚠️ Gagal meningkatkan kualitas gambar. Coba lagi nanti atau gunakan gambar lain.")
    }
  }
}