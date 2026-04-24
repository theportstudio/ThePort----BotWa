const axios = require("axios")

module.exports = {
  name: "mediafire",
  alias: ["mf", "mfdl"],

  async execute(ctx) {
    try {
      const args = ctx.args || []
      const url = args[0]

      if (!url || !url.includes("mediafire.com")) {
        return ctx.reply(
          "💡 Gunakan format:\n.mediafire <link mediafire>\n\nContoh:\n.mediafire https://www.mediafire.com/file/xxxxx/v2.zip/file",
          { quoted: ctx.msg }
        )
      }

      await ctx.reply("⏳ Waitt Kakk...", {
        quoted: ctx.msg
      })

      const apiUrl = `https://api.nexray.web.id/downloader/mediafire?url=${encodeURIComponent(url)}`
      const res = await axios.get(apiUrl, {
        timeout: 30000,
        headers: {
          "User-Agent": "Mozilla/5.0"
        }
      })

      if (
        !res.data ||
        !res.data.status ||
        !res.data.result ||
        !res.data.result.download_url
      ) {
        throw new Error("Gagal mengambil data dari API")
      }

      const fileName = res.data.result.filename || "file.zip"
      const downloadUrl = res.data.result.download_url
      const mimeType = res.data.result.mimetype || "application/octet-stream"

      await ctx.sock.sendMessage(
        ctx.from,
        {
          document: { url: downloadUrl },
          fileName: fileName,
          mimetype: mimeType,
          caption:
            `📂 *Mediafire Downloader*\n\n` +
            `📄 *Nama:* ${fileName}\n` +
            `🔗 *Link:* ${url}\n\n` +
            `_File berhasil diproses, sedang dikirim..._`
        },
        { quoted: ctx.msg }
      )
    } catch (err) {
      console.error("MEDIAFIRE ERROR:", err.message)

      await ctx.sock.sendMessage(ctx.from, {
        react: { text: "❌", key: ctx.msg.key }
      })

      await ctx.reply(
        "⚠️ Gagal mendownload file Mediafire. Pastikan link valid atau coba lagi nanti.",
        { quoted: ctx.msg }
      )
    }
  }
}
