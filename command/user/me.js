const fs = require("fs")
const path = require("path")
const axios = require("axios")
const { createCanvas, loadImage } = require("canvas")

const makeProfileCard = async (data, avatarPath) => {
  const width = 1000
  const height = 650

  const canvas = createCanvas(width, height)
  const c = canvas.getContext("2d")

  c.fillStyle = "#0f172a"
  c.fillRect(0, 0, width, height)

  c.fillStyle = "#111827"
  c.beginPath()
  c.roundRect(30, 30, width - 60, height - 60, 24)
  c.fill()

  c.strokeStyle = "rgba(255,255,255,0.06)"
  c.lineWidth = 2
  c.stroke()

  const avatarSize = 180
  const avatarX = 70
  const avatarY = 90

  c.beginPath()
  c.arc(
    avatarX + avatarSize / 2,
    avatarY + avatarSize / 2,
    avatarSize / 2 + 6,
    0,
    Math.PI * 2
  )

  c.strokeStyle = data.isPremium ? "#facc15" : "#60a5fa"
  c.lineWidth = 6
  c.stroke()

  c.save()
  c.beginPath()
  c.arc(
    avatarX + avatarSize / 2,
    avatarY + avatarSize / 2,
    avatarSize / 2,
    0,
    Math.PI * 2
  )
  c.closePath()
  c.clip()

  try {
    if (avatarPath) {
      const avatar = await loadImage(avatarPath)
      c.drawImage(avatar, avatarX, avatarY, avatarSize, avatarSize)
    } else {
      throw new Error()
    }
  } catch {
    c.fillStyle = "#334155"
    c.fillRect(avatarX, avatarY, avatarSize, avatarSize)

    c.fillStyle = "#cbd5e1"
    c.font = "bold 72px Arial"
    c.textAlign = "center"
    c.fillText(
      data.name.charAt(0).toUpperCase(),
      avatarX + avatarSize / 2,
      avatarY + avatarSize / 2 + 25
    )
  }

  c.restore()

  c.textAlign = "left"
  c.fillStyle = "#ffffff"
  c.font = "bold 38px Arial"
  c.fillText(data.name, 300, 120)

  c.fillStyle = "#94a3b8"
  c.font = "18px Arial"
  c.fillText(
    data.isPremium ? "Premium User" : "Free User",
    300,
    155
  )

  c.fillText(`ID: ${data.id}`, 300, 185)

  c.fillStyle = "rgba(255,255,255,0.08)"
  c.fillRect(300, 220, 600, 2)

  c.fillStyle = "#ffffff"
  c.font = "bold 22px Arial"
  c.fillText("Progress", 300, 265)

  const expPercent = Math.min(
    100,
    (data.exp / data.maxExp) * 100
  )

  c.fillStyle = "rgba(255,255,255,0.08)"
  c.beginPath()
  c.roundRect(300, 290, 500, 18, 10)
  c.fill()

  c.fillStyle = "#60a5fa"
  c.beginPath()
  c.roundRect(
    300,
    290,
    500 * (expPercent / 100),
    18,
    10
  )
  c.fill()

  c.fillStyle = "#ffffff"
  c.font = "bold 18px Arial"
  c.fillText(
    `${data.exp} / ${data.maxExp} XP`,
    300,
    340
  )

  c.textAlign = "right"
  c.fillStyle = "#38bdf8"
  c.font = "bold 22px Arial"
  c.fillText(`Level ${data.level}`, 900, 340)

  c.textAlign = "left"
  c.fillStyle = "#ffffff"
  c.font = "bold 24px Arial"
  c.fillText("Statistics", 70, 380)

  const boxY = 420
  const boxWidth = 260
  const gap = 30

  const stats = [
    {
      title: "Rank",
      value: data.rank
    },
    {
      title: "Limit",
      value: data.limit
    },
    {
      title: "Money",
      value: `Rp${data.uang}`
    }
  ]

  stats.forEach((item, i) => {
    const x = 70 + i * (boxWidth + gap)

    c.fillStyle = "rgba(255,255,255,0.04)"
    c.beginPath()
    c.roundRect(x, boxY, boxWidth, 110, 16)
    c.fill()

    c.fillStyle = "#94a3b8"
    c.font = "16px Arial"
    c.fillText(item.title, x + 20, boxY + 35)

    c.fillStyle = "#ffffff"
    c.font = "bold 24px Arial"
    c.fillText(
      String(item.value),
      x + 20,
      boxY + 75
    )
  })

  c.fillStyle = "#64748b"
  c.font = "italic 15px Arial"
  c.fillText(
    "Tetap aktif untuk meningkatkan level dan reward",
    70,
    590
  )

  const tempDir = path.join(process.cwd(), "temp")

  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, {
      recursive: true
    })
  }

  const outputPath = path.join(
    tempDir,
    `profile-${Date.now()}.png`
  )

  fs.writeFileSync(
    outputPath,
    canvas.toBuffer("image/png")
  )

  return outputPath
}

