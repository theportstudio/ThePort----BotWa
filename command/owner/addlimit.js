const settings = require("../../settings")

module.exports = {
  name: "addlimit",
  alias: ["limitadd", "tambahlimit"],

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
      const limitAdd = parseInt(ctx.args[1])

      if (!targetInput || !limitAdd) {
        return ctx.reply(
          "💡 Format salah!\n\n" +
          "Contoh:\n" +
          ".addlimit farel 10\n" +
          ".addlimit @user 10"
        )
      }

      if (limitAdd < 1) {
        return ctx.reply("❌ Jumlah limit harus lebih dari 0!")
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

      if (typeof db[targetKey].limit !== "number") {
        db[targetKey].limit = 0
      }

      db[targetKey].limit += limitAdd
      ctx.saveUserDB(db)

      await ctx.sock.sendMessage(
        ctx.from,
        {
          text:
            `✅ *Limit Berhasil Ditambahkan*\n\n` +
            `👤 Nama: ${db[targetKey].name}\n` +
            `➕ Ditambahkan: ${limitAdd}\n` +
            `📊 Total Limit: ${db[targetKey].limit}`
        },
        { quoted: ctx.msg }
      )

      try {
        await ctx.sock.sendMessage(targetKey + "@s.whatsapp.net", {
          text:
            `🎉 *Limit Bertambah!*\n\n` +
            `Halo ${db[targetKey].name},\n` +
            `Limit kamu bertambah *${limitAdd}*.\n\n` +
            `📊 Total limit sekarang: ${db[targetKey].limit}`
        })
      } catch {}
    } catch (err) {
      console.error("ADDLIMIT ERROR:", err)
      await ctx.reply("⚠️ Terjadi kesalahan saat menambahkan limit.")
    }
  }
}