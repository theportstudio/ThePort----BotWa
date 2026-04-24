const axios = require("axios")

module.exports = {
  name: "deepseek",
  alias: ["ds", "askds"],

  async execute(ctx) {
    try {
      const text =
        ctx.msg?.message?.conversation ||
        ctx.msg?.message?.extendedTextMessage?.text ||
        ""

      const prompt = text.split(" ").slice(1).join(" ").trim()

      if (!prompt) {
        return ctx.reply(
          "Gunakan format:\n.deepseek <pertanyaan>\n\nContoh:\n.deepseek jelaskan AI",
          { quoted: ctx.msg }
        )
      }

      await ctx.sock.sendMessage(ctx.from, {
        react: { text: "⏳", key: ctx.msg.key }
      })

      const url = `https://www.neoapis.xyz/api/ai/deepseek?text=${encodeURIComponent(prompt)}`

      const res = await axios.get(url, {
        timeout: 30000,
        headers: {
          "User-Agent": "Mozilla/5.0"
        }
      })

      if (!res.data || !res.data.status) {
        throw new Error("API gagal merespons")
      }

      const answer =
        res.data?.data?.reply ||
        "Tidak ada jawaban dari AI."

      await ctx.sock.sendMessage(ctx.from, {
        react: { text: "✅", key: ctx.msg.key }
      })

      await ctx.sock.sendMessage(
        ctx.from,
        { text: answer },
        { quoted: ctx.msg }
      )

    } catch (err) {
      console.error("DEEPSEEK ERROR:", err)

      await ctx.sock.sendMessage(ctx.from, {
        react: { text: "❌", key: ctx.msg.key }
      })

      await ctx.reply("DeepSeek sedang error, coba lagi nanti.", {
        quoted: ctx.msg
      })
    }
  }
}