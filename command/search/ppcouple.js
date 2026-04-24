const axios = require("axios")

module.exports = {
  name: "ppcouple",
  alias: ["ppc", "couple"],
  loginRequired: true,

  async execute(ctx) {
    try {
      const isIndo = (ctx.from?.language_code || "").startsWith("id")

      const waitMsg = await ctx.sock.sendMessage(
        ctx.from,
        { text: isIndo ? "⏳ Mengambil PP Couple..." : "⏳ Fetching couple profile pictures..." },
        { quoted: ctx.msg }
      )

      const { data } = await axios.get("https://api.deline.web.id/random/ppcouple", {
        timeout: 10000
      })

      if (!data?.result?.cowo || !data?.result?.cewe) {
        throw new Error("API tidak mengembalikan gambar valid")
      }

      const cowoImg = data.result.cowo
      const ceweImg = data.result.cewe

      await ctx.sock.sendMessage(
        ctx.from,
        { image: { url: cowoImg }, caption: "👦 Cowok" },
        { quoted: ctx.msg }
      )

      await ctx.sock.sendMessage(
        ctx.from,
        { image: { url: ceweImg }, caption: "👧 Cewek" },
        { quoted: ctx.msg }
      )

      try {
        await ctx.sock.sendMessage(ctx.from, { delete: waitMsg.key })
      } catch (_) {}

    } catch (err) {
      console.error("❌ PPCOUPLE ERROR:", err)
      ctx.sock.sendMessage(
        ctx.from,
        {
          text: (ctx.from?.language_code || "").startsWith("id")
            ? "❌ Gagal mengambil PP Couple 😥"
            : "❌ Failed to fetch couple profile pictures 😥"
        },
        { quoted: ctx.msg }
      )
    }
  }
}