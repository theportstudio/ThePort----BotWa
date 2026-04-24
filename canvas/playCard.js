const { createCanvas, loadImage } = require("@napi-rs/canvas");
const fs = require("fs");
const path = require("path");

async function makePlayCard({ title, duration, coverUrl }) {
  if (!title) title = "Unknown Title";
  if (!duration) duration = "0:00";

  const width = 1280;
  const height = 720;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");

  const outDir = path.join(__dirname, "temp");
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  /* =====================
     BACKGROUND
  ===================== */
  const bgPath = path.join(__dirname, "assets", "image", "ground.jpg");
  if (fs.existsSync(bgPath)) {
    const bg = await loadImage(bgPath);
    ctx.drawImage(bg, 0, 0, width, height);
  } else {
    ctx.fillStyle = "#111";
    ctx.fillRect(0, 0, width, height);
  }

  /* =====================
     OVERLAY
  ===================== */
  ctx.fillStyle = "rgba(0,0,0,0.55)";
  ctx.fillRect(0, 0, width, height);

  /* =====================
     COVER IMAGE
  ===================== */
  const size = 260;
  const cx = width / 2;
  const cy = height / 2 - 80;

  ctx.beginPath();
  ctx.arc(cx, cy, size / 2 + 8, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(0,0,0,0.6)";
  ctx.fill();

  try {
    if (coverUrl) {
      const cover = await loadImage(coverUrl);
      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, size / 2, 0, Math.PI * 2);
      ctx.clip();
      ctx.drawImage(cover, cx - size / 2, cy - size / 2, size, size);
      ctx.restore();
    }
  } catch {
    ctx.fillStyle = "#222";
    ctx.beginPath();
    ctx.arc(cx, cy, size / 2, 0, Math.PI * 2);
    ctx.fill();
  }

  /* =====================
     TEXT
  ===================== */
  ctx.textAlign = "center";
  ctx.fillStyle = "#fff";
  ctx.font = "bold 42px Sans";
  ctx.fillText(title.slice(0, 40), width / 2, cy + size / 2 + 70);

  ctx.font = "28px Sans";
  ctx.fillStyle = "rgba(255,255,255,0.85)";
  ctx.fillText(duration, width / 2, cy + size / 2 + 110);

  ctx.font = "26px Sans";
  ctx.fillStyle = "rgba(255,255,255,0.8)";
  ctx.fillText("Auto Download Audio", width / 2, height - 60);

  /* =====================
     SAVE
  ===================== */
  const filePath = path.join(outDir, `play-${Date.now()}.jpg`);
  fs.writeFileSync(filePath, canvas.toBuffer("image/jpeg", { quality: 0.9 }));

  return filePath;
}

module.exports = { makePlayCard };
