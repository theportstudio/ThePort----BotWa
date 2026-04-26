const settings = require("../../settings")

module.exports = {
  name: "owner",
  alias: ["creator", "dev", "developer"],
  category: "general",
  loginRequired: false,

  async execute(ctx) {
    try {
      const ownerNumber = settings.ownerNumber[0]
      const ownerName = settings.ownerName

      const vcard = `BEGIN:VCARD
VERSION:3.0
FN:${ownerName}
N:${ownerName};;;
TEL;type=CELL;waid=${ownerNumber}:+${ownerNumber}
END:VCARD`

        return ctx.reply(
          "*! Berikut adalah kontak owner bot ini !*\n_Langsung ke intinya saja_",
          { quoted: ctx.msg }
        )

      await ctx.sock.sendMessage(
        ctx.from,
        {
          contacts: {
            displayName: ownerName,
            contacts: [{ vcard }]
          }
        },
        { quoted: ctx.msg }
      )

    } catch (err) {
      console.error("OWNER ERROR:", err)
      await ctx.reply("Terjadi kesalahan saat membagikan kontak owner.")
    }
  }
}