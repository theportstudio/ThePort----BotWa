const { proto } = require("@whiskeysockets/baileys")

module.exports = {
  name: "del",
  alias: ["delete", "hapus"],
  loginRequired: true,

  async execute(ctx) {
    try {
      const msg = ctx.msg
      const ext = msg.message?.extendedTextMessage
      const info = ext?.contextInfo

      if (!info?.quotedMessage || !info?.stanzaId) {
        return ctx.reply("Reply pesan bot yang ingin dihapus.")
      }

      const key = {
        remoteJid: ctx.from,
        id: info.stanzaId,
        fromMe: true,
        participant: ctx.isGroup ? info.participant : undefined
      }

      if (!key.fromMe) {
        return ctx.reply("Saya hanya bisa menghapus pesan saya sendiri.")
      }

      await ctx.sock.sendMessage(ctx.from, { delete: key })

    } catch (err) {
      console.error("DEL ERROR:", err)
      ctx.reply("Gagal menghapus pesan.")
    }
  }
}