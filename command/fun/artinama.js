const axios = require("axios")

module.exports = {
  name: "artinama",
  alias: ["arti", "namaku"],
  loginRequired: true,

  async execute(ctx) {
    try {
      const text = ctx.args.join(" ").trim()

      if (!text) {
        return ctx.reply("💡 Contoh: *.artinama Farel*")
      }

      await ctx.sock.sendMessage(ctx.from, {
        react: {
          text: "🔍",
          key: ctx.msg.key
        }
      })

      const { data } = await axios.get(
        `https://api-faa.my.id/faa/arti-nama?nama=${encodeURIComponent(text)}`
      )

      if (!data?.status) {
        return ctx.reply("❌ Arti nama tidak ditemukan.")
      }

      const nama = data.nama || text
      const arti = data.arti || "-"
      const catatan = data.catatan || "-"

      const message =
`✨ *ARTI NAMA*

👤 Nama: *${nama}*

📖 Arti:
${arti}

📝 Catatan:
${catatan}`

      await ctx.reply(message)

      await ctx.sock.sendMessage(ctx.from, {
        react: {
          text: "✅",
          key: ctx.msg.key
        }
      })

    } catch (err) {
      console.log("ARTINAMA ERROR:", err?.message || err)

      await ctx.sock.sendMessage(ctx.from, {
        react: {
          text: "❌",
          key: ctx.msg.key
        }
      })

      return ctx.reply("⚠️ Gagal mengambil arti nama.")
    }
  }
}