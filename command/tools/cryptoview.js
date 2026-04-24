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
  matic: "matic-network",
  link: "chainlink",
  ltc: "litecoin",
  uni: "uniswap",
  atom: "cosmos",
  etc: "ethereum-classic",
  xlm: "stellar",
  bch: "bitcoin-cash",
  algo: "algorand",
  vet: "vechain",
  fil: "filecoin",
  trx: "tron",
  eos: "eos",
  aave: "aave",
  sushi: "sushi",
  comp: "compound-governance-token",
  yfi: "yearn-finance",
  mkr: "maker",
  snx: "havven",
  crv: "curve-dao-token",
  bat: "basic-attention-token",
  mana: "decentraland",
  sand: "the-sandbox",
  axs: "axie-infinity",
  ftm: "fantom",
  near: "near",
  egld: "elrond-erd-2",
  theta: "theta-token",
  grt: "the-graph",
  enj: "enjincoin",
  chz: "chiliz",
  hot: "holotoken",
  zil: "zilliqa",
  one: "harmony",
  celo: "celo",
  ankr: "ankr",
  rvn: "ravencoin",
  zec: "zcash",
  dash: "dash",
  neo: "neo",
  xmr: "monero",
  iota: "iota",
  waves: "waves",
  ksm: "kusama",
  omg: "omisego",
  zrx: "0x",
  rep: "augur",
  knc: "kyber-network-crystal",
  bal: "balancer",
  yfii: "dfi-money",
  ren: "republic-protocol",
  uma: "uma",
  band: "band-protocol",
  lrc: "loopring",
  ocean: "ocean-protocol",
  srm: "serum",
  ray: "raydium",
  step: "step-finance",
  mango: "mango-markets",
  fida: "bonfida",
  maps: "maps",
  oxygen: "oxygen",
  media: "media-network",
  audius: "audius",
  kin: "kin"
}

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

