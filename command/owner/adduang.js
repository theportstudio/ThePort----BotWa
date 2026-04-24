const settings = require("../../settings")

module.exports = {
  name: "adduang",
  alias: ["uangadd", "tambahuang"],

  async execute(ctx) {
    try {
      const senderId = ctx.sender.split("@")[0]
      const isOwner =
        settings.ownerId === senderId ||
        settings.ownerNumber.some(num => {
          const senderNumber = ctx.phoneNumber.replace(/[^0-9]/g, "")
          const ownerNum = num.replace(/[^0-9]/g, "")
          return senderNumber === ownerNum
        })

      if (!isOwner) {
        return ctx.reply("❌ Fitur ini hanya untuk owner!")
      }

      const targetInput = ctx.args[0]
      const uangAdd = parseInt(ctx.args[1])

      if (!targetInput || !uangAdd) {
        return ctx.reply(
          "💡 Format salah!\n\n" +
          "Contoh:\n" +
          ".adduang farel 10000\n" +
          ".adduang @user 5000"
        )
      }

      if (uangAdd < 1) {
        return ctx.reply("❌ Jumlah uang harus lebih dari 0!")
      }

      const db = ctx.db
      let targetKey = null

      if (targetInput.startsWith("@")) {
        const mentioned =
          ctx.msg.message?.extendedTextMessage?.contextInfo?.mentionedJid

        if (!mentioned || !mentioned.length) {
          return ctx.reply("❌ Tag user tidak valid!")
        }

        targetKey = mentioned[0].split("@")[0]
      } else {
        const targetName = targetInput.toLowerCase()

        for (const [key, user] of Object.entries(db)) {
          if (user?.name?.toLowerCase() === targetName) {
            targetKey = key
            break
          }
        }
      }

      if (!targetKey || !db[targetKey]) {
        return ctx.reply(
          "❌ User tidak ditemukan!\n" +
          "Pastikan user sudah login."
        )
      }

      if (!db[targetKey].name) {
        return ctx.reply("❌ User belum login!")
      }

      if (typeof db[targetKey].uang !== "number") {
        db[targetKey].uang = 0
      }

      db[targetKey].uang += uangAdd
      ctx.saveUserDB(db)

      await ctx.sock.sendMessage(
        ctx.from,
        {
          text:
            `✅ *Uang Berhasil Ditambahkan*\n\n` +
            `👤 Nama: ${db[targetKey].name}\n` +
            `➕ Ditambahkan: ${uangAdd.toLocaleString()}\n` +
            `📊 Total Uang: ${db[targetKey].uang.toLocaleString()}`
        },
        { quoted: ctx.msg }
      )

      try {
        await ctx.sock.sendMessage(targetKey + "@s.whatsapp.net", {
          text:
            `🎉 *Uang Bertambah!*\n\n` +
            `Halo ${db[targetKey].name},\n` +
            `Uang kamu bertambah *${uangAdd.toLocaleString()}*.\n\n` +
            `📊 Total uang sekarang: ${db[targetKey].uang.toLocaleString()}`
        })
      } catch {}
    } catch (err) {
      console.error("ADDUANG ERROR:", err)
      await ctx.reply("⚠️ Terjadi kesalahan saat menambahkan uang.")
    }
  }
}