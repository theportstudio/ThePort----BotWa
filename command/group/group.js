const fs = require("fs")
const path = require("path")
const settings = require("../../settings")

const groupDBPath = path.join(process.cwd(), "db/group_database.json")

function getGroupDB() { 
  if (!fs.existsSync(groupDBPath)) {
    fs.writeFileSync(groupDBPath, JSON.stringify({}, null, 2))
  }
  return JSON.parse(fs.readFileSync(groupDBPath))
}

function saveGroupDB(db) {
  fs.writeFileSync(groupDBPath, JSON.stringify(db, null, 2))
}

function getGroupData(db, groupId) {
  if (!db[groupId]) {
    db[groupId] = {
      antilink: false,
      alert: false,
      antivirtex: false,
      antimedia: false,
      antisticker: false,
      antitagsw: false,
      openTime: null,
      closeTime: null,
      lockTime: null,
      unlockTime: null,
      customWelcome: null,
      customOut: null
    }
  }
  return db[groupId]
}

function cleanJid(jid) {
  return jid ? jid.replace(/:\d+/, "").split("@")[0] : ""
}

function getStatusSymbol(active) {
  return active ? "[ON]" : "[OFF]"
}

function sendGroupMessage(ctx, text, mentions = []) {
  return ctx.sock.sendMessage(
    ctx.from,
    {
      text: text,
      mentions: mentions,
      contextInfo: {
        mentionedJid: mentions,
        externalAdReply: {
          title: `${settings.botName} v1.0`,
          body: `Group Settings`,
          thumbnailUrl: settings.menuImage || "",
          sourceUrl: 'https://github.com   ',
          mediaType: 1,
          renderLargerThumbnail: true
        }
      }
    },
    { quoted: ctx.msg }
  )
}

