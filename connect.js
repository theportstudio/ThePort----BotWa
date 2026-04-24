const {
  default: makeWASocket,
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
  DisconnectReason,
  Browsers
} = require("@whiskeysockets/baileys")

const pino = require("pino")
const fs = require("fs")

const SESSION_PATH = "./session"

async function connectBot({
  pairNumber,
  onLog,
  onConnectionUpdate,
  onPairingCode
} = {}) {
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
    onConnectionUpdate?.(update)

    const { connection, lastDisconnect } = update

    if (connection === "open") {
      onLog?.("✅ Bot berhasil terhubung ke WhatsApp")
    }

    if (connection === "close") {
      const reason = lastDisconnect?.error?.output?.statusCode

      if (reason === DisconnectReason.loggedOut) {
        onLog?.("🚫 Logout terdeteksi, hapus session...")
        if (fs.existsSync(SESSION_PATH)) {
          fs.rmSync(SESSION_PATH, { recursive: true, force: true })
        }
      } else {
        onLog?.("⚠️ Koneksi terputus. Untuk menyambung ulang, tekan tombol restart di dashboard.")
      }
    }
  })

  if (!sock.authState.creds.registered && pairNumber) {
    const cleanNumber = pairNumber.replace(/[^0-9]/g, "")

    onLog?.("⏳ Meminta pairing code...")
    const code = await sock.requestPairingCode(cleanNumber)
    const formatted = code.match(/.{1,4}/g).join("-")

    onLog?.(`🔑 Kode pairing: ${formatted}`)
    onPairingCode?.(formatted)
  }

  return { sock, state }
}

module.exports = connectBot