module.exports = {
  name: "ceksifat",
  alias: ["sifat"],
  loginRequired: true,

  async execute(ctx) {
    try {
      let targetJid
      const msg = ctx.msg

      if (msg?.message?.extendedTextMessage?.contextInfo?.participant) {
        targetJid =
          msg.message.extendedTextMessage.contextInfo.participant
      }

      else if (
        msg?.message?.extendedTextMessage?.contextInfo?.mentionedJid?.length
      ) {
        targetJid =
          msg.message.extendedTextMessage.contextInfo.mentionedJid[0]
      }

      else {
        targetJid = ctx.sender
      }

      const sifatList = [
        "Pemalas tapi kreatif",
        "Suka drama tapi jago coding",
        "Pintar tapi pelupa",
        "Suka makan tapi diet terus",
        "Cerewet tapi baik hati",
        "Pemalu tapi pemberani",
        "Suka tidur siang",
        "Selalu telat tapi santai",
        "Riang tapi pemikir",
        "Suka ngelawak",
        "Jago masak tapi lupa beli bahan",
        "Cerdas tapi nyentrik",
        "Santuy tapi rajin",
        "Suka tantangan",
        "Setia kawan",
        "Bucin sejati",
        "Galak tapi perhatian",
        "Suka ngegame",
        "Kocak tapi misterius",
        "Jago debat tapi pelupa",
        "Pembenci tapi perhatian"
      ]

      const sifat =
        sifatList[Math.floor(Math.random() * sifatList.length)]

      await ctx.sock.sendMessage(
        ctx.from,
        {
          text:
            `👤 *HASIL CEK SIFAT*\n` +
            `━━━━━━━━━━━━━━\n` +
            `👥 User: @${targetJid.split("@")[0]}\n` +
            `✨ Sifat: *${sifat}*\n` +
            `━━━━━━━━━━━━━━`,
          mentions: [targetJid]
        },
        { quoted: ctx.msg }
      )

    } catch (err) {
      console.error("CEKSIFAT ERROR:", err)
      await ctx.reply("❌ Gagal mengecek sifat 😥", { quoted: ctx.msg })
    }
  }
}