module.exports = {
  name: "profile",
  alias: ["me"],
  loginRequired: true,

  async execute(ctx) {
    let imgPath = null
    let avatarPath = null

    try {
      await ctx.reply("Memuat data profil...")

      const targetJid =
        ctx.sender ||
        ctx.msg?.key?.participant ||
        ctx.msg?.key?.remoteJid ||
        "unknown@s.whatsapp.net"

      const targetData = ctx.user || {}

      const cleanId = targetJid
        .replace("@s.whatsapp.net", "")
        .replace("@lid", "")
        .replace("@c.us", "")

      const data = {
        id: cleanId,
        name:
          targetData.name ||
          ctx.pushName ||
          "Pengguna",
        exp: Number(targetData.exp || 0),
        maxExp: 400,
        level: Number(targetData.level || 1),
        rank: targetData.rank || "Beginner",
        limit: Number(targetData.limit || 0),
        uang: Number(
          targetData.uang ||
          targetData.money ||
          targetData.balance ||
          targetData.coin ||
          0
        ),
        isPremium:
          targetData.status === "Premium"
      }

      const tempDir = path.join(
        process.cwd(),
        "temp"
      )

      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, {
          recursive: true
        })
      }

      try {
        const ppUrl =
          await ctx.sock.profilePictureUrl(
            targetJid,
            "image"
          )

        const res = await axios.get(ppUrl, {
          responseType: "arraybuffer",
          timeout: 10000
        })

        avatarPath = path.join(
          tempDir,
          `avatar-${Date.now()}.jpg`
        )

        fs.writeFileSync(
          avatarPath,
          res.data
        )
      } catch {
        avatarPath = null
      }

      imgPath = await makeProfileCard(
        data,
        avatarPath
      )

      const caption =
        `👤 PROFILE USER\n\n` +
        `• Nama: ${data.name}\n` +
        `• ID: ${data.id}\n` +
        `• Status: ${data.isPremium ? "Premium" : "Free"}\n\n` +
        `📊 STATISTIK\n\n` +
        `• Level: ${data.level}\n` +
        `• Rank: ${data.rank}\n` +
        `• EXP: ${data.exp}/${data.maxExp}\n` +
        `• Money: Rp${data.uang}\n` +
        `• Limit: ${data.limit}`

      await ctx.sock.sendMessage(
        ctx.from,
        {
          image: fs.readFileSync(imgPath),
          caption
        },
        {
          quoted: ctx.msg
        }
      )
    } catch (err) {
      console.error(
        "PROFILE COMMAND ERROR:",
        err
      )

      await ctx.reply(
        "Terjadi kesalahan saat menampilkan profil"
      )
    } finally {
      try {
        if (imgPath && fs.existsSync(imgPath)) {
          fs.unlinkSync(imgPath)
        }

        if (
          avatarPath &&
          fs.existsSync(avatarPath)
        ) {
          fs.unlinkSync(avatarPath)
        }
      } catch {}
    }
  }
}