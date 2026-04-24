module.exports = {
  name: "youtubesearch",
  alias: ["yts", "ytsearch"],
  loginRequired: true,

  async execute(ctx) {
    try {
      const input = ctx.args.join(" ").trim()
      if (!input) {
        return ctx.reply(
          "💡 Gunakan:\n*.youtubesearch <judul video>*\nContoh: *.youtubesearch tutorial javascript*"
        )
      }

      await ctx.sock.sendMessage(
        ctx.from,
        { text: "⏳ Mencari video di YouTube..." },
        { quoted: ctx.msg }
      )

      const apiUrl = `https://api.deline.web.id/search/youtube?q=${encodeURIComponent(input)}`
      const res = await fetch(apiUrl)
      const data = await res.json()

      if (!data?.status || !Array.isArray(data.result) || data.result.length === 0) {
        throw new Error("Video tidak ditemukan")
      }

      const results = data.result.slice(0, 10)
      const prefix = global.settings?.prefix || "."

      let caption =
        `✨ *YOUTUBE SEARCH* ✨\n` +
        `🔎 *Query:* ${input}\n` +
        `📊 *Menampilkan:* ${results.length} hasil\n\n`

      results.forEach((v, i) => {
        caption +=
          `*${i + 1}. ${v.title}*\n` +
          `👤 ${v.channel}\n` +
          `⏱ ${v.duration}\n` +
          `🔗 ${v.link}\n\n` +
          `▶️ Video:\n` +
          `\`\`\`${prefix}ytmp4 ${v.link}\`\`\`\n` +
          `🎵 Audio:\n` +
          `\`\`\`${prefix}ytmp3 ${v.link}\`\`\`\n\n` +
          `──────────────\n\n`
      })

      const first = results[0]

      await ctx.sock.sendMessage(
        ctx.from,
        {
          image: { url: first.imageUrl },
          caption,
          contextInfo: {
            externalAdReply: {
              title: first.title,
              body: `Hasil pencarian: ${results.length} video`,
              thumbnailUrl: first.imageUrl,
              sourceUrl: first.link,
              mediaType: 1,
              renderLargerThumbnail: true
            }
          }
        },
        { quoted: ctx.msg }
      )

    } catch (err) {
      console.error("Error di youtubesearch:", err)
      await ctx.reply("❌ Terjadi kesalahan saat mencari video. Coba lagi nanti.")
    }
  }
}