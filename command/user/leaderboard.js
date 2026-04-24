const fs = require("fs")
const path = require("path")
const { createCanvas } = require("canvas")
const settings = require("../../settings")

const makeLeaderboardCard = async (topUsers, authorData, authorRank, stats) => {
  const width = 900
  const height = 1350

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

  c.textAlign = "center"
  c.fillStyle = "#ffffff"
  c.font = "bold 42px Arial"
  c.fillText("LEADERBOARD", width / 2, 95)

  c.fillStyle = "#94a3b8"
  c.font = "20px Arial"
  c.fillText(`${stats.totalUsers} Total Users`, width / 2, 130)

  c.fillStyle = "rgba(255,255,255,0.08)"
  c.fillRect(60, 160, width - 120, 2)

  const startY = 200
  const rowHeight = 78

  for (let i = 0; i < topUsers.length; i++) {
    const user = topUsers[i]
    const y = startY + i * rowHeight

    c.fillStyle =
      i < 3
        ? "rgba(59,130,246,0.12)"
        : "rgba(255,255,255,0.03)"

    c.beginPath()
    c.roundRect(60, y, width - 120, 60, 14)
    c.fill()

    c.fillStyle = "#60a5fa"
    c.font = "bold 24px Arial"
    c.textAlign = "center"
    c.fillText(`#${i + 1}`, 95, y + 38)

    c.textAlign = "left"
    c.fillStyle = "#ffffff"
    c.font = "bold 21px Arial"

    const name =
      user.name.length > 18
        ? user.name.slice(0, 18) + "..."
        : user.name

    c.fillText(name, 145, y + 30)

    c.fillStyle = user.isPremium ? "#facc15" : "#94a3b8"
    c.font = "15px Arial"
    c.fillText(
      user.isPremium ? "PREMIUM" : "FREE",
      145,
      y + 50
    )

    c.textAlign = "right"
    c.fillStyle = "#38bdf8"
    c.font = "bold 20px Arial"
    c.fillText(`Lv.${user.level}`, width - 80, y + 38)
  }

  const statsY = 920

  c.textAlign = "left"
  c.fillStyle = "#ffffff"
  c.font = "bold 26px Arial"
  c.fillText("Bot Statistics", 60, statsY)

  c.fillStyle = "rgba(255,255,255,0.05)"
  c.beginPath()
  c.roundRect(60, statsY + 25, width - 120, 150, 16)
  c.fill()

  c.fillStyle = "#cbd5e1"
  c.font = "18px Arial"

  c.fillText(`Total User : ${stats.totalUsers}`, 90, statsY + 70)
  c.fillText(`Premium   : ${stats.premiumCount}`, 90, statsY + 110)
  c.fillText(`Free User : ${stats.freeCount}`, 90, statsY + 150)

  c.fillText(`Avg Level : ${stats.avgLevel}`, 500, statsY + 70)
  c.fillText(`Max Level : ${stats.maxLevel}`, 500, statsY + 110)
  c.fillText(`Total EXP : ${stats.totalExp.toLocaleString()}`, 500, statsY + 150)

  const authorY = 1140

  c.fillStyle = "#ffffff"
  c.font = "bold 24px Arial"
  c.fillText("Your Position", 60, authorY)

  c.fillStyle = "rgba(59,130,246,0.12)"
  c.beginPath()
  c.roundRect(60, authorY + 25, width - 120, 70, 14)
  c.fill()

  c.fillStyle = "#60a5fa"
  c.font = "bold 24px Arial"
  c.fillText(`#${authorRank}`, 90, authorY + 68)

  c.fillStyle = "#ffffff"
  c.font = "bold 20px Arial"

  const authorName =
    authorData.name.length > 18
      ? authorData.name.slice(0, 18) + "..."
      : authorData.name

  c.fillText(authorName, 150, authorY + 62)

  c.fillStyle = authorData.isPremium ? "#facc15" : "#94a3b8"
  c.font = "15px Arial"
  c.fillText(
    authorData.isPremium ? "PREMIUM" : "FREE",
    150,
    authorY + 84
  )

  c.textAlign = "right"
  c.fillStyle = "#38bdf8"
  c.font = "bold 22px Arial"
  c.fillText(`Lv.${authorData.level}`, width - 80, authorY + 65)

  const tempDir = path.join(process.cwd(), "temp")

  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true })
  }

  const outputPath = path.join(
    tempDir,
    `leaderboard-${Date.now()}.png`
  )

  fs.writeFileSync(
    outputPath,
    canvas.toBuffer("image/png")
  )

  return outputPath
}

