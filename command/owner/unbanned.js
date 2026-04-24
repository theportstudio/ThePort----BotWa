const settings = require("../../settings")

module.exports = {
  name: "unbanned",
  alias: ["unban", "unblock"],

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

      await ctx.sock.updateBlockStatus(targetJid, "unblock")

      await ctx.reply(
        `✅ *User Berhasil Di-unbanned*\n\n` +
        `📱 Nomor: ${targetJid.split("@")[0]}`
      )

    } catch (err) {
      console.error("UNBANNED ERROR:", err)
      await ctx.reply("⚠️ Gagal membuka blokir user.")
    }
  }
}