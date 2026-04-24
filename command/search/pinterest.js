const {
  generateWAMessageFromContent,
  prepareWAMessageMedia,
  proto
} = require("@whiskeysockets/baileys")

module.exports = {
  name: "pinterest",
  alias: ["pin"],
  loginRequired: true,

  async execute(ctx) {
    try {
      const query = ctx.args.join(" ").trim()

      if (!query) {
        return ctx.reply(
          "💡 Gunakan:\n*.pinterest <kata kunci>*\nContoh: *.pinterest pemandangan malam*"
        )
      }

      await ctx.sock.sendMessage(ctx.from, {
        react: { text: "⏳", key: ctx.msg.key }
      })

      const apiUrl =
        "https://api.siputzx.my.id/api/s/pinterest?type=image&query=" +
        encodeURIComponent(query)

      const res = await fetch(apiUrl)
      if (!res.ok) throw new Error("API Pinterest gagal")

      const json = await res.json()
      const results = json?.data

      if (!Array.isArray(results) || results.length === 0) {
        return ctx.reply("❌ Gambar tidak ditemukan.")
      }

      const validImages = results
        .filter(v => v?.image_url || v?.pin)
        .slice(0, 5)

      if (validImages.length === 0) {
        return ctx.reply("❌ Tidak ada gambar valid.")
      }

      const cards = []

      for (let i = 0; i < validImages.length; i++) {
        const item = validImages[i]
        const imageUrl = item.image_url || item.pin

        const media = await prepareWAMessageMedia(
          {
            image: { url: imageUrl }
          },
          {
            upload: ctx.sock.waUploadToServer
          }
        )

        cards.push({
          header: {
            hasMediaAttachment: true,
            ...media
          },
          body: {
            text: `📌 Hasil Pencarian : ${i + 1}`
          },
          footer: {
            text: "Pinterest Search - ThePort"
          },
          nativeFlowMessage: {
            buttons: []
          }
        })
      }

      const msg = generateWAMessageFromContent(
        ctx.from,
        proto.Message.fromObject({
          viewOnceMessage: {
            message: {
              interactiveMessage: {
                body: {
                  text: `Pencarian dengan  query *${query}* Di dapatkan berikut ini hasilnya :`
                },
                footer: {
                  text: "ThePort"
                },
                header: {
                  hasMediaAttachment: false
                },
                carouselMessage: {
                  cards
                }
              }
            }
          }
        }),
        {
          quoted: ctx.msg,
          userJid: ctx.sock.user.id
        }
      )

      await ctx.sock.relayMessage(
        ctx.from,
        msg.message,
        {
          messageId: msg.key.id
        }
      )

    } catch (err) {
      console.log("PINTEREST CAROUSEL ERROR:", err)

      await ctx.reply(
        "⚠️ Gagal mengambil gambar dari Pinterest. Coba kata kunci lain."
      )
    }
  }
}