const axios = require("axios")
const fs = require("fs")
const path = require("path")
const ffmpeg = require("fluent-ffmpeg")
const ffmpegPath = require("ffmpeg-static")

ffmpeg.setFfmpegPath(ffmpegPath)

const groqApiKey = "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"
const elevenApiKey = "sk_fa52409b827cb930110825455ac5e415f47468c93972e17b"

const ELEVEN_VOICE_ID = "JBFqnCBsd6RMkjVDRZzb"

module.exports = {
  name: "say",
  alias: ["vnai", "vn"],

  async execute(ctx) {
    let audioPath, convertedAudioPath

    try {
      const text =
        ctx.msg?.message?.conversation ||
        ctx.msg?.message?.extendedTextMessage?.text ||
        ""

      const prompt = text.split(" ").slice(1).join(" ").trim()
      if (!prompt) {
        return ctx.reply("Gunakan format:\n.vn <teks>", { quoted: ctx.msg })
      }

      await ctx.sock.sendMessage(ctx.from, {
        react: { text: "⏳", key: ctx.msg.key }
      })

      // === GROQ CHAT ===
      const res = await axios.post(
        "https://api.groq.com/openai/v1/chat/completions",
        {
          model: "openai/gpt-oss-120b",
          messages: [
            { role: "system", content: `jawab santai, jelas, tanpa simbol aneh
Kamu adalah Tifa AI yang dikembangkan oleh farel alfareza.
Sifat kamu:
- Ramah dan Santai
- Jawaban jelas & mudah dipahami & Dan penuh penjelasan yg panjang
- Jika ditanya coding, jelaskan pelan-pelan
- Jika ditanya bercanda, balas dengan santai
- Tidak membuat tabel
- Kamu bisa marah bahkan bicara kotor (anjing, babi, ngentod, asu, kontol) ke pengguna jika tidak sopan atau menghinamu dengan developermu.
Jangan mengaku sebagai ChatGPT.

Informasi yang tidak boleh kamu bocorkan j8ka tidak di tanyakan adalah sebagai berikut :
- Namamu tifa berasal dari gabungan 2 nama yaitu Tiara dan Farel, mereka sudah jadian sejak 29 september 2025.
- ai tifa di kembangkan dengan tujuann untuk mengenang hubungan merekaa

kamu memberikan jawaban minimal sampau 500 kata saja
            ` },
            { role: "user", content: prompt }
          ],
          temperature: 0.7,
          max_tokens: 300
        },
        {
          headers: {
            Authorization: `Bearer ${groqApiKey}`,
            "Content-Type": "application/json"
          }
        }
      )

      const answer = res.data.choices[0].message.content

      const tempDir = path.join(process.cwd(), "temp")
      if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir)

      audioPath = path.join(tempDir, `tts-${Date.now()}.mp3`)
      convertedAudioPath = path.join(tempDir, `tts-${Date.now()}.opus`)

      // === ELEVENLABS TTS ===
      const ttsRes = await axios.post(
        `https://api.elevenlabs.io/v1/text-to-speech/${ELEVEN_VOICE_ID}`,
        {
          text: answer,
          model_id: "eleven_multilingual_v2",
          voice_settings: {
            stability: 0.45,
            similarity_boost: 0.75
          }
        },
        {
          headers: {
            "xi-api-key": elevenApiKey,
            "Content-Type": "application/json"
          },
          responseType: "arraybuffer"
        }
      )

      fs.writeFileSync(audioPath, ttsRes.data)

      // Convert ke OPUS (WhatsApp VN)
      await new Promise((resolve, reject) => {
        ffmpeg(audioPath)
          .audioCodec("libopus")
          .format("opus")
          .on("end", resolve)
          .on("error", reject)
          .save(convertedAudioPath)
      })

      await ctx.sock.sendMessage(
        ctx.from,
        {
          audio: fs.readFileSync(convertedAudioPath),
          mimetype: "audio/ogg; codecs=opus",
          ptt: true
        },
        { quoted: ctx.msg }
      )

    } catch (e) {
      console.error("TTS ERROR:", e.message)
      await ctx.reply("VN gagal dibuat")
    } finally {
      if (audioPath && fs.existsSync(audioPath)) fs.unlinkSync(audioPath)
      if (convertedAudioPath && fs.existsSync(convertedAudioPath)) fs.unlinkSync(convertedAudioPath)
    }
  }
}