module.exports = {
  name: "cryptoview",
  alias: ["crypto", "coin"],
  loginRequired: true,

  async execute(ctx) {
    try {
      const input = ctx.args[0]
      let symbol
      
      if (!input) {
        const keys = Object.keys(CRYPTO_MAP)
        const randomKey = keys[Math.floor(Math.random() * keys.length)]
        symbol = randomKey
      } else {
        symbol = input.toLowerCase()
      }

      const id = CRYPTO_MAP[symbol] || symbol
      const url = `https://api.coingecko.com/api/v3/coins/${id}?localization=false&sparkline=true`

      await ctx.sock.sendMessage(ctx.from, { text: "⏳ Mengambil data crypto..." }, { quoted: ctx.msg })

      const { data } = await axios.get(url, { timeout: 15000, headers: { "User-Agent": "Mozilla/5.0" } })

      if (!data.market_data?.sparkline_7d?.price) {
        throw new Error("Data market tidak valid")
      }

      const spark = data.market_data.sparkline_7d.price
      const md = data.market_data

      const width = 1400
      const height = 800
      const canvas = createCanvas(width, height)
      const c = canvas.getContext("2d")

      const bg = c.createLinearGradient(0, 0, width, height)
      bg.addColorStop(0, "#0a0e27")
      bg.addColorStop(1, "#1a1f3a")
      c.fillStyle = bg
      c.fillRect(0, 0, width, height)

      for (let i = 0; i < 100; i++) {
        c.fillStyle = `rgba(255,255,255,${Math.random() * 0.03})`
        c.beginPath()
        c.arc(Math.random() * width, Math.random() * height, Math.random() * 2, 0, Math.PI * 2)
        c.fill()
      }

      c.fillStyle = "rgba(255,255,255,0.05)"
      roundRect(c, 40, 40, width - 80, height - 80, 30)
      c.fill()

      c.fillStyle = "#ffffff"
      c.font = "bold 48px Arial"
      c.fillText(`${data.name} (${data.symbol.toUpperCase()})`, 80, 110)

      c.font = "bold 72px Arial"
      c.fillText(`$${md.current_price.usd.toLocaleString()}`, 80, 190)

      const change24h = md.price_change_percentage_24h || 0
      const change7d = md.price_change_percentage_7d || 0
      const change30d = md.price_change_percentage_30d || 0
      const up = change24h >= 0

      c.fillStyle = up ? "#22c55e" : "#ef4444"
      c.font = "bold 32px Arial"
      c.fillText(`${up ? "▲" : "▼"} ${change24h.toFixed(2)}% (24H)`, 80, 240)

      c.fillStyle = "#64748b"
      c.font = "24px Arial"
      c.fillText(`7D: ${change7d >= 0 ? "+" : ""}${change7d.toFixed(2)}% | 30D: ${change30d >= 0 ? "+" : ""}${change30d.toFixed(2)}%`, 80, 280)

      const max = Math.max(...spark)
      const min = Math.min(...spark)
      const chartX = 80
      const chartY = 340
      const chartW = width - 160
      const chartH = 280

      c.strokeStyle = "rgba(255,255,255,0.1)"
      c.lineWidth = 1
      for (let i = 0; i <= 4; i++) {
        const y = chartY + (chartH / 4) * i
        c.beginPath()
        c.moveTo(chartX, y)
        c.lineTo(chartX + chartW, y)
        c.stroke()
      }

      const gradient = c.createLinearGradient(0, chartY, 0, chartY + chartH)
      gradient.addColorStop(0, up ? "rgba(34,197,94,0.3)" : "rgba(239,68,68,0.3)")
      gradient.addColorStop(1, up ? "rgba(34,197,94,0.05)" : "rgba(239,68,68,0.05)")

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

      c.lineWidth = 4
      c.strokeStyle = up ? "#22c55e" : "#ef4444"
      c.shadowColor = c.strokeStyle
      c.shadowBlur = 20
      c.beginPath()
      spark.forEach((p, i) => {
        const x = chartX + (i / (spark.length - 1)) * chartW
        const y = chartY + chartH - ((p - min) / (max - min || 1)) * chartH
        i === 0 ? c.moveTo(x, y) : c.lineTo(x, y)
      })
      c.stroke()
      c.shadowBlur = 0

      const lastPrice = spark[spark.length - 1]
      c.fillStyle = "#ffffff"
      c.beginPath()
      c.arc(chartX + chartW, chartY + chartH - ((lastPrice - min) / (max - min || 1)) * chartH, 8, 0, Math.PI * 2)
      c.fill()

      const stats = [
        { label: "Market Cap", value: `$${(md.market_cap.usd || 0).toLocaleString()}`, rank: md.market_cap_rank ? `#${md.market_cap_rank}` : "N/A" },
        { label: "Volume 24H", value: `$${(md.total_volume.usd || 0).toLocaleString()}`, rank: "" },
        { label: "High 24H", value: `$${(md.high_24h.usd || 0).toLocaleString()}`, rank: "" },
        { label: "Low 24H", value: `$${(md.low_24h.usd || 0).toLocaleString()}`, rank: "" },
        { label: "Circulating Supply", value: `${(md.circulating_supply || 0).toLocaleString()} ${data.symbol.toUpperCase()}`, rank: "" },
        { label: "Total Supply", value: `${(md.total_supply || 0).toLocaleString()} ${data.symbol.toUpperCase()}`, rank: "" },
        { label: "Max Supply", value: md.max_supply ? `${md.max_supply.toLocaleString()} ${data.symbol.toUpperCase()}` : "∞", rank: "" },
        { label: "ATH", value: `$${(md.ath.usd || 0).toLocaleString()}`, rank: `${((md.current_price.usd / md.ath.usd - 1) * 100).toFixed(1)}%` },
        { label: "ATL", value: `$${(md.atl.usd || 0).toLocaleString()}`, rank: `${((md.current_price.usd / md.atl.usd - 1) * 100).toFixed(1)}%` }
      ]

      let statX = 80
      let statY = 680
      stats.forEach((stat, i) => {
        if (i === 4) {
          statX = 80
          statY = 740
        }
        
        c.fillStyle = "#64748b"
        c.font = "16px Arial"
        c.fillText(stat.label, statX, statY)
        
        c.fillStyle = "#ffffff"
        c.font = "bold 20px Arial"
        c.fillText(stat.value, statX, statY + 25)
        
        if (stat.rank) {
          c.fillStyle = "#3b82f6"
          c.font = "14px Arial"
          c.fillText(stat.rank, statX + c.measureText(stat.value).width + 10, statY + 25)
        }
        
        statX += 320
      })

      const buffer = canvas.toBuffer("image/png")

      const caption = `📊 *Crypto View: ${data.name} (${data.symbol.toUpperCase()})*

💰 *Price:* $${md.current_price.usd.toLocaleString()}
📈 *24H Change:* ${change24h >= 0 ? "+" : ""}${change24h.toFixed(2)}%
📊 *7D Change:* ${change7d >= 0 ? "+" : ""}${change7d.toFixed(2)}%
📉 *30D Change:* ${change30d >= 0 ? "+" : ""}${change30d.toFixed(2)}%

🏆 *Market Cap:* $${(md.market_cap.usd || 0).toLocaleString()} (#${md.market_cap_rank || "N/A"})
💎 *Volume 24H:* $${(md.total_volume.usd || 0).toLocaleString()}
🔺 *High 24H:* $${(md.high_24h.usd || 0).toLocaleString()}
🔻 *Low 24H:* $${(md.low_24h.usd || 0).toLocaleString()}

🔄 *Circulating Supply:* ${(md.circulating_supply || 0).toLocaleString()} ${data.symbol.toUpperCase()}
📦 *Total Supply:* ${(md.total_supply || 0).toLocaleString()} ${data.symbol.toUpperCase()}
⚡ *Max Supply:* ${md.max_supply ? md.max_supply.toLocaleString() + " " + data.symbol.toUpperCase() : "Unlimited"}

🚀 *All Time High:* $${(md.ath.usd || 0).toLocaleString()} (${((md.current_price.usd / md.ath.usd - 1) * 100).toFixed(1)}%)
💥 *All Time Low:* $${(md.atl.usd || 0).toLocaleString()} (+${((md.current_price.usd / md.atl.usd - 1) * 100).toFixed(1)}%)

⏰ Updated: ${new Date().toLocaleString()}`

      await ctx.sock.sendMessage(
        ctx.from,
        { image: buffer, caption: caption },
        { quoted: ctx.msg }
      )

    } catch (err) {
      console.error("❌ CRYPTOVIEW ERROR:", err)
      await ctx.sock.sendMessage(
        ctx.from,
        { text: `⚠️ Gagal menampilkan crypto: ${err.message}` },
        { quoted: ctx.msg }
      )
    }
  }
}