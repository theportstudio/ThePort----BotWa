const axios = require("axios")

module.exports = {
  name: "copilot",
  alias: ["pilot", "ai2"],

  async execute(ctx) {
    try {
      const text =
        ctx.msg?.message?.conversation ||
        ctx.msg?.message?.extendedTextMessage?.text ||
        ""

      const prompt = text.split(" ").slice(1).join(" ").trim()

      if (!prompt) {
        return ctx.reply(
          "💡 Gunakan:\n.copilot <pertanyaan>\n\nContoh:\n.copilot jelaskan fungsi async await",
          { quoted: ctx.msg }
        )
      }

      await ctx.sock.sendMessage(ctx.from, {
        react: { text: "⏳", key: ctx.msg.key }
      })

      const res = await axios.get(
        "https://api.yupra.my.id/api/ai/copilot",
        {
          params: { text: prompt },
          timeout: 60000
        }
      )

      const result =
        res.data?.result ||
        res.data?.answer ||
        res.data?.response

      if (!result) {
        throw new Error("Response kosong")
      }

      await ctx.sock.sendMessage(ctx.from, {
        react: { text: "✅", key: ctx.msg.key }
      })

      await ctx.sock.sendMessage(
        ctx.from,
        {
          text: `${result}`
        },
        { quoted: ctx.msg }
      )
      
    } catch (err) {
      console.error("COPILOT ERROR:", err?.response?.data || err.message)

      await ctx.sock.sendMessage(ctx.from, {
        react: { text: "❌", key: ctx.msg.key }
      })

      await ctx.reply(
        "⚠️ Copilot sedang bermasalah. Coba lagi nanti.",
        { quoted: ctx.msg }
      )
    }
  }
}