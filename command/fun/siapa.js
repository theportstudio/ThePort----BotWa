module.exports = {
  name: "siapa",
  alias: ["who"],
  groupOnly: true,
  loginRequired: true,

  async execute(ctx) {
    try {
      const text =
        ctx.args && ctx.args.length > 0
          ? ctx.args.join(" ")
          : null

      if (!text) {
        return ctx.reply("Gunakan format:\n.siapa <pertanyaan>")
      }

      const groupMeta = await ctx.sock.groupMetadata(ctx.from)
      const participants = groupMeta.participants || []

      if (participants.length < 2) {
        return ctx.reply("Anggota grup tidak cukup.")
      }

      const botId = ctx.sock.user.id
      const eligible = participants
        .map(p => p.id)
        .filter(id => id !== botId)

      if (eligible.length === 0) {
        return ctx.reply("Tidak ada anggota yang bisa dipilih.")
      }

      const randomId =
        eligible[Math.floor(Math.random() * eligible.length)]

      const number = randomId.split("@")[0]

      const caption =
        `👉 @${number}`

      await ctx.sock.sendMessage(
        ctx.from,
        {
          text: caption,
          mentions: [randomId]
        },
        { quoted: ctx.msg }
      )

    } catch (err) {
      console.error("SIAPA ERROR:", err)
      await ctx.reply("Terjadi kesalahan.")
    }
  }
}