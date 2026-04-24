const fs = require("fs")
const path = require("path")
const chalk = require("chalk")
const settings = require("./settings")

const activeGames = new Map()
const groupDBPath = path.join(process.cwd(), "db/group_database.json")

function loadCommands() {
  let commands = []
  const categories = fs.readdirSync("./command")

  for (let category of categories) {
    const files = fs
      .readdirSync(`./command/${category}`)
      .filter(f => f.endsWith(".js"))

    for (let file of files) {
      const cmd = require(`./command/${category}/${file}`)
      cmd.category = category
      commands.push(cmd)
    }
  }
  return commands
}

function getUserDB() {
  if (!fs.existsSync("./db/database.json")) {
    fs.writeFileSync("./db/database.json", "{}")
  }
  return JSON.parse(fs.readFileSync("./db/database.json"))
}

function saveUserDB(db) {
  fs.writeFileSync("./db/database.json", JSON.stringify(db, null, 2))
}

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
      antimedia: false,
      antisticker: false,
      antivirtex: false,
      antitagsw: false,
      alert: false,
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

function getRank(level) {
  if (level >= 30) return "Legend"
  if (level >= 25) return "Master"
  if (level >= 20) return "Diamond"
  if (level >= 15) return "Gold"
  if (level >= 10) return "Silver"
  if (level >= 5) return "Bronze"
  return "Newbie"
}

function extractPhoneNumber(jid) {
  return jid.split('@')[0]
}

function cleanJid(jid) {
  return jid ? jid.replace(/:\d+/, "").split("@")[0] : ""
}

function checkAndResetLimit(user) {
  const now = Date.now()
  const lastReset = user.lastLimitReset || 0
  const hoursPassed = (now - lastReset) / (1000 * 60 * 60)

  if (hoursPassed >= 24) {
    if (user.limit === 0 || user.limit === undefined || user.limit === null) {
      user.limit = 10
      user.lastLimitReset = now
      return true
    }
  }
  return false
}

function checkPremiumExpired(user) {
  if (user.status !== "Premium") return false

  const now = Date.now()
  if (user.premiumExpire && now > user.premiumExpire) {
    user.status = "Free"
    user.limit = 10
    user.premiumStart = null
    user.premiumExpire = null
    user.premiumDuration = null
    return true
  }
  return false
}

function hasActiveGame(groupId) {
  return activeGames.has(groupId)
}

function getActiveGame(groupId) {
  return activeGames.get(groupId)
}

function setActiveGame(groupId, gameData) {
  activeGames.set(groupId, gameData)
}

function clearActiveGame(groupId) {
  activeGames.delete(groupId)
}

function normalizeText(text) {
  return text.toLowerCase().replace(/[^a-z0-9 ]/g, "").trim()
}

function isAnswerCorrect(userAnswer, correctAnswer) {
  const userWords = normalizeText(userAnswer).split(/\s+/)
  const answerWords = normalizeText(correctAnswer).split(/\s+/)
  return answerWords.every(w => userWords.includes(w))
}

function addExp(user, amount) {
  const requiredExp = 500
  user.exp += amount
  while (user.exp >= requiredExp) {
    user.exp -= requiredExp
    user.level += 1
  }
  user.rank = getRank(user.level)
}

function addMoney(user, min = 1000, max = 5000) {
  const amount = Math.floor(Math.random() * (max - min + 1)) + min
  user.uang = (user.uang || 0) + amount
  return amount
}

function normalizeParticipantJid(participant, metadata) {
  if (participant.endsWith('@s.whatsapp.net')) return participant

  if (participant.endsWith('@lid')) {
    const user = metadata?.participants?.find(
      p => p.lid === participant
    )
    return user?.id || participant
  }

  return participant + '@s.whatsapp.net'
}

