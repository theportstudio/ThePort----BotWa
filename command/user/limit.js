const fs = require("fs")
const path = require("path")
const axios = require("axios")
const settings = require("../../settings")
const { createCanvas, loadImage } = require("canvas")

const makeLimitCard = async (data, avatarPath) => {
  const width = 800
  const height = 500
  const canvas = createCanvas(width, height)
  const c = canvas.getContext("2d")

  const bgGradient = c.createLinearGradient(0, 0, width, height)
  bgGradient.addColorStop(0, "#0f172a")
  bgGradient.addColorStop(0.5, "#1e293b")
  bgGradient.addColorStop(1, "#0f172a")
  c.fillStyle = bgGradient
  c.fillRect(0, 0, width, height)

  for (let i = 0; i < 50; i++) {
    c.fillStyle = `rgba(59, 130, 246, ${Math.random() * 0.1})`
    c.beginPath()
    c.arc(Math.random() * width, Math.random() * height, Math.random() * 3, 0, Math.PI * 2)
    c.fill()
  }

  c.shadowColor = "rgba(0,0,0,0.5)"
  c.shadowBlur = 30
  c.shadowOffsetY = 10
  c.fillStyle = "rgba(30, 41, 59, 0.9)"
  c.beginPath()
  c.roundRect(30, 30, width - 60, height - 60, 25)
  c.fill()
  c.shadowBlur = 0

  const borderGradient = c.createLinearGradient(0, 0, width, height)
  borderGradient.addColorStop(0, "rgba(59, 130, 246, 0.5)")
  borderGradient.addColorStop(0.5, "rgba(139, 92, 246, 0.3)")
  borderGradient.addColorStop(1, "rgba(59, 130, 246, 0.5)")
  c.strokeStyle = borderGradient
  c.lineWidth = 3
  c.stroke()

  const avatarSize = 120
  const avatarX = 60
  const avatarY = 80

  c.beginPath()
  c.arc(avatarX + avatarSize / 2, avatarY + avatarSize / 2, avatarSize / 2 + 8, 0, Math.PI * 2)
  const ringGradient = c.createLinearGradient(avatarX, avatarY, avatarX + avatarSize, avatarY + avatarSize)
  if (data.limit <= 0) {
    ringGradient.addColorStop(0, "#ef4444")
    ringGradient.addColorStop(1, "#dc2626")
  } else if (data.limit < 10) {
    ringGradient.addColorStop(0, "#f59e0b")
    ringGradient.addColorStop(1, "#d97706")
  } else {
    ringGradient.addColorStop(0, "#3b82f6")
    ringGradient.addColorStop(1, "#8b5cf6")
  }
  c.strokeStyle = ringGradient
  c.lineWidth = 6
  c.stroke()

  c.save()
  c.beginPath()
  c.arc(avatarX + avatarSize / 2, avatarY + avatarSize / 2, avatarSize / 2, 0, Math.PI * 2)
  c.closePath()
  c.clip()

  try {
    const avatar = await loadImage(avatarPath)
    c.drawImage(avatar, avatarX, avatarY, avatarSize, avatarSize)
  } catch {
    c.fillStyle = "#334155"
    c.fillRect(avatarX, avatarY, avatarSize, avatarSize)
    c.fillStyle = "#94a3b8"
    c.font = "bold 60px Arial"
    c.textAlign = "center"
    c.fillText(data.name.charAt(0).toUpperCase(), avatarX + avatarSize / 2, avatarY + avatarSize / 2 + 20)
  }
  c.restore()

  c.textAlign = "left"
  c.fillStyle = "#ffffff"
  c.font = "bold 36px Arial"
  c.fillText(data.name, 210, 120)

  c.fillStyle = "#94a3b8"
  c.font = "18px Arial"
  c.fillText(`@${data.id.split("@")[0]}`, 210, 150)

  c.fillStyle = "#64748b"
  c.font = "14px Arial"
  c.fillText(data.isPremium ? "Status: Premium" : "Status: Free User", 210, 175)

  c.fillStyle = "rgba(255,255,255,0.1)"
  c.fillRect(60, 230, width - 120, 2)

  c.fillStyle = "#e2e8f0"
  c.font = "bold 24px Arial"
  c.fillText("SISA LIMIT", 60, 270)

  const limitPercent = Math.min(100, (data.limit / data.maxLimit) * 100)
  const barY = 300

  c.fillStyle = "rgba(15, 23, 42, 0.8)"
  c.beginPath()
  c.roundRect(60, barY, width - 120, 35, 18)
  c.fill()

  const barGradient = c.createLinearGradient(60, barY, 60 + (width - 120) * (limitPercent / 100), barY)
  if (data.limit <= 0) {
    barGradient.addColorStop(0, "#ef4444")
    barGradient.addColorStop(1, "#dc2626")
  } else if (data.limit < 10) {
    barGradient.addColorStop(0, "#f59e0b")
    barGradient.addColorStop(1, "#d97706")
  } else {
    barGradient.addColorStop(0, "#3b82f6")
    barGradient.addColorStop(1, "#8b5cf6")
  }

  c.save()
  c.shadowColor = limitPercent > 50 ? "rgba(59, 130, 246, 0.5)" : "rgba(239, 68, 68, 0.5)"
  c.shadowBlur = 15
  c.fillStyle = barGradient
  c.beginPath()
  c.roundRect(60, barY, (width - 120) * (limitPercent / 100), 35, 18)
  c.fill()
  c.restore()

  c.fillStyle = "#ffffff"
  c.font = "bold 28px Arial"
  c.textAlign = "center"
  c.fillText(`${data.limit}`, (width - 120) / 2 + 60, barY + 26)

  c.textAlign = "left"
  c.fillStyle = "#94a3b8"
  c.font = "16px Arial"
  c.fillText(`Maksimal: ${data.maxLimit} limit/hari`, 60, barY + 60)

  c.fillStyle = "rgba(255,255,255,0.1)"
  c.fillRect(60, 390, width - 120, 2)

  c.fillStyle = data.limit > 0 ? "#22c55e" : "#ef4444"
  c.font = "bold 20px Arial"
  const statusText = data.limit > 0 ? "✓ Limit tersedia" : "✗ Limit habis"
  c.fillText(statusText, 60, 430)

  const outputPath = path.join(process.cwd(), "temp", `limit-${Date.now()}.png`)
  const buffer = canvas.toBuffer("image/png")
  fs.writeFileSync(outputPath, buffer)
  return outputPath
}

