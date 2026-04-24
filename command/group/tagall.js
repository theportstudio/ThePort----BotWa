const fs = require("fs")

module.exports = {
  name: "tagall",
  alias: ["hidetag"],
  groupOnly: true,
  loginRequired: true,

  async execute(ctx) {
    try {
      const rawCmd = ctx.cmd || (ctx.body || "").trim().split(" ")[0]
      const command = rawCmd ? rawCmd.replace(/^\./,"").toLowerCase() : ""

      const groupMeta = await ctx.sock.groupMetadata(ctx.from)
      const participants = groupMeta?.participants || []

      if (participants.length === 0) {
        return ctx.sock.sendMessage(ctx.from, { text: "⚠️ Tidak ada anggota di grup." }, { quoted: ctx.msg })
      }

      const mentions = participants.map(p => p.id)

      const argsText = ctx.args ? ctx.args.join(" ").trim() : ""
      let text = argsText || (command === "tagall" ? "🔔 @everyone" : "🔔 Pesan dari admin")

      if (command === "hidetag") {
        text = argsText || "🔔 Pesan khusus (tidak terlihat tag)"
      }

      await ctx.sock.sendMessage(
        ctx.from,
        {
          text,
          mentions
        },
        { quoted: ctx.msg }
      )

    } catch (err) {
      console.error("TAGALL/HIDETAG ERROR:", err)
      await ctx.sock.sendMessage(ctx.from, { text: "⚠️ Terjadi kesalahan saat mengeksekusi command." }, { quoted: ctx.msg })
    }
  }
}