async function sendWelcomeMessage(sock, groupId, participant, groupMetadata) {
  const groupDB = getGroupDB()
  const groupData = getGroupData(groupDB, groupId)

  const participantJid = participant.includes("@s.whatsapp.net")
    ? participant
    : participant + "@s.whatsapp.net"

  const userNumber = cleanJid(participant)
  const groupName = groupMetadata?.subject || "Group"

  let messageText
  let mentions = []
  
  if (groupData?.customWelcome) {
    let customText = groupData.customWelcome
    
    customText = customText.replace(/<tag>/gi, `@${userNumber}`)
    customText = customText.replace(/<user>/gi, `@${userNumber}`)
    customText = customText.replace(/<username>/gi, userNumber)
    customText = customText.replace(/<group-name>/gi, groupName)
    
    const admins = groupMetadata.participants
      .filter(p => p.admin === "admin" || p.admin === "superadmin")
      .map(p => `@${cleanJid(p.id)}`)
    
    const allMembers = groupMetadata.participants
      .map(p => `@${cleanJid(p.id)}`)
    
    customText = customText.replace(/<admin>/gi, admins.join(" "))
    customText = customText.replace(/<alltag>/gi, allMembers.join(" "))
    
    messageText = customText
    
    mentions.push(participantJid)
    
    const allMentions = groupMetadata.participants.map(p => p.id)
    mentions = [...new Set([...mentions, ...allMentions])]
  } else {
    messageText = `Welcome to ${groupName}\n@${userNumber}`
    mentions.push(participantJid)
    
    const allMentions = groupMetadata.participants.map(p => p.id)
    mentions = [...new Set([...mentions, ...allMentions])]
  }

  await sock.sendMessage(groupId, {
    text: messageText,
    mentions: mentions,
    contextInfo: {
      externalAdReply: {
        title: "Welcome 👋",
        body: groupName,
        thumbnailUrl: settings.menuImage,
        mediaType: 1,
        renderLargerThumbnail: true,
        sourceUrl: "https://fareldev.vercel.app   "
      }
    }
  })
}

async function sendOutMessage(sock, groupId, participant, groupMetadata) {
  const groupDB = getGroupDB()
  const groupData = getGroupData(groupDB, groupId)

  const participantJid = normalizeParticipantJid(participant, groupMetadata)
  const userNumber = cleanJid(participant)
  const groupName = groupMetadata?.subject || "Group"

  let messageText
  let mentions = []
  
  if (groupData?.customOut) {
    let customText = groupData.customOut
    
    customText = customText.replace(/<tag>/gi, `@${userNumber}`)
    customText = customText.replace(/<user>/gi, `@${userNumber}`)
    customText = customText.replace(/<username>/gi, userNumber)
    customText = customText.replace(/<group-name>/gi, groupName)
    
    const admins = groupMetadata.participants
      .filter(p => p.admin === "admin" || p.admin === "superadmin")
      .map(p => `@${cleanJid(p.id)}`)
    
    const allMembers = groupMetadata.participants
      .map(p => `@${cleanJid(p.id)}`)
    
    customText = customText.replace(/<admin>/gi, admins.join(" "))
    customText = customText.replace(/<alltag>/gi, allMembers.join(" "))
    
    messageText = customText
    
    mentions.push(participantJid)
    
    const allMentions = groupMetadata.participants.map(p => p.id)
    mentions = [...new Set([...mentions, ...allMentions])]
  } else {
    messageText = `@${userNumber}\nLeaving From ${groupName}`
    mentions.push(participantJid)
    
    const allMentions = groupMetadata.participants.map(p => p.id)
    mentions = [...new Set([...mentions, ...allMentions])]
  }

  await sock.sendMessage(groupId, {
    text: messageText,
    mentions: mentions,
    contextInfo: {
      externalAdReply: {
        title: "Goodbye 👋",
        body: groupName,
        thumbnailUrl: settings.menuImage,
        mediaType: 1,
        renderLargerThumbnail: true,
        sourceUrl: "https://fareldev.vercel.app   "
      }
    }
  })
}

