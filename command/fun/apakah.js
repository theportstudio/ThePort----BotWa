module.exports = {
  name: "apakah",
  alias: ["tanya"],
  loginRequired: true,

  async execute(ctx) {
    try {
      const text =
        ctx.msg?.message?.conversation ||
        ctx.msg?.message?.extendedTextMessage?.text ||
        ""

      const question = text.split(" ").slice(1).join(" ").trim()

      if (!question) {
        return ctx.reply(
          "💡 Gunakan format:\n.apakah <pertanyaanmu>",
          { quoted: ctx.msg }
        )
      }

      const answers = [
        "Iya",
        "Tidak",
        "Mungkin",
        "Tentu saja",
        "Sepertinya iya",
        "Sepertinya tidak",
        "Bisa jadi",
        "Jawabannya ada pada dirimu",
        "Tidak tahu",
        "Yakin deh!",
        "Ngimpi",
        "Kok nanya saya?",
        "Coba tanya lagi nanti"
      ]

      const randomAnswer =
        answers[Math.floor(Math.random() * answers.length)]

      await ctx.reply(
        `❓ *Pertanyaan:*\n${question}\n\n💬 *Jawaban:*\n${randomAnswer}`,
        { quoted: ctx.msg }
      )

    } catch (err) {
      console.error("APAKAH ERROR:", err)
      await ctx.reply(
        "❌ Terjadi kesalahan saat memproses pertanyaan 😥",
        { quoted: ctx.msg }
      )
    }
  }
}