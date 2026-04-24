const axios = require("axios")
let apikey = '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'

module.exports = {
  name: "ai",
  alias: ["ask", "chatgpt"],

  async execute(ctx) {
    try {
      const text =
        ctx.msg?.message?.conversation ||
        ctx.msg?.message?.extendedTextMessage?.text ||
        ""

      const prompt = text.split(" ").slice(1).join(" ").trim()

      if (!prompt) {
        return ctx.reply(
          "💡 Gunakan format:\n.ai <pertanyaan>\n\nContoh:\n.ai jelaskan black hole",
          { quoted: ctx.msg }
        )
      }

      await ctx.sock.sendMessage(ctx.from, {
        react: { text: "⏳", key: ctx.msg.key }
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

      const res = await axios.post(
        "https://api.groq.com/openai/v1/chat/completions",
        {
          model: "openai/gpt-oss-120b",
          messages: [
            {
              role: "system",
              content: systemIntroduction
            },
            {
              role: "user",
              content: prompt
            }
          ],
          temperature: 0.7,
          max_tokens: 4096
        },
        {
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${apikey}`
          },
          timeout: 120000
        }
      )

      let answer =
        res.data?.choices?.[0]?.message?.content ||
        "❌ AI tidak bisa menjawab."

      answer = answer.replace(/```[\s\S]*?```/g, (match) => {
        return match.replace(/\|/g, "┃")
      })

      await ctx.sock.sendMessage(ctx.from, {
        react: { text: "✅", key: ctx.msg.key }
      })

      const maxLength = 4000
      const maxParts = 5

      if (answer.length > maxLength) {
        const parts = []
        let remaining = answer
        
        while (remaining.length > 0 && parts.length < maxParts) {
          if (remaining.length <= maxLength) {
            parts.push(remaining)
            break
          }
          
          let cutIndex = remaining.lastIndexOf('\n\n', maxLength)
          if (cutIndex === -1 || cutIndex < maxLength * 0.5) {
            cutIndex = remaining.lastIndexOf('. ', maxLength)
          }
          if (cutIndex === -1 || cutIndex < maxLength * 0.5) {
            cutIndex = remaining.lastIndexOf(' ', maxLength)
          }
          if (cutIndex === -1 || cutIndex < maxLength * 0.8) {
            cutIndex = maxLength
          }
          
          parts.push(remaining.slice(0, cutIndex).trim())
          remaining = remaining.slice(cutIndex).trim()
        }
        
        if (remaining.length > 0) {
          parts.push("")
        }
        
        for (let i = 0; i < parts.length; i++) {
          const prefix = parts.length > 1 ? `*Bagian ${i + 1}/${parts.length}*\n\n` : ""
          await ctx.sock.sendMessage(
            ctx.from,
            {
              text: `${prefix}${parts[i]}`
            },
            { quoted: i === 0 ? ctx.msg : undefined }
          )
          
          if (i < parts.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 1000))
          }
        }
      } else {
        await ctx.sock.sendMessage(
          ctx.from,
          {
            text: answer
          },
          { quoted: ctx.msg }
        )
      }

    } catch (err) {
      console.error("AI ERROR:", err?.response?.data || err.message)
      
      await ctx.sock.sendMessage(ctx.from, {
        react: { text: "❌", key: ctx.msg.key }
      })

      await ctx.reply(
        "⚠️ AI sedang bermasalah. Coba lagi nanti ya 😥",
        { quoted: ctx.msg }
      )
    }
  }
}