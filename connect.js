const {
  default: makeWASocket,
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
  DisconnectReason,
  Browsers
} = require("@whiskeysockets/baileys")

const pino = require("pino")
const readline = require("readline")
const fs = require("fs")

const SESSION_PATH = "./session"

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

function question(text) {
  return new Promise(resolve => rl.question(text, resolve))
}

async function connectBot() {
  const { state, saveCreds } = await useMultiFileAuthState(SESSION_PATH)
  const { version } = await fetchLatestBaileysVersion()

  const sock = makeWASocket({
    version,
    logger: pino({ level: "silent" }),
    auth: state,
    browser: Browsers.ubuntu("Chrome"),
    printQRInTerminal: false
  })

  sock.ev.on("creds.update", saveCreds)

  sock.ev.on("connection.update", async (update) => {
    const { connection, lastDisconnect } = update

    if (connection === "open") {
      console.log("✅ Bot berhasil terhubung ke WhatsApp")
      rl.close()
    }

    if (connection === "close") {
      const reason = lastDisconnect?.error?.output?.statusCode

      if (reason !== DisconnectReason.loggedOut) {
        console.log("⚠️ Koneksi terputus, mencoba ulang...")
        connectBot()
      } else {
        console.log("🚫 Logout terdeteksi, hapus session...")
        if (fs.existsSync(SESSION_PATH)) {
          fs.rmSync(SESSION_PATH, { recursive: true, force: true })
        }
        connectBot()
      }
    }
  })

  if (!sock.authState.creds.registered) {
    const number = await question(
      "📱 Masukkan nomor WhatsApp (contoh: 628xxx): "
    )

    const cleanNumber = number.replace(/[^0-9]/g, "")

    console.log("⏳ Meminta pairing code...")
    await new Promise(resolve => setTimeout(resolve, 2000))

    const code = await sock.requestPairingCode(cleanNumber)
    const formatted = code.match(/.{1,4}/g).join("-")

    console.log(`
╔══════════════════════════════╗
║      🔑 PAIRING CODE         ║
║                              ║
║   ${formatted}   ║
║                              ║
║  Masukkan di WhatsApp kamu   ║
╚══════════════════════════════╝
`)
  }

  return sock
}

module.exports = connectBot