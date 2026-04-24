const axios = require("axios")

module.exports = {
  name: "bmkg",
  alias: ["gempa", "earthquake"],
  loginRequired: true,

  async execute(ctx) {
    try {
      await ctx.sock.sendMessage(
        ctx.from,
        { text: "⏳ Mengambil data gempa terkini..." },
        { quoted: ctx.msg }
      )

      const apiUrl = "https://data.bmkg.go.id/DataMKG/TEWS/autogempa.json"
      const result = await axios.get(apiUrl)
      const data = result.data?.Infogempa?.gempa

      if (!data) {
        return ctx.sock.sendMessage(
          ctx.from,
          { text: "❌ Data gempa tidak ditemukan." },
          { quoted: ctx.msg }
        )
      }

      const shakemapUrl = "https://data.bmkg.go.id/DataMKG/TEWS/" + data.Shakemap

      const caption = 
`🌏 *Gempa Terkini BMKG*
📅 Tanggal : ${data.Tanggal}
⏰ Jam     : ${data.Jam}
💥 Magnitude : ${data.Magnitude}
📏 Kedalaman : ${data.Kedalaman}
📍 Wilayah   : ${data.Wilayah}
🌀 Dirasakan : ${data.Dirasakan || "-"}

📌 Coordinates: ${data.Lintang}, ${data.Bujur}`

      if (shakemapUrl) {
        await ctx.sock.sendMessage(
          ctx.from,
          { image: { url: shakemapUrl }, caption },
          { quoted: ctx.msg }
        )
      } else {
        // fallback jika tidak ada gambar
        await ctx.sock.sendMessage(
          ctx.from,
          { text: caption },
          { quoted: ctx.msg }
        )
      }

    } catch (err) {
      console.error("❌ BMKG ERROR:", err)
      await ctx.sock.sendMessage(
        ctx.from,
        { text: "⚠️ Gagal mengambil data gempa. Coba lagi nanti." },
        { quoted: ctx.msg }
      )
    }
  }
}