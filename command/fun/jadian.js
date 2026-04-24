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
  ctx.bezierCurveTo(0, 10, -40, -20, -80, 10);
  ctx.bezierCurveTo(-120, 60, -40, 120, 0, 160);
  ctx.bezierCurveTo(40, 120, 120, 60, 80, 10);
  ctx.bezierCurveTo(40, -20, 0, 10, 0, 30);
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
  ctx.restore();
};

const createCoupleCanvas = async (sock, senderId, targetId, loveMeter) => {
  const width = 800;
  const height = 450;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");

  const bg = ctx.createLinearGradient(0, 0, width, height);
  bg.addColorStop(0, "#0f172a");
  bg.addColorStop(1, "#111827");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, width, height);

  const cardW = width - 100;
  const cardH = height - 100;

  ctx.fillStyle = "rgba(255,255,255,0.05)";
  ctx.beginPath();
  ctx.roundRect(50, 50, cardW, cardH, 20);
  ctx.fill();

  const avatarSize = 140;
  const leftX = 170;
  const rightX = width - 170 - avatarSize;
  const y = 120;

  const loadAvatar = async (userId) => {
    try {
      const pp = await sock.profilePictureUrl(userId, "image");
      const res = await axios.get(pp, { responseType: "arraybuffer" });
      const file = path.join(process.cwd(), `temp-${Date.now()}-${userId}.jpg`);
      fs.writeFileSync(file, res.data);
      return file;
    } catch {
      return null;
    }
  };

  const senderAvatar = await loadAvatar(senderId);
  const targetAvatar = await loadAvatar(targetId);

  const drawAvatar = async (imgPath, x, y) => {
    ctx.save();
    ctx.beginPath();
    ctx.arc(x + avatarSize / 2, y + avatarSize / 2, avatarSize / 2, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();

    try {
      const img = await loadImage(imgPath);
      ctx.drawImage(img, x, y, avatarSize, avatarSize);
    } catch {
      ctx.fillStyle = "#374151";
      ctx.fillRect(x, y, avatarSize, avatarSize);
    }

    ctx.restore();
  };

  await drawAvatar(senderAvatar, leftX, y);
  await drawAvatar(targetAvatar, rightX, y);

  const heartX = width / 2;
  const heartY = y + 70;

  drawHeart(ctx, heartX, heartY, 60, "#f43f5e");

  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 22px Arial";
  ctx.textAlign = "center";
  ctx.fillText(`${loveMeter}%`, heartX, heartY + 15);

  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 20px Arial";
  ctx.fillText("LOVE MATCH", width / 2, 360);

  const barW = 300;
  const barX = (width - barW) / 2;
  const barY = 390;

  ctx.fillStyle = "rgba(255,255,255,0.1)";
  ctx.beginPath();
  ctx.roundRect(barX, barY, barW, 10, 10);
  ctx.fill();

  ctx.fillStyle = "#f43f5e";
  ctx.beginPath();
  ctx.roundRect(barX, barY, barW * (loveMeter / 100), 10, 10);
  ctx.fill();

  const tempDir = path.join(process.cwd(), "temp");
  if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

  const outputPath = path.join(tempDir, `couple-${Date.now()}.png`);
  fs.writeFileSync(outputPath, canvas.toBuffer("image/png"));

  if (senderAvatar && fs.existsSync(senderAvatar)) fs.unlinkSync(senderAvatar);
  if (targetAvatar && fs.existsSync(targetAvatar)) fs.unlinkSync(targetAvatar);

  return outputPath;
};

module.exports = {
  name: "jadian",
  alias: ["couple", "match"],

  async execute(ctx) {
    let imagePath;

    try {
      const group = await ctx.sock.groupMetadata(ctx.from);
      const participants = group.participants;

      const senderId = ctx.sender;

      let targetId;

      const mentioned = ctx.msg.message?.extendedTextMessage?.contextInfo?.mentionedJid;

      if (mentioned?.length) {
        targetId = mentioned[0];
      } else {
        const filtered = participants.filter(p => p.id !== senderId);
        targetId = filtered[Math.floor(Math.random() * filtered.length)].id;
      }

      const love = Math.floor(Math.random() * 40) + 60;

      imagePath = await createCoupleCanvas(ctx.sock, senderId, targetId, love);

      await ctx.sock.sendMessage(ctx.from, {
        image: fs.readFileSync(imagePath),
        caption: `❤️ MATCH FOUND\n\n@${senderId.split("@")[0]} ❤ @${targetId.split("@")[0]}\nCocok: ${love}%`,
        mentions: [senderId, targetId]
      }, { quoted: ctx.msg });

    } catch (e) {
      console.error(e);
      await ctx.reply("Error saat membuat jadian.");
    } finally {
      if (imagePath && fs.existsSync(imagePath)) fs.unlinkSync(imagePath);
    }
  }
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