module.exports = {
  name: "pinterest",
  alias: ["pin"],
  loginRequired: true,

  async execute(ctx) {
    let waitMsg;
    try {
      const query = ctx.args.join(" ").trim();
      if (!query) {
        return ctx.reply(
          "💡 Gunakan:\n*.pinterest <kata kunci>*\nContoh: *.pinterest pemandangan malam*"
        );
      }

      waitMsg = await ctx.reply("⏳ Mencari gambar di Pinterest...");

      const apiUrl =
        "https://api.siputzx.my.id/api/s/pinterest?type=image&query=" +
        encodeURIComponent(query);

      const res = await fetch(apiUrl);
      if (!res.ok) throw new Error("API Pinterest gagal");

      const json = await res.json();
      const results = json?.data;
      if (!Array.isArray(results) || results.length === 0) {
        throw new Error("Gambar tidak ditemukan");
      }

      const randomIndex = Math.floor(Math.random() * results.length);
      const imageUrl = results[randomIndex].image_url || results[randomIndex].pin;

      if (!imageUrl) {
        throw new Error("URL gambar tidak valid");
      }

      await ctx.sock.sendMessage(
        ctx.from,
        {
          image: { url: imageUrl },
          caption: `✨ *Hasil Pinterest*
🔎 Kata kunci: *${query}*
📌 Sumber: Pinterest`,
        },
        { quoted: ctx.msg }
      );

    } catch (err) {
      console.error("❌ Pinterest Error:", err.message);

      await ctx.reply(
        "⚠️ Gagal mengambil gambar dari Pinterest. Coba kata kunci lain."
      );
    }
  }
};