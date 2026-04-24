const axios = require("axios")

module.exports = {
  name: "tekateki",
  alias: ["soal"],
  category: "game",
  loginRequired: true,
  groupOnly: true,

  async execute(ctx) {
    const url = "https://api.deline.web.id/game/tekateki"

    try {
      const res = await axios.get(url)
      const data = res.data

      if (!data.status || !data.result) {
        return ctx.reply("❌ Gagal memuat soal teka-teki.")
      }

      const soal = data.result.soal
      const originalAnswer = data.result.jawaban
      const answer = originalAnswer.toLowerCase()

      let timeLimit = 30000

const sent = await ctx.reply(`
🧩 *TEKA-TEKI*
❓ ${soal}

⏱ Waktu: ${timeLimit / 1000} detik
📌 *BALAS PESAN INI* dengan jawabanmu
`);

      ctx.startGame({
        answer,
        originalAnswer,
        soal,
        level: "sedang",
        messageKey: sent.key.id,
        timeout: Date.now() + timeLimit
      })

      setTimeout(async () => {
        const current = ctx.getGame()
        if (current && current.messageKey === sent.key.id && current.active) {
          ctx.clearGame()
          await ctx.reply(
            `⏰ Waktu habis!\n\n` +
            `❓ ${soal}\n` +
            `✅ Jawaban: *${originalAnswer}*`
          )
        }
      }, timeLimit)

    } catch (error) {
      console.error("Error tekateki:", error)
      return ctx.reply("❌ Gagal memulai game. Coba lagi nanti.")
    }
  }
}