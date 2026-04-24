const fs = require("fs")
const path = require("path")
const settings = require("../../settings")
const p = settings.prefix || "."
const os = require("os")
const axios = require("axios")
const ffmpeg = require("fluent-ffmpeg")
const { createCanvas, loadImage } = require("canvas")

const audioPath = path.join(process.cwd(), "media", "audio.mp3")

const getGreeting = () => {
  const hour = new Date().toLocaleString("en-US", {
    timeZone: "Asia/Makassar",
    hour: "numeric",
    hour12: false
  })
  const makassarHour = parseInt(hour)
  if (makassarHour >= 5 && makassarHour < 12) return "Pagi"
  if (makassarHour >= 12 && makassarHour < 15) return "Siang"
  if (makassarHour >= 15 && makassarHour < 18) return "Sore"
  return "Malam"
}

const createMenuCanvas = async (userName, userJid, avatarPath, totalCmd, greeting) => {
  const width = 1200
  const height = 600
  const canvas = createCanvas(width, height)
  const c = canvas.getContext("2d")

  // background minimalist dark
  c.fillStyle = "#0f172a"
  c.fillRect(0, 0, width, height)

  // main card
  c.fillStyle = "#111827"
  c.beginPath()
  c.roundRect(50, 50, width - 100, height - 100, 28)
  c.fill()

  // soft border
  c.strokeStyle = "rgba(255,255,255,0.06)"
  c.lineWidth = 2
  c.stroke()

  // top accent line
  c.fillStyle = "#3b82f6"
  c.beginPath()
  c.roundRect(50, 50, width - 100, 6, 6)
  c.fill()

  // avatar
  const avatarSize = 170
  const avatarX = 100
  const avatarY = 170

  // avatar ring
  c.beginPath()
  c.arc(
    avatarX + avatarSize / 2,
    avatarY + avatarSize / 2,
    avatarSize / 2 + 6,
    0,
    Math.PI * 2
  )
  c.strokeStyle = "#3b82f6"
  c.lineWidth = 4
  c.stroke()

  // avatar image
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
    const avatar = await loadImage(avatarPath)
    c.drawImage(avatar, avatarX, avatarY, avatarSize, avatarSize)
  } catch {
    c.fillStyle = "#1e293b"
    c.fillRect(avatarX, avatarY, avatarSize, avatarSize)

    c.fillStyle = "#94a3b8"
    c.font = "bold 70px Arial"
    c.textAlign = "center"
    c.fillText(
      userName.charAt(0).toUpperCase(),
      avatarX + avatarSize / 2,
      avatarY + avatarSize / 2 + 25
    )
  }

  c.restore()

  // right content
  const infoX = 340

  // greeting badge
  c.fillStyle = "rgba(59,130,246,0.12)"
  c.beginPath()
  c.roundRect(infoX, 110, 220, 42, 12)
  c.fill()

  c.fillStyle = "#60a5fa"
  c.font = "bold 18px Arial"
  c.textAlign = "left"
  c.fillText(`Selamat ${greeting}`, infoX + 20, 137)

  // username
  c.fillStyle = "#ffffff"
  c.font = "bold 52px Arial"

  const displayName =
    userName.length > 18
      ? userName.substring(0, 18) + ".."
      : userName

  c.fillText(displayName, infoX, 220)

  // jid cleaner
  const cleanId = userJid.split("@")[0].replace(/[^0-9]/g, "")

  c.fillStyle = "#94a3b8"
  c.font = "22px Arial"
  c.fillText(`${cleanId}`, infoX, 260)

  // stats cards
  const stats = [
    {
      label: "COMMANDS",
      value: totalCmd
    },
    {
      label: "RUNTIME",
      value: `${Math.floor(process.uptime())}s`
    },
    {
      label: "VERSION",
      value: "v2.0.4"
    }
  ]

  let startX = infoX
  const boxY = 320

  stats.forEach((stat) => {
    c.fillStyle = "#1e293b"
    c.beginPath()
    c.roundRect(startX, boxY, 190, 110, 18)
    c.fill()

    c.strokeStyle = "rgba(255,255,255,0.04)"
    c.lineWidth = 1
    c.stroke()

    c.fillStyle = "#ffffff"
    c.font = "bold 30px Arial"
    c.fillText(String(stat.value), startX + 20, boxY + 48)

    c.fillStyle = "#94a3b8"
    c.font = "bold 15px Arial"
    c.fillText(stat.label, startX + 20, boxY + 82)

    startX += 210
  })

  // footer
  c.fillStyle = "#64748b"
  c.font = "16px Arial"
  c.fillText(
    `Powered by ${settings.botName}`,
    infoX,
    500
  )

  c.textAlign = "right"
  c.fillStyle = "rgba(255,255,255,0.05)"
  c.font = "bold 72px Arial"
  c.fillText(
    settings.botName.split(" ")[0],
    width - 80,
    height - 80
  )

  const outputPath = path.join(
    process.cwd(),
    "temp",
    `menu-${Date.now()}.png`
  )

  const buffer = canvas.toBuffer("image/png")
  fs.writeFileSync(outputPath, buffer)

  return outputPath
}

