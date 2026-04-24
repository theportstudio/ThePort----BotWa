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
      alert: true,
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

function sendStyledMessage(ctx, text, mentions = []) {
  return ctx.sock.sendMessage(
    ctx.from,
    {
      text: text,
      mentions: mentions,
      contextInfo: {
        mentionedJid: mentions,
        externalAdReply: {
          title: `${settings.botName} v1.0`,
          body: `Custom Alert Message`,
          thumbnailUrl: settings.menuImage || "",
          sourceUrl: 'https://github.com',
          mediaType: 1,
          renderLargerThumbnail: true
        }
      }
    },
    { quoted: ctx.msg }
  )
}

module.exports = {
  name: "setalert",
  alias: ["setalert", "customalert", "alerttext"],
  category: "group",
  description: "Mengatur teks custom untuk welcome/out message",
  usage: ".setalert <welcome/out> <teks>",
  adminOnly: true,
  botAdminRequired: false,

  async execute(ctx) {
    const { sock, from, sender, args, msg, isOwner } = ctx
    
    const db = getGroupDB()
    const groupData = getGroupData(db, from)

    if (!args[0]) {
      let text = `╭── *TEXT ALERT SETTINGS*\n`
      text += `│\n`
      text += `│  📝 Custom Welcome:\n`
      text += `│  ${groupData.customWelcome ? "✅ Sudah diatur" : "❌ Belum diatur"}\n`
      text += `│\n`
      text += `│  📝 Custom Out:\n`
      text += `│  ${groupData.customOut ? "✅ Sudah diatur" : "❌ Belum diatur"}\n`
      text += `│\n`
      text += `│  *Format Variabel:*\n`
      text += `│  <tag> = Mention user\n`
      text += `│  <user> = Mention user (sama dengan tag)\n`
      text += `│  <username> = Nama user (tanpa mention)\n`
      text += `│  <group-name> = Nama group\n`
      text += `│  <admin> = Mention semua admin\n`
      text += `│  <alltag> = Hide tag semua member\n`
      text += `│\n`
      text += `│  *Commands:*\n`
      text += `│  ${settings.prefix}setalert welcome <teks>\n`
      text += `│  ${settings.prefix}setalert out <teks>\n`
      text += `│  ${settings.prefix}setalert preview welcome\n`
      text += `│  ${settings.prefix}setalert preview out\n`
      text += `│  ${settings.prefix}setalert reset welcome\n`
      text += `│  ${settings.prefix}setalert reset out\n`
      text += `╰──────────`
      text += `\n`
      text += `*Contoh:*\n`
      text += `${settings.prefix}setalert welcome Halo <tag> selamat datang di <group-name>!\n`

      return sendStyledMessage(ctx, text, [sender])
    }

    const type = args[0].toLowerCase()
    const textInput = args.slice(1).join(" ")

    try {
      const groupMetadata = await sock.groupMetadata(from)
      
      const senderNumber = cleanJid(sender)
      
      const senderParticipant = groupMetadata.participants.find(p => {
        const pCleanId = cleanJid(p.id)
        const pLid = p.lid ? cleanJid(p.lid) : null
        return pCleanId === senderNumber || pLid === senderNumber
      })
      
      const isUserAdmin = senderParticipant && (senderParticipant.admin === "admin" || senderParticipant.admin === "superadmin")

      if (!isUserAdmin && !isOwner()) {
        return sendStyledMessage(ctx, "❌ Hanya admin group yang dapat menggunakan command ini!", [sender])
      }

      if (type === "welcome") {
        if (!textInput) {
          return sendStyledMessage(ctx, "⚠️ Masukkan teks untuk welcome message!\n\nContoh: .setalert welcome Halo <tag> selamat datang!", [sender])
        }

        groupData.customWelcome = textInput
        saveGroupDB(db)
        
        let previewText = `✅ Custom welcome message telah disimpan!\n\n`
        previewText += `*Preview dengan format:*\n`
        previewText += await formatAlertText(sock, from, sender, groupMetadata, textInput)
        
        return sendStyledMessage(ctx, previewText, [sender])
      }

      if (type === "out") {
        if (!textInput) {
          return sendStyledMessage(ctx, "⚠️ Masukkan teks untuk out message!\n\nContoh: .setalert out <tag> meninggalkan group!", [sender])
        }

        groupData.customOut = textInput
        saveGroupDB(db)
        
        let previewText = `✅ Custom out message telah disimpan!\n\n`
        previewText += `*Preview dengan format:*\n`
        previewText += await formatAlertText(sock, from, sender, groupMetadata, textInput)
        
        return sendStyledMessage(ctx, previewText, [sender])
      }

      if (type === "preview" && args[1]) {
        const previewType = args[1].toLowerCase()
        const template = previewType === "welcome" ? groupData.customWelcome : groupData.customOut
        
        if (!template) {
          return sendStyledMessage(ctx, `❌ Belum ada custom ${previewType} message yang diatur!`, [sender])
        }

        let previewText = `*Preview ${previewType} message:*\n\n`
        previewText += await formatAlertText(sock, from, sender, groupMetadata, template)
        
        return sendStyledMessage(ctx, previewText, [sender])
      }

      if (type === "reset" && args[1]) {
        const resetType = args[1].toLowerCase()
        
        if (resetType === "welcome") {
          groupData.customWelcome = null
          saveGroupDB(db)
          return sendStyledMessage(ctx, "✅ Custom welcome message telah direset ke default!", [sender])
        }
        
        if (resetType === "out") {
          groupData.customOut = null
          saveGroupDB(db)
          return sendStyledMessage(ctx, "✅ Custom out message telah direset ke default!", [sender])
        }
        
        return sendStyledMessage(ctx, "⚠️ Gunakan: .setalert reset welcome/out", [sender])
      }

      return sendStyledMessage(ctx, "⚠️ Type tidak valid!\n\nAvailable: welcome, out, preview, reset", [sender])

    } catch (err) {
      console.error("setalert ERROR:", err)
      return sendStyledMessage(ctx, "❌ Terjadi kesalahan: " + err.message, [sender])
    }
  }
}

async function formatAlertText(sock, groupId, participant, groupMetadata, template) {
  let text = template
  
  const userNumber = cleanJid(participant)
  const userTag = `@${userNumber}`
  const groupName = groupMetadata?.subject || "Group"
  
  const participantJid = participant.includes("@s.whatsapp.net") 
    ? participant 
    : participant + "@s.whatsapp.net"
  const contact = sock.store?.contacts?.[participantJid] || {}
  const userName = contact.notify || contact.name || contact.verifiedName || userNumber
  
  const admins = groupMetadata.participants
    .filter(p => p.admin === "admin" || p.admin === "superadmin")
    .map(p => {
      const num = cleanJid(p.id)
      return `@${num}`
    })
  
  const allMembers = groupMetadata.participants
    .map(p => {
      const num = cleanJid(p.id)
      return `@${num}`
    })
  
  text = text.replace(/<tag>/gi, userTag)
  text = text.replace(/<user>/gi, userTag)
  text = text.replace(/<username>/gi, userName)
  text = text.replace(/<group-name>/gi, groupName)
  text = text.replace(/<admin>/gi, admins.join(" "))
  text = text.replace(/<alltag>/gi, allMembers.join(" "))
  
  return text
}

module.exports.formatAlertText = formatAlertText