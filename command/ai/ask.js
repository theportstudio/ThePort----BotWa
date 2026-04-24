const axios = require("axios")
const { downloadContentFromMessage } = require("@whiskeysockets/baileys")

let apikey = "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"

const callAI = async (messages, model) => {
  return await axios.post(
    "https://api.groq.com/openai/v1/chat/completions",
    {
      model,
      messages,
      temperature: 0.7,
      max_tokens: 4096
    },
    {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apikey}`
      }
    }
  )
}

const streamToBase64 = async (stream) => {
  let buffer = Buffer.from([])
  for await (const chunk of stream) {
    buffer = Buffer.concat([buffer, chunk])
  }
  return buffer.toString("base64")
}

const getImageBase64 = async (imgMsg) => {
  const stream = await downloadContentFromMessage(imgMsg, "image")
  return await streamToBase64(stream)
}

const isTruncated = (text) => {
  if (!text) return false
  const last = text.trim().slice(-1)
  return ![".", "!", "?", "】", "）"].includes(last)
}

module.exports = {
  name: "theport",
  alias: ["ask", "chatgpt", "ai"],

  async execute(ctx) {
    try {
      const msg = ctx.msg

      const text =
        msg?.message?.conversation ||
        msg?.message?.extendedTextMessage?.text ||
        msg?.message?.imageMessage?.caption ||
        ""

      const prompt = text.split(" ").slice(1).join(" ").trim()

      if (!prompt && !msg?.message?.imageMessage) {
        return ctx.reply("Gunakan:\n.theport <pertanyaan>", { quoted: msg })
      }

      await ctx.sock.sendMessage(ctx.from, {
        react: { text: "⏳", key: msg.key }
      })

      const quotedImg =
        msg?.message?.extendedTextMessage?.contextInfo?.quotedMessage?.imageMessage

      const directImg = msg?.message?.imageMessage

      let imageBase64 = null

      if (quotedImg) imageBase64 = await getImageBase64(quotedImg)
      else if (directImg) imageBase64 = await getImageBase64(directImg)

      const systemPrompt = `
Kamu adalah ThePort AI. yg di kembangkan oleh Farel Alfareza
web developer kamu : fareldev.vercel.app

- Jawab jelas dan akurat
- Bisa membaca gambar jika ada
- Tidak membuat tabel
- Gunakan list jika perlu
      `.trim()

      const messages = [
        { role: "system", content: systemPrompt }
      ]

      if (imageBase64) {
        messages.push({
          role: "user",
          content: [
            {
              type: "text",
              text: prompt || "Jelaskan gambar ini"
            },
            {
              type: "image_url",
              image_url: {
                url: `data:image/jpeg;base64,${imageBase64}`
              }
            }
          ]
        })
      } else {
        messages.push({
          role: "user",
          content: prompt
        })
      }

      const model = imageBase64
        ? "meta-llama/llama-4-scout-17b-16e-instruct"
        : "llama-3.3-70b-versatile"

      let fullAnswer = ""
      let loop = 0
      const maxLoop = 5

      let currentMessages = [...messages]

      while (loop < maxLoop) {
        const res = await callAI(currentMessages, model)

        const content = res.data?.choices?.[0]?.message?.content || ""

        fullAnswer += content

        if (!isTruncated(content)) break

        currentMessages.push({
          role: "assistant",
          content
        })

        currentMessages.push({
          role: "user",
          content: "lanjutkan tanpa mengulang"
        })

        loop++
      }

      await ctx.sock.sendMessage(ctx.from, {
        react: { text: "✅", key: msg.key }
      })

      const maxLength = 4000

      if (fullAnswer.length > maxLength) {
        const parts = []
        let text = fullAnswer

        while (text.length > 0) {
          let cut = text.lastIndexOf("\n", maxLength)
          if (cut === -1) cut = maxLength

          parts.push(text.slice(0, cut))
          text = text.slice(cut)
        }

        for (let i = 0; i < parts.length; i++) {
          await ctx.sock.sendMessage(
            ctx.from,
            { text: parts[i] },
            { quoted: i === 0 ? msg : null }
          )
        }
      } else {
        await ctx.sock.sendMessage(
          ctx.from,
          { text: fullAnswer },
          { quoted: msg }
        )
      }

    } catch (err) {
      console.error("THEPORT ERROR:", err?.response?.data || err.message)

      await ctx.sock.sendMessage(ctx.from, {
        react: { text: "❌", key: ctx.msg.key }
      })

      await ctx.reply("AI error, coba lagi nanti.", {
        quoted: ctx.msg
      })
    }
  }
}