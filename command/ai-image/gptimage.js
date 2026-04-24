const fetch = (...args) =>
  import("node-fetch").then(({ default: fetch }) => fetch(...args));
const fs = require("fs");
const path = require("path");

const API_TOKEN = "pk_k9zs4cpkEkkfHfL3";

module.exports = {
  name: "gptimage",
  alias: ["imggpt", "gptimg", "img"],
  category: "tools",

  async execute(ctx) {
    let tempFiles = [];
    
    try {
      const prompt = ctx.args.join(" ");
      
      if (!prompt) {
        return await ctx.reply("Masukkan prompt untuk generate gambar.\nContoh: .gptimage a beautiful sunset over mountains");
      }

      await ctx.reply("Sedang membuat gambar...");

      const seed = Math.floor(Math.random() * 1e6);
      const encodedPrompt = encodeURIComponent(prompt);
      const url = `https://gen.pollinations.ai/image/${encodedPrompt}?seed=${seed}&width=1024&height=1024&nologo=true&model=gptimage `;

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${API_TOKEN}`,
          'Accept': 'image/png,image/jpeg,image/webp,*/*'
        },
        timeout: 60000
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP Error: ${response.status} - ${errorText}`);
      }

      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      if (buffer.length < 1000) {
        throw new Error("Data yang diterima bukan gambar valid.");
      }

      const tempDir = path.join(process.cwd(), "temp");
      if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

      const imagePath = path.join(tempDir, `gptimage-${Date.now()}.png`);
      fs.writeFileSync(imagePath, buffer);
      tempFiles.push(imagePath);

      await ctx.sock.sendMessage(
        ctx.from,
        {
          image: fs.readFileSync(imagePath),
          caption: `AI Image Generator\n\nPrompt: ${prompt}\nSeed: ${seed}\nModel: gptimage `
        },
        { quoted: ctx.msg }
      );

    } catch (err) {
      console.error("gptimage ERROR:", err.message);
      
      await ctx.reply(`Gagal membuat gambar.\n\nPesan: ${err.message}\nSaran: Coba gunakan kata kunci bahasa Inggris atau ulangi beberapa saat lagi.`);
    } finally {
      for (const file of tempFiles) {
        if (fs.existsSync(file)) {
          try { fs.unlinkSync(file); } catch {}
        }
      }
    }
  }
};