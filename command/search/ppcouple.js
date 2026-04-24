const axios = require("axios")
const {
  generateWAMessageFromContent,
  prepareWAMessageMedia,
  proto
} = require("@whiskeysockets/baileys")

module.exports = {
  name: "ppcouple",
  alias: ["ppc", "couple"],
  loginRequired: true,

  async execute(ctx) {
    try {
      await ctx.sock.sendMessage(
        ctx.from,
        {
          text: "⏳ Mengambil PP Couple..."
        },
        { quoted: ctx.msg }
      )

      const { data } = await axios.get(
        "https://api.deline.web.id/random/ppcouple",
        {
          timeout: 15000
        }
      )

      if (!data?.result?.cowo || !data?.result?.cewe) {
        return ctx.reply("❌ Gagal mengambil gambar.")
      }

      const media1 = await prepareWAMessageMedia(
        {
          image: { url: data.result.cowo }
        },
        {
          upload: ctx.sock.waUploadToServer
        }
      )

      const media2 = await prepareWAMessageMedia(
        {
          image: { url: data.result.cewe }
        },
        {
          upload: ctx.sock.waUploadToServer
        }
      )

      const msg = generateWAMessageFromContent(
        ctx.from,
        proto.Message.fromObject({
          viewOnceMessage: {
            message: {
              interactiveMessage: {
                body: {
                  text: "💞 PP Couple Random"
                },
                footer: {
                  text: "AutoBot"
                },
                header: {
                  hasMediaAttachment: false
                },
                carouselMessage: {
                  cards: [
                    {
                      header: {
                        hasMediaAttachment: true,
                        ...media1
                      },
                      body: {
                        text: "👦 Cowok"
                      },
                      footer: {
                        text: "ThePort - Bot"
                      },
                      nativeFlowMessage: {
                        buttons: []
                      }
                    },
                    {
                      header: {
                        hasMediaAttachment: true,
                        ...media2
                      },
                      body: {
                        text: "👧 Cewek"
                      },
                      footer: {
                        text: "ThePort Bot"
                      },
                      nativeFlowMessage: {
                        buttons: []
                      }
                    }
                  ]
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
      console.log("PPCOUPLE CAROUSEL ERROR:", err)

      await ctx.sock.sendMessage(
        ctx.from,
        {
          text: "❌ Gagal mengirim carousel PP Couple."
        },
        { quoted: ctx.msg }
      )
    }
  }
}