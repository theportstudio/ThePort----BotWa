module.exports = {
  name: "kapankah",
  alias: ["kapan"],
  loginRequired: true,

  async execute(ctx) {
    try {
      const text = ctx.msg?.message?.conversation
        || ctx.msg?.message?.extendedTextMessage?.text
        || ""

      const question = text.split(" ").slice(1).join(" ").trim()

      if (!question) {
        return ctx.reply(
          "💡 Gunakan format:\n.kapankah <pertanyaanmu>",
          { quoted: ctx.msg }
        )
      }

      const answers = [
        "1 abad lagi",
        "Besok",
        "Nanti",
        "Ada masanya",
        "Tidak akan",
        "Tahun depan",
        "3 tahun lagi",
        "4 bulan lagi",
        "Tahun depan (mungkin)",
        "2 bulan lagi",
        "3 minggu lagi",
        "Tau mimpi??",
        "Ga akan"
      ]

      const randomAnswer =
        answers[Math.floor(Math.random() * answers.length)]

      await ctx.sock.sendMessage(
        ctx.from,
        {
          text:
            `❓ *Pertanyaan:*\n${question}\n\n` +
            `💬 *Jawaban:*\n${randomAnswer}`
        },
        { quoted: ctx.msg }
      )

    } catch (err) {
      console.error("kapankah ERROR:", err)
      await ctx.reply(
        "❌ Terjadi kesalahan saat memproses pertanyaan 😥",
        { quoted: ctx.msg }
      )
    }
  }
}