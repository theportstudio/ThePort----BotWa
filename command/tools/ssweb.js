const axios = require("axios");

module.exports = {
  name: "ssweb",
  alias: ["screenshotweb", "webss"],
  loginRequired: true,

  async execute(ctx) {
    const text =
      ctx.msg?.message?.conversation ||
      ctx.msg?.message?.extendedTextMessage?.text ||
      "";

    const args = text.split(" ").slice(1);
    let url = args[0];

    if (!url) {
      return ctx.reply("⚠️ Gunakan format:\n.ssweb <URL>", { quoted: ctx.msg });
    }

    if (!url.startsWith("http")) {
      url = "https://" + url;
    }

    await ctx.reply("⏳ Sedang mengambil screenshot...", { quoted: ctx.msg });

    try {
      const apiUrl = `https://api.deline.web.id/tools/screenshot?url=${encodeURIComponent(url)}`;
      
      const res = await axios.get(apiUrl, { 
        responseType: "arraybuffer",
        timeout: 45000,
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        }
      });

      const imageBuffer = Buffer.from(res.data);

      if (imageBuffer.length < 100) {
        throw new Error("File yang diterima terlalu kecil atau bukan gambar.");
      }

      await ctx.sock.sendMessage(
        ctx.from,
        { image: imageBuffer, caption: `📸 *Screenshot Berhasil*\n🌐 URL: ${url}` },
        { quoted: ctx.msg }
      );

    } catch (err) {
      console.error("SSWEB ERROR:", err.message);

      try {
        const fallbackUrl = `https://image.thum.io/get/width/1200/noanimate/${url}`;
        
        await ctx.sock.sendMessage(
          ctx.from,
          { 
            image: { url: fallbackUrl }, 
            caption: `✨ Screenshot (Fallback) untuk: ${url}` 
          },
          { quoted: ctx.msg }
        );
      } catch (fallbackErr) {
        await ctx.reply(`❌ Gagal mengambil screenshot.\nError: ${err.message}`, { quoted: ctx.msg });
      }
    }
  },
};