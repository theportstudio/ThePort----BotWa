const axios = require("axios")

module.exports = {
  name: "spotifysearch",
  alias: ["spsrch", "sptfy"],
  loginRequired: true,

  async execute(ctx) {
    try {
      const query = ctx.args.join(" ").trim()

      if (!query) {
        return ctx.sock.sendMessage(
          ctx.from,
          {
            text: "⚠️ Gunakan: .spotifysearch <nama lagu / artis>"
          },
          { quoted: ctx.msg }
        )
      }

      await ctx.sock.sendMessage(
        ctx.from,
        {
          text: `⏳ Mencari lagu Spotify untuk: *${query}*...`
        },
        { quoted: ctx.msg }
      )

      const apiUrl = `https://api.nexray.web.id/search/spotify?q=${encodeURIComponent(query)}`
      const res = await axios.get(apiUrl)
      const results = res.data.result

      if (!results || !Array.isArray(results) || results.length === 0) {
        return ctx.sock.sendMessage(
          ctx.from,
          {
            text: "⚠️ Lagu tidak ditemukan."
          },
          { quoted: ctx.msg }
        )
      }

      const topResults = results.slice(0, 5)

      const imageRes = await axios.get(topResults[0].thumbnail, {
        responseType: "arraybuffer"
      })

      const imageBuffer = Buffer.from(imageRes.data)

      let caption = `🎵 *SPOTIFY SEARCH RESULT*\n`
      caption += `🔎 Query: ${query}\n\n`

      topResults.forEach((track, index) => {
        caption += `*${index + 1}. ${track.title}*\n`
        caption += `🎤 Artist : ${track.artist}\n`
        caption += `💿 Album : ${track.album}\n`
        caption += `⏱ Duration : ${track.duration}\n`
        caption += `📆 Release : ${track.release_date}\n`
        caption += `🔥 Popularity : ${track.popularity}\n`
        caption += `🔗 ${track.url}\n\n`
      })

      await ctx.sock.sendMessage(
        ctx.from,
        {
          image: imageBuffer,
          caption
        },
        { quoted: ctx.msg }
      )

    } catch (err) {
      console.error("SPOTIFYSEARCH ERROR:", err)

      await ctx.sock.sendMessage(
        ctx.from,
        {
          text: "⚠️ Gagal mencari lagu Spotify."
        },
        { quoted: ctx.msg }
      )
    }
  }
}