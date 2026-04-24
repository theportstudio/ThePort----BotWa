const axios = require("axios");

module.exports = {
  name: "cecan",
  alias: ["cewe", "girl"],
  loginRequired: true,

  async execute(ctx) {
    try {
      const validCountries = ["china", "indonesia", "japan", "korea", "thailand", "vietnam"];
      
      const args = ctx.args || ctx.text?.split(" ") || [];
      const country = args[0]?.toLowerCase();

      if (!country) {
        return ctx.reply(`Penggunaan: .cecan <nama_negara>\n\nNegara yang tersedia:\n${validCountries.map(c => `- ${c}`).join("\n")}`);
      }

      if (!validCountries.includes(country)) {
        return ctx.reply(`Negara "${country}" tidak valid!\n\nNegara yang tersedia:\n${validCountries.map(c => `- ${c}`).join("\n")}`);
      }

      await ctx.reply(`Mengambil foto cecan dari ${country.charAt(0).toUpperCase() + country.slice(1)}...`);

      const response = await axios.get(`https://rynekoo-api.hf.space/random/girl/${country}`, {
        timeout: 30000,
        responseType: "arraybuffer"
      });

      const contentType = response.headers["content-type"];
      
      if (contentType && contentType.includes("image")) {
        await ctx.sock.sendMessage(ctx.from, {
          image: Buffer.from(response.data),
          caption: `Random Cecan ${country.charAt(0).toUpperCase() + country.slice(1)} 😍`
        },  { quoted: ctx.msg });
      } else {
        const jsonData = JSON.parse(Buffer.from(response.data).toString());
        
        if (jsonData.url || jsonData.image || jsonData.result) {
          const imageUrl = jsonData.url || jsonData.image || jsonData.result;
          await ctx.sock.sendMessage(ctx.from, {
            image: { url: imageUrl },
            caption: `Random Cecan ${country.charAt(0).toUpperCase() + country.slice(1)} 😍`
          },  { quoted: ctx.msg });
        } else {
          await ctx.reply("Gagal mengambil gambar. Coba lagi nanti.");
        }
      }

    } catch (err) {
      console.error("CECAN ERROR:", err.message);
      await ctx.reply("Gagal mengambil foto cecan. Coba lagi nanti.");
    }
  }
};