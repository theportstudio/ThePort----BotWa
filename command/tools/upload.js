const axios = require("axios")
const fs = require("fs")
const path = require("path")
const settings = require("../../settings")
const FormData = require("form-data")
const { downloadMediaMessage, downloadContentFromMessage } = require("@whiskeysockets/baileys")

module.exports = {
    name: "upload",
    alias: ["tourl", "uploader"],
    category: "tools",
    loginRequired: true,

    async execute(ctx) {
        let tempPath = null

        try {
            const msg = ctx.msg
            const extendedText = msg.message?.extendedTextMessage
            const contextInfo = extendedText?.contextInfo
            const quoted = contextInfo?.quotedMessage
            const isQuoted = !!quoted

            const mediaMsg = isQuoted
                ? quoted.imageMessage || quoted.videoMessage || quoted.documentMessage || quoted.audioMessage || quoted.stickerMessage
                : msg.message?.imageMessage || msg.message?.videoMessage || msg.message?.documentMessage || msg.message?.audioMessage || msg.message?.stickerMessage

            if (!mediaMsg) {
                return ctx.reply(
                    "Gunakan format:\n.upload (reply file)\natau kirim file dengan caption .upload",
                    { quoted: msg }
                )
            }

            await ctx.sock.sendMessage(ctx.from, {
                react: { text: "⏳", key: msg.key }
            })

            let mediaBuffer
            let downloadSuccess = false

            try {
                const messageToDownload = isQuoted
                    ? {
                        key: {
                            remoteJid: ctx.from,
                            id: contextInfo.stanzaId,
                            participant: contextInfo.participant
                        },
                        message: quoted
                    }
                    : { key: msg.key, message: msg.message }

                mediaBuffer = await downloadMediaMessage(
                    messageToDownload,
                    "buffer",
                    {},
                    { reuploadRequest: ctx.sock.updateMediaMessage }
                )
                downloadSuccess = true
            } catch { }

            if (!downloadSuccess) {
                let type = "document"
                if (mediaMsg.mimetype?.includes("image")) type = "image"
                else if (mediaMsg.mimetype?.includes("video")) type = "video"
                else if (mediaMsg.mimetype?.includes("audio")) type = "audio"

                const stream = await downloadContentFromMessage(mediaMsg, type)
                const chunks = []
                for await (const chunk of stream) chunks.push(chunk)
                mediaBuffer = Buffer.concat(chunks)
            }

            if (!mediaBuffer || !mediaBuffer.length) {
                throw new Error("Gagal mengunduh media")
            }

            const mime = mediaMsg.mimetype || "application/octet-stream"
            const ext = mime.split("/")[1]?.split(";")[0] || "bin"
            const fileName = mediaMsg.fileName || `file-${Date.now()}.${ext}`

            const tempDir = path.join(process.cwd(), "temp")
            if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true })

            tempPath = path.join(tempDir, fileName)
            fs.writeFileSync(tempPath, mediaBuffer)

            const form = new FormData()
            form.append("files[]", fs.createReadStream(tempPath), fileName)

            const response = await axios.post("https://uguu.se/upload", form, {
                headers: form.getHeaders(),
                maxBodyLength: Infinity,
                maxContentLength: Infinity,
                timeout: 120000
            })

            const uploadedFile = response.data?.files?.[0]
            if (!uploadedFile?.url) throw new Error("Upload gagal")

            const fileUrl = uploadedFile.url
            const fileSizeMB = (mediaBuffer.length / (1024 * 1024)).toFixed(2)
            const mentions = []

            await ctx.sock.sendMessage(ctx.from, {
                react: { text: "✅", key: msg.key }
            })

            await ctx.sock.sendMessage(ctx.from, {
                text: `✅ *UPLOAD BERHASIL*\n\n` +
                    `📦 Ukuran : ${fileSizeMB} MB\n` +
                    `🔗 Link : ${fileUrl}\n\n` +
                    `⏳ File akan terhapus otomatis dalam 48 jam`,
                mentions: mentions,
                contextInfo: {
                    mentionedJid: mentions,
                    externalAdReply: {
                        title: `AutoBot v1.0`,
                        body: "Simple • Fast • Reliable",
                        thumbnailUrl: settings.menuImage,
                        sourceUrl: "https://github.com/fareldev-hub",
                        mediaType: 1,
                        renderLargerThumbnail: true
                    }
                }
            }, { quoted: ctx.msg })

        } catch (err) {
            await ctx.sock.sendMessage(ctx.from, {
                react: { text: "❌", key: ctx.msg.key }
            })
            await ctx.reply(`Gagal upload\n${err.message}`, { quoted: ctx.msg })
        } finally {
            if (tempPath && fs.existsSync(tempPath)) fs.unlinkSync(tempPath)
        }
    }
}