module.exports = {
  name: "limit",
  alias: ["ceklimit", "sisa", "sisalimit"],
  loginRequired: true,

  async execute(ctx) {
    let imgPath = null
    let avatarPath = null

    try {
      await ctx.sock.sendMessage(ctx.from, {
        react: { text: "⏳", key: ctx.msg.key }
      })

      const args = ctx.args || []
      const mentionedJid = ctx.msg.message?.extendedTextMessage?.contextInfo?.mentionedJid || []
      const quotedParticipant = ctx.msg.message?.extendedTextMessage?.contextInfo?.participant

      let targetJid
      let targetData

      if (mentionedJid.length > 0) {
        targetJid = mentionedJid[0]
        targetData = ctx.db?.getUser(targetJid) || {}
      } else if (quotedParticipant) {
        targetJid = quotedParticipant
        targetData = ctx.db?.getUser(targetJid) || {}
      } else if (args.length > 0) {
        const input = args[0].replace(/[^0-9]/g, "")
        if (input.length > 0) {
          targetJid = input + "@s.whatsapp.net"
          targetData = ctx.db?.getUser(targetJid) || {}
        }
      }

      if (!targetJid) {
        targetJid = ctx.sender || ctx.msg?.key?.participant || ctx.msg?.key?.remoteJid || "unknown@s.whatsapp.net"
        targetData = ctx.user || {}
      }

      const maxLimit = targetData.isPremium || targetData.status === "Premium" ? 100 : 25

      const data = {
        id: targetJid,
        name: targetData.name || ctx.pushName || "Pengguna",
        limit: Number(targetData.limit || 0),
        maxLimit: maxLimit,
        isPremium: targetData.isPremium || targetData.status === "Premium"
      }

      const tempDir = path.join(process.cwd(), "temp")
      if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true })

      try {
        const ppUrl = await ctx.sock.profilePictureUrl(targetJid, "image")
        const res = await axios.get(ppUrl, { 
          responseType: "arraybuffer",
          timeout: 10000,
          headers: { "User-Agent": "Mozilla/5.0" }
        })
        avatarPath = path.join(tempDir, `avatar-limit-${Date.now()}.jpg`)
        fs.writeFileSync(avatarPath, res.data)
      } catch {
        avatarPath = null
      }

      imgPath = await makeLimitCard(data, avatarPath)

      const statusEmoji = data.limit > 0 ? "✅" : "❌"
      const premiumBadge = data.isPremium ? "👑 PREMIUM" : "🆓 FREE"

      const caption = `*INFO LIMIT* ${statusEmoji}

 👤 User: ${data.name}
 🆔 ID: @${targetJid.split("@")[0]}
 🏷️ Status: ${premiumBadge}

 💳 Sisa Limit: ${data.limit}
 📊 Max Limit: ${data.maxLimit}/hari

 📌 *Note:* Limit reset setiap jam 00:00 WIB`

      const mentions = [targetJid]

      await ctx.sock.sendMessage(
        ctx.from,
        {
          image: fs.readFileSync(imgPath),
          caption: caption,
          mentions: mentions,
          contextInfo: {
            mentionedJid: mentions,
            externalAdReply: {
              title: `Limit Check - ${data.name}`,
              body: `Sisa: ${data.limit} / ${data.maxLimit}`,
              thumbnailUrl: settings.menuImage,
              sourceUrl: "",
              mediaType: 1,
              renderLargerThumbnail: true
            }
          }
        },
        { quoted: ctx.msg }
      )

      await ctx.sock.sendMessage(ctx.from, {
        react: { text: data.limit > 0 ? "✅" : "⚠️", key: ctx.msg.key }
      })

    } catch (err) {
      console.error("LIMIT COMMAND ERROR:", err)
      await ctx.sock.sendMessage(ctx.from, {
        react: { text: "❌", key: ctx.msg.key }
      })
      await ctx.reply("⚠️ Gagal memuat data limit. Coba lagi nanti.")

    } finally {
      try {
        if (imgPath && fs.existsSync(imgPath)) fs.unlinkSync(imgPath)
        if (avatarPath && fs.existsSync(avatarPath)) fs.unlinkSync(avatarPath)
      } catch {}
    }
  }
}