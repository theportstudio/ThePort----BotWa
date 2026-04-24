const settings = require("../../settings")

module.exports = {
  name: "addprem",
  alias: ["addpremium", "prem"],

  async execute(ctx) {
    try {
      const senderId = ctx.sender.split("@")[0]
      const isOwner = settings.ownerId === senderId || settings.ownerNumber.some(num => {
        const senderNumber = ctx.phoneNumber.replace(/[^0-9]/g, "")
        const ownerNum = num.replace(/[^0-9]/g, "")
        return senderNumber === ownerNum
      })

      if (!isOwner) {
        return ctx.reply("❌ Fitur ini hanya untuk owner!")
      }

      const target = ctx.args[0]
      const duration = parseInt(ctx.args[1])

      if (!target) {
        return ctx.reply("💡 Masukkan nomor atau tag user!\nContoh: .addprem @user 7\nContoh: .addprem 628123456789 30")
      }

      if (!duration || duration < 1 || duration > 30) {
        return ctx.reply("❌ Durasi harus 1-30 hari!\nContoh: .addprem @user 7 (untuk 7 hari)")
      }

      let phoneNumber = ""

      if (target.startsWith("@")) {
        const mentioned = ctx.msg.message?.extendedTextMessage?.contextInfo?.mentionedJid
        if (mentioned && mentioned.length > 0) {
          phoneNumber = mentioned[0].split("@")[0]
        } else {
          return ctx.reply("❌ Tag user tidak valid!")
        }
      } else {
        phoneNumber = target.replace(/[^0-9]/g, "")
      }

      if (!phoneNumber || phoneNumber.length < 10) {
        return ctx.reply("❌ Nomor tidak valid!")
      }

      const userKey = phoneNumber
      const db = ctx.db

      if (!db[userKey]) {
        return ctx.reply(`❌ User +${phoneNumber} belum terdaftar di bot!\nUser harus melakukan .login terlebih dahulu.`)
      }

      if (!db[userKey].name) {
        return ctx.reply(`❌ User +${phoneNumber} belum melakukan login!\nUser harus melakukan .login terlebih dahulu.`)
      }

      const now = Date.now()
      const expireDate = now + (duration * 24 * 60 * 60 * 1000)

      db[userKey].status = "Premium"
      db[userKey].premiumStart = now
      db[userKey].premiumExpire = expireDate
      db[userKey].premiumDuration = duration

      const expireDateStr = new Date(expireDate).toLocaleDateString("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric"
      })

      ctx.saveUserDB(db)

      await ctx.sock.sendMessage(
        ctx.from,
        {
          text: `✅ *Premium Activated*\n\n👤 User: +${phoneNumber}\n📛 Nama: ${db[userKey].name}\n⭐ Status: Premium\n📅 Durasi: ${duration} hari\n⏳ Expired: ${expireDateStr}\n\nUser sekarang dapat menggunakan semua fitur premium.`
        },
        { quoted: ctx.msg }
      )

      try {
        await ctx.sock.sendMessage(
          phoneNumber + "@s.whatsapp.net",
          {
            text: `🎉 *Selamat ${db[userKey].name}!*\n\nAkun Anda telah diupgrade ke status *PREMIUM*.\n\n📅 Durasi: ${duration} hari\n⏳ Berlaku hingga: ${expireDateStr}\n\n⭐ Benefit Premium:\n• Limit unlimited\n• Akses semua fitur eksklusif\n• Prioritas support\n• No iklan\n\nNikmati pengalaman terbaik dengan AutoBot!`
          }
        )
      } catch (err) {
        console.log("Gagal mengirim notifikasi ke user:", err.message)
      }

    } catch (err) {
      console.error("ADDPREM ERROR:", err)
      await ctx.reply("⚠️ Terjadi kesalahan saat menambahkan premium.")
    }
  }
}