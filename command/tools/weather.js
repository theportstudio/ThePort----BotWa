const axios = require("axios");
const { createCanvas, loadImage } = require("canvas");
const path = require("path");
const fs = require("fs");

const API_KEY = "c4ae2723330599c18ce457d1fb998ea2";

const createWeatherCanvas = async (data) => {
  const width = 800;
  const height = 400;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");

  const gradient = ctx.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, "#0f172a");
  gradient.addColorStop(1, "#1e293b");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  ctx.fillStyle = "rgba(59, 130, 246, 0.1)";
  ctx.beginPath();
  ctx.arc(width, 0, 200, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = "rgba(255, 255, 255, 0.1)";
  ctx.lineWidth = 10;
  ctx.strokeRect(20, 20, width - 40, height - 40);

  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 40px Arial";
  ctx.fillText(`${data.name}, ${data.sys.country}`, 50, 80);

  ctx.fillStyle = "#3b82f6";
  ctx.fillRect(50, 100, 100, 5);

  try {
    const iconUrl = `http://openweathermap.org/img/wn/${data.weather[0].icon}@4x.png`;
    const icon = await loadImage(iconUrl);
    ctx.drawImage(icon, 450, 50, 250, 250);
  } catch (e) {
    console.error("Gagal memuat ikon cuaca");
  }

  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 100px Arial";
  ctx.fillText(`${Math.round(data.main.temp)}C`, 50, 220);

  ctx.font = "25px Arial";
  ctx.fillStyle = "#94a3b8";
  ctx.fillText(`Terasa seperti: ${Math.round(data.main.feels_like)}C`, 55, 260);

  ctx.font = "italic 30px Arial";
  ctx.fillStyle = "#60a5fa";
  const desc = data.weather[0].description;
  ctx.fillText(desc.charAt(0).toUpperCase() + desc.slice(1), 50, 310);

  const stats = [
    { label: "Kelembaban", value: `${data.main.humidity}%` },
    { label: "Angin", value: `${data.wind.speed} m/s` },
    { label: "Tekanan", value: `${data.main.pressure} hPa` }
  ];

  ctx.font = "20px Arial";
  stats.forEach((stat, i) => {
    ctx.fillStyle = "#ffffff";
    ctx.fillText(stat.value, 50 + (i * 180), 360);
    ctx.fillStyle = "#64748b";
    ctx.fillText(stat.label, 50 + (i * 180), 385);
  });

  const tempPath = path.join(process.cwd(), "temp", `weather-${Date.now()}.png`);
  fs.writeFileSync(tempPath, canvas.toBuffer("image/png"));
  return tempPath;
};

module.exports = {
  name: "weather",
  alias: ["cuaca", "forecast"],
  loginRequired: true,

  async execute(ctx) {
    let imagePath = null;
    try {
      const location = ctx.args.join(" ");
      if (!location) {
        return ctx.reply("Mohon tulis nama kota atau lokasi.");
      }

      const tempDir = path.join(process.cwd(), "temp");
      if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir);

      const url = "https://api.openweathermap.org/data/2.5/weather";
      const result = await axios.get(url, {
        params: {
          q: location,
          appid: API_KEY,
          units: "metric",
          lang: "id"
        }
      });

      const data = result.data;
      
      imagePath = await createWeatherCanvas(data);

      const caption = `Laporan Cuaca Lengkap\n\n` +
        `Lokasi: ${data.name}, ${data.sys.country}\n` +
        `Suhu: ${data.main.temp}C\n` +
        `Kelembaban: ${data.main.humidity}%\n` +
        `Angin: ${data.wind.speed} m/s\n` +
        `Deskripsi: ${data.weather[0].description}\n\n` +
        `Data diperbarui secara real-time via OpenWeather`;

      await ctx.sock.sendMessage(
        ctx.from,
        { 
          image: fs.readFileSync(imagePath), 
          caption: caption 
        },
        { quoted: ctx.msg }
      );

    } catch (err) {
      console.error("WEATHER ERROR:", err);
      const msg = err.response?.status === 404 
        ? "Kota tidak ditemukan. Periksa kembali ejaannya." 
        : "Gagal mengambil data cuaca.";
      
      await ctx.reply(msg);
    } finally {
      if (imagePath && fs.existsSync(imagePath)) {
        try { fs.unlinkSync(imagePath); } catch (e) {}
      }
    }
  }
};