module.exports = {
  name: "login",
  alias: ["daftar"],
  category: "user",

  async execute(ctx, msg) {
    const name = ctx.args.join(" ").trim()

    const userKey = ctx.userKey
    const phoneNumber = ctx.phoneNumber

    const waName =
      msg?.pushName ||
      ctx?.pushName ||
      ctx?.senderName ||
      "User"

    if (!name) {
      return ctx.reply(
        "❌ Nama belum diisi\n\n📌 Contoh:\n.login " + waName
      )
    }

    if (name.length < 3) {
      return ctx.reply("❌ Nama minimal 3 karakter")
    }

    const allowedPattern = /^[a-zA-Z0-9_-]+$/

    if (!allowedPattern.test(name)) {
      return ctx.reply(
        "> 🚫 Tidak boleh ada emoji atau simbol lain"
      )
    }

    if (ctx.user.name) {
      return ctx.reply(
        `Kamu sudah login sebagai *${ctx.user.name}*\n` +
        `📱 ID : *${phoneNumber}*`
      )
    }

    const isNameUsed = Object.values(ctx.db).some(
      user =>
        user?.name &&
        user.name.toLowerCase() === name.toLowerCase()
    )

    if (isNameUsed) {
      return ctx.reply(
        `❌ Nama *${name}* sudah digunakan user lain\n` +
        "Silakan pilih nama lain"
      )
    }

    ctx.user.name = name
    ctx.user.phoneNumber = phoneNumber
    ctx.user.status = "Free"
    ctx.user.exp ??= 0
    ctx.user.level ??= 1
    ctx.user.rank ??= "Newbie"

    ctx.db[userKey] = ctx.user
    ctx.saveUserDB(ctx.db)

    ctx.reply(
      `✅ *Login berhasil!*\n\n` +
      `👤 Nama : *${name}*\n` +
      `📱 ID : *${phoneNumber}*\n` +
      `💎 Status : *Free*\n\n` +
      "Welcome anda berhasil.login 🎉\n> Silahkan ketik *.menu* untuk melihat semua daftar fitur."
    )
  }
}