const axios = require("axios")
const {
  generateWAMessageFromContent,
  prepareWAMessageMedia,
  proto
} = require("@whiskeysockets/baileys")

module.exports = {
  name: "tiktoksearch",
  alias: ["ttsearch", "tiktok"],
  loginRequired: true,

  async execute(ctx) {
    try {
      const text = ctx.args.join(" ").trim()

      if (!text) {
        return ctx.reply("💡 Contoh: *.tiktoksearch dance*")
      }

      await ctx.sock.sendMessage(ctx.from, {
        react: {
          text: "🔍",
          key: ctx.msg.key
        }
      })

      const { data } = await axios.get(
        `https://api-faa.my.id/faa/tiktok-search?q=${encodeURIComponent(text)}`
      )

      if (!data?.status || !Array.isArray(data.result) || data.result.length === 0) {
        return ctx.reply("❌ Video TikTok tidak ditemukan.")
      }

      const videos = data.result
        .filter(v => v?.cover && v?.url_nowm)
        .slice(0, 5)

      if (videos.length === 0) {
        return ctx.reply("❌ Tidak ada video valid.")
      }

      const cards = []

      for (let i = 0; i < videos.length; i++) {
        const item = videos[i]

        const media = await prepareWAMessageMedia(
          {
            image: {
              url: item.cover
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
`🎵 ${item.title?.slice(0, 80) || "No Title"}

👤 ${item.author?.nickname || "Unknown"}
👁️ ${item.stats?.views || 0} views`
          },
          footer: {
            text: "TikTok Search"
          },
          nativeFlowMessage: {
            buttons: [
              {
                name: "cta_url",
                buttonParamsJson: JSON.stringify({
                  display_text: "Buka",
                  url: item.url_nowm,
                  merchant_url: item.url_nowm
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
                  text: `✨ Hasil TikTok Search: ${text}`
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
      console.log("TIKTOK CAROUSEL ERROR:", err?.message || err)

      await ctx.sock.sendMessage(ctx.from, {
        react: {
          text: "❌",
          key: ctx.msg.key
        }
      })

      return ctx.reply("⚠️ Gagal mengambil video TikTok.")
    }
  }
}