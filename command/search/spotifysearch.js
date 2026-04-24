const axios = require("axios")
const {
  generateWAMessageFromContent,
  prepareWAMessageMedia,
  proto
} = require("@whiskeysockets/baileys")

const prefix = global.settings?.prefix || "."

module.exports = {
  name: "spotifysearch",
  alias: ["spsrch", "sptfy"],
  loginRequired: true,

  async execute(ctx) {
    try {
      const query = ctx.args.join(" ").trim()

      if (!query) {
        return ctx.sock.sendMessage(
          ctx.from,
          {
            text: "⚠️ Gunakan: .spotifysearch <nama lagu / artis>"
          },
          {
            quoted: ctx.msg
          }
        )
      }

      await ctx.sock.sendMessage(
        ctx.from,
        {
          react: {
            text: "🎵",
            key: ctx.msg.key
          }
        }
      )

      const { data } = await axios.get(
        `https://api.nexray.web.id/search/spotify?q=${encodeURIComponent(query)}`
      )

      const results = data?.result

      if (!Array.isArray(results) || results.length === 0) {
        return ctx.sock.sendMessage(
          ctx.from,
          {
            text: "⚠️ Lagu tidak ditemukan."
          },
          {
            quoted: ctx.msg
          }
        )
      }

      const topResults = results
        .filter(item =>
          item &&
          item.title &&
          item.artist &&
          item.url &&
          item.thumbnail
        )
        .slice(0, 5)

      if (topResults.length === 0) {
        return ctx.reply("⚠️ Tidak ada hasil valid.")
      }

      const cards = []

      for (let i = 0; i < topResults.length; i++) {
        const track = topResults[i]

        const media = await prepareWAMessageMedia(
          {
            image: {
              url: track.thumbnail
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
`🎵 ${track.title.slice(0, 80)}

🎤 ${track.artist || "-"}
💿 ${track.album || "-"}
⏱ ${track.duration || "-"}
⬇ ${prefix}spotifydl ${track.url}`
          },
          footer: {
            text: "Spotify Search"
          },
          nativeFlowMessage: {
            buttons: [
              {
                name: "cta_url",
                buttonParamsJson: JSON.stringify({
                  display_text: "Buka Spotify",
                  url: track.url,
                  merchant_url: track.url
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
                  text: `🎧 Hasil Spotify Search: ${query}`
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
      console.error("SPOTIFY SEARCH ERROR:", err)

      await ctx.sock.sendMessage(
        ctx.from,
        {
          react: {
            text: "❌",
            key: ctx.msg.key
          }
        }
      )

      await ctx.sock.sendMessage(
        ctx.from,
        {
          text: "⚠️ Gagal mencari lagu Spotify."
        },
        {
          quoted: ctx.msg
        }
      )
    }
  }
}