async function handleGroupParticipantsUpdate(sock, update) {
  const { id, participants, action } = update
  
  console.log(chalk.blue(`[GROUP EVENT] ${action} | ${id} | ${participants.join(', ')}`))
  
  try {
    const groupDB = getGroupDB()
    const groupData = getGroupData(groupDB, id)
    
    if (!groupData.alert) {
      console.log(chalk.gray(`[ALERT OFF] Skipping welcome/out for ${id}`))
      return
    }
    
    const groupMetadata = await sock.groupMetadata(id)
    
    for (const participant of participants) {
      if (action === 'add' || action === 'invite') {
        await sendWelcomeMessage(sock, id, participant, groupMetadata)
      } else if (action === 'remove' || action === 'leave' || action === 'kick') {
        await sendOutMessage(sock, id, participant, groupMetadata)
      }
    }
  } catch (err) {
    console.error(chalk.red("[GROUP PARTICIPANTS ERROR]"), err)
  }
}

const messageHandler = async (sock, msg) => {
  try {
    const from = msg.key.remoteJid
    const isFromMe = msg.key.fromMe
    const sender = msg.key.participant || msg.key.remoteJid
    const pushName = msg.pushName || "Unknown"

    if (msg.messageStubType) {
      const groupId = from
      const participant = msg.messageStubParameters?.[0]
      
      const groupDB = getGroupDB()
      const groupData = getGroupData(groupDB, groupId)
      
      if (!groupData.alert) return

      if (msg.messageStubType === 32) {
        if (participant) {
          const groupMetadata = await sock.groupMetadata(groupId)
          await sendOutMessage(sock, groupId, participant, groupMetadata)
        }
        return
      }

      if (msg.messageStubType === 27 || msg.messageStubType === 28) {
        if (participant) {
          const groupMetadata = await sock.groupMetadata(groupId)
          await sendWelcomeMessage(sock, groupId, participant, groupMetadata)
        }
        return
      }
    }

    const text =
      msg.message?.conversation ||
      msg.message?.extendedTextMessage?.text ||
      msg.message?.imageMessage?.caption ||
      msg.message?.videoMessage?.caption

    const hasImage = !!msg.message?.imageMessage
    const hasVideo = !!msg.message?.videoMessage
    const hasSticker = !!msg.message?.stickerMessage
    const hasDocument = !!msg.message?.documentMessage
    const hasAudio = !!msg.message?.audioMessage

    console.log(
      chalk.cyan(
        `[MSG] ${isFromMe ? "BOT" : "USER"} | ${from} | ${pushName} | ${text || "[MEDIA]"}`
      )
    )

    const db = getUserDB()
    const groupDB = getGroupDB()
    const groupData = getGroupData(groupDB, from)

    if (from.endsWith("@g.us") && !isFromMe) {
      try {
        const groupMetadata = await sock.groupMetadata(from)
        const botId = sock.user.id.replace(/:\d+/, "")
        const isBotAdmin = groupMetadata.participants.some(p => p.id.replace(/:\d+/, "") === botId && p.admin)

        if (groupData.antilink && text) {
          const linkRegex = /(https?:\/\/|www\.)?(chat\.whatsapp\.com\/[a-zA-Z0-9]+|wa\.me\/[0-9]+|whatsapp\.com\/[a-zA-Z0-9]+)/gi
          if (linkRegex.test(text)) {
            if (isBotAdmin) {
              await sock.sendMessage(from, { delete: msg.key })
              await sock.sendMessage(from, {
                text: `⚠️ @${sender.split("@")[0]} Link tidak diizinkan di group ini!`,
                mentions: [sender]
              })
              return
            }
          }
        }

        if (groupData.antivirtex && text) {
          const virtexPatterns = [
            /(.)\1{1000,}/,
            /([^\w\s])\2{500,}/,
            /(\n){50,}/,
            /[\u200B-\u200D\uFEFF]{100,}/,
            /[̲̅]/
          ]
          const isVirtex = virtexPatterns.some(pattern => pattern.test(text)) || text.length > 5000
          
          if (isVirtex) {
            if (isBotAdmin) {
              await sock.sendMessage(from, { delete: msg.key })
              await sock.sendMessage(from, {
                text: `⚠️ @${sender.split("@")[0]} Virtex/Teks berbahaya terdeteksi dan dihapus!`,
                mentions: [sender]
              })
              return
            }
          }
        }

        if (groupData.antimedia) {
          const isViewOnce = msg.message?.imageMessage?.viewOnce || 
                             msg.message?.videoMessage?.viewOnce ||
                             msg.message?.audioMessage?.viewOnce
          
          if ((hasImage || hasVideo || hasDocument) && !isViewOnce) {
            if (isBotAdmin) {
              await sock.sendMessage(from, { delete: msg.key })
              await sock.sendMessage(from, {
                text: `⚠️ @${sender.split("@")[0]} Media tidak diizinkan! Hanya viewonce yang diperbolehkan.`,
                mentions: [sender]
              })
              return
            }
          }
        }

        if (groupData.antisticker && hasSticker) {
          if (isBotAdmin) {
            await sock.sendMessage(from, { delete: msg.key })
            await sock.sendMessage(from, {
              text: `⚠️ @${sender.split("@")[0]} Sticker tidak diizinkan di group ini!`,
              mentions: [sender]
            })
            return
          }
        }

        if (groupData.antitagsw) {
          const hasStatusMention = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.some(jid => jid.includes("status@broadcast")) ||
                                   msg.message?.imageMessage?.contextInfo?.mentionedJid?.some(jid => jid.includes("status@broadcast")) ||
                                   msg.message?.videoMessage?.contextInfo?.mentionedJid?.some(jid => jid.includes("status@broadcast"))

          const isStatusForward = msg.message?.extendedTextMessage?.contextInfo?.forwardedNewsletterMessageInfo ||
                                  msg.message?.imageMessage?.contextInfo?.forwardedNewsletterMessageInfo ||
                                  msg.message?.videoMessage?.contextInfo?.forwardedNewsletterMessageInfo

          if (hasStatusMention || isStatusForward) {
            if (isBotAdmin) {
              await sock.sendMessage(from, { delete: msg.key })
              await sock.sendMessage(from, {
                text: `⚠️ @${sender.split("@")[0]} Tag status WhatsApp tidak diizinkan di group ini!`,
                mentions: [sender]
              })
              return
            }
          }
        }
      } catch (err) {
        console.error(chalk.red("[ANTI FEATURE ERROR]"), err)
      }
    }

    if (!text) return

    const phoneNumber = extractPhoneNumber(sender)
    const userKey = phoneNumber

    const isCommand = text.startsWith(settings.prefix)

    let user = db[userKey] || null

    if (user) {
      const wasReset = checkAndResetLimit(user)
      if (wasReset) {
        console.log(chalk.green(`[RESET LIMIT] ${phoneNumber} | Limit reset to 10`))
      }

      const wasExpired = checkPremiumExpired(user)
      if (wasExpired) {
        console.log(chalk.yellow(`[PREMIUM EXPIRED] ${phoneNumber} | Reverted to Free`))
      }

      if (!user.userName && pushName && pushName !== "Unknown") {
        user.userName = pushName
        saveUserDB(db)
      }
    }

    const args = text
      .slice(settings.prefix.length)
      .trim()
      .split(/ +/)

    const commandName = args.shift().toLowerCase()

    const commands = loadCommands()
    const command = commands.find(
      cmd =>
        cmd.name === commandName ||
        (cmd.alias && cmd.alias.includes(commandName))
    )

    if (!isCommand) {
      const ext = msg.message?.extendedTextMessage
      const replyText = ext?.text
      const contextInfo = ext?.contextInfo

      if (!contextInfo?.quotedMessage || !replyText) return

      const gameSession = getActiveGame(from)
      if (!gameSession || !gameSession.active) return

      if (!contextInfo.stanzaId || !contextInfo.stanzaId.endsWith(gameSession.messageKey)) return

      if (Date.now() > gameSession.timeout) return

      if (isAnswerCorrect(replyText, gameSession.answer)) {
        clearActiveGame(from)

        const winner = db[extractPhoneNumber(sender)]
        let expText = ""
        let moneyText = ""
        if (winner) {
          addExp(winner, 15)
          const moneyAdded = addMoney(winner, 1000, 5000)
          expText = `\n⭐ +15 EXP (Total: ${winner.exp}/${winner.level * 500})`
          moneyText = `\n💰 +${moneyAdded.toLocaleString()} Money (Total: ${winner.uang.toLocaleString()})`
          saveUserDB(db)
        }

        if (isFromMe) {
          await sock.sendMessage(
            from,
            {
              text:
                `🎉 *JAWABAN BENAR!*\n\n` +
                `✅ Jawaban: *${gameSession.originalAnswer}*\n` +
                `⏱ Level: ${gameSession.level}\n` +
                `👤 Dijawab oleh: @${sender.split("@")[0]}` +
                expText +
                moneyText,
              mentions: [sender]
            }
          )
        } else {
          await sock.sendMessage(
            from,
            {
              text:
                `🎉 *JAWABAN BENAR!*\n\n` +
                `✅ Jawaban: *${gameSession.originalAnswer}*\n` +
                `⏱ Level: ${gameSession.level}\n` +
                `👤 Dijawab oleh: @${sender.split("@")[0]}` +
                expText +
                moneyText,
              mentions: [sender]
            },
            { quoted: msg }
          )
        }
      } else {
        await sock.sendMessage(from, {
          react: { text: "❌", key: msg.key }
        })
      }
      return
    }

    if (!command) {
      if (commandName === "stopgame" || commandName === "sg" || commandName === "stop") {
        if (!hasActiveGame(from)) {
          if (isFromMe) {
            return sock.sendMessage(
              from,
              { text: "❌ Tidak ada sesi game yang sedang berjalan." }
            )
          } else {
            return sock.sendMessage(
              from,
              { text: "❌ Tidak ada sesi game yang sedang berjalan." },
              { quoted: msg }
            )
          }
        }

        const gameName = getActiveGame(from).gameName
        clearActiveGame(from)

        if (isFromMe) {
          return sock.sendMessage(
            from,
            { text: `✅ Sesi game *${gameName}* telah dihentikan.` }
          )
        } else {
          return sock.sendMessage(
            from,
            { text: `✅ Sesi game *${gameName}* telah dihentikan.` },
            { quoted: msg }
          )
        }
      }
      return
    }

    if (command.name === "stopgame" || command.alias?.includes("sg") || command.alias?.includes("stop")) {
      if (!hasActiveGame(from)) {
        if (isFromMe) {
          return sock.sendMessage(
            from,
            { text: "❌ Tidak ada sesi game yang sedang berjalan." }
          )
        } else {
          return sock.sendMessage(
            from,
            { text: "❌ Tidak ada sesi game yang sedang berjalan." },
            { quoted: msg }
          )
        }
      }

      const gameName = getActiveGame(from).gameName
      clearActiveGame(from)

      if (isFromMe) {
        return sock.sendMessage(
          from,
          { text: `✅ Sesi game *${gameName}* telah dihentikan.` }
        )
      } else {
        return sock.sendMessage(
          from,
          { text: `✅ Sesi game *${gameName}* telah dihentikan.` },
          { quoted: msg }
        )
      }
    }

    if (command.category === "game") {
      if (hasActiveGame(from)) {
        const currentGame = getActiveGame(from)
        if (isFromMe) {
          return sock.sendMessage(
            from,
            {
              text:
                `⏳ Tidak bisa memulai *${command.name}* karena sedang ada sesi *${currentGame.gameName}* yang berjalan.\n\n` +
                `Ketik *.stopgame* untuk menghentikan sesi yang aktif.`
            }
          )
        } else {
          return sock.sendMessage(
            from,
            {
              text:
                `⏳ Tidak bisa memulai *${command.name}* karena sedang ada sesi *${currentGame.gameName}* yang berjalan.\n\n` +
                `Ketik *.stopgame* untuk menghentikan sesi yang aktif.`
            },
            { quoted: msg }
          )
        }
      }
    }

    if (command.name === "login" || command.alias?.includes("daftar")) {
      if (!user) {
        user = {
          name: null,
          userName: pushName && pushName !== "Unknown" ? pushName : null,
          phoneNumber: phoneNumber,
          exp: 0,
          level: 1,
          rank: "Newbie",
          limit: 10,
          lastLimitReset: Date.now(),
          uang: 0,
          status: "Free",
          firstChat: from
        }
        db[userKey] = user
      }
    }

    const waName = msg.pushName || "User"

    if (isFromMe && !user) {
      user = {
        name: "Bot",
        userName: pushName && pushName !== "Unknown" ? pushName : "Bot",
        phoneNumber: phoneNumber,
        exp: 999999,
        level: 999,
        rank: "Legend",
        limit: 999999,
        lastLimitReset: Date.now(),
        uang: 999999,
        status: "Premium",
        firstChat: from
      }
      db[userKey] = user
      saveUserDB(db)
    }

    if (!user) {
      if (isFromMe) {
        return sock.sendMessage(
          from,
          {
            text:
              "❌ Kamu belum terdaftar\n\n" +
              "Ketik:\n" +
              `.login ${waName}`
          }
        )
      } else {
        return sock.sendMessage(
          from,
          {
            text:
              "❌ Kamu belum terdaftar\n\n" +
              "Ketik:\n" +
              `.login ${waName}`
          },
          { quoted: msg }
        )
      }
    }

    if (command.loginRequired && !user.name) {
      if (isFromMe) {
        return sock.sendMessage(
          from,
          { text: `Kamu belum login.\nGunakan: *.login ${waName}*` }
        )
      } else {
        return sock.sendMessage(
          from,
          { text: `Kamu belum login.\nGunakan: *.login ${waName}*` },
          { quoted: msg }
        )
      }
    }

    const exemptCategories = ["general", "owner", "user", "group", "game", "fun"]
    const isExempt = exemptCategories.includes(command.category)

    if (!isExempt && !isFromMe && user.limit <= 0) {
      if (isFromMe) {
        return sock.sendMessage(
          from,
          { text: "Limit kamu habis!\nLimit reset setiap hari atau upgrade ke Premium." }
        )
      } else {
        return sock.sendMessage(
          from,
          { text: "Limit kamu habis!\nLimit reset setiap hari atau upgrade ke Premium." },
          { quoted: msg }
        )
      }
    }

    const ctx = {
      sock,
      msg,
      from,
      sender,
      pushName,
      userName: user.userName || pushName || "User",
      args,
      db,
      user: user,
      isFromMe,
      phoneNumber,
      userKey,

      reply: async (text, options = {}) => {
        if (isFromMe) {
          return sock.sendMessage(
            from,
            { text: "" + text, ...options }
          )
        } else {
          return sock.sendMessage(
            from,
            { text: "" + text, ...options },
            { quoted: msg }
          )
        }
      },

      isOwner: () =>
        settings.ownerNumber?.some(n => phoneNumber.includes(n)),

      isPremium: () => user.status === "Premium",

      saveUserDB: saveUserDB,

      startGame: (gameData) => {
        setActiveGame(from, {
          ...gameData,
          gameName: command.name,
          active: true
        })
      },

      clearGame: () => {
        clearActiveGame(from)
      },

      getGame: () => {
        return getActiveGame(from)
      },

      hasGame: () => {
        return hasActiveGame(from)
      }
    }

    if (command.execute) {
      await command.execute(ctx)
    } else if (command.code) {
      await command.code(ctx)
    }

    if (!isExempt && !isFromMe) {
      user.limit -= 1
      console.log(chalk.yellow(`[LIMIT] ${phoneNumber} | ${command.name} | Limit: ${user.limit}`))
    }

    addExp(user, 20)

    db[userKey] = user
    saveUserDB(db)

  } catch (err) {
    console.error(chalk.red("HANDLER ERROR:"), err)
  }
}

module.exports = messageHandler
module.exports.handleGroupParticipantsUpdate = handleGroupParticipantsUpdate