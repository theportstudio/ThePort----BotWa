const axios = require("axios")

module.exports = {
  name: "facebook",
  alias: ["fb", "fbdl"],

  async execute(ctx) {
    try {
      const args = ctx.args || []
      const url = args[0]

      if (!url || !(/facebook.com|fb.watch|fb.com/).test(url)) {
        return ctx.reply(
          "💡 Gunakan format:\n.facebook <link facebook>\n\nContoh:\n.facebook https://www.facebook.com/share/r/xxxx/",
          { quoted: ctx.msg }
        )
      }

      const waitMsg = await ctx.reply("⏳ Waitt Kakk...", {
        quoted: ctx.msg
      })

      const apiUrl = `https://api.deline.web.id/downloader/facebook?url=${encodeURIComponent(url)}`
      const res = await axios.get(apiUrl)

      if (!res.data.status) {
        throw new Error("API Error")
      }

      const result = res.data.result
      const videoUrl = result.download || result.list[0].url

      await ctx.sock.sendMessage(
        ctx.from,
        {
          video: { url: videoUrl },
          caption: `✅ *Facebook Downloader*\n\n🔗 *Source:* ${url}\n\n_Berhasil mengunduh video kualitas terbaik._`,
          mimetype: "video/mp4"
        },
        { quoted: ctx.msg }
      )

    } catch (err) {
      console.error("FB DOWNLOADER ERROR:", err.message)

      await ctx.sock.sendMessage(ctx.from, {
        react: { text: "❌", key: ctx.msg.key }
      })

      await ctx.reply(
        "⚠️ Gagal mengunduh video Facebook. Pastikan link publik dan coba lagi.",
        { quoted: ctx.msg }
      )
    }
  }
}