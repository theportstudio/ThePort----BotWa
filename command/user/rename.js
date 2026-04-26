module.exports = {
  name: "rename",
  alias: ["gantinama", "ubahnama"],
  category: "user",
  loginRequired: true,

  async execute(ctx) {
    const newName = ctx.args.join(" ").trim()
    const userKey = ctx.userKey
    const phoneNumber = ctx.phoneNumber

    if (!ctx.user.name) {
      return ctx.reply(
        `Kamu belum login.\n` +
        `Silakan login terlebih dahulu dengan *.login <nama>*`
      )
    }

    if (!newName) {
      return ctx.reply(
        `❌ Contoh penggunaan:\n` +
        `*.rename BudiSantoso*`
      )
    }

    if (newName.length < 3) {
      return ctx.reply("❌ Nama minimal 3 karakter")
    }

    if (newName.length > 20) {
      return ctx.reply("❌ Nama maksimal 20 karakter")
    }

    const validNameRegex = /^[a-zA-Z0-9 _-]+$/

    if (!validNameRegex.test(newName)) {
      return ctx.reply(
        "> 🚫 Tidak boleh ada emoji atau simbol lain"
      )
    }

    if (newName.toLowerCase() === ctx.user.name.toLowerCase()) {
      return ctx.reply("❌ Nama baru tidak boleh sama dengan nama lama")
    }

    const isNameUsed = Object.values(ctx.db).some(
      user =>
        user.name &&
        user.name.toLowerCase() === newName.toLowerCase() &&
        user.phoneNumber !== phoneNumber
    )

    if (isNameUsed) {
      return ctx.reply(
        `❌ Nama *${newName}* sudah digunakan user lain.\n` 
      )
    }

    const oldName = ctx.user.name

    ctx.user.name = newName
    ctx.db[userKey] = ctx.user
    ctx.saveUserDB(ctx.db)

    ctx.reply(
      `✅ *Rename berhasil!*\n\n` +
      `├ 👤 Nama Lama : *${oldName}*\n` +
      `├ 👤 Nama Baru : *${newName}*\n` +
      `├ 📱 ID : *${phoneNumber}*\n` +
      `└ ⭐ Level : *${ctx.user.level || 1}*\n\n` +
      `Data berhasil diperbarui.`
    )
  }
}