const os = require("os")
const { createCanvas, loadImage } = require("canvas")
const { execSync } = require("child_process")
const { performance } = require("perf_hooks")
const fs = require("fs")
const path = require("path")

module.exports = {
  name: "ping",
  alias: ["sysinfo", "status"],

  async execute(ctx) {
    try {
      const THEME = {
        bg: "#0a0e1a",
        bgGradientStart: "#0f172a",
        bgGradientEnd: "#1e1b4b",
        card: "rgba(30, 41, 59, 0.6)",
        cardBorder: "rgba(148, 163, 184, 0.1)",
        primary: "#3b82f6",
        primaryGlow: "rgba(59, 130, 246, 0.4)",
        success: "#10b981",
        successGlow: "rgba(16, 185, 129, 0.4)",
        warning: "#f59e0b",
        warningGlow: "rgba(245, 158, 11, 0.4)",
        danger: "#ef4444",
        dangerGlow: "rgba(239, 68, 68, 0.4)",
        purple: "#8b5cf6",
        purpleGlow: "rgba(139, 92, 246, 0.4)",
        cyan: "#06b6d4",
        cyanGlow: "rgba(6, 182, 212, 0.4)",
        pink: "#ec4899",
        pinkGlow: "rgba(236, 72, 153, 0.4)",
        textPrimary: "#f8fafc",
        textSecondary: "#cbd5e1",
        textTertiary: "#64748b",
        accent: "#fbbf24"
      }

      const formatSize = (bytes) => {
        if (!bytes || bytes === 0) return "0 B"
        const sizes = ["B", "KB", "MB", "GB", "TB"]
        const i = Math.floor(Math.log(bytes) / Math.log(1024))
        return (bytes / Math.pow(1024, i)).toFixed(2) + " " + sizes[i]
      }

      const formatTime = (sec) => {
        sec = Number(sec)
        const d = Math.floor(sec / 86400)
        const h = Math.floor((sec % 86400) / 3600)
        const m = Math.floor((sec % 3600) / 60)
        const s = Math.floor(sec % 60)
        if (d > 0) return `${d}d ${h}h ${m}m`
        return `${h}h ${m}m ${s}s`
      }

      const W = 1400
      const H = 900
      const canvas = createCanvas(W, H)
      const c = canvas.getContext("2d")

      const bgGradient = c.createLinearGradient(0, 0, W, H)
      bgGradient.addColorStop(0, THEME.bgGradientStart)
      bgGradient.addColorStop(0.5, THEME.bg)
      bgGradient.addColorStop(1, THEME.bgGradientEnd)
      c.fillStyle = bgGradient
      c.fillRect(0, 0, W, H)

      for (let i = 0; i < 50; i++) {
        c.fillStyle = `rgba(59, 130, 246, ${Math.random() * 0.03})`
        c.beginPath()
        c.arc(Math.random() * W, Math.random() * H, Math.random() * 2, 0, Math.PI * 2)
        c.fill()
      }

      const drawGlow = (x, y, w, h, color, blur = 20) => {
        c.shadowColor = color
        c.shadowBlur = blur
        c.fillStyle = color
        c.fillRect(x, y, w, h)
        c.shadowBlur = 0
      }

      const drawCard = (x, y, w, h, color = THEME.card) => {
        c.save()
        c.fillStyle = color
        c.strokeStyle = THEME.cardBorder
        c.lineWidth = 1
        c.beginPath()
        c.roundRect(x, y, w, h, 20)
        c.fill()
        c.stroke()
        c.restore()
      }

      const drawProgressBar = (x, y, w, h, percent, color, glowColor) => {
        c.fillStyle = "rgba(15, 23, 42, 0.8)"
        c.beginPath()
        c.roundRect(x, y, w, h, 10)
        c.fill()

        const gradient = c.createLinearGradient(x, y, x + w * (percent / 100), y)
        gradient.addColorStop(0, color)
        gradient.addColorStop(1, glowColor)

        c.save()
        c.shadowColor = glowColor
        c.shadowBlur = 15
        c.fillStyle = gradient
        c.beginPath()
        c.roundRect(x, y, w * (percent / 100), h, 10)
        c.fill()
        c.restore()
      }

      const drawIcon = (x, y, type, color) => {
        c.save()
        c.strokeStyle = color
        c.lineWidth = 2
        c.beginPath()

        switch(type) {
          case "cpu":
            c.arc(x + 15, y + 15, 10, 0, Math.PI * 2)
            c.moveTo(x + 15, y + 5)
            c.lineTo(x + 15, y + 10)
            c.moveTo(x + 15, y + 20)
            c.lineTo(x + 15, y + 25)
            c.moveTo(x + 5, y + 15)
            c.lineTo(x + 10, y + 15)
            c.moveTo(x + 20, y + 15)
            c.lineTo(x + 25, y + 15)
            break
          case "ram":
            c.rect(x + 5, y + 8, 20, 14)
            c.moveTo(x + 10, y + 8)
            c.lineTo(x + 10, y + 5)
            c.moveTo(x + 20, y + 8)
            c.lineTo(x + 20, y + 5)
            break
          case "disk":
            c.arc(x + 15, y + 15, 10, 0, Math.PI * 2)
            c.arc(x + 15, y + 15, 4, 0, Math.PI * 2)
            break
          case "network":
            c.arc(x + 15, y + 20, 8, Math.PI, 0)
            c.arc(x + 15, y + 20, 5, Math.PI, 0)
            c.arc(x + 15, y + 20, 2, Math.PI, 0)
            break
          case "uptime":
            c.arc(x + 15, y + 15, 10, 0, Math.PI * 2)
            c.moveTo(x + 15, y + 15)
            c.lineTo(x + 15, y + 8)
            c.moveTo(x + 15, y + 15)
            c.lineTo(x + 20, y + 15)
            break
        }
        c.stroke()
        c.restore()
      }

      const start = performance.now()
      await new Promise(r => setTimeout(r, 20))
      const latency = (performance.now() - start).toFixed(2)

      const cpus = os.cpus()
      const load = os.loadavg()[0]
      const cpuLoad = Math.min(100, ((load * 100) / cpus.length)).toFixed(1)
      const cpuPercent = Math.min(100, Math.max(5, parseFloat(cpuLoad)))

      const totalMem = os.totalmem()
      const freeMem = os.freemem()
      const usedMem = totalMem - freeMem
      const memPercent = Math.min(100, Math.max(5, (usedMem / totalMem) * 100))

      let diskTotal = 0
      let diskUsed = 0
      let diskPercent = 0

      try {
        if (process.platform === "win32") {
          const output = execSync("wmic logicaldisk get size,freespace,caption /format:csv").toString()
          const lines = output.trim().split("\n").slice(1)
          lines.forEach(line => {
            const parts = line.trim().split(",")
            if (parts.length >= 4 && parts[1] === "C:") {
              const free = Number(parts[2]) || 0
              const size = Number(parts[3]) || 0
              diskTotal = size
              diskUsed = size - free
            }
          })
        } else {
          const output = execSync("df -k /").toString().split("\n")[1].trim().split(/\s+/)
          diskTotal = Number(output[1]) * 1024
          diskUsed = Number(output[2]) * 1024
        }
      } catch (e) {
        diskTotal = totalMem * 2
        diskUsed = usedMem
      }

      diskPercent = diskTotal > 0 ? Math.min(100, Math.max(5, (diskUsed / diskTotal) * 100)) : 0

      c.fillStyle = THEME.textPrimary
      c.font = "bold 42px Arial"
      c.fillText("SYSTEM MONITOR", 60, 70)

      c.fillStyle = THEME.accent
      c.font = "bold 36px Arial"
      c.textAlign = "right"
      c.fillText(`${latency} ms`, W - 60, 70)
      c.textAlign = "left"

      c.fillStyle = THEME.textTertiary
      c.font = "16px Arial"
      c.fillText("Real-time Server Metrics", 60, 100)

      drawCard(60, 140, 400, 280)
      drawIcon(90, 170, "cpu", THEME.primary)
      c.fillStyle = THEME.primary
      c.font = "bold 20px Arial"
      c.fillText("CPU USAGE", 125, 188)
      c.fillStyle = THEME.textPrimary
      c.font = "bold 48px Arial"
      c.fillText(`${cpuLoad}%`, 90, 250)
      c.fillStyle = THEME.textSecondary
      c.font = "14px Arial"
      c.fillText(`${cpus.length} Cores`, 90, 280)
      c.fillText(cpus[0].model.substring(0, 35) + "...", 90, 305)
      drawProgressBar(90, 340, 340, 12, cpuPercent, THEME.primary, THEME.primaryGlow)

      drawCard(500, 140, 400, 280)
      drawIcon(530, 170, "ram", THEME.success)
      c.fillStyle = THEME.success
      c.font = "bold 20px Arial"
      c.fillText("MEMORY", 565, 188)
      c.fillStyle = THEME.textPrimary
      c.font = "bold 48px Arial"
      c.fillText(`${memPercent.toFixed(1)}%`, 530, 250)
      c.fillStyle = THEME.textSecondary
      c.font = "14px Arial"
      c.fillText(`${formatSize(usedMem)} used`, 530, 280)
      c.fillText(`${formatSize(totalMem)} total`, 530, 305)
      drawProgressBar(530, 340, 340, 12, memPercent, THEME.success, THEME.successGlow)

      drawCard(940, 140, 400, 280)
      drawIcon(970, 170, "disk", THEME.purple)
      c.fillStyle = THEME.purple
      c.font = "bold 20px Arial"
      c.fillText("STORAGE", 1005, 188)
      c.fillStyle = THEME.textPrimary
      c.font = "bold 48px Arial"
      c.fillText(`${diskPercent.toFixed(1)}%`, 970, 250)
      c.fillStyle = THEME.textSecondary
      c.font = "14px Arial"
      c.fillText(`${formatSize(diskUsed)} used`, 970, 280)
      c.fillText(`${formatSize(diskTotal)} total`, 970, 305)
      drawProgressBar(970, 340, 340, 12, diskPercent, THEME.purple, THEME.purpleGlow)

      drawCard(60, 460, 620, 180)
      drawIcon(90, 490, "uptime", THEME.cyan)
      c.fillStyle = THEME.cyan
      c.font = "bold 20px Arial"
      c.fillText("UPTIME", 125, 508)
      c.fillStyle = THEME.textPrimary
      c.font = "bold 36px Arial"
      c.fillText(formatTime(process.uptime()), 90, 560)
      c.fillStyle = THEME.textSecondary
      c.font = "14px Arial"
      c.fillText("Bot Uptime", 90, 590)
      c.fillStyle = THEME.textPrimary
      c.font = "bold 36px Arial"
      c.fillText(formatTime(os.uptime()), 350, 560)
      c.fillStyle = THEME.textSecondary
      c.font = "14px Arial"
      c.fillText("Server Uptime", 350, 590)

      drawCard(720, 460, 620, 180)
      drawIcon(750, 490, "network", THEME.pink)
      c.fillStyle = THEME.pink
      c.font = "bold 20px Arial"
      c.fillText("SYSTEM INFO", 785, 508)
      c.fillStyle = THEME.textPrimary
      c.font = "16px Arial"
      c.fillText(`Platform : ${process.platform} ${os.release()}`, 750, 550)
      c.fillText(`Node.js  : ${process.version}`, 750, 580)
      c.fillText(`Arch     : ${os.arch()}`, 750, 610)

      drawCard(60, 680, 1280, 180)
      c.fillStyle = THEME.textTertiary
      c.font = "bold 16px Arial"
      c.fillText("NETWORK INTERFACES", 90, 715)

      let yOffset = 745
      const interfaces = os.networkInterfaces()
      Object.keys(interfaces).slice(0, 3).forEach((name, idx) => {
        const iface = interfaces[name].find(i => i.family === "IPv4" && !i.internal)
        if (iface) {
          c.fillStyle = idx % 2 === 0 ? THEME.primary : THEME.cyan
          c.font = "14px Arial"
          c.fillText(name, 90, yOffset)
          c.fillStyle = THEME.textSecondary
          c.fillText(iface.address, 250, yOffset)
          c.fillText(`MAC: ${iface.mac}`, 450, yOffset)
          yOffset += 30
        }
      })

      c.fillStyle = THEME.textTertiary
      c.font = "12px Arial"
      c.textAlign = "right"
      c.fillText(`Generated: ${new Date().toLocaleString()}`, W - 60, H - 30)
      c.textAlign = "left"

      await ctx.sock.sendMessage(
        ctx.from,
        {
          image: canvas.toBuffer("image/png"),
          caption:
`🖥️ *SYSTEM STATUS*

⚡ Latency: ${latency}ms
🖥️ CPU: ${cpuLoad}% (${cpus.length} cores)
💾 RAM: ${formatSize(usedMem)} / ${formatSize(totalMem)}
💿 Disk: ${formatSize(diskUsed)} / ${formatSize(diskTotal)}
⏱️ Bot Uptime: ${formatTime(process.uptime())}
🖥️ Server Uptime: ${formatTime(os.uptime())}

📊 Platform: ${process.platform} ${os.arch()}
🔧 Node.js: ${process.version}

⏰ ${new Date().toLocaleString()}`
        },
        { quoted: ctx.msg }
      )

    } catch (e) {
      console.error(e)
      ctx.sock.sendMessage(
        ctx.from,
        { text: `❌ Error: ${e.message}` },
        { quoted: ctx.msg }
      )
    }
  }
}