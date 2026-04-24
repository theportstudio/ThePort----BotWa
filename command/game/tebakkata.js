const axios = require("axios")

module.exports = {
  name: "tebakkata",
  alias: ["tkata", "tebak", "kata"],
  category: "game",
  loginRequired: true,
  groupOnly: true,

  async execute(ctx) {
    const url = "https://raw.githubusercontent.com/BochilTeam/database/master/games/tebakkata.json"

    try {
      const res = await axios.get(url)
      const list = res.data

      if (!Array.isArray(list) || !list.length) {
        return ctx.reply("❌ Gagal memuat soal tebak kata.")
      }

      const soal = list[Math.floor(Math.random() * list.length)]
      const originalAnswer = soal.jawaban
      const answer = originalAnswer.toLowerCase()
      const deskripsi = soal.soal
      const level = soal.level || "sedang"

      let timeLimit = 30000
      if (level === "mudah") timeLimit = 45000
      if (level === "sulit") timeLimit = 20000

      const hint = originalAnswer.replace(/[aiueoAIUEO]/g, "_")
      const displayHint = hint.split("").join(" ")

const sent = await ctx.reply(`
📝 *TEBAK KATA*
❓ Deskripsi: ${deskripsi}

💡 Petunjuk: *${displayHint}
📊 Level: ${level}
⏱ Waktu: ${timeLimit / 1000} detik

📌 *BALAS PESAN INI* dengan jawabanmu
`);

      ctx.startGame({
        answer,
        originalAnswer,
        deskripsi,
        level,
        messageKey: sent.key.id,
        timeout: Date.now() + timeLimit
      })

      setTimeout(async () => {
        const current = ctx.getGame()
        if (current && current.messageKey === sent.key.id && current.active) {
          ctx.clearGame()
          await ctx.reply(
            `⏰ Waktu habis!\n\n` +
            `❓ ${deskripsi}\n` +
            `✅ Jawaban: *${originalAnswer}*`
          )
        }
      }, timeLimit)

    } catch (error) {
      console.error("Error tebakkata:", error)
      return ctx.reply("❌ Gagal memulai game. Coba lagi nanti.")
    }
  }
}