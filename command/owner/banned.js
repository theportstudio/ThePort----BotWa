const settings = require("../../settings")

module.exports = {
  name: "banned",
  alias: ["ban", "block"],

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
        return ctx.reply("❌ Perintah ini khusus owner bot.")
      }

      let targetJid = null

      const mentioned =
        ctx.msg.message?.extendedTextMessage?.contextInfo?.mentionedJid

      if (mentioned && mentioned.length > 0) {
        targetJid = mentioned[0]
      } else if (
        ctx.msg.message?.extendedTextMessage?.contextInfo?.participant
      ) {
        targetJid =
          ctx.msg.message.extendedTextMessage.contextInfo.participant
      } else if (ctx.args[0]) {
        const number = ctx.args[0].replace(/[^0-9]/g, "")
        if (number.length < 10) {
          return ctx.reply("❌ Nomor tidak valid.")
        }
        targetJid = number + "@s.whatsapp.net"
      }

      if (!targetJid) {
        return ctx.reply("❌ Gunakan nomor / tag / reply pesan user.")
      }

      if (targetJid === ctx.sock.user.id) {
        return ctx.reply("❌ Tidak bisa memblokir bot sendiri.")
      }

      await ctx.sock.updateBlockStatus(targetJid, "block")

      await ctx.reply(
        `🚫 *User Berhasil Dibanned*\n\n` +
        `📱 Nomor: ${targetJid.split("@")[0]}`
      )

    } catch (err) {
      console.error("BANNED ERROR:", err)
      await ctx.reply("⚠️ Gagal memblokir user.")
    }
  }
}