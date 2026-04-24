const axios = require("axios")
const { downloadMediaMessage } = require("@whiskeysockets/baileys")

module.exports = {
  name: "removebg",
  alias: ["rbg", "nobg"],
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
        return ctx.reply("💡 Reply foto atau kirim foto dengan caption .removebg untuk menghapus latar belakang.")
      }

      await ctx.sock.sendMessage(ctx.from, {
        react: { text: "⏳", key: msg.key }
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

      const base64Image = "data:image/png;base64," + mediaBuffer.toString("base64")
      const apiUrl = "https://puruboy-api.vercel.app/api/tools/removebg"

      const res = await axios.post(apiUrl, {
        url: base64Image
      }, {
        headers: {
          "Content-Type": "application/json"
        },
        timeout: 120000
      })

      const imageUrl = res.data?.url
      if (!imageUrl) {
        throw new Error("URL hasil tidak ditemukan")
      }

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
          caption: "✨ Latar belakang berhasil dihapus!"
        },
        { quoted: msg }
      )

    } catch (err) {
      console.error("REMOVEBG ERROR:", err.message)
      if (err.response) {
        console.error("Status:", err.response.status)
        console.error("Data:", err.response.data)
      }
      await ctx.sock.sendMessage(ctx.from, {
        react: { text: "❌", key: ctx.msg.key }
      })
      await ctx.reply("⚠️ Gagal menghapus latar belakang. Pastikan gambar jelas atau coba lagi nanti.")
    }
  }
}