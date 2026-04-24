const axios = require("axios");
const fs = require("fs");

module.exports = {
  name: "play",
  alias: ["ytplay", "lagu"],

  async execute(ctx) {
    let waitMsg;

    try {
      const query = ctx.args.join(" ").trim();

      if (!query) {
        return ctx.reply(
          "💡 Gunakan:\n*.play <judul lagu>*\nContoh: *.play Multo Cup of Joe*"
        );
      }

      waitMsg = await ctx.reply("⏳ Waitt Kakk...", {
        quoted: ctx.msg
      });

      const search = await axios.get(
        `https://puruboy-api.vercel.app/api/play/soundcloud?q=${encodeURIComponent(query)}`,
        { timeout: 30000 }
      );

      const result = search.data?.result;
      if (!result || !result.url) {
        return ctx.reply("⚠️ Lagu tidak ditemukan.");
      }

      const { title, duration, url: audioUrl } = result;

      const audioRes = await axios.get(audioUrl, {
        responseType: "arraybuffer",
        timeout: 120000,
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
          "Accept": "*/*"
        },
        maxContentLength: 50 * 1024 * 1024,
        maxBodyLength: 50 * 1024 * 1024
      });

      if (!audioRes.data || audioRes.data.length === 0) {
        throw new Error("Audio data kosong");
      }

      const safeFileName = `${title.replace(/[^a-zA-Z0-9]/g, "_")}.mp3`;

      await ctx.sock.sendMessage(
        ctx.from,
        {
          audio: Buffer.from(audioRes.data),
          mimetype: "audio/mpeg",
          ptt: false,
          fileName: safeFileName
        },
        { quoted: ctx.msg }
      );

    } catch (err) {
      console.error("/play error:", err.message);

      await ctx.reply(
        err.message.includes("download") || err.message.includes("Audio")
          ? "❌ Gagal mengunduh audio. Coba lagu lain atau coba lagi nanti."
          : "❌ Gagal memutar lagu."
      );

    } finally {
      console.log("send audio");
    }
  }
};