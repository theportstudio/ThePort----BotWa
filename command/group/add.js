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
          body: `Add Member`,
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

async function sendPrivateInvite(sock, number, groupMetadata, inviter) {
  const groupName = groupMetadata?.subject || "Group"
  const groupDesc = groupMetadata?.desc || "Tidak ada deskripsi"
  const inviteCode = groupMetadata?.inviteCode
  
  let text = `Halo! 👋\n\n`
  text += `Anda diundang oleh @${cleanJid(inviter)} untuk bergabung ke group:\n\n`
  text += `📌 *${groupName}*\n`
  text += `${groupDesc}\n\n`
  
  if (inviteCode) {
    text += `🔗 Link Group:\n`
    text += `https://chat.whatsapp.com/${inviteCode}\n\n`
  }
  
  text += `Silakan klik link di atas untuk bergabung!`

  try {
    await sock.sendMessage(
      number + "@s.whatsapp.net",
      {
        text: text,
        mentions: [inviter],
        contextInfo: {
          mentionedJid: [inviter],
          externalAdReply: {
            title: `${settings.botName} v1.0`,
            body: `Group Invitation`,
            thumbnailUrl: settings.menuImage || "",
            sourceUrl: inviteCode ? `https://chat.whatsapp.com/${inviteCode}` : 'https://github.com',
            mediaType: 1,
            renderLargerThumbnail: true
          }
        }
      }
    )
    return true
  } catch (err) {
    console.error("Private invite error:", err)
    return false
  }
}

module.exports = {
  name: "add",
  alias: ["invite", "tambah"],
  category: "group",
  description: "Menambahkan anggota ke group",
  usage: ".add <nomor>",
  adminOnly: true,
  botAdminRequired: true,

  async execute(ctx) {
    const { sock, from, sender, args, msg } = ctx

    if (!args[0]) {
      return sendStyledMessage(ctx, "⚠️ Masukkan nomor yang ingin ditambahkan!\n\nContoh: .add 628123456789", [sender])
    }

    const rawNumber = args[0]
    const cleanNum = cleanNumber(rawNumber)
    const jid = cleanNum + "@s.whatsapp.net"

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
        return sendStyledMessage(ctx, "❌ Hanya admin group yang dapat menambahkan anggota!", [sender])
      }

      if (!isBotAdmin) {
        const ownerNumbers = settings.ownerNumber || []
        const isBotOwner = ownerNumbers.some(n => botNumber.includes(n) || n.includes(botNumber))
        
        if (!isBotOwner) {
          return sendStyledMessage(ctx, `❌ Bot harus menjadi admin untuk menambahkan anggota!\n\nBot ditemukan: ${botParticipant ? "Ya" : "Tidak"}\nStatus: ${botParticipant?.admin || "Bukan Admin"}`, [sender])
        }
        
        console.log("✅ Bot is owner, bypassing admin check")
      }

      const alreadyInGroup = groupMetadata.participants.some(p => {
        const pCleanId = cleanJid(p.id)
        const pLid = p.lid ? cleanJid(p.lid) : null
        const targetClean = cleanNum
        return pCleanId === targetClean || pLid === targetClean
      })

      if (alreadyInGroup) {
        return sendStyledMessage(ctx, `⚠️ Nomor @${cleanNum} sudah berada di group ini!`, [jid, sender])
      }

      try {
        const response = await sock.groupParticipantsUpdate(from, [jid], "add")
        console.log("Add response:", response)
        
        const success = response[0]?.status === "200" || response[0]?.status === "OK"
        
        if (success) {
          return sendStyledMessage(ctx, `✅ Berhasil menambahkan @${cleanNum} ke group!`, [jid, sender])
        } else {
          const status = response[0]?.status
          
          if (status === "403" || status === "408" || status === "private") {
            const privateSent = await sendPrivateInvite(sock, cleanNum, groupMetadata, sender)
            
            if (privateSent) {
              return sendStyledMessage(ctx, `📩 @${cleanNum} memiliki privasi aktif.\n\nLink undangan telah dikirim secara pribadi!`, [jid, sender])
            } else {
              return sendStyledMessage(ctx, `❌ Gagal mengirim undangan pribadi ke @${cleanNum}.\n\nPastikan nomor valid dan memiliki WhatsApp.`, [jid, sender])
            }
          }
          
          if (status === "401") {
            return sendStyledMessage(ctx, `❌ @${cleanNum} telah memblokir bot.`, [jid, sender])
          }
          
          if (status === "404") {
            return sendStyledMessage(ctx, `❌ @${cleanNum} tidak terdaftar di WhatsApp.`, [jid, sender])
          }
          
          return sendStyledMessage(ctx, `⚠️ Gagal menambahkan @${cleanNum} (Status: ${status})`, [jid, sender])
        }
        
      } catch (addErr) {
        console.error("Add participant error:", addErr)
        
        const privateSent = await sendPrivateInvite(sock, cleanNum, groupMetadata, sender)
        
        if (privateSent) {
          return sendStyledMessage(ctx, `📩 @${cleanNum} memiliki privasi aktif atau tidak dapat ditambahkan langsung.\n\nLink undangan telah dikirim secara pribadi!`, [jid, sender])
        } else {
          return sendStyledMessage(ctx, `❌ Gagal menambahkan @${cleanNum}.\n\nError: ${addErr.message}`, [jid, sender])
        }
      }

    } catch (err) {
      console.error("ADD COMMAND ERROR:", err)
      return sendStyledMessage(ctx, "❌ Terjadi kesalahan: " + err.message, [sender])
    }
  }
}