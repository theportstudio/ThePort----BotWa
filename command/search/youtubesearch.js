const {
  generateWAMessageFromContent,
  prepareWAMessageMedia,
  proto
} = require("@whiskeysockets/baileys")

module.exports = {
  name: "youtubesearch",
  alias: ["yts", "ytsearch"],
  loginRequired: true,

  async execute(ctx) {
    try {
      const input = ctx.args.join(" ").trim()

      if (!input) {
        return ctx.reply(
          "💡 Gunakan:\n*.youtubesearch <judul video>*\nContoh: *.youtubesearch tutorial javascript*"
        )
      }

      await ctx.sock.sendMessage(
        ctx.from,
        {
          react: {
            text: "🔍",
            key: ctx.msg.key
          }
        }
      )

      const apiUrl = `https://api.deline.web.id/search/youtube?q=${encodeURIComponent(input)}`
      const res = await fetch(apiUrl)
      const data = await res.json()

      if (!data?.status || !Array.isArray(data.result) || data.result.length === 0) {
        return ctx.reply("❌ Video tidak ditemukan.")
      }

      const results = data.result
        .filter(v => v?.title && v?.link && v?.imageUrl)
        .slice(0, 5)

      if (results.length === 0) {
        return ctx.reply("❌ Tidak ada hasil valid.")
      }

      const prefix = global.settings?.prefix || "."
      const cards = []

      for (let i = 0; i < results.length; i++) {
        const item = results[i]

        const media = await prepareWAMessageMedia(
          {
            image: {
              url: item.imageUrl
            }
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
            text:
`🎬 ${item.title.slice(0, 80)}

👤 ${item.channel || "Unknown"}
⏱ ${item.duration || "-"}
⬇ ${prefix}ytmp4 ${item.link}
⬇ ${prefix}ytmp3 ${item.link}`
          },
          footer: {
            text: "YouTube Search"
          },
          nativeFlowMessage: {
            buttons: [
              {
                name: "cta_url",
                buttonParamsJson: JSON.stringify({
                  display_text: "Buka YouTube",
                  url: item.link,
                  merchant_url: item.link
                })
              }
            ]
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
                  text: `🎬 Hasil YouTube Search: ${input}`
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

      await ctx.sock.sendMessage(ctx.from, {
        react: {
          text: "✅",
          key: ctx.msg.key
        }
      })

    } catch (err) {
      console.error("YOUTUBE SEARCH ERROR:", err)

      await ctx.sock.sendMessage(ctx.from, {
        react: {
          text: "❌",
          key: ctx.msg.key
        }
      })

      await ctx.reply("❌ Terjadi kesalahan saat mencari video. Coba lagi nanti.")
    }
  }
}