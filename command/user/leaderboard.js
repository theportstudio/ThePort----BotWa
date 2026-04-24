const fs = require("fs")
const path = require("path")
const { createCanvas } = require("canvas")
const settings = require("../../settings")

const makeLeaderboardCard = async (topUsers, authorData, authorRank, stats) => {
  const width = 900

  const rowHeight = 85
  const headerHeight = 180
  const footerHeight = 420
  const safePadding = 80

  const height =
    headerHeight +
    (topUsers.length * rowHeight) +
    footerHeight +
    safePadding

  const canvas = createCanvas(width, height)
  const c = canvas.getContext("2d")

  c.imageSmoothingEnabled = true
  c.imageSmoothingQuality = "high"

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
  c.fillText("LEADERBOARD", width / 2, 90)

  c.fillStyle = "#94a3b8"
  c.font = "20px Arial"
  c.fillText(`${stats.totalUsers} Total Users`, width / 2, 125)

  c.fillStyle = "rgba(255,255,255,0.08)"
  c.fillRect(60, 150, width - 120, 2)

  const startY = 190

  for (let i = 0; i < topUsers.length; i++) {
    const user = topUsers[i]
    const y = startY + i * rowHeight

    c.fillStyle =
      i < 3 ? "rgba(59,130,246,0.12)" : "rgba(255,255,255,0.03)"

    c.beginPath()
    c.roundRect(60, y, width - 120, 70, 14)
    c.fill()

    c.textAlign = "center"
    c.fillStyle = "#60a5fa"
    c.font = "bold 22px Arial"
    c.fillText(`#${i + 1}`, 95, y + 45)

    let name = user.name || "User"
    if (name.length > 20) name = name.slice(0, 20) + "..."

    c.textAlign = "left"
    c.fillStyle = "#ffffff"
    c.font = "bold 20px Arial"
    c.fillText(name, 150, y + 35)

    c.fillStyle = user.isPremium ? "#facc15" : "#94a3b8"
    c.font = "14px Arial"
    c.fillText(user.isPremium ? "PREMIUM" : "FREE", 150, y + 58)

    c.textAlign = "right"
    c.fillStyle = "#38bdf8"
    c.font = "bold 20px Arial"
    c.fillText(`Lv.${user.level}`, width - 80, y + 45)
  }

  const statsY = startY + topUsers.length * rowHeight + 60

  c.textAlign = "left"
  c.fillStyle = "#ffffff"
  c.font = "bold 26px Arial"
  c.fillText("Bot Statistics", 60, statsY)

  c.fillStyle = "rgba(255,255,255,0.05)"
  c.beginPath()
  c.roundRect(60, statsY + 25, width - 120, 160, 16)
  c.fill()

  c.fillStyle = "#cbd5e1"
  c.font = "18px Arial"

  c.fillText(`Total User : ${stats.totalUsers}`, 90, statsY + 70)
  c.fillText(`Premium    : ${stats.premiumCount}`, 90, statsY + 105)
  c.fillText(`Free User  : ${stats.freeCount}`, 90, statsY + 140)

  c.fillText(`Avg Level  : ${stats.avgLevel}`, 500, statsY + 70)
  c.fillText(`Max Level  : ${stats.maxLevel}`, 500, statsY + 105)
  c.fillText(`Total EXP  : ${stats.totalExp.toLocaleString()}`, 500, statsY + 140)

  const authorY = statsY + 220

  c.fillStyle = "#ffffff"
  c.font = "bold 24px Arial"
  c.fillText("Your Position", 60, authorY)

  c.fillStyle = "rgba(59,130,246,0.12)"
  c.beginPath()
  c.roundRect(60, authorY + 25, width - 120, 70, 14)
  c.fill()

  c.fillStyle = "#60a5fa"
  c.font = "bold 22px Arial"
  c.fillText(`#${authorRank}`, 90, authorY + 68)

  let authorName = authorData.name || "User"
  if (authorName.length > 20) authorName = authorName.slice(0, 20) + "..."

  c.fillStyle = "#ffffff"
  c.font = "bold 20px Arial"
  c.fillText(authorName, 150, authorY + 62)

  c.fillStyle = authorData.isPremium ? "#facc15" : "#94a3b8"
  c.font = "14px Arial"
  c.fillText(authorData.isPremium ? "PREMIUM" : "FREE", 150, authorY + 85)

  c.textAlign = "right"
  c.fillStyle = "#38bdf8"
  c.font = "bold 20px Arial"
  c.fillText(`Lv.${authorData.level}`, width - 80, authorY + 65)

  const tempDir = path.join(process.cwd(), "temp")
  if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true })

  const outputPath = path.join(tempDir, `leaderboard-${Date.now()}.png`)
  fs.writeFileSync(outputPath, canvas.toBuffer("image/png"))

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
        react: { text: "⏳", key: ctx.msg.key }
      })

      const dbPath = path.join(process.cwd(), "db", "database.json")
      let allUsers = []

      if (fs.existsSync(dbPath)) {
        const raw = fs.readFileSync(dbPath, "utf8")
        const parsed = JSON.parse(raw)

        allUsers = Object.entries(parsed).map(([id, user]) => ({
          id: id + "@s.whatsapp.net",
          name: user.userName || user.name || "User",
          level: Number(user.level || 1),
          exp: Number(user.exp || 0),
          isPremium: user.status === "Premium"
        }))
      }

      const sorted = allUsers.sort((a, b) =>
        b.level - a.level || b.exp - a.exp
      )

      const top5 = sorted.slice(0, 5)

      const authorPhone = ctx.sender.split("@")[0]

      const authorData =
        sorted.find(u => u.id.split("@")[0] === authorPhone) || {
          name: ctx.pushName || "User",
          level: 1,
          exp: 0,
          isPremium: false
        }

      const authorRank =
        sorted.findIndex(u => u.id.split("@")[0] === authorPhone) + 1

      const stats = {
        totalUsers: allUsers.length,
        premiumCount: allUsers.filter(u => u.isPremium).length,
        freeCount: allUsers.filter(u => !u.isPremium).length,
        avgLevel: Math.round(allUsers.reduce((a, b) => a + b.level, 0) / allUsers.length),
        maxLevel: Math.max(...allUsers.map(u => u.level)),
        totalExp: allUsers.reduce((a, b) => a + b.exp, 0)
      }

      imgPath = await makeLeaderboardCard(top5, authorData, authorRank, stats)

      const caption =
`📊 STATISTIK BOT

• Total User: ${stats.totalUsers}
• Premium: ${stats.premiumCount}
• Free: ${stats.freeCount}
• Avg Level: ${stats.avgLevel}
• Max Level: ${stats.maxLevel}
• Total EXP: ${stats.totalExp.toLocaleString()}

🏆 Posisimu: #${authorRank}`

      await ctx.sock.sendMessage(ctx.from, {
        image: fs.readFileSync(imgPath),
        caption
      }, { quoted: ctx.msg })

      await ctx.sock.sendMessage(ctx.from, {
        react: { text: "✅", key: ctx.msg.key }
      })

    } catch (err) {
      console.error("LEADERBOARD ERROR:", err)

      await ctx.sock.sendMessage(ctx.from, {
        react: { text: "❌", key: ctx.msg.key }
      })

      await ctx.reply("Gagal memuat leaderboard.")
    } finally {
      if (imgPath && fs.existsSync(imgPath)) fs.unlinkSync(imgPath)
    }
  }
}