const axios = require("axios")

function shuffleWord(word) {
  const arr = word.split("")
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr.join("")
}

function ensureShuffled(original) {
  let shuffled = shuffleWord(original)
  let attempts = 0
  while (shuffled === original && attempts < 10) {
    shuffled = shuffleWord(original)
    attempts++
  }
  return shuffled.toUpperCase()
}

module.exports = {
  name: "susunkata",
  alias: ["skata", "susunkta", "shuffle"],
  category: "game",
  loginRequired: true,
  groupOnly: true,

  async execute(ctx) {
    const url = "https://raw.githubusercontent.com/BochilTeam/database/master/games/susunkata.json"

    try {
      const res = await axios.get(url)
      const list = res.data

      if (!Array.isArray(list) || !list.length) {
        return ctx.reply("❌ Gagal memuat soal susun kata.")
      }

      const soal = list[Math.floor(Math.random() * list.length)]
      const originalAnswer = soal.jawaban
      const answer = originalAnswer.toLowerCase()
      const shuffled = ensureShuffled(originalAnswer)
      const tipe = soal.tipe || "umum"
      const level = soal.level || "sedang"

      let timeLimit = 30000
      if (level === "mudah") timeLimit = 45000
      if (level === "sulit") timeLimit = 20000

const sent = await ctx.reply(`
🧩 *SUSUN KATA*

🔤 Huruf acak: *${shuffled}*

🏷️ Tipe: ${tipe}
📊 Level: ${level}
⏱ Waktu: ${timeLimit / 1000} detik

📌 *BALAS PESAN INI* dengan kata yang benar
`);

      ctx.startGame({
        answer,
        originalAnswer,
        shuffled,
        tipe,
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
            `🔤 Huruf: *${shuffled}*\n` +
            `✅ Jawaban: *${originalAnswer}*`
          )
        }
      }, timeLimit)

    } catch (error) {
      console.error("Error susunkata:", error)
      return ctx.reply("❌ Gagal memulai game. Coba lagi nanti.")
    }
  }
}