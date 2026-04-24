const axios = require("axios")

module.exports = {
  name: "gptsmart",
  alias: ["gpt5", "smart"],

  async execute(ctx) {
    try {
      const text =
        ctx.msg?.message?.conversation ||
        ctx.msg?.message?.extendedTextMessage?.text ||
        ""

      const prompt = text.split(" ").slice(1).join(" ").trim()

      if (!prompt) {
        return ctx.reply(
          "💡 Gunakan:\n.gptsmart <pertanyaan atau teks>\n\nContoh:\n.gptsmart jelaskan quantum computing"
        )
      }

      await ctx.sock.sendMessage(ctx.from, {
        react: { text: "⏳", key: ctx.msg.key }
      })

      const res = await axios.get(
        "https://api.yupra.my.id/api/ai/gpt5",
        {
          params: { text: prompt },
          timeout: 60000
        }
      )

      const result = res.data?.result || res.data?.data || res.data?.answer

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
      console.error("GPTSMART ERROR:", err?.response?.data || err.message)

      await ctx.sock.sendMessage(ctx.from, {
        react: { text: "❌", key: ctx.msg.key }
      })

      await ctx.reply(
        "⚠️ GPT-Smart API sedang bermasalah. Coba lagi nanti.",
        { quoted: ctx.msg }
      )
    }
  }
}