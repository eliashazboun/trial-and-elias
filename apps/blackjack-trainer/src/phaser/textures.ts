import Phaser from "phaser";
import { symbols } from "../engine/cards";
import { chipColors as COLORS } from "../engine/chips";
export function textures(scene: Phaser.Scene) {
  for (const suit of ["spades", "hearts", "diamonds", "clubs"] as const)
    for (const rank of [
      "A",
      "2",
      "3",
      "4",
      "5",
      "6",
      "7",
      "8",
      "9",
      "10",
      "J",
      "Q",
      "K",
    ]) {
      const key = `${rank}-${suit}`;
      if (scene.textures.exists(key)) continue;
      const texture = scene.textures.createCanvas(key, 180, 252)!;
      const ctx = texture.context;
      ctx.fillStyle = "#00000033";
      ctx.beginPath();
      ctx.roundRect(4, 5, 176, 247, 12);
      ctx.fill();
      ctx.fillStyle = "#fbf8ef";
      ctx.beginPath();
      ctx.roundRect(0, 0, 175, 246, 10);
      ctx.fill();
      ctx.strokeStyle = "#d9d4c8";
      ctx.stroke();
      ctx.fillStyle = ["hearts", "diamonds"].includes(suit)
        ? "#ad253d"
        : "#202832";
      ctx.textAlign = "left";
      ctx.font = "bold 35px Georgia";
      ctx.fillText(rank, 12, 39);
      ctx.font = "28px Georgia";
      ctx.fillText(symbols[suit], 12, 68);
      ctx.save();
      ctx.translate(175, 246);
      ctx.rotate(Math.PI);
      ctx.font = "bold 35px Georgia";
      ctx.fillText(rank, 12, 39);
      ctx.font = "28px Georgia";
      ctx.fillText(symbols[suit], 12, 68);
      ctx.restore();
      ctx.textAlign = "center";
      if (["J", "Q", "K"].includes(rank)) {
        ctx.strokeStyle = ctx.fillStyle;
        ctx.lineWidth = 2;
        ctx.strokeRect(44, 47, 86, 151);
        ctx.font = "60px Georgia";
        ctx.fillText(rank === "K" ? "♚" : rank === "Q" ? "♛" : "♞", 87, 132);
        ctx.font = "30px Georgia";
        ctx.fillText(symbols[suit], 87, 179);
      } else if (rank === "A") {
        ctx.font = "88px Georgia";
        ctx.fillText(symbols[suit], 87, 155);
      } else {
        const n = Number(rank);
        for (let i = 0; i < n; i++) {
          const col = n <= 3 ? 0 : i % 2,
            row = n <= 3 ? i : Math.floor(i / 2),
            rows = n <= 3 ? n : Math.ceil(n / 2);
          ctx.font = "28px Georgia";
          ctx.fillText(
            symbols[suit],
            n <= 3 ? 87 : col ? 116 : 59,
            85 + row * (rows === 1 ? 0 : 90 / (rows - 1)),
          );
        }
      }
      texture.refresh();
    }
  for (const [name, color] of Object.entries({
    blue: "#244b78",
    red: "#923544",
    gold: "#29252a",
    geometric: "#385960",
    scholar: "#5c4389",
  })) {
    const t = scene.textures.createCanvas(`back-${name}`, 180, 252)!,
      c = t.context;
    c.fillStyle = "#eee8d9";
    c.beginPath();
    c.roundRect(0, 0, 175, 246, 10);
    c.fill();
    c.fillStyle = color;
    c.fillRect(8, 8, 159, 230);
    c.strokeStyle = name === "gold" ? "#d3b77a" : "#e6e0cb99";
    c.lineWidth = 1;
    for (let i = -250; i < 250; i += 12) {
      c.beginPath();
      c.moveTo(9, Math.max(9, i));
      c.lineTo(166, Math.min(237, i + 157));
      c.stroke();
    }
    c.strokeStyle = "#e5ca89";
    c.strokeRect(18, 19, 139, 207);
    c.font = "40px Georgia";
    c.textAlign = "center";
    c.fillStyle = "#eee8d9";
    c.fillText("♠", 87, 139);
    t.refresh();
  }
  for (const [den, color] of Object.entries(COLORS)) {
    const t = scene.textures.createCanvas(`chip-${den}`, 120, 120)!,
      c = t.context;
    c.fillStyle = "#0005";
    c.beginPath();
    c.ellipse(61, 67, 55, 45, 0, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = color;
    c.beginPath();
    c.ellipse(60, 63, 54, 45, 0, 0, Math.PI * 2);
    c.fill();
    c.beginPath();
    c.ellipse(60, 56, 54, 45, 0, 0, Math.PI * 2);
    c.fill();
    c.strokeStyle = den === "1" ? "#c6ba97" : "#fff8";
    c.lineWidth = 5;
    c.stroke();
    for (let i = 0; i < 8; i++) {
      const a = (i * Math.PI) / 4;
      c.save();
      c.translate(60, 56);
      c.scale(1, 0.83);
      c.rotate(a);
      c.fillStyle = den === "1" ? "#263043" : "#eee8d9";
      c.fillRect(42, -5, 10, 10);
      c.restore();
    }
    c.strokeStyle = den === "1" ? "#8f8061" : "#fff8";
    c.lineWidth = 1;
    c.beginPath();
    c.ellipse(60, 56, 34, 28, 0, 0, Math.PI * 2);
    c.stroke();
    c.fillStyle = den === "1" ? "#253037" : "#fff7e6";
    c.textAlign = "center";
    c.font = "bold 26px Georgia";
    c.fillText(den, 60, 64);
    t.refresh();
  }
}
