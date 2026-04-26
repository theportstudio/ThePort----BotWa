const axios = require("axios")
const path = require("path")
const settings = require("../../settings")
const { performance } = require("perf_hooks")

module.exports = {
  name: "tes",
  alias: ["speed", "ping"],
  loginRequired: false,

  async execute(ctx) {
    try {
      await ctx.sock.sendMessage(ctx.from, {
        react: { text: "⚡", key: ctx.msg.key }
      })

      const start = performance.now()
      
      await axios.get("https://www.google.com", { 
        timeout: 5000,
        headers: { "User-Agent": "Mozilla/5.0" }
      }).catch(() => {})

      const latency = (performance.now() - start).toFixed(2)

      let status = "KENCANG"
      if (latency > 500) status = "LEMOT"
      if (latency > 1000) status = "SANGAT LEMOT"

      const responseText = `🚀 *TEST SPEED KONEKSI*

📡 Speed Respon : *${latency} ms*
🚦 Status Koneksi : *${status}*

⏰ _Waktu Pengecekan: ${new Date().toLocaleTimeString()}_`

      await ctx.sock.sendMessage(ctx.from, {
        text: responseText,
        contextInfo: {
          externalAdReply: {
            title: "Network Latency Test",
            body: `Ping: ${latency}ms | Status: ${status}`,
            thumbnailUrl: settings.menuImage,
            sourceUrl: "https://www.google.com",
            mediaType: 1,
            renderLargerThumbnail: true
          }
        }
      }, { quoted: ctx.msg })

    } catch (err) {
      console.error(err)
      ctx.reply("⚠️ Gagal mengecek kecepatan.")
    }
  }
}