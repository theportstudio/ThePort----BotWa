module.exports = {
  name: "cekkhodam",
  alias: ["khodam"],
  loginRequired: true,

  async execute(ctx) {
    try {
      let targetJid
      let displayName = "Pengguna"

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

      const khodamList = [
        "Macan Pemarah",
        "Buaya Sunda",
        "Harimau Birahi",
        "Tutup Odol",
        "Kanebo Kering",
        "Remote TV",
        "Sendal Jepit",
        "Genderuwo TikTok",
        "Tuyul Main PS5",
        "Kuntilanak Selfie",
        "Pocong Joget",
        "Jin Es Krim Leleh",
        "Si Lontong Lumer",
        "Setan Jualan Online",
        "Tuyul Jago Coding",
        "Genderuwo Nonton Netflix",
        "Panci Gosong",
        "Ember Bocor",
        "Bantal Empuk",
        "Senter Mati"
      ]

      const khodam =
        khodamList[Math.floor(Math.random() * khodamList.length)]

      const power = Math.floor(Math.random() * 100) + 1

      await ctx.sock.sendMessage(
        ctx.from,
        {
          text:
            `👤 *HASIL CEK KHODAM*\n` +
            `━━━━━━━━━━━━━━\n` +
            `👥 User: @${targetJid.split("@")[0]}\n` +
            `🪄 Khodam: *${khodam}*\n` +
            `⚡ Power: *${power}*\n` +
            `━━━━━━━━━━━━━━`,
          mentions: [targetJid]
        },
        { quoted: ctx.msg }
      )

    } catch (err) {
      console.error("CEKKHODAM ERROR:", err)
      await ctx.reply("❌ Gagal mengecek khodam 😥", { quoted: ctx.msg })
    }
  }
}