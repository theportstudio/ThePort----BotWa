const axios = require("axios")

module.exports = {
  name: "tebakkimia",
  alias: ["tkimia", "tbkkimia"],
  category: "game",
  loginRequired: true,
  groupOnly: true,

  async execute(ctx) {
    const url = "https://api.deline.web.id/game/tebakkimia"

    try {
      const res = await axios.get(url)
      const data = res.data

      if (!data.status || !data.data) {
        return ctx.reply("❌ Gagal memuat soal kimia.")
      }

      const unsur = data.data.unsur
      const lambang = data.data.lambang
      const answer = lambang.toLowerCase()
      const originalAnswer = lambang

      let timeLimit = 25000

const sent = await ctx.reply(`
⚗️ *TEBAK KIMIA*

🔬 Unsur: *${unsur}*
❓ Tulis lambang kimianya!

⏱ Waktu: ${timeLimit / 1000} detik
📌 *BALAS PESAN INI* dengan lambang unsur
`);

      ctx.startGame({
        answer,
        originalAnswer,
        unsur,
        level: "sulit",
        messageKey: sent.key.id,
        timeout: Date.now() + timeLimit
      })

      setTimeout(async () => {
        const current = ctx.getGame()
        if (current && current.messageKey === sent.key.id && current.active) {
          ctx.clearGame()
          await ctx.reply(
            `⏰ Waktu habis!\n\n` +
            `🔬 Unsur: *${unsur}*\n` +
            `✅ Lambang: *${originalAnswer}*`
          )
        }
      }, timeLimit)

    } catch (error) {
      console.error("Error tebakkimia:", error)
      return ctx.reply("❌ Gagal memulai game. Coba lagi nanti.")
    }
  }
}