const axios = require("axios")
const { createCanvas } = require("@napi-rs/canvas")

function roundRect(ctx, x, y, w, h, r) {
  if (ctx.roundRect) {
    ctx.roundRect(x, y, w, h, r)
  } else {
    ctx.beginPath()
    ctx.moveTo(x + r, y)
    ctx.lineTo(x + w - r, y)
    ctx.quadraticCurveTo(x + w, y, x + w, y + r)
    ctx.lineTo(x + w, y + h - r)
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
    ctx.lineTo(x + r, y + h)
    ctx.quadraticCurveTo(x, y + h, x, y + h - r)
    ctx.lineTo(x, y + r)
    ctx.quadraticCurveTo(x, y, x + r, y)
    ctx.closePath()
  }
}

const CRYPTO_MAP = {
  btc: "bitcoin",
  eth: "ethereum",
  bnb: "binancecoin",
  sol: "solana",
  xrp: "ripple",
  ada: "cardano",
  doge: "dogecoin",
  dot: "polkadot",
  avax: "avalanche-2",
  matic: "matic-network"
}

module.exports = {
  name: "cryptoview",
  alias: ["crypto", "coin"],
  loginRequired: true,

  async execute(ctx) {
    try {
      const input = ctx.args[0]
      const symbol = input ? input.toLowerCase() : "btc"
      const id = CRYPTO_MAP[symbol] || symbol

      const url = `https://api.coingecko.com/api/v3/coins/${id}?localization=false&sparkline=true`

      const { data } = await axios.get(url, {
        timeout: 15000,
        headers: { "User-Agent": "Mozilla/5.0" }
      })

      const md = data.market_data
      const spark = md.sparkline_7d.price

      const width = 1200
      const height = 900
      const canvas = createCanvas(width, height)
      const c = canvas.getContext("2d")

      const bg = c.createLinearGradient(0, 0, width, height)
      bg.addColorStop(0, "#0a0e27")
      bg.addColorStop(1, "#121a33")
      c.fillStyle = bg
      c.fillRect(0, 0, width, height)

      const padding = 60

      c.fillStyle = "rgba(255,255,255,0.05)"
      roundRect(c, padding, padding, width - padding * 2, height - padding * 2, 25)
      c.fill()

      c.fillStyle = "#ffffff"
      c.font = "bold 42px Arial"
      c.fillText(`${data.name} (${data.symbol.toUpperCase()})`, 90, 120)

      c.font = "bold 64px Arial"
      c.fillText(`$${md.current_price.usd.toLocaleString()}`, 90, 200)

      const change = md.price_change_percentage_24h || 0
      c.fillStyle = change >= 0 ? "#22c55e" : "#ef4444"
      c.font = "bold 28px Arial"
      c.fillText(`${change >= 0 ? "▲" : "▼"} ${change.toFixed(2)}% (24H)`, 90, 250)

      const chartX = 90
      const chartY = 300
      const chartW = width - 180
      const chartH = 260

      const max = Math.max(...spark)
      const min = Math.min(...spark)

      c.strokeStyle = "rgba(255,255,255,0.08)"
      for (let i = 0; i <= 4; i++) {
        const y = chartY + (chartH / 4) * i
        c.beginPath()
        c.moveTo(chartX, y)
        c.lineTo(chartX + chartW, y)
        c.stroke()
      }

      const gradient = c.createLinearGradient(0, chartY, 0, chartY + chartH)
      gradient.addColorStop(0, "rgba(34,197,94,0.25)")
      gradient.addColorStop(1, "rgba(34,197,94,0.02)")

      c.beginPath()
      c.moveTo(chartX, chartY + chartH)

      spark.forEach((p, i) => {
        const x = chartX + (i / (spark.length - 1)) * chartW
        const y = chartY + chartH - ((p - min) / (max - min || 1)) * chartH
        c.lineTo(x, y)
      })

      c.lineTo(chartX + chartW, chartY + chartH)
      c.closePath()
      c.fillStyle = gradient
      c.fill()

      c.strokeStyle = "#22c55e"
      c.lineWidth = 3
      c.beginPath()

      spark.forEach((p, i) => {
        const x = chartX + (i / (spark.length - 1)) * chartW
        const y = chartY + chartH - ((p - min) / (max - min || 1)) * chartH
        i === 0 ? c.moveTo(x, y) : c.lineTo(x, y)
      })

      c.stroke()

      const stats = [
        ["Market Cap", md.market_cap.usd],
        ["Volume 24H", md.total_volume.usd],
        ["High 24H", md.high_24h.usd],
        ["Low 24H", md.low_24h.usd],
        ["Circulating", md.circulating_supply],
        ["ATH", md.ath.usd]
      ]

      const startX = 90
      const startY = 600
      const colW = 340
      const rowH = 85

      c.font = "16px Arial"

      stats.forEach((s, i) => {
        const col = i % 3
        const row = Math.floor(i / 3)

        const x = startX + col * colW
        const y = startY + row * rowH

        c.fillStyle = "#94a3b8"
        c.font = "16px Arial"
        c.fillText(s[0], x, y)

        c.fillStyle = "#ffffff"
        c.font = "bold 20px Arial"

        const value =
          typeof s[1] === "number"
            ? `$${s[1].toLocaleString()}`
            : String(s[1])

        c.fillText(value, x, y + 26)
      })

      const caption = `📊 *Crypto View: ${data.name} (${data.symbol.toUpperCase()})*

💰 Price: $${md.current_price.usd.toLocaleString()}
📈 24H: ${change >= 0 ? "+" : ""}${change.toFixed(2)}%

🏆 Market Cap: $${(md.market_cap.usd || 0).toLocaleString()} (#${md.market_cap_rank || "N/A"})
💎 Volume: $${(md.total_volume.usd || 0).toLocaleString()}
🔺 High: $${(md.high_24h.usd || 0).toLocaleString()}
🔻 Low: $${(md.low_24h.usd || 0).toLocaleString()}

🔄 Supply: ${(md.circulating_supply || 0).toLocaleString()} ${data.symbol.toUpperCase()}
📦 Total: ${(md.total_supply || 0).toLocaleString()} ${data.symbol.toUpperCase()}

🚀 ATH: $${(md.ath.usd || 0).toLocaleString()}
💥 ATL: $${(md.atl.usd || 0).toLocaleString()}

⏰ ${new Date().toLocaleString()}`

      await ctx.sock.sendMessage(
        ctx.from,
        {
          image: canvas.toBuffer("image/png"),
          caption
        },
        { quoted: ctx.msg }
      )

    } catch (err) {
      console.error(err)
      await ctx.sock.sendMessage(ctx.from, {
        text: "❌ gagal memuat crypto"
      }, { quoted: ctx.msg })
    }
  }
}