module.exports = {
  name: "group",
  alias: ["gc", "grup"],
  category: "group",
  description: "Pengaturan group",
  usage: ".group <option> [value]",
  adminOnly: true,
  botAdminRequired: false,

  async execute(ctx) {
    const { sock, from, sender, args, msg, isOwner } = ctx
    
    const db = getGroupDB()
    const groupData = getGroupData(db, from)

    if (!args[0]) {
      let text = `╭── *GROUP SETTINGS*\n`
      text += `│\n`
      text += `│  • Antilink: ${getStatusSymbol(groupData.antilink)}\n`
      text += `│  • Antivirtex: ${getStatusSymbol(groupData.antivirtex)}\n`
      text += `│  • Antimedia: ${getStatusSymbol(groupData.antimedia)}\n`
      text += `│  • Antisticker: ${getStatusSymbol(groupData.antisticker)}\n`
      text += `│  • Antitagsw: ${getStatusSymbol(groupData.antitagsw)}\n`
      text += `│  • Alert: ${getStatusSymbol(groupData.alert)}\n`
      text += `│  • Custom Welcome: ${groupData.customWelcome ? "[SET]" : "[DEFAULT]"}\n`
      text += `│  • Custom Out: ${groupData.customOut ? "[SET]" : "[DEFAULT]"}\n`
      text += `│\n`
      text += `│  *Commands:*\n`
      text += `│  ${settings.prefix}group antilink on/off\n`
      text += `│  ${settings.prefix}group antivirtex on/off\n`
      text += `│  ${settings.prefix}group antimedia on/off\n`
      text += `│  ${settings.prefix}group antisticker on/off\n`
      text += `│  ${settings.prefix}group antitagsw on/off\n`
      text += `│  ${settings.prefix}group alert on/off\n`
      text += `│  ${settings.prefix}group open [jam]\n`
      text += `│  ${settings.prefix}group close [jam]\n`
      text += `│\n`
      text += `╰──────────`

      return sendGroupMessage(ctx, text, [sender])
    }

    const option = args[0].toLowerCase()
    const value = args[1] ? args[1].toLowerCase() : null

    try {
      const groupMetadata = await sock.groupMetadata(from)
      
      const botNumber = cleanJid(sock.user.id)
      const botLid = sock.user.lid ? cleanJid(sock.user.lid) : null
      const senderNumber = cleanJid(sender)
      
      let isBotAdmin = false
      let botParticipant = null
      
      for (const p of groupMetadata.participants) {
        const pCleanId = cleanJid(p.id)
        const pLid = p.lid ? cleanJid(p.lid) : null
        
        const isBotMatch = pCleanId === botNumber || 
                          pLid === botNumber || 
                          pCleanId === botLid || 
                          pLid === botLid
        
        if (isBotMatch) {
          botParticipant = p
          if (p.admin === "admin" || p.admin === "superadmin") {
            isBotAdmin = true
            break
          }
        }
      }
      
      const senderParticipant = groupMetadata.participants.find(p => {
        const pCleanId = cleanJid(p.id)
        const pLid = p.lid ? cleanJid(p.lid) : null
        return pCleanId === senderNumber || pLid === senderNumber
      })
      
      const isUserAdmin = senderParticipant && (senderParticipant.admin === "admin" || senderParticipant.admin === "superadmin")

      if (!isUserAdmin && !isOwner()) {
        return sendGroupMessage(ctx, "❌ Hanya admin group yang dapat menggunakan command ini!", [sender])
      }

      const ownerNumbers = settings.ownerNumber || []
      const isBotOwner = ownerNumbers.some(n => botNumber.includes(n) || n.includes(botNumber))

      const toggleFeatures = ["antilink", "antivirtex", "antimedia", "antisticker", "antitagsw", "alert"]
      
      if (toggleFeatures.includes(option)) {
        const needsBotAdmin = ["antilink", "antivirtex", "antimedia", "antisticker", "antitagsw"].includes(option)
        
        if (needsBotAdmin && !isBotAdmin && !isBotOwner) {
          return sendGroupMessage(ctx, `❌ Bot harus menjadi admin untuk menggunakan fitur ${option}!`, [sender])
        }

        if (value === "on") {
          if (option === "alert") {
            if (!groupData.customWelcome || !groupData.customOut) {
              let missingText = ""
              if (!groupData.customWelcome && !groupData.customOut) {
                missingText = "welcome dan out"
              } else if (!groupData.customWelcome) {
                missingText = "welcome"
              } else {
                missingText = "out"
              }
              
              return sendGroupMessage(ctx, 
                `❌ Tidak dapat mengaktifkan alert!\n\n` +
                `Anda harus mengatur custom ${missingText} message terlebih dahulu.\n\n` +
                `Gunakan:\n` +
                `${settings.prefix}setalert welcome <teks>\n` +
                `${settings.prefix}setalert out <teks>`, 
                [sender]
              )
            }
          }
          
          groupData[option] = true
          saveGroupDB(db)
          return sendGroupMessage(ctx, `✅ ${option} telah ${getStatusSymbol(true)}!`, [sender])
        } else if (value === "off") {
          groupData[option] = false
          saveGroupDB(db)
          return sendGroupMessage(ctx, `✅ ${option} telah ${getStatusSymbol(false)}!`, [sender])
        } else {
          return sendGroupMessage(ctx, `⚠️ Gunakan: .group ${option} on/off\n\nStatus saat ini: ${getStatusSymbol(groupData[option])}`, [sender])
        }
      }

      if (option === "open") {
        if (!isBotAdmin && !isBotOwner) {
          return sendGroupMessage(ctx, `❌ Bot harus menjadi admin untuk membuka group!`, [sender])
        }

        const hours = parseInt(value)
        
        if (hours && hours > 0) {
          const unlockTime = Date.now() + (hours * 60 * 60 * 1000)
          groupData.unlockTime = unlockTime
          groupData.lockTime = null
          saveGroupDB(db)

          await sock.groupSettingUpdate(from, "not_announcement")
          
          setTimeout(async () => {
            try {
              await sock.groupSettingUpdate(from, "announcement")
              const updatedDb = getGroupDB()
              const updatedGroup = getGroupData(updatedDb, from)
              updatedGroup.unlockTime = null
              saveGroupDB(updatedDb)
              sock.sendMessage(from, { 
                text: `⏰ Group telah ditutup otomatis setelah ${hours} jam.`,
                contextInfo: {
                  externalAdReply: {
                    title: `${settings.botName} v1.0`,
                    body: `Auto Close`,
                    thumbnailUrl: settings.menuImage || "",
                    sourceUrl: 'https://github.com   ',
                    mediaType: 1,
                    renderLargerThumbnail: true
                  }
                }
              })
            } catch (err) {
              console.error("Auto lock error:", err)
            }
          }, hours * 60 * 60 * 1000)

          return sendGroupMessage(ctx, `✅ Group dibuka untuk ${hours} jam!\n\nGroup akan otomatis ditutup setelah waktu habis.`, [sender])
        } else {
          groupData.unlockTime = null
          groupData.lockTime = null
          saveGroupDB(db)
          await sock.groupSettingUpdate(from, "not_announcement")
          return sendGroupMessage(ctx, "✅ Group telah *dibuka*!\n\nSemua anggota dapat mengirim pesan.", [sender])
        }
      }

      if (option === "close") {
        if (!isBotAdmin && !isBotOwner) {
          return sendGroupMessage(ctx, `❌ Bot harus menjadi admin untuk menutup group!`, [sender])
        }

        const hours = parseInt(value)
        
        if (hours && hours > 0) {
          const lockTime = Date.now() + (hours * 60 * 60 * 1000)
          groupData.lockTime = lockTime
          groupData.unlockTime = null
          saveGroupDB(db)

          await sock.groupSettingUpdate(from, "announcement")
          
          setTimeout(async () => {
            try {
              await sock.groupSettingUpdate(from, "not_announcement")
              const updatedDb = getGroupDB()
              const updatedGroup = getGroupData(updatedDb, from)
              updatedGroup.lockTime = null
              saveGroupDB(updatedDb)
              sock.sendMessage(from, { 
                text: `⏰ Group telah dibuka otomatis setelah ${hours} jam.`,
                contextInfo: {
                  externalAdReply: {
                    title: `${settings.botName} v1.0`,
                    body: `Auto Open`,
                    thumbnailUrl: settings.menuImage || "",
                    sourceUrl: 'https://github.com   ',
                    mediaType: 1,
                    renderLargerThumbnail: true
                  }
                }
              })
            } catch (err) {
              console.error("Auto unlock error:", err)
            }
          }, hours * 60 * 60 * 1000)

          return sendGroupMessage(ctx, `✅ Group ditutup untuk ${hours} jam!\n\nGroup akan otomatis dibuka setelah waktu habis.`, [sender])
        } else {
          groupData.lockTime = null
          groupData.unlockTime = null
          saveGroupDB(db)
          await sock.groupSettingUpdate(from, "announcement")
          return sendGroupMessage(ctx, "✅ Group telah *ditutup*!\n\nHanya admin yang dapat mengirim pesan.", [sender])
        }
      }

      return sendGroupMessage(ctx, "⚠️ Option tidak valid!\n\nAvailable: antilink, antivirtex, antimedia, antisticker, antitagsw, alert, open, close", [sender])

    } catch (err) {
      console.error("GROUP SETTINGS ERROR:", err)
      return sendGroupMessage(ctx, "❌ Terjadi kesalahan: " + err.message, [sender])
    }
  }
}