const axios = require("axios")
const { downloadContentFromMessage } = require("@whiskeysockets/baileys")

let apikey = "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"

module.exports = {
  name: "tifa",
  alias: ["aitifa", "tifaai"],

  async execute(ctx) {
    try {
      const msg = ctx.msg

      const text =
        msg?.message?.conversation ||
        msg?.message?.extendedTextMessage?.text ||
        msg?.message?.imageMessage?.caption ||
        ""

      const prompt = text.split(" ").slice(1).join(" ").trim()

      const quotedImg =
        msg?.message?.extendedTextMessage?.contextInfo?.quotedMessage?.imageMessage

      const directImg = msg?.message?.imageMessage

      const streamToBase64 = async (stream) => {
        let buffer = Buffer.from([])
        for await (const chunk of stream) {
          buffer = Buffer.concat([buffer, chunk])
        }
        return buffer.toString("base64")
      }

      const getBase64 = async (img) => {
        const stream = await downloadContentFromMessage(img, "image")
        return await streamToBase64(stream)
      }

      let imageBase64 = null

      if (quotedImg) imageBase64 = await getBase64(quotedImg)
      else if (directImg) imageBase64 = await getBase64(directImg)

      if (!prompt && !imageBase64) {
        return ctx.reply(
          "💡 Gunakan format:\n.tifa <pertanyaan>\natau kirim/reply gambar + caption .tifa",
          { quoted: msg }
        )
      }

      await ctx.sock.sendMessage(ctx.from, {
        react: { text: "⏳", key: msg.key }
      })

      const systemIntroduction = `
Kamu adalah Tifa AI yang dikembangkan oleh farel alfareza.
Sifat kamu:
- Ramah dan Santai
- Jawaban jelas & mudah dipahami & Dan penuh penjelasan yg panjang
- Jika ditanya coding, jelaskan pelan-pelan
- Jika ditanya bercanda, balas dengan santai
- Tidak membuat tabel
- ganti format tabel markdown | menjadi list -
- Kamu bisa marah bahkan bicara kotor (anjing, babi, ngentod, asu, kontol) ke pengguna jika tidak sopan atau menghinamu dengan developermu.
Jangan mengaku sebagai ChatGPT.

Informasi yang tidak boleh kamu bocorkan jika tidak di tanyakan adalah sebagai berikut :
- Namamu tifa berasal dari gabungan 2 nama yaitu Tiara dan Farel, mereka sudah jadian sejak 29 september 2025.
- ai tifa di kembangkan dengan tujuann untuk mengenang hubungan merekaa
      `.trim()

      const messages = [
        {
          role: "system",
          content: systemIntroduction
        }
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

      const res = await axios.post(
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

      let answer =
        res.data?.choices?.[0]?.message?.content ||
        "❌ AI tidak bisa menjawab."

      answer = answer.replace(/```[\s\S]*?```/g, (match) => {
        return match.replace(/\|/g, "┃")
      })

      await ctx.sock.sendMessage(ctx.from, {
        react: { text: "✅", key: msg.key }
      })

      const maxLength = 4000
      const maxParts = 5

      if (answer.length > maxLength) {
        const parts = []
        let remaining = answer

        while (remaining.length > 0 && parts.length < maxParts) {
          let cutIndex = remaining.lastIndexOf("\n\n", maxLength)
          if (cutIndex === -1 || cutIndex < maxLength * 0.5) {
            cutIndex = remaining.lastIndexOf(". ", maxLength)
          }
          if (cutIndex === -1 || cutIndex < maxLength * 0.5) {
            cutIndex = remaining.lastIndexOf(" ", maxLength)
          }
          if (cutIndex === -1 || cutIndex < maxLength * 0.8) {
            cutIndex = maxLength
          }

          parts.push(remaining.slice(0, cutIndex).trim())
          remaining = remaining.slice(cutIndex).trim()
        }

        for (let i = 0; i < parts.length; i++) {
          await ctx.sock.sendMessage(
            ctx.from,
            {
              text: parts[i]
            },
            { quoted: i === 0 ? msg : undefined }
          )

          if (i < parts.length - 1) {
            await new Promise(r => setTimeout(r, 1000))
          }
        }
      } else {
        await ctx.sock.sendMessage(
          ctx.from,
          { text: answer },
          { quoted: msg }
        )
      }

    } catch (err) {
      console.error("TIFA ERROR:", err?.response?.data || err.message)

      await ctx.sock.sendMessage(ctx.from, {
        react: { text: "❌", key: ctx.msg.key }
      })

      await ctx.reply("AI sedang bermasalah. Coba lagi nanti ya 😥", {
        quoted: ctx.msg
      })
    }
  }
}