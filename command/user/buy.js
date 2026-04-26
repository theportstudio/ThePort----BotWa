const {
  generateWAMessageFromContent,
  prepareWAMessageMedia,
  proto
} = require("@whiskeysockets/baileys")

const settings = require("../../settings")

const PRICE_PER_LIMIT = 5000

async function runBuyCommand(ctx) {
  const { args, user, from, sock, msg, saveUserDB, db, userKey } = ctx

  const type = (args[1] || "").toLowerCase()

  if (type === "limit") {
    const amount = parseInt(args[2])

    if (!amount || amount <= 0) {
      return sock.sendMessage(from, {
        text: "❌ Format salah\nContoh: .buy limit 10"
      }, { quoted: msg })
    }

    const totalPrice = amount * PRICE_PER_LIMIT

    if ((user.uang || 0) < totalPrice) {
      await sock.sendMessage(from, {
        react: { text: "❌", key: msg.key }
      })
      return sock.sendMessage(from, {
        text:
          `❌ Uang tidak cukup\n💰 Harga: Rp${totalPrice.toLocaleString()}\n💳 Saldo: Rp${(user.uang || 0).toLocaleString()}`
      }, { quoted: msg })
    }

    user.uang -= totalPrice
    user.limit = (user.limit || 0) + amount

    db[userKey] = user
    saveUserDB(db)

    await sock.sendMessage(from, {
      react: { text: "✅", key: msg.key }
    })

    return sock.sendMessage(from, {
      text:
        `✅ PEMBELIAN BERHASIL\n\n` +
        `📦 Limit +${amount}\n` +
        `💰 Total: Rp${totalPrice.toLocaleString()}\n` +
        `⭐ Total Limit: ${user.limit}`
    }, { quoted: msg })
  }
}

async function execute(ctx) {
  const { sock, from, msg, user } = ctx

  await sock.sendMessage(from, {
    react: {
      text: "🛒",
      key: msg.key
    }
  })

  const packages = [10, 20, 50, 150, 500, 1000]

  const cards = []

  for (const qty of packages) {
    const total = qty * PRICE_PER_LIMIT

    const media = await prepareWAMessageMedia(
      { image: { url: settings.menuImage } },
      { upload: sock.waUploadToServer }
    )

    cards.push({
      header: {
        hasMediaAttachment: true,
        ...media
      },
      body: {
        text:
          `⭐ PAKET ${qty} LIMIT\n` +
          `💵 Rp${total.toLocaleString()}\n` +
          `💰 Saldo: Rp${(user.uang || 0).toLocaleString()}`
      },
      footer: { text: "ThePort Marketplace" },
      nativeFlowMessage: {
        buttons: [
          {
            name: "quick_reply",
            buttonParamsJson: JSON.stringify({
              display_text: `Beli ${qty} Limit`,
              id: `BUY_LIMIT_${qty}`
            })
          }
        ]
      }
    })
  }

  const msgContent = generateWAMessageFromContent(
    from,
    proto.Message.fromObject({
      viewOnceMessage: {
        message: {
          interactiveMessage: {
            body: { text: "🛍️ TOKO LIMIT" },
            footer: { text: "ThePort Multi Device" },
            header: { hasMediaAttachment: false },
            carouselMessage: { cards }
          }
        }
      }
    }),
    { quoted: msg }
  )

  await sock.relayMessage(from, msgContent.message, {
    messageId: msgContent.key.id
  })
}

module.exports = {
  name: "buy",
  alias: ["beli", "shop"],
  loginRequired: true,
  execute,
  runBuyCommand
}