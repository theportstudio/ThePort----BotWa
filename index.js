const http = require("http")
const fs = require("fs")
const path = require("path")
const util = require("util")
const archiver = require("archiver")
const connectBot = require("./connect")
const handler = require("./handler")

const PORT = process.env.PORT || 3000
const PUBLIC_DIR = path.join(__dirname, "public")
const SESSION_PATH = "./session"
const LOG_LIMIT = 300

const originalConsole = {
  log: console.log.bind(console),
  warn: console.warn.bind(console),
  error: console.error.bind(console)
}

const logs = []

function formatTimestamp(date = new Date()) {
  return date.toISOString().replace("T", " ").substring(0, 19)
}

function addLog(level, message) {
  const text = typeof message === "string" ? message : util.inspect(message, { depth: 2 })
  const entry = { time: formatTimestamp(), level, message: text }
  logs.push(entry)
  if (logs.length > LOG_LIMIT) logs.shift()
}

console.log = (...args) => {
  originalConsole.log(...args)
  addLog("INFO", util.format(...args))
}
console.warn = (...args) => {
  originalConsole.warn(...args)
  addLog("WARN", util.format(...args))
}
console.error = (...args) => {
  originalConsole.error(...args)
  addLog("ERROR", util.format(...args))
}

let botSocket = null
let authState = null
let lastConnection = { connection: "starting" }
let latestPairingCode = null
let lastNotify = null

function getStatus() {
  const registered = !!botSocket?.authState?.creds?.registered
  const sessionExists = fs.existsSync(SESSION_PATH)
  return {
    botRunning: Boolean(botSocket),
    registered,
    sessionExists,
    connection: lastConnection.connection || "unknown",
    pairCode: latestPairingCode,
    notification: lastNotify
  }
}

async function startBot(pairNumber) {
  if (botSocket) {
    addLog("WARN", "Bot sudah berjalan. Jika ingin memulai ulang, gunakan tombol restart.")
    return
  }

  addLog("INFO", "Memulai bot WhatsApp...")

  try {
    const { sock, state } = await connectBot({
      pairNumber,
      onLog: msg => addLog("INFO", msg),
      onConnectionUpdate: update => {
        lastConnection = update
        if (update.connection === "open") {
          latestPairingCode = null
          lastNotify = "Bot berhasil terhubung."
        }
        if (update.connection === "close" && update.lastDisconnect?.error?.output?.statusCode === 401) {
          lastNotify = "Bot ter-logout. Session dihapus otomatis."
        }
      },
      onPairingCode: code => {
        latestPairingCode = code
        lastNotify = `Pairing code siap: ${code}`
      }
    })

    botSocket = sock
    authState = state

    botSocket.ev.on("messages.upsert", async ({ messages }) => {
      const msg = messages[0]
      if (!msg.message) return
      try {
        await handler(botSocket, msg)
      } catch (err) {
        addLog("ERROR", `Handler error: ${err.message || err}`)
      }
    })

    botSocket.ev.on("group-participants.update", async (update) => {
      try {
        await handler.handleGroupParticipantsUpdate(botSocket, update)
      } catch (err) {
        addLog("ERROR", `Group update error: ${err.message || err}`)
      }
    })

    addLog("INFO", "Bot siap. Buka dashboard untuk monitoring.")
  } catch (err) {
    addLog("ERROR", `Gagal memulai bot: ${err.message || err}`)
    botSocket = null
    authState = null
    lastConnection = { connection: "error", error: err.message }
  }
}

async function stopBot() {
  if (!botSocket) {
    addLog("WARN", "Bot belum berjalan.")
    return
  }

  addLog("WARN", "Mematikan bot...")
  try {
    if (botSocket.logout) {
      await botSocket.logout("Stop from dashboard")
    } else if (botSocket.ws?.close) {
      await botSocket.ws.close()
    }
  } catch (err) {
    addLog("ERROR", `Gagal mematikan bot: ${err.message || err}`)
  }

  botSocket = null
  authState = null
  lastConnection = { connection: "stopped" }
  latestPairingCode = null
  lastNotify = "Bot dimatikan."
  addLog("INFO", "Bot telah dimatikan.")
}

async function restartBot() {
  addLog("INFO", "Restart bot dimulai...")
  if (botSocket) await stopBot()
  await startBot()
}

function parseRequestBody(req) {
  return new Promise((resolve, reject) => {
    let body = ""
    req.on("data", chunk => { body += chunk })
    req.on("end", () => {
      if (!body) return resolve({})
      try {
        resolve(JSON.parse(body))
      } catch (err) {
        reject(err)
      }
    })
    req.on("error", reject)
  })
}

function sendJson(res, data, status = 200) {
  const payload = JSON.stringify(data)
  res.writeHead(status, { "Content-Type": "application/json", "Cache-Control": "no-store" })
  res.end(payload)
}

