module.exports = {
  name: "money",
  alias: ["m", "saldo"],
  category: "user",
  loginRequired: true,

  async execute(ctx) {
    try {
      if (!ctx.user || !ctx.user.name) {
        return ctx.reply(
          `Kamu belum login.\n` +
          `Silakan login dengan *.login <nama>*`
        )
      }

      const formatRupiah = (num) => {
        return Number(num || 0).toLocaleString("id-ID")
      }

      const name = ctx.user.name
      const saldo = Number(
        ctx.user.uang ||
        ctx.user.money ||
        ctx.user.balance ||
        ctx.user.coin ||
        0
      )

      const phoneNumber = ctx.phoneNumber

      const teks =
        `💰 *INFORMASI SALDO*\n\n` +
        `👤 Nama : *${name}*\n` +
        `📱 ID   : *${phoneNumber}*\n` +
        `💵 Saldo: *Rp${formatRupiah(saldo)}*\n`

      await ctx.reply(teks)

    } catch (err) {
      console.error("MONEY COMMAND ERROR:", err)
      ctx.reply("Terjadi kesalahan saat mengambil saldo")
    }
  }
}