const axios = require("axios")
const { createCanvas, loadImage } = require("canvas")

module.exports = {
  name: "spotifydl",
  alias: ["spotify"],
  loginRequired: true,

  async execute(ctx) {
    try {
      const url = ctx.args[0]

      if (!url) {
        return ctx.sock.sendMessage(
          ctx.from,
          {
            text: "⚠️ Gunakan: .spotifydl <link spotify>"
          },
          { quoted: ctx.msg }
        )
      }

      await ctx.reply("⏳ Waitt Kakk...", {
        quoted: ctx.msg
      })

      const apiUrl = `https://api.nexray.web.id/downloader/spotify?url=${encodeURIComponent(url)}`
      const res = await axios.get(apiUrl)
      const data = res.data.result

      if (!data || !data.url) {
        return ctx.sock.sendMessage(
          ctx.from,
          {
            text: "⚠️ Lagu tidak ditemukan atau link Spotify tidak valid."
          },
          { quoted: ctx.msg }
        )
      }

      const width = 900
      const height = 500
      const canvas = createCanvas(width, height)
      const c = canvas.getContext("2d")

      const gradient = c.createLinearGradient(0, 0, width, height)
      gradient.addColorStop(0, "#0f172a")
      gradient.addColorStop(1, "#1db954")
      c.fillStyle = gradient
      c.fillRect(0, 0, width, height)

      c.fillStyle = "rgba(0,0,0,0.35)"
      c.fillRect(30, 30, width - 60, height - 60)

      const searchCover = `https://api.nexray.web.id/search/spotify?q=${encodeURIComponent(data.title)}`
      const coverResSearch = await axios.get(searchCover)
      const coverThumb = coverResSearch.data.result?.[0]?.thumbnail

      let cover = null

      if (coverThumb) {
        const coverRes = await axios.get(coverThumb, {
          responseType: "arraybuffer"
        })
        cover = await loadImage(Buffer.from(coverRes.data))
      }

      const imgSize = 320
      const imgX = 60
      const imgY = 90
      const radius = 25

      c.save()
      c.beginPath()
      c.moveTo(imgX + radius, imgY)
      c.lineTo(imgX + imgSize - radius, imgY)
      c.quadraticCurveTo(imgX + imgSize, imgY, imgX + imgSize, imgY + radius)
      c.lineTo(imgX + imgSize, imgY + imgSize - radius)
      c.quadraticCurveTo(imgX + imgSize, imgY + imgSize, imgX + imgSize - radius, imgY + imgSize)
      c.lineTo(imgX + radius, imgY + imgSize)
      c.quadraticCurveTo(imgX, imgY + imgSize, imgX, imgY + imgSize - radius)
      c.lineTo(imgX, imgY + radius)
      c.quadraticCurveTo(imgX, imgY, imgX + radius, imgY)
      c.closePath()
      c.clip()

      if (cover) {
        c.drawImage(cover, imgX, imgY, imgSize, imgSize)
      } else {
        c.fillStyle = "#1e293b"
        c.fillRect(imgX, imgY, imgSize, imgSize)
      }

      c.restore()

      c.fillStyle = "#1db954"
      c.font = "bold 22px Sans"
      c.fillText("NOW PLAYING", 420, 120)

      c.fillStyle = "#ffffff"
      c.font = "bold 36px Sans"
      wrapText(c, data.title, 420, 170, 420, 42)

      c.font = "24px Sans"
      c.fillStyle = "#e5e5e5"
      c.fillText(data.artist, 420, 260)

      c.font = "20px Sans"
      c.fillStyle = "#cccccc"
      c.fillText("Spotify Downloader", 420, 310)

      const imageBuffer = canvas.toBuffer("image/png")

      const caption =
`🎵 *${data.title}*
🎤 ${data.artist}

Mengirim audio.....`

      await ctx.sock.sendMessage(
        ctx.from,
        {
          image: imageBuffer,
          caption
        },
        { quoted: ctx.msg }
      )

      const audioRes = await axios.get(data.url, {
        responseType: "arraybuffer",
        timeout: 180000,
        maxRedirects: 10,
        headers: {
          "User-Agent": "Mozilla/5.0",
          Accept: "*/*"
        }
      })

      await ctx.sock.sendMessage(
        ctx.from,
        {
          audio: Buffer.from(audioRes.data),
          mimetype: "audio/mpeg",
          ptt: false,
          fileName: `${data.title}.mp3`
        },
        { quoted: ctx.msg }
      )

    } catch (err) {
      console.error("SPOTIFYDL ERROR:", err)

      await ctx.sock.sendMessage(
        ctx.from,
        {
          text: "⚠️ Gagal mengambil lagu. Pastikan link Spotify valid."
        },
        { quoted: ctx.msg }
      )
    }
  }
}

function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
  const words = text.split(" ")
  let line = ""

  for (let i = 0; i < words.length; i++) {
    const testLine = line + words[i] + " "
    const metrics = ctx.measureText(testLine)

    if (metrics.width > maxWidth && i > 0) {
      ctx.fillText(line, x, y)
      line = words[i] + " "
      y += lineHeight
    } else {
      line = testLine
    }
  }

  ctx.fillText(line, x, y)
}