const axios = require("axios")

module.exports = {
    name: "tebakgambar",
    alias: ["tg", "tebakimg"],
    category: "game",
    loginRequired: true,
    groupOnly: true,

    async execute(ctx) {
        const url = "https://raw.githubusercontent.com/BochilTeam/database/master/games/tebakgambar.json"

        try {
            const res = await axios.get(url)
            const list = res.data

            if (!Array.isArray(list) || !list.length) {
                return ctx.reply("❌ Gagal memuat soal tebak gambar.")
            }

            const soal = list[Math.floor(Math.random() * list.length)]
            const image = soal.img
            const answer = soal.jawaban.toLowerCase()
            const originalAnswer = soal.jawaban
            const level = soal.level || "sedang"
            const deskripsi = soal.deskripsi || ""

            let timeLimit = 20000
            if (level === "mudah") timeLimit = 25000
            if (level === "sulit") timeLimit = 30000

            const sent = await ctx.sock.sendMessage(ctx.from, {
                image: { url: image },
                caption:
                    `🎮 *TEBAK GAMBAR*\n\n` +
                    `${deskripsi ? `📝 Deskripsi: ${deskripsi}\n` : ""}` +
                    `⏱ Waktu: ${timeLimit / 1000} detik\n` +
                    `📊 Level: ${level}\n\n` +
                    `📌 *BALAS / REPLY GAMBAR INI* dengan jawaban kamu`
            }, { quoted: ctx.msg })

            ctx.startGame({
                answer,
                originalAnswer,
                level,
                messageKey: sent.key.id,
                timeout: Date.now() + timeLimit
            })

            setTimeout(async () => {
                const current = ctx.getGame()
                if (current && current.messageKey === sent.key.id && current.active) {
                    ctx.clearGame()
                    await ctx.reply(`⏰ Waktu habis!\nJawaban yang benar adalah: *${originalAnswer}*`)
                }
            }, timeLimit)

        } catch (error) {
            console.error("Error tebakgambar:", error)
            return ctx.reply("❌ Gagal memulai game. Coba lagi nanti.")
        }
    }
}