function sendText(res, text, status = 200) {
  res.writeHead(status, { "Content-Type": "text/plain; charset=utf-8" })
  res.end(text)
}

async function serveStatic(req, res) {
  const parsed = new URL(req.url || "/", "http://localhost")
  let pathname = parsed.pathname === "/" ? "/index.html" : parsed.pathname
  const filePath = path.join(PUBLIC_DIR, decodeURIComponent(pathname))
  if (!filePath.startsWith(PUBLIC_DIR)) return sendText(res, "Invalid path", 400)
  try {
    if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
      sendText(res, "Tidak ditemukan", 404)
      return
    }
    const ext = path.extname(filePath).toLowerCase()
    const types = {
      ".html": "text/html",
      ".js": "application/javascript",
      ".css": "text/css",
      ".json": "application/json",
      ".png": "image/png",
      ".jpg": "image/jpeg",
      ".jpeg": "image/jpeg",
      ".svg": "image/svg+xml",
      ".ico": "image/x-icon"
    }
    res.writeHead(200, { "Content-Type": types[ext] || "application/octet-stream" })
    fs.createReadStream(filePath).pipe(res)
  } catch (err) {
    addLog("ERROR", `Gagal membuka file statis: ${err.message || err}`)
    sendText(res, "Internal server error", 500)
  }
}

async function handleBackup(req, res) {
  res.writeHead(200, {
    "Content-Type": "application/zip",
    "Content-Disposition": "attachment; filename=\"db-backup.zip\"",
    "Cache-Control": "no-cache"
  })
  const archive = archiver("zip", { zlib: { level: 9 } })
  archive.on("error", err => {
    addLog("ERROR", `Backup error: ${err.message || err}`)
    if (!res.headersSent) res.end()
  })
  archive.pipe(res)
  archive.directory(path.join(__dirname, "db"), "db")
  archive.finalize()
}

const server = http.createServer(async (req, res) => {
  const parsed = new URL(req.url || "/", "http://localhost")
  const pathname = parsed.pathname

  if (pathname.startsWith("/api/")) {
    if (req.method === "GET" && pathname === "/api/status") {
      return sendJson(res, getStatus())
    }
    if (req.method === "GET" && pathname === "/api/logs") {
      return sendJson(res, { logs })
    }
    if (req.method === "GET" && pathname === "/api/backup") {
      return handleBackup(req, res)
    }
    if (req.method === "POST" && pathname === "/api/pair") {
      try {
        const body = await parseRequestBody(req)
        const number = String(body.number || "").trim()
        if (!number) return sendJson(res, { error: "Nomor tidak boleh kosong" }, 400)
        if (!botSocket) {
          await startBot(number)
        } else if (botSocket.authState?.creds?.registered) {
          return sendJson(res, { error: "Bot sudah terdaftar. Hapus session terlebih dahulu." }, 400)
        } else {
          const cleanNumber = number.replace(/[^0-9]/g, "")
          const code = await botSocket.requestPairingCode(cleanNumber)
          const formatted = code.match(/.{1,4}/g).join("-")
          latestPairingCode = formatted
          lastNotify = `Pairing code siap: ${formatted}`
          addLog("INFO", `Pairing code: ${formatted}`)
          return sendJson(res, { pairingCode: formatted })
        }
        return sendJson(res, { pairingCode: latestPairingCode || null })
      } catch (err) {
        addLog("ERROR", `Pair error: ${err.message || err}`)
        return sendJson(res, { error: err.message || "Gagal meminta pairing code" }, 500)
      }
    }
    if (req.method === "POST" && pathname === "/api/restart") {
      await restartBot()
      return sendJson(res, { ok: true })
    }
    if (req.method === "POST" && pathname === "/api/stop") {
      await stopBot()
      return sendJson(res, { ok: true })
    }
    if (req.method === "POST" && pathname === "/api/delete-session") {
      try {
        if (fs.existsSync(SESSION_PATH)) fs.rmSync(SESSION_PATH, { recursive: true, force: true })
        if (botSocket && botSocket.logout) await botSocket.logout("Delete session from dashboard")
        botSocket = null
        authState = null
        latestPairingCode = null
        lastNotify = "Session dihapus. Silakan mulai ulang bot untuk nomor baru."
        addLog("WARN", "Session dihapus.")
        return sendJson(res, { ok: true })
      } catch (err) {
        addLog("ERROR", `Hapus session gagal: ${err.message || err}`)
        return sendJson(res, { error: err.message || "Gagal menghapus session" }, 500)
      }
    }
    return sendJson(res, { error: "Endpoint tidak ditemukan" }, 404)
  }

  return serveStatic(req, res)
})

server.listen(PORT, () => {
  addLog("INFO", `Dashboard berjalan di http://localhost:${PORT}`)
  startBot().catch(err => addLog("ERROR", `Gagal memulai bot: ${err.message || err}`))
})