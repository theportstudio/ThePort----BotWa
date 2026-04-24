const sharp = require("sharp")
const { downloadMediaMessage } = require("@whiskeysockets/baileys")
const { Sticker, StickerTypes } = require("wa-sticker-formatter")

module.exports = {
  name: "stickermeme",
  alias: ["smeme", "stikermeme"],
  loginRequired: true,

  async execute(ctx) {
    try {
      const msg = ctx.msg
      const text = ctx.args.join(" ")

      const [topText, bottomText] = text.split("|").map(t => t?.trim() || "")

      if (!topText && !bottomText) {
        return ctx.reply(
          "💡 Gunakan format:\n.stickermeme Teks Atas | Teks Bawah\n\nContoh:\n.stickermeme Halo | Apa Kabar",
          { quoted: msg }
        )
      }

      const extendedText = msg.message?.extendedTextMessage
      const contextInfo = extendedText?.contextInfo
      const quoted = contextInfo?.quotedMessage
      const isQuoted = !!quoted

      const mediaMsg = isQuoted
        ? quoted.imageMessage
        : msg.message?.imageMessage

      if (!mediaMsg) {
        return ctx.reply(
          "❌ Reply foto atau kirim foto dengan caption .stickermeme",
          { quoted: msg }
        )
      }

      await ctx.sock.sendMessage(ctx.from, {
        react: {
          text: "⏳",
          key: msg.key
        }
      })

      const mediaBuffer = await downloadMediaMessage(
        isQuoted
          ? {
              key: {
                remoteJid: ctx.from,
                id: contextInfo.stanzaId,
                participant: contextInfo.participant
              },
              message: quoted
            }
          : msg,
        "buffer",
        {},
        {
          reuploadRequest: ctx.sock.updateMediaMessage
        }
      )

      const escapeXml = (unsafe) => {
        return unsafe
          .replace(/&/g, "&amp;")
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;")
          .replace(/"/g, "&quot;")
          .replace(/'/g, "&apos;")
      }

      const wrapText = (text, maxChars = 18) => {
        if (!text) return []

        const words = text.toUpperCase().split(" ")
        const lines = []
        let currentLine = ""

        for (const word of words) {
          const testLine = currentLine
            ? `${currentLine} ${word}`
            : word

          if (testLine.length <= maxChars) {
            currentLine = testLine
          } else {
            if (currentLine) lines.push(currentLine)
            currentLine = word
          }
        }

        if (currentLine) lines.push(currentLine)

        return lines
      }

      const createTextLines = (lines, startY, isBottom = false) => {
        if (!lines.length) return ""

        const lineHeight = 52
        const totalHeight = (lines.length - 1) * lineHeight

        let baseY = startY

        if (isBottom) {
          baseY = startY - totalHeight
        }

        return lines
          .map((line, index) => {
            const y = baseY + index * lineHeight
            return `
              <text
                x="50%"
                y="${y}"
                text-anchor="middle"
                dominant-baseline="middle"
                font-size="48"
                class="text"
              >
                ${escapeXml(line)}
              </text>
            `
          })
          .join("")
      }

      const topLines = wrapText(topText, 18)
      const bottomLines = wrapText(bottomText, 18)

      const svgText = `
        <svg width="512" height="512" viewBox="0 0 512 512">
          <defs>
            <style>
              .text {
                fill: white;
                stroke: black;
                stroke-width: 3px;
                font-weight: 900;
                font-family: Impact, Arial, sans-serif;
                text-transform: uppercase;
                paint-order: stroke;
              }
            </style>
          </defs>

          ${createTextLines(topLines, 55, false)}
          ${createTextLines(bottomLines, 460, true)}
        </svg>
      `

      const webpBuffer = await sharp(mediaBuffer)
        .resize(512, 512, {
          fit: "cover"
        })
        .composite([
          {
            input: Buffer.from(svgText),
            top: 0,
            left: 0
          }
        ])
        .webp({
          quality: 90
        })
        .toBuffer()

      const sticker = await new Sticker(webpBuffer)
        .setPack("ThePort • Bot")
        .setAuthor("By Farel Dev")
        .setType(StickerTypes.FULL)
        .setCategories(["✨"])
        .setID(ctx.msg.key.id)
        .setQuality(50)
        .build()

      await ctx.sock.sendMessage(ctx.from, {
        react: {
          text: "✅",
          key: msg.key
        }
      })

      await ctx.sock.sendMessage(
        ctx.from,
        {
          sticker: sticker
        },
        {
          quoted: msg
        }
      )
    } catch (err) {
      console.error("SMEME ERROR:", err)

      await ctx.sock.sendMessage(ctx.from, {
        react: {
          text: "❌",
          key: ctx.msg.key
        }
      })

      await ctx.reply(
        "❌ Gagal membuat sticker meme.",
        {
          quoted: ctx.msg
        }
      )
    }
  }
}