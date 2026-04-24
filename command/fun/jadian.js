const { createCanvas, loadImage } = require("canvas");
const axios = require("axios");
const path = require("path");
const fs = require("fs");

const drawHeart = (ctx, x, y, size, color) => {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(size / 100, size / 100);
  ctx.beginPath();
  ctx.moveTo(0, 30);
  ctx.bezierCurveTo(0, 20, -25, 0, -50, 0);
  ctx.bezierCurveTo(-95, 0, -95, 55, -95, 55);
  ctx.bezierCurveTo(-95, 85, -65, 110, 0, 140);
  ctx.bezierCurveTo(65, 110, 95, 85, 95, 55);
  ctx.bezierCurveTo(95, 55, 95, 0, 50, 0);
  ctx.bezierCurveTo(25, 0, 0, 20, 0, 30);
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
  ctx.restore();
};

const createCoupleCanvas = async (sock, senderId, targetId, loveMeter) => {
  const width = 800;
  const height = 500;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");

  const gradient = ctx.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, "#1a1a2e");
  gradient.addColorStop(0.5, "#16213e");
  gradient.addColorStop(1, "#0f3460");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  for (let i = 0; i < 50; i++) {
    ctx.fillStyle = `rgba(255, 105, 180, ${Math.random() * 0.3})`;
    ctx.beginPath();
    ctx.arc(Math.random() * width, Math.random() * height, Math.random() * 3, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.shadowColor = "rgba(0, 0, 0, 0.5)";
  ctx.shadowBlur = 30;
  ctx.shadowOffsetY = 10;
  ctx.fillStyle = "rgba(255, 255, 255, 0.05)";
  ctx.beginPath();
  ctx.roundRect(40, 40, width - 80, height - 80, 20);
  ctx.fill();
  ctx.shadowBlur = 0;

  const avatarSize = 180;
  const leftX = 150;
  const rightX = width - 150 - avatarSize;
  const avatarY = 120;

  const loadAvatar = async (userId) => {
    try {
      const ppUrl = await sock.profilePictureUrl(userId, "image");
      const res = await axios.get(ppUrl, {
        responseType: "arraybuffer",
        timeout: 10000,
        headers: { "User-Agent": "Mozilla/5.0" }
      });
      const tempPath = path.join(process.cwd(), "temp", `avatar-${Date.now()}-${userId.split("@")[0]}.jpg`);
      fs.writeFileSync(tempPath, res.data);
      return tempPath;
    } catch {
      return null;
    }
  };

  const senderAvatarPath = await loadAvatar(senderId);
  const targetAvatarPath = await loadAvatar(targetId);

  ctx.save();
  ctx.beginPath();
  ctx.arc(leftX + avatarSize / 2, avatarY + avatarSize / 2, avatarSize / 2, 0, Math.PI * 2);
  ctx.closePath();
  ctx.clip();

  try {
    const senderImg = await loadImage(senderAvatarPath);
    ctx.drawImage(senderImg, leftX, avatarY, avatarSize, avatarSize);
  } catch {
    ctx.fillStyle = "#e94560";
    ctx.fillRect(leftX, avatarY, avatarSize, avatarSize);
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 80px Arial";
    ctx.textAlign = "center";
    ctx.fillText("?", leftX + avatarSize / 2, avatarY + avatarSize / 2 + 25);
  }
  ctx.restore();

  const heartX = width / 2;
  const heartY = avatarY + avatarSize / 2;
  const pulse = 1 + Math.sin(Date.now() / 200) * 0.1;
  drawHeart(ctx, heartX, heartY, 80 * pulse, "#ff1744");

  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 24px Arial";
  ctx.textAlign = "center";
  ctx.fillText(`${loveMeter}%`, heartX, heartY + 10);

  ctx.save();
  ctx.beginPath();
  ctx.arc(rightX + avatarSize / 2, avatarY + avatarSize / 2, avatarSize / 2, 0, Math.PI * 2);
  ctx.closePath();
  ctx.clip();

  try {
    const targetImg = await loadImage(targetAvatarPath);
    ctx.drawImage(targetImg, rightX, avatarY, avatarSize, avatarSize);
  } catch {
    ctx.fillStyle = "#e94560";
    ctx.fillRect(rightX, avatarY, avatarSize, avatarSize);
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 80px Arial";
    ctx.textAlign = "center";
    ctx.fillText("?", rightX + avatarSize / 2, avatarY + avatarSize / 2 + 25);
  }
  ctx.restore();

  ctx.strokeStyle = "#ff1744";
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.arc(leftX + avatarSize / 2, avatarY + avatarSize / 2, avatarSize / 2 + 8, 0, Math.PI * 2);
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(rightX + avatarSize / 2, avatarY + avatarSize / 2, avatarSize / 2 + 8, 0, Math.PI * 2);
  ctx.stroke();

  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 36px Arial";
  ctx.textAlign = "center";
  ctx.fillText("COUPLE MATCH", width / 2, 360);

  ctx.fillStyle = "#ff6b9d";
  ctx.font = "italic 24px Arial";
  ctx.fillText("Semoga langgeng!", width / 2, 400);

  const progressWidth = 400;
  const progressHeight = 20;
  const progressX = (width - progressWidth) / 2;
  const progressY = 430;

  ctx.fillStyle = "rgba(255, 255, 255, 0.2)";
  ctx.beginPath();
  ctx.roundRect(progressX, progressY, progressWidth, progressHeight, 10);
  ctx.fill();

  const loveGradient = ctx.createLinearGradient(progressX, progressY, progressX + progressWidth * (loveMeter / 100), progressY);
  loveGradient.addColorStop(0, "#ff1744");
  loveGradient.addColorStop(1, "#ff6b9d");

  ctx.fillStyle = loveGradient;
  ctx.beginPath();
  ctx.roundRect(progressX, progressY, progressWidth * (loveMeter / 100), progressHeight, 10);
  ctx.fill();

  const tempDir = path.join(process.cwd(), "temp");
  if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

  const outputPath = path.join(tempDir, `couple-${Date.now()}.png`);
  fs.writeFileSync(outputPath, canvas.toBuffer("image/png"));

  if (senderAvatarPath && fs.existsSync(senderAvatarPath)) {
    try { fs.unlinkSync(senderAvatarPath); } catch {}
  }
  if (targetAvatarPath && fs.existsSync(targetAvatarPath)) {
    try { fs.unlinkSync(targetAvatarPath); } catch {}
  }

  return outputPath;
};

module.exports = {
  name: "jadian",
  alias: ["couple", "match"],
  groupOnly: true,
  loginRequired: false,

  async execute(ctx) {
    let imagePath = null;
    try {
      const groupMeta = await ctx.sock.groupMetadata(ctx.from);
      const participants = groupMeta.participants || [];

      if (participants.length < 2) {
        return ctx.reply("Grup minimal harus ada 2 anggota.");
      }

      const senderId = ctx.sender;
      const senderNumber = senderId.includes("@") ? senderId.split("@")[0] : senderId;

      let targetId = null;
      let targetNumber = null;

      const mentioned = ctx.msg.message?.extendedTextMessage?.contextInfo?.mentionedJid;

      if (mentioned && mentioned.length > 0) {
        targetId = mentioned[0];
        targetNumber = targetId.split("@")[0];

        if (targetId === senderId) {
          return ctx.reply("Tidak bisa jadian dengan diri sendiri.");
        }
      } else {
        const eligible = participants.filter(p => {
          const pid = p.id;
          const pnumber = pid.includes("@") ? pid.split("@")[0] : pid;
          return pid !== senderId && !pid.includes(senderNumber);
        });

        if (eligible.length === 0) {
          return ctx.reply("Tidak ada pasangan yang tersedia untukmu.");
        }

        const randomIndex = Math.floor(Math.random() * eligible.length);
        targetId = eligible[randomIndex].id;
        targetNumber = targetId.includes("@") ? targetId.split("@")[0] : targetId;
      }

      const loveMeter = Math.floor(Math.random() * 40) + 60;

      imagePath = await createCoupleCanvas(ctx.sock, senderId, targetId, loveMeter);

      const caption = `JODOH ALERT\n\n@${senderNumber} ❤  @${targetNumber}\n\nKecocokan: ${loveMeter}%\n\nSemoga langgeng!`;

      await ctx.sock.sendMessage(
        ctx.from,
        {
          image: fs.readFileSync(imagePath),
          caption: caption,
          mentions: [senderId, targetId]
        },
        { quoted: ctx.msg }
      );

    } catch (err) {
      console.error("JADIAN ERROR:", err);
      await ctx.reply("Terjadi kesalahan saat mencari jodoh.");
    } finally {
      if (imagePath && fs.existsSync(imagePath)) {
        try { fs.unlinkSync(imagePath); } catch {}
      }
    }
  }
};