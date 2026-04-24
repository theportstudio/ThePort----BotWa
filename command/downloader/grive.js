const axios = require("axios")

module.exports = {
  name: "googledrive",
  alias: ["gdrive", "drive"],

  async execute(ctx) {
    try {
      const url = ctx.args[0]

      if (!url || !url.includes("drive.google.com")) {
        return ctx.reply(
          "💡 Gunakan format:\n.googledrive <link google drive>\n\nContoh:\n.googledrive https://drive.google.com/file/d/xxxxx/view",
          { quoted: ctx.msg }
        )
      }

      await ctx.reply("⏳ Waitt Kakk...", {
        quoted: ctx.msg
      })

      const apiUrl = `https://api.siputzx.my.id/api/d/gdrive?url=${encodeURIComponent(url)}`

      const res = await axios.get(apiUrl, {
        timeout: 30000,
        headers: {
          "User-Agent": "Mozilla/5.0"
        }
      })

      if (
        !res.data ||
        !res.data.status ||
        !res.data.data ||
        !res.data.data.download
      ) {
        throw new Error("Gagal mengambil data dari API")
      }

      const fileName = res.data.data.name || "file"
      const ext = fileName.split(".").pop().toLowerCase()

      const mimeTypes = {
        zip: "application/zip",
        rar: "application/vnd.rar",
        pdf: "application/pdf",
        mp4: "video/mp4",
        mp3: "audio/mpeg",
        jpg: "image/jpeg",
        jpeg: "image/jpeg",
        png: "image/png",
        apk: "application/vnd.android.package-archive",
        txt: "text/plain",
        doc: "application/msword",
        docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        xls: "application/vnd.ms-excel",
        xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      }

      const detectedMimeType = mimeTypes[ext] || "application/octet-stream"
      const downloadUrl = res.data.data.download

      const fileRes = await axios.get(downloadUrl, {
        responseType: "stream",
        timeout: 120000,
        headers: {
          "User-Agent": "Mozilla/5.0"
        }
      })

      await ctx.sock.sendMessage(
        ctx.from,
        {
          document: { url: downloadUrl },
          fileName: fileName,
          mimetype: detectedMimeType,
          
        },
        { quoted: ctx.msg }
      )
    } catch (err) {
      console.error("GOOGLEDRIVE ERROR:", err.message)

      await ctx.sock.sendMessage(ctx.from, {
        react: { text: "❌", key: ctx.msg.key }
      })

      await ctx.reply(
        "⚠️ Gagal mendownload file Google Drive. Pastikan link valid atau coba lagi nanti.",
        { quoted: ctx.msg }
      )
    }
  }
}