module.exports = {
  name: "menu",
  alias: ["help", "cmd", "list"],

  async execute(ctx) {
    let imgPath = null
    let avatarPath = null
    let convertedAudioPath = null

    try {
      const userName = ctx.pushName || "User"
      const userJid = ctx.sender || ctx.msg?.key?.participant || ctx.msg?.key?.remoteJid || "unknown@s.whatsapp.net"
      const greeting = getGreeting()

      const args = ctx.args || []
      const requestedCategory = args[0] ? args[0].toLowerCase() : null

      const tempDir = path.join(process.cwd(), "temp")
      if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true })

      try {
        const ppUrl = await ctx.sock.profilePictureUrl(userJid, "image")
        const res = await axios.get(ppUrl, {
          responseType: "arraybuffer",
          timeout: 10000,
          headers: { "User-Agent": "Mozilla/5.0" }
        })
        avatarPath = path.join(tempDir, `avatar-menu-${Date.now()}.jpg`)
        fs.writeFileSync(avatarPath, res.data)
      } catch {
        const defaultAvatarUrl = "https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEjCX5TOKkOk3MBt8V-f8PbmGrdLHCi4BoUOs_yuZ1pekOp8U_yWcf40t66JZ4_e_JYpRTOVCl0m8ozEpLrs9Ip2Cm7kQz4fUnUFh8Jcv8fMFfPbfbyWEEKne0S9e_U6fWEmcz0oihuJM6sP1cGFqdJZbLjaEQnGdgJvcxctqhMbNw632OKuAMBMwL86/s414/pp%20kosong%20wa%20default.jpg"
        const resDefault = await axios.get(defaultAvatarUrl, { responseType: "arraybuffer" })
        avatarPath = path.join(tempDir, `avatar-default-${Date.now()}.jpg`)
        fs.writeFileSync(avatarPath, resDefault.data)
      }

      const commandPath = path.join(process.cwd(), "command")
      const categories = fs.readdirSync(commandPath).filter(f =>
        fs.statSync(path.join(commandPath, f)).isDirectory()
      )

      let totalCmd = 0
      const allCommands = {}

      categories.forEach(cat => {
        const files = fs.readdirSync(path.join(commandPath, cat))
          .filter(f => f.endsWith(".js"))
        totalCmd += files.length
        allCommands[cat.toLowerCase()] = files.map(f => f.replace(".js", ""))
      })

      const date = new Date().toLocaleDateString("id-ID", {
        timeZone: "Asia/Makassar",
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
      
      const time = new Date().toLocaleTimeString("id-ID", {
        timeZone: "Asia/Makassar",
        hour: "2-digit",
        minute: "2-digit"
      })

      await ctx.sock.sendMessage(ctx.from, {
        react: { text: "⏳ ", key: ctx.msg.key }
      })

      let text = ""
      const mentions = [userJid]

      const footerText = `${settings.botName}`
      const inviteLink = "https://chat.whatsapp.com/F7UBBSz5oi9AotInRcYZjR"

      if (requestedCategory) {
        if (!allCommands[requestedCategory]) {
          const availableCats = Object.keys(allCommands).map(cat =>
            `│  ☆ ${settings.prefix}menu ${cat}`
          ).join("\n")
          text += `Menu tidak di temukan, silahkan cari yang lain.\n\n`
          text += `╭┈┈┈┈┈┈❀︎ *MENU ThePort*\n`
          text += `${availableCats}\n`
          text += `╰┈┈┈┈┈┈●\n\n`

          await ctx.sock.sendMessage(
            ctx.from,
            {
              text: text,
              mentions: mentions,
              contextInfo: {
                mentionedJid: mentions,
                externalAdReply: {
                  title: `${settings.botName} v1.0`,
                  body: `ThePort Menu`,
                  thumbnailUrl: settings.menuImage || "",
                  sourceUrl: inviteLink,
                  mediaType: 1,
                  renderLargerThumbnail: true
                }
              }
            },
            { quoted: ctx.msg }
          )
          return
        }

        const cmds = allCommands[requestedCategory]

        text = `╭┈┈┈┈┈┈❀︎ *USER INFO*\n`
        text += `│  Name : ${userName}\n`
        text += `│  Tag  : @${userJid.split("@")[0]}\n`
        text += `│  Time : Selamat ${greeting}\n`
        text += `╰┈┈┈┈┈┈●\n\n`

        text += `╭┈┈┈┈┈┈❀︎ *SYSTEM INFO*\n`
        text += `│  Date     : ${date}\n`
        text += `│  Time     : ${time} WITA (Makassar)\n`
        text += `│  Engine   : Node.js ${process.version}\n`
        text += `│  Platform : ${os.platform()}\n`
        text += `╰┈┈┈┈┈┈●\n\n`

        text += `╭┈┈┈┈┈┈❀︎ ☆ *${requestedCategory.toUpperCase()} (${cmds.length})*\n`

        cmds.forEach((cmd) => {
          const num = '✦'
          text += `│${num} ${settings.prefix}${cmd}\n`
        })

        text += `╰┈┈┈┈┈┈●\n\n`

        await ctx.sock.sendMessage(
          ctx.from,
          {
            text: text,
            mentions: mentions,
            contextInfo: {
              mentionedJid: mentions,
              externalAdReply: {
                title: `${settings.botName} v1.0`,
                body: footerText,
                thumbnailUrl: settings.menuImage || "",
                sourceUrl: inviteLink,
                mediaType: 1,
                renderLargerThumbnail: true
              }
            }
          },
          { quoted: ctx.msg }
        )

      } else {
        imgPath = await createMenuCanvas(userName, userJid, avatarPath, totalCmd, greeting)

        let text = `Halo Selamatt ${greeting} kak  @${userJid.split("@")[0]}\n, dan Selamat datang di ThePort, silahkan pilih menu yang ingin di gunakan\n\n`

        text += `╭┈┈┈┈┈┈❀︎ *SYSTEM INFO*\n`
        text += `│  Date     : ${date}\n`
        text += `│  Time     : ${time} WITA (Makassar)\n`
        text += `│  Engine   : Node.js ${process.version}\n`
        text += `│  Platform : ${os.platform()}\n`
        text += `│  Features : ${totalCmd} Commands\n`
        text += `╰┈┈┈┈┈┈●\n\n`

        text += `╭┈┈┈┈┈┈❀︎ *MENU CATEGORIES*\n`

        Object.keys(allCommands).forEach(cat => {
          text += `│↳ ${settings.prefix}menu ${cat}\n`
        })

        text += `╰┈┈┈┈┈┈●\n\n`
        text += `> Terima kasih telah menggunakan *${settings.botName}*`

        await ctx.sock.sendMessage(
          ctx.from,
          {
            image: fs.readFileSync(imgPath),
            caption: text,
            mentions: mentions,
            contextInfo: {
              mentionedJid: mentions,
              externalAdReply: {
                title: `${settings.botName} v1.0`,
                body: footerText,
                thumbnailUrl: settings.menuImage || "",
                sourceUrl: inviteLink,
                mediaType: 1,
                renderLargerThumbnail: true
              }
            }
          },
          { quoted: ctx.msg }
        )

        if (fs.existsSync(audioPath)) {
          convertedAudioPath = path.join(tempDir, `converted-${Date.now()}.opus`)
          ffmpeg(audioPath)
            .toFormat('opus')
            .on('error', (err) => console.error("Konversi PTT Gagal:", err))
            .on('end', async () => {
              await ctx.sock.sendMessage(
                ctx.from,
                {
                  audio: fs.readFileSync(convertedAudioPath),
                  mimetype: "audio/ogg; codecs=opus",
                  ptt: true
                },
                { quoted: ctx.msg }
              )
              if (fs.existsSync(convertedAudioPath)) fs.unlinkSync(convertedAudioPath)
            })
            .save(convertedAudioPath)
        }
      }
    } catch (err) {
      console.error("MENU ERROR:", err)
      await ctx.sock.sendMessage(ctx.from, {
        text: "Menu gagal dimuat."
      }, { quoted: ctx.msg })
    } finally {
      try {
        if (imgPath && fs.existsSync(imgPath)) fs.unlinkSync(imgPath)
        if (avatarPath && fs.existsSync(avatarPath)) fs.unlinkSync(avatarPath)
      } catch { }
    }
  }
}