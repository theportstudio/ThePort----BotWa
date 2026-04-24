const axios = require("axios")
const settings = require("../../settings")

module.exports = {
  name: "ytmp4",
  alias: ["ytv", "ytvideo"],

  async execute(ctx) {
    try {
      const input = ctx.args.join(" ").trim()

      if (!input) {
        return ctx.reply(
          "💡 Gunakan:\n*.ytmp4 <link YouTube>*\nContoh: *.ytmp4 https://youtube.com/watch?v=xxxxx*"
        )
      }

      const ytRegex =
        /^https?:\/\/(?:www\.)?(?:youtube\.com\/(?:watch\?v=|embed\/|v\/|shorts\/)|youtu\.be\/)[^"&?\/\s]{11}(?:\S+)?$/

      if (!ytRegex.test(input)) {
        return ctx.reply("❌ Link YouTube tidak valid!")
      }

      await ctx.sock.sendMessage(ctx.from, {
        react: {
          text: "⏳",
          key: ctx.msg.key
        }
      })

      // API baru Puruboy
      const apiUrl =
        "https://puruboy-api.vercel.app/api/downloader/youtube"

      const res = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          url: input
        })
      })

      const json = await res.json()

      if (
        !json ||
        !json.success ||
        !json.result ||
        !json.result.downloadUrl
      ) {
        throw new Error("Response API tidak valid")
      }

      const result = json.result

      const caption =
        `🎬 *YouTube Video Downloader*\n\n` +
        `📌 Title : ${result.title || "-"}\n` +
        `📺 Quality : ${result.quality || "-"}\n` +
        `📦 Size : ${result.size || "-"}\n\n` +
        `✅ Video berhasil diunduh`

      // kirim langsung via URL (lebih ringan)
      await ctx.sock.sendMessage(
        ctx.from,
        {
          video: {
            url: result.downloadUrl
          },
          mimetype: "video/mp4",
          caption,
          contextInfo: {
            externalAdReply: {
              title: result.title || "YouTube Video",
              body: `${result.quality || "HD"} • ${result.size || ""}`,
              thumbnailUrl: result.thumbnail || settings.menuImage || "",
              sourceUrl: input,
              mediaType: 1,
              renderLargerThumbnail: true
            }
          }
        },
        {
          quoted: ctx.msg
        }
      )

      await ctx.sock.sendMessage(ctx.from, {
        react: {
          text: "✅",
          key: ctx.msg.key
        }
      })

    } catch (err) {
      console.error("❌ YTMP4 ERROR:", err)

      await ctx.sock.sendMessage(ctx.from, {
        react: {
          text: "❌",
          key: ctx.msg.key
        }
      })

      await ctx.reply(
        "❌ Gagal mengunduh video.\nPastikan link valid dan coba lagi."
      )
    }
  }
}