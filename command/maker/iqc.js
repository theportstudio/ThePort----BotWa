const axios = require("axios")

module.exports = {
  name: "iqc",
  alias: ["iphonequotedchat", "iphonechat"],

  async execute(ctx) {
    try {
      const text =
        ctx.msg?.message?.conversation ||
        ctx.msg?.message?.extendedTextMessage?.text ||
        ""

      const prompt = text.split(" ").slice(1).join(" ").trim()

      if (!prompt) {
        return ctx.reply(
          "❌ Gunakan:\n.iqc <teks>\n\nContoh:\n.iqc amel cantik",
          { quoted: ctx.msg }
        )
      }

      // ⏰ ambil waktu lokal user (WIB otomatis dari device server)
      const now = new Date()

      const pad = (n) => n.toString().padStart(2, "0")

      const time = `${pad(now.getHours())}:${pad(now.getMinutes())}`

      await ctx.sock.sendMessage(ctx.from, {
        react: { text: "⏳", key: ctx.msg.key }
      })

      // 🔥 CALL API IQC
      const url = "https://api.deline.web.id/maker/iqc"

      const res = await axios.get(url, {
        params: {
          text: prompt,
          chatTime: time,
          statusBarTime: time
        },
        responseType: "arraybuffer", // 🔥 penting biar jadi buffer image
        timeout: 30000
      })

      const buffer = Buffer.from(res.data)

      await ctx.sock.sendMessage(ctx.from, {
        react: { text: "✅", key: ctx.msg.key }
      })

      await ctx.sock.sendMessage(
        ctx.from,
        {
          image: buffer,
          caption: `💬 IQC Maker\n\n📝 Text: ${prompt}\n⏰ Time: ${time}`
        },
        { quoted: ctx.msg }
      )

    } catch (err) {
      console.error("IQC ERROR:", err?.response?.data || err.message)

      await ctx.sock.sendMessage(ctx.from, {
        react: { text: "❌", key: ctx.msg.key }
      })

      await ctx.reply(
        "❌ Gagal membuat IQC, coba lagi nanti",
        { quoted: ctx.msg }
      )
    }
  }
}