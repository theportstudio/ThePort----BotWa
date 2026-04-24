const axios = require("axios");

module.exports = {
  name: "instagram",
  alias: ["ig", "igdl"],

  async execute(ctx) {
    try {
      const input = ctx.args.join(" ").trim();

      if (!input) {
        return ctx.reply(
          "💡 Gunakan:\n*.instagram <url>*\nContoh: *.instagram https://www.instagram.com/reel/xxxxx*"
        );
      }

      const igRegex = /(https?:\/\/)?(www\.)?(instagram\.com|instagr\.am)\/(p|reel|tv|stories)\/([^\/\?]+)/;
      if (!igRegex.test(input)) {
        return ctx.reply("❌ Link Instagram tidak valid!");
      }

      await ctx.reply("⏳ Waitt Kakk...", { quoted: ctx.msg });

      const apiUrl = `https://api.deline.web.id/downloader/ig?url=${encodeURIComponent(input)}`;
      const res = await axios.get(apiUrl);
      const data = res.data;

      if (!data?.status || !data?.result?.media) {
        throw new Error("Data kosong dari API");
      }

      const media = data.result.media;
      const images = media.images || [];
      const videos = media.videos || [];
      const total = images.length + videos.length;
      let sentCount = 0;

      if (total === 0) {
        throw new Error("Tidak ada media ditemukan");
      }

      for (let i = 0; i < videos.length; i++) {
        const videoUrl = videos[i];
        const isLast = images.length === 0 && i === videos.length - 1;

        try {
          await ctx.sock.sendMessage(
            ctx.from,
            { text: "📥 Mengunduh video..." }
          );

          const videoRes = await axios.get(videoUrl, {
            responseType: "arraybuffer",
            timeout: 120000,
            headers: { "User-Agent": "Mozilla/5.0" }
          });

          const caption = isLast ? `✅ Selesai mengirim ${total} media.` : undefined;

          await ctx.sock.sendMessage(
            ctx.from,
            {
              video: Buffer.from(videoRes.data),
              mimetype: "video/mp4",
              caption: caption
            },
            { quoted: ctx.msg }
          );

          sentCount++;
        } catch (e) {
          console.warn("Gagal kirim video:", e.message);
        }
      }

      if (images.length > 0) {
        await ctx.sock.sendMessage(
          ctx.from,
          { text: "📷 Mengirim foto..." }
        );

        for (let i = 0; i < images.length; i++) {
          const imgUrl = images[i];
          const isLast = i === images.length - 1 && videos.length === 0;
          const caption = isLast ? `✅ Selesai mengirim ${total} media.` : undefined;

          try {
            await ctx.sock.sendMessage(
              ctx.from,
              {
                image: { url: imgUrl },
                caption: caption
              },
              { quoted: i === 0 ? ctx.msg : undefined }
            );

            sentCount++;
          } catch (e) {
            console.warn("Gagal kirim gambar:", e.message);
          }

          if (i < images.length - 1) {
            await new Promise(r => setTimeout(r, 1000));
          }
        }
      }

    } catch (err) {
      console.warn("Error utama:", err.message);
      await ctx.reply("⚠️ Gagal memproses konten Instagram. Coba lagi nanti.");
    }
  }
};