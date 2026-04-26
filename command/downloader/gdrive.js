const axios = require("axios")

module.exports = {
  name: "gdrive",
  alias: ["gd", "drive"],
  category: "downloader",
  loginRequired: false,

  async execute(ctx) {
    try {
      const url = ctx.args[0]

      if (!url) {
        return ctx.reply(
          `❌ Contoh penggunaan:\n` +
          `*.gdrive https://drive.google.com/...*`
        )
      }

      const apiUrl =
        `https://api.deline.web.id/downloader/gdrive?url=${encodeURIComponent(url)}`

      const res = await axios.get(apiUrl, {
        timeout: 15000
      })

      const data = res.data

      if (!data.status) {
        return ctx.reply("❌ Gagal mengambil data dari Google Drive")
      }

      const result = data.result

      const fileUrl = result.downloadUrl
      const fileName = result.fileName
      const fileSize = result.fileSize
      const mimetype = result.mimetype

      const caption =
        `📥 *GOOGLE DRIVE DOWNLOADER*\n\n` +
        `📄 Nama : ${fileName}\n` +
        `📦 Size : ${fileSize}\n` +
        `📁 Type : ${mimetype}`

      await ctx.sock.sendMessage(
        ctx.from,
        {
          document: { url: fileUrl },
          fileName: fileName,
          mimetype: mimetype,
          caption: caption
        },
        { quoted: ctx.msg }
      )

    } catch (err) {
      console.error("GDRIVE ERROR:", err)
      ctx.reply("❌ Terjadi kesalahan saat download file")
    }
  }
}