module.exports = {
  name: "leaderboard",
  alias: ["lb", "top", "rank", "ranks"],
  loginRequired: true,

  async execute(ctx) {
    let imgPath = null

    try {
      await ctx.sock.sendMessage(ctx.from, {
        react: {
          text: "⏳",
          key: ctx.msg.key
        }
      })

      const dbPath = path.join(
        process.cwd(),
        "db",
        "database.json"
      )

      let allUsers = []

      if (fs.existsSync(dbPath)) {
        const raw = fs.readFileSync(dbPath, "utf8")
        const parsed = JSON.parse(raw)

        allUsers = Object.entries(parsed).map(([id, user]) => ({
          id: id + "@s.whatsapp.net",
          name: user.userName || user.name || "Pengguna",
          level: Number(user.level || 1),
          exp: Number(user.exp || 0),
          maxExp: 400,
          isPremium:
            user.status === "Premium" ||
            user.isPremium ||
            false
        }))
      }

      if (!allUsers.length) {
        return ctx.reply("Belum ada data user.")
      }

      const sortedUsers = allUsers.sort((a, b) => {
        if (b.level !== a.level) return b.level - a.level
        return b.exp - a.exp
      })

      const top10 = sortedUsers.slice(0, 10)

      const authorJid = ctx.sender
      const authorPhone = authorJid.split("@")[0]

      const authorData =
        sortedUsers.find(
          (u) => u.id.split("@")[0] === authorPhone
        ) || {
          name: ctx.pushName || "Anda",
          level: 1,
          exp: 0,
          maxExp: 400,
          isPremium: false
        }

      const authorRank =
        sortedUsers.findIndex(
          (u) => u.id.split("@")[0] === authorPhone
        ) + 1 || sortedUsers.length + 1

      const stats = {
        totalUsers: allUsers.length,
        premiumCount: allUsers.filter((u) => u.isPremium).length,
        freeCount: allUsers.filter((u) => !u.isPremium).length,
        avgLevel: Math.round(
          allUsers.reduce((a, b) => a + b.level, 0) /
            allUsers.length
        ),
        maxLevel: Math.max(
          ...allUsers.map((u) => u.level)
        ),
        totalExp: allUsers.reduce(
          (a, b) => a + b.exp,
          0
        )
      }

      imgPath = await makeLeaderboardCard(
        top10,
        authorData,
        authorRank,
        stats
      )

      const caption =
        `📊 STATISTIK BOT\n\n` +
        `• Total User: ${stats.totalUsers}\n` +
        `• Premium: ${stats.premiumCount}\n` +
        `• Free: ${stats.freeCount}\n` +
        `• Avg Level: ${stats.avgLevel}\n` +
        `• Max Level: ${stats.maxLevel}\n` +
        `• Total EXP: ${stats.totalExp.toLocaleString()}\n\n` +
        `🏆 Posisimu: #${authorRank}`

      await ctx.sock.sendMessage(
        ctx.from,
        {
          image: fs.readFileSync(imgPath),
          caption,
          contextInfo: {
            externalAdReply: {
              title: "Leaderboard Top 10",
              body: `Peringkat kamu #${authorRank}`,
              thumbnailUrl: settings.menuImage,
              sourceUrl: "",
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
      console.error("LEADERBOARD ERROR:", err)

      await ctx.sock.sendMessage(ctx.from, {
        react: {
          text: "❌",
          key: ctx.msg.key
        }
      })

      await ctx.reply(
        "Gagal memuat leaderboard. Coba lagi nanti."
      )
    } finally {
      try {
        if (imgPath && fs.existsSync(imgPath)) {
          fs.unlinkSync(imgPath)
        }
      } catch {}
    }
  }
}