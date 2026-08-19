import { BANNERS, type BannerId } from "./enums";
import type { MyProfileResponse } from "./types";

const CARD_W = 1000;
const CARD_H = 600;

function bannerColors(banner: BannerId) {
  return BANNERS.find((b) => b.id === banner) ?? BANNERS[0];
}

function roundedRectPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/**
 * Renders the "flex card" onto a canvas the caller owns and returns a PNG
 * data URL. Pure Canvas 2D — no html2canvas or other new dependency, and no
 * custom-font loading race (system-ui/serif stacks only), so this works
 * reliably the moment the modal opens.
 */
export function drawProfileCard(
  canvas: HTMLCanvasElement,
  data: {
    username: string;
    nickname: string | null;
    banner: BannerId;
    traitName: string | null;
    traitIcon: string | null;
    stats: MyProfileResponse["stats"];
    badgeIcons: string[];
    joinedAt: string;
  }
): string {
  canvas.width = CARD_W;
  canvas.height = CARD_H;
  const ctx = canvas.getContext("2d");
  if (!ctx) return "";

  const colors = bannerColors(data.banner);

  // Background gradient.
  const grad = ctx.createLinearGradient(0, 0, CARD_W, CARD_H);
  grad.addColorStop(0, colors.from);
  grad.addColorStop(1, colors.to);
  ctx.fillStyle = grad;
  roundedRectPath(ctx, 0, 0, CARD_W, CARD_H, 36);
  ctx.fill();

  // Faint inner border for a "printed card" edge.
  ctx.strokeStyle = "rgba(255,255,255,0.28)";
  ctx.lineWidth = 2;
  roundedRectPath(ctx, 16, 16, CARD_W - 32, CARD_H - 32, 26);
  ctx.stroke();

  // Wordmark.
  ctx.fillStyle = "rgba(255,255,255,0.72)";
  ctx.font = "600 22px system-ui, sans-serif";
  ctx.textBaseline = "top";
  ctx.fillText("MAISON DE MERDE", 56, 56);
  ctx.font = "400 15px system-ui, sans-serif";
  ctx.fillStyle = "rgba(255,255,255,0.5)";
  ctx.fillText("Purveyors of Fine Digestive Distinction", 56, 86);

  // Display name.
  const displayName = data.nickname || data.username;
  ctx.fillStyle = "#ffffff";
  ctx.font = "400 64px Georgia, 'Times New Roman', serif";
  ctx.fillText(displayName, 56, 150);

  ctx.font = "400 22px system-ui, sans-serif";
  ctx.fillStyle = "rgba(255,255,255,0.65)";
  ctx.fillText(`@${data.username}`, 58, 226);

  // Trait line.
  if (data.traitName) {
    ctx.font = "500 26px system-ui, sans-serif";
    ctx.fillStyle = "#ffffff";
    const label = `${data.traitIcon ?? ""}  ${data.traitName}`.trim();
    ctx.fillText(label, 58, 268);
  }

  // Stat blocks.
  const stats: [string, string | number][] = [
    ["SESSIONS", data.stats.totalSessions],
    ["STREAK", data.stats.currentStreak],
    ["LONGEST", data.stats.longestStreak],
    ["DISTINCTIONS", `${data.stats.badgesUnlocked}/${data.stats.badgesTotal}`],
  ];
  const statY = 400;
  const statW = (CARD_W - 112) / 4;
  stats.forEach(([label, value], i) => {
    const x = 56 + i * statW;
    ctx.font = "700 44px system-ui, sans-serif";
    ctx.fillStyle = "#ffffff";
    ctx.fillText(String(value), x, statY);
    ctx.font = "600 13px system-ui, sans-serif";
    ctx.fillStyle = "rgba(255,255,255,0.6)";
    ctx.fillText(label, x, statY + 58);
  });

  // Badge strip.
  if (data.badgeIcons.length) {
    ctx.font = "36px system-ui, sans-serif";
    ctx.fillStyle = "#ffffff";
    ctx.fillText(data.badgeIcons.slice(0, 12).join("  "), 56, 500);
  }

  // Footer.
  ctx.font = "400 14px system-ui, sans-serif";
  ctx.fillStyle = "rgba(255,255,255,0.5)";
  const joined = new Date(data.joinedAt);
  const joinedLabel = Number.isNaN(joined.getTime())
    ? ""
    : `Est. ${joined.toLocaleDateString(undefined, { year: "numeric", month: "short" })}`;
  ctx.fillText(joinedLabel, 56, CARD_H - 52);

  return canvas.toDataURL("image/png");
}
