const fs = require("fs")
const path = require("path")
const settings = require("../../settings")

function cleanNumber(input) {
  let number = input.replace(/[^0-9]/g, "")
  if (number.startsWith("0")) {
    number = "62" + number.slice(1)
  }
  if (!number.startsWith("62")) {
    number = "62" + number
  }
  return number
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
          body: `Kick Member`,
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
  name: "kick",
  alias: ["remove", "keluarkan", "hapus"],
  category: "group",
  description: "Mengeluarkan anggota dari group",
  usage: ".kick <@tag/reply/nomor>",
  adminOnly: true,
  botAdminRequired: true,

  async execute(ctx) {
    const { sock, from, sender, args, msg } = ctx

    let targetJid = null
    let targetNumber = null
    let method = ""

    try {
      const groupMetadata = await sock.groupMetadata(from)
      
      const botNumber = cleanJid(sock.user.id)
      const botLid = sock.user.lid ? cleanJid(sock.user.lid) : null
      const senderNumber = cleanJid(sender)
      
      console.log("Bot ID:", sock.user.id)
      console.log("Bot Number:", botNumber)
      console.log("Bot LID:", botLid)
      console.log("Sender:", sender)
      console.log("Participants count:", groupMetadata.participants.length)
      
      let isBotAdmin = false
      let botParticipant = null
      
      for (const p of groupMetadata.participants) {
        const pCleanId = cleanJid(p.id)
        const pLid = p.lid ? cleanJid(p.lid) : null
        
        console.log(`Checking participant: ${p.id} | LID: ${p.lid} | Admin: ${p.admin}`)
        
        const isBotMatch = pCleanId === botNumber || 
                          pLid === botNumber || 
                          pCleanId === botLid || 
                          pLid === botLid
        
        if (isBotMatch) {
          botParticipant = p
          console.log("✅ Bot found:", p.id, "Admin:", p.admin)
          if (p.admin === "admin" || p.admin === "superadmin") {
            isBotAdmin = true
            console.log("✅ Bot is admin!")
            break
          }
        }
      }
      
      let isUserAdmin = false
      let senderParticipant = null
      
      for (const p of groupMetadata.participants) {
        const pCleanId = cleanJid(p.id)
        const pLid = p.lid ? cleanJid(p.lid) : null
        
        if (pCleanId === senderNumber || pLid === senderNumber) {
          senderParticipant = p
          if (p.admin === "admin" || p.admin === "superadmin") {
            isUserAdmin = true
            break
          }
        }
      }

      console.log("Is Bot Admin:", isBotAdmin)
      console.log("Is User Admin:", isUserAdmin)

      if (!isUserAdmin) {
        return sendStyledMessage(ctx, "❌ Hanya admin group yang dapat mengeluarkan anggota!", [sender])
      }

      if (!isBotAdmin) {
        const ownerNumbers = settings.ownerNumber || []
        const isBotOwner = ownerNumbers.some(n => botNumber.includes(n) || n.includes(botNumber))
        
        if (!isBotOwner) {
          return sendStyledMessage(ctx, `❌ Bot harus menjadi admin untuk mengeluarkan anggota!\n\nBot ditemukan: ${botParticipant ? "Ya" : "Tidak"}\nStatus: ${botParticipant?.admin || "Bukan Admin"}`, [sender])
        }
        
        console.log("✅ Bot is owner, bypassing admin check")
      }

      const quotedMessage = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage
      const mentionedJid = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid || []

      if (quotedMessage) {
        const quotedParticipant = msg.message.extendedTextMessage.contextInfo.participant
        if (quotedParticipant) {
          targetJid = quotedParticipant
          targetNumber = cleanJid(targetJid)
          method = "reply"
        }
      }

      if (!targetJid && mentionedJid.length > 0) {
        targetJid = mentionedJid[0]
        targetNumber = cleanJid(targetJid)
        method = "tag"
      }

      if (!targetJid && args.length > 0) {
        const rawInput = args.join(" ").trim()
        
        if (rawInput.startsWith("@")) {
          targetNumber = rawInput.replace("@", "").replace(/[^0-9]/g, "")
          targetJid = targetNumber + "@s.whatsapp.net"
          method = "tag_text"
        } else {
          targetNumber = cleanNumber(rawInput)
          targetJid = targetNumber + "@s.whatsapp.net"
          method = "number"
        }
      }

      if (!targetJid) {
        let helpText = `╭── *CARA MENGGUNAKAN .KICK*\n`
        helpText += `│\n`
        helpText += `│  1️⃣ *Reply pesan target*\n`
        helpText += `│     Reply pesan anggota + ketik .kick\n`
        helpText += `│\n`
        helpText += `│  2️⃣ *Tag anggota*\n`
        helpText += `│     .kick @anggota\n`
        helpText += `│\n`
        helpText += `│  3️⃣ *Ketik nomor*\n`
        helpText += `│     .kick 628123456789\n`
        helpText += `│     .kick 08123456789\n`
        helpText += `│\n`
        helpText += `╰──────────`
        
        return sendStyledMessage(ctx, helpText, [sender])
      }

      const targetClean = targetNumber
      const botClean = botNumber
      const senderClean = senderNumber

      if (targetClean === botClean) {
        return sendStyledMessage(ctx, "❌ Tidak dapat mengeluarkan bot sendiri!", [sender])
      }

      if (targetClean === senderClean) {
        return sendStyledMessage(ctx, "❌ Tidak dapat mengeluarkan diri sendiri!", [sender])
      }

      let targetInGroup = null
      let isTargetAdmin = false
      
      for (const p of groupMetadata.participants) {
        const pCleanId = cleanJid(p.id)
        const pLid = p.lid ? cleanJid(p.lid) : null
        
        if (pCleanId === targetClean || pLid === targetClean) {
          targetInGroup = p
          if (p.admin === "admin" || p.admin === "superadmin") {
            isTargetAdmin = true
          }
          break
        }
      }

      if (!targetInGroup) {
        return sendStyledMessage(ctx, `⚠️ @${targetNumber} tidak berada di group ini!`, [targetJid, sender])
      }

      if (isTargetAdmin) {
        return sendStyledMessage(ctx, `❌ Tidak dapat mengeluarkan @${targetNumber} karena mereka adalah admin!`, [targetJid, sender])
      }

      const response = await sock.groupParticipantsUpdate(from, [targetJid], "remove")
      console.log("Kick response:", response)

      const success = response[0]?.status === "200" || response[0]?.status === "OK"

      if (success) {
        let successText = `✅ @${targetNumber} telah dikeluarkan dari group!`
        if (method) {
          successText += `\n\n📌 Method: ${method}`
        }
        return sendStyledMessage(ctx, successText, [targetJid, sender])
      } else {
        const status = response[0]?.status
        return sendStyledMessage(ctx, `❌ Gagal mengeluarkan @${targetNumber} (Status: ${status})`, [targetJid, sender])
      }

    } catch (err) {
      console.error("KICK COMMAND ERROR:", err)
      return sendStyledMessage(ctx, "❌ Terjadi kesalahan: " + err.message, [sender])
    }
  }
}