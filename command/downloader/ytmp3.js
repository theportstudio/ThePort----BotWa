const fs = require("fs");
const path = require("path");
const axios = require("axios");
const ffmpeg = require("fluent-ffmpeg");

module.exports = {
  name: "ytmp3",
  alias: ["yta", "ytaudio"],

  async execute(ctx) {
    let inputFile = null;
    let outputFile = null;

    try {
      const input = ctx.args.join(" ").trim();

      if (!input) {
        return ctx.reply(
          "Gunakan:\n.ytmp3 <link youtube>"
        );
      }

      const ytRegex = /^https?:\/\/(?:www\.)?(?:youtube\.com\/(?:watch\?v=|embed\/|v\/|shorts\/)|youtu\.be\/)[^"&?\/\s]{11}(?:\S+)?$/;

      if (!ytRegex.test(input)) {
        return ctx.reply("Link YouTube tidak valid");
      }

      await ctx.reply("⏳ Waitt Kakk...");

      const apiRes = await fetch(
        "https://puruboy-api.vercel.app/api/downloader/ytmp3",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            url: input
          })
        }
      );

      const json = await apiRes.json();

      if (
        !json ||
        !json.success ||
        !json.result ||
        !json.result.download_url
      ) {
        throw new Error("Response API tidak valid");
      }

      const { title, download_url } = json.result;

      const tempDir = path.join(process.cwd(), "temp");
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }

      inputFile = path.join(tempDir, `raw-${Date.now()}.mp4`);
      outputFile = path.join(tempDir, `audio-${Date.now()}.mp3`);

      const audioRes = await axios.get(download_url, {
        responseType: "arraybuffer",
        timeout: 120000,
        maxRedirects: 10,
        headers: {
          "User-Agent": "Mozilla/5.0",
          Accept: "*/*"
        }
      });

      fs.writeFileSync(inputFile, Buffer.from(audioRes.data));

      await new Promise((resolve, reject) => {
        ffmpeg(inputFile)
          .audioBitrate(128)
          .toFormat("mp3")
          .on("end", resolve)
          .on("error", reject)
          .save(outputFile);
      });

      await ctx.sock.sendMessage(
        ctx.from,
        {
          audio: fs.readFileSync(outputFile),
          mimetype: "audio/mpeg",
          ptt: false,
          fileName: `${title}.mp3`
        },
        { quoted: ctx.msg }
      );

    } catch (err) {
      console.error("YTMP3 ERROR:", err);
      await ctx.reply("Gagal mengunduh audio.");
    } finally {
      try {
        if (inputFile && fs.existsSync(inputFile)) {
          fs.unlinkSync(inputFile);
        }

        if (outputFile && fs.existsSync(outputFile)) {
          fs.unlinkSync(outputFile);
        }
      } catch {}
    }
  }
};