const fs = require("fs")
const path = require("path")

const PRICE_PER_LIMIT = 5000

module.exports = {
  name: "buy",
  alias: ["beli", "shop"],
  loginRequired: true,
  category: "user",

  async execute(ctx) {
    const { args, user, reply, saveUserDB, db, userKey } = ctx

    if (!args[0] || args[0].toLowerCase() !== "limit") {
      const priceList = `
╭──⊙ *TOKO LIMIT* 💰
│ *Harga Limit:*
│ • 1 Limit = Rp5.000
│ • 5 Limit = Rp25.000
│ • 10 Limit = Rp50.000
│ • 50 Limit = Rp250.000
│ • 100 Limit = Rp500.000
╰──────────⊙
╭──⊙ *Cara Pembelian:*
│ .buy limit <jumlah>
│
│ *Contoh:*
│ .buy limit 10
│
│ *Saldo Anda:* Rp${(user.uang || 0).toLocaleString()}
│ *Limit Saat Ini:* ${user.limit || 0}
╰──────────⊙`

      return await reply(priceList)
    }

    const amount = parseInt(args[1])

    if (!amount || isNaN(amount) || amount <= 0) {
      return await reply("❌ Masukkan jumlah limit yang valid!\n\nContoh: .buy limit 10")
    }

    const totalPrice = amount * PRICE_PER_LIMIT

    if ((user.uang || 0) < totalPrice) {
      return await reply(
        `❌ Uang tidak cukup!\n\n` +
        `💰 Harga ${amount} limit: Rp${totalPrice.toLocaleString()}\n` +
        `💳 Saldo Anda: Rp${(user.uang || 0).toLocaleString()}\n\n` +
        `Kekurangan: Rp${(totalPrice - (user.uang || 0)).toLocaleString()}`
      )
    }

    user.uang -= totalPrice
    user.limit = (user.limit || 0) + amount

    db[userKey] = user
    saveUserDB(db)

    const successMsg = `
╭──⊙ *PEMBELIAN BERHASIL* ✅
│ 📦 Item: ${amount} Limit
│ 💰 Harga: Rp${totalPrice.toLocaleString()}
│ 💳 Sisa Saldo: Rp${user.uang.toLocaleString()}
│ ⭐ Limit Sekarang: ${user.limit}
╰──────────⊙

Terima kasih telah berbelanja! 🎉`

    await reply(successMsg)
  }
}