// 比べる物と金塊のイラスト（オーナー指摘 2026-11-13：図形だけでは楽しくない → コードで描くイラストにする）。
// 立体にする（オーナー 2026-11-22）：金塊と同じ斜めの見せ方で、箱の形の物は上面と右の面も描く（奥行きは objects.json の d）。
// 筒の形の物は上の楕円、丸い物は陰影で立体に見せる。光は左上から（上面は明るく、右の面は暗く）。
// 画像の素材は使わない。物は id ごとに描き、知らない id は objects.json の shape で輪郭を描く（物の追加は JSON だけでできる）。
// 実在の商品名・ロゴ・刻印は描かない

type Ctx = CanvasRenderingContext2D;

const OUT = '#4a4238';
/** 奥行きを斜めに描く割合（金塊と同じ）。奥行き d cm は、右上へ d×0.35 ずらして描く */
export const ART_DEPTH = 0.35;

function lin(ctx: Ctx, x0: number, y0: number, x1: number, y1: number, stops: [number, string][]): CanvasGradient {
  const g = ctx.createLinearGradient(x0, y0, x1, y1);
  for (const [o, c] of stops) g.addColorStop(o, c);
  return g;
}

function rad(ctx: Ctx, x: number, y: number, r: number, stops: [number, string][]): CanvasGradient {
  const g = ctx.createRadialGradient(x, y, 0, x, y, Math.max(r, 0.01));
  for (const [o, c] of stops) g.addColorStop(o, c);
  return g;
}

function fillStroke(ctx: Ctx, fill: string | CanvasGradient, lw: number, stroke = OUT): void {
  ctx.fillStyle = fill;
  ctx.fill();
  if (lw > 0) {
    ctx.lineWidth = lw;
    ctx.strokeStyle = stroke;
    ctx.lineJoin = 'round';
    ctx.stroke();
  }
}

/** 円柱の横方向の陰影（左寄りに光、右が暗い） */
function cylinder(ctx: Ctx, x: number, w: number, base: string, light: string, dark: string): CanvasGradient {
  return lin(ctx, x, 0, x + w, 0, [
    [0, dark],
    [0.22, light],
    [0.45, base],
    [0.85, dark],
    [1, dark],
  ]);
}

/** 白い光の筋（つや） */
function gloss(ctx: Ctx, x: number, y: number, w: number, h: number, alpha = 0.35): void {
  ctx.fillStyle = `rgba(255,255,255,${alpha})`;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, Math.min(w, h) / 2);
  ctx.fill();
}

/** 今の道（path）の内側だけに、右下を暗く・左上を明るくする陰影を重ねる（丸い物の立体感） */
function shadeRound(ctx: Ctx, x: number, y: number, w: number, h: number): void {
  ctx.save();
  ctx.clip();
  ctx.fillStyle = rad(ctx, x + w * 0.72, y + h * 0.8, Math.max(w, h) * 0.75, [
    [0, 'rgba(110,75,30,0.28)'],
    [1, 'rgba(110,75,30,0)'],
  ]);
  ctx.fillRect(x, y, w, h);
  // 床からの照り返し（下の縁を少し明るく）
  ctx.fillStyle = lin(ctx, 0, y + h * 0.82, 0, y + h, [
    [0, 'rgba(255,240,210,0)'],
    [1, 'rgba(255,240,210,0.35)'],
  ]);
  ctx.fillRect(x, y, w, h);
  ctx.restore();
}

// ---- 箱の面（正面の左上が x, y。奥行きは右上へ dp px） ----

function pathTop(ctx: Ctx, x: number, y: number, w: number, dp: number): void {
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + dp, y - dp);
  ctx.lineTo(x + w + dp, y - dp);
  ctx.lineTo(x + w, y);
  ctx.closePath();
}

function pathRight(ctx: Ctx, x: number, y: number, w: number, h: number, dp: number): void {
  ctx.beginPath();
  ctx.moveTo(x + w, y);
  ctx.lineTo(x + w + dp, y - dp);
  ctx.lineTo(x + w + dp, y + h - dp);
  ctx.lineTo(x + w, y + h);
  ctx.closePath();
}

/** 上面に、0〜1 の座標（u：横、v：奥）で描く */
function onTop(ctx: Ctx, x: number, y: number, w: number, dp: number, fn: () => void): void {
  ctx.save();
  ctx.transform(w, 0, dp, -dp, x, y);
  fn();
  ctx.restore();
}

/** 右の面に、0〜1 の座標（u：奥、v：下）で描く */
function onRight(ctx: Ctx, x: number, y: number, w: number, h: number, dp: number, fn: () => void): void {
  ctx.save();
  ctx.transform(dp, -dp, 0, h, x + w, y);
  fn();
  ctx.restore();
}

/** 地面の影（物の下のやわらかい楕円） */
export function groundShadow(ctx: Ctx, cx: number, ground: number, w: number): void {
  if (w < 2) return;
  ctx.fillStyle = rad(ctx, cx, ground, w * 0.55, [
    [0, 'rgba(60,45,20,0.2)'],
    [1, 'rgba(60,45,20,0)'],
  ]);
  ctx.save();
  ctx.translate(cx, ground);
  ctx.scale(1, Math.max(0.06, Math.min(0.16, 14 / Math.max(w, 1))));
  ctx.beginPath();
  ctx.arc(0, 0, w * 0.55, 0, Math.PI * 2);
  ctx.restore();
  ctx.fill();
}

/** (x, y, w, h)：正面の枠。dp：奥行きのずらし（px）。lw：線の太さ */
type Draw = (ctx: Ctx, x: number, y: number, w: number, h: number, lw: number, dp: number) => void;

const sesame: Draw = (ctx, x, y, w, h, lw) => {
  const cy = y + h / 2;
  const path = () => {
    ctx.beginPath();
    ctx.moveTo(x + w, cy);
    ctx.bezierCurveTo(x + w * 0.62, y - h * 0.08, x, y, x, cy);
    ctx.bezierCurveTo(x, y + h, x + w * 0.62, y + h * 1.08, x + w, cy);
  };
  path();
  fillStroke(ctx, rad(ctx, x + w * 0.35, y + h * 0.35, w * 0.8, [[0, '#fff8e4'], [0.55, '#efdcaa'], [1, '#c9a764']]), lw);
  path();
  shadeRound(ctx, x, y, w, h);
  // 真ん中の筋
  ctx.strokeStyle = 'rgba(160,120,60,0.45)';
  ctx.lineWidth = Math.max(1, lw * 0.6);
  ctx.beginPath();
  ctx.moveTo(x + w * 0.12, cy);
  ctx.quadraticCurveTo(x + w * 0.55, cy - h * 0.06, x + w * 0.9, cy);
  ctx.stroke();
  gloss(ctx, x + w * 0.18, y + h * 0.2, w * 0.3, h * 0.12, 0.75);
};

const rice: Draw = (ctx, x, y, w, h, lw) => {
  const path = () => {
    ctx.beginPath();
    ctx.ellipse(x + w / 2, y + h / 2, w / 2, h / 2, 0, 0, Math.PI * 2);
  };
  path();
  fillStroke(ctx, rad(ctx, x + w * 0.38, y + h * 0.32, w * 0.75, [[0, '#ffffff'], [0.55, '#f8f4ea'], [1, '#d9d0b9']]), lw);
  path();
  shadeRound(ctx, x, y, w, h);
  // 胚芽のくぼみ
  ctx.fillStyle = 'rgba(190,170,120,0.55)';
  ctx.beginPath();
  ctx.ellipse(x + w * 0.1, y + h * 0.62, w * 0.07, h * 0.16, -0.5, 0, Math.PI * 2);
  ctx.fill();
  gloss(ctx, x + w * 0.25, y + h * 0.18, w * 0.42, h * 0.14, 0.95);
};

const coin1: Draw = (ctx, x, y, w, h, lw) => {
  const cx = x + w / 2;
  const cy = y + h / 2;
  const r = Math.min(w, h) / 2;
  // 縁の厚み（右下に少しずらした暗い円）
  ctx.beginPath();
  ctx.arc(cx + r * 0.05, cy + r * 0.04, r, 0, Math.PI * 2);
  ctx.fillStyle = '#7d868e';
  ctx.fill();
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  fillStroke(ctx, rad(ctx, cx - r * 0.4, cy - r * 0.4, r * 1.6, [[0, '#ffffff'], [0.4, '#e3e7eb'], [1, '#98a1aa']]), lw, '#6f7880');
  // 内側の縁（くぼみ）
  ctx.strokeStyle = 'rgba(255,255,255,0.8)';
  ctx.lineWidth = Math.max(1, r * 0.035);
  ctx.beginPath();
  ctx.arc(cx + r * 0.01, cy + r * 0.01, r * 0.84, Math.PI * 0.15, Math.PI * 1.15, false);
  ctx.stroke();
  ctx.strokeStyle = 'rgba(110,120,130,0.6)';
  ctx.beginPath();
  ctx.arc(cx - r * 0.01, cy - r * 0.01, r * 0.84, Math.PI * 1.15, Math.PI * 0.15, false);
  ctx.stroke();
  // 「1」（浮き出し）
  ctx.font = `700 ${Math.round(r * 1.05)}px system-ui, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  ctx.fillText('1', cx - r * 0.025, cy + r * 0.03);
  ctx.fillStyle = '#8b949c';
  ctx.fillText('1', cx + r * 0.015, cy + r * 0.07);
};

const dice: Draw = (ctx, x, y, w, h, lw, dp) => {
  // 右の面（3の目）
  pathRight(ctx, x, y, w, h, dp);
  fillStroke(ctx, lin(ctx, x + w, y, x + w + dp, y + h, [[0, '#ddd6c8'], [1, '#bdb4a2']]), lw);
  onRight(ctx, x, y, w, h, dp, () => {
    ctx.fillStyle = '#2b2724';
    for (const [u, v] of [[0.22, 0.22], [0.5, 0.5], [0.78, 0.78]] as const) {
      ctx.beginPath();
      ctx.arc(u, v, 0.085, 0, Math.PI * 2);
      ctx.fill();
    }
  });
  // 上面（1の目は赤）
  pathTop(ctx, x, y, w, dp);
  fillStroke(ctx, lin(ctx, x, y - dp, x + w, y, [[0, '#ffffff'], [1, '#f2eee6']]), lw);
  onTop(ctx, x, y, w, dp, () => {
    ctx.fillStyle = '#d63a3a';
    ctx.beginPath();
    ctx.arc(0.5, 0.5, 0.16, 0, Math.PI * 2);
    ctx.fill();
  });
  // 正面（5の目）
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  fillStroke(ctx, lin(ctx, x, y, x + w, y + h, [[0, '#ffffff'], [0.6, '#f4f1ea'], [1, '#e2dccf']]), lw);
  const pip = (px: number, py: number, pr: number, c: string) => {
    ctx.fillStyle = c;
    ctx.beginPath();
    ctx.arc(x + w * px, y + h * py, Math.min(w, h) * pr, 0, Math.PI * 2);
    ctx.fill();
  };
  for (const [px, py] of [[0.26, 0.26], [0.74, 0.26], [0.26, 0.74], [0.74, 0.74], [0.5, 0.5]] as const) pip(px, py, 0.085, '#2b2724');
};

const battery: Draw = (ctx, x, y, w, h, lw) => {
  const ry = w * 0.16;
  const nubW = w * 0.36;
  const nubH = h * 0.05;
  const topY = y + nubH + ry;
  const bottomY = y + h - ry;
  const cx = x + w / 2;
  // 本体（下は楕円の弧）
  ctx.beginPath();
  ctx.moveTo(x, topY);
  ctx.lineTo(x, bottomY);
  ctx.ellipse(cx, bottomY, w / 2, ry, 0, Math.PI, 0, true);
  ctx.lineTo(x + w, topY);
  ctx.closePath();
  fillStroke(ctx, cylinder(ctx, x, w, '#33373c', '#6b7178', '#1a1c1f'), lw);
  // 色の帯（上の6割）
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, topY, w, (bottomY - topY) * 0.58);
  ctx.clip();
  ctx.fillStyle = cylinder(ctx, x, w, '#e0702e', '#f7ac78', '#9e4116');
  ctx.fillRect(x, topY - ry, w, bottomY - topY);
  ctx.restore();
  ctx.strokeStyle = 'rgba(255,255,255,0.25)';
  ctx.lineWidth = Math.max(1, lw * 0.5);
  ctx.beginPath();
  ctx.ellipse(cx, topY + (bottomY - topY) * 0.58, w / 2, ry, 0, 0, Math.PI);
  ctx.stroke();
  // 上の面（銀色の楕円）
  ctx.beginPath();
  ctx.ellipse(cx, topY, w / 2, ry, 0, 0, Math.PI * 2);
  fillStroke(ctx, lin(ctx, x, topY - ry, x + w, topY + ry, [[0, '#ffffff'], [1, '#a9b0b7']]), lw);
  // プラス極の出っぱり
  ctx.beginPath();
  ctx.rect(cx - nubW / 2, topY - nubH, nubW, nubH);
  fillStroke(ctx, cylinder(ctx, cx - nubW / 2, nubW, '#d9dde1', '#ffffff', '#8c949b'), lw * 0.7);
  ctx.beginPath();
  ctx.ellipse(cx, topY - nubH, nubW / 2, ry * 0.36, 0, 0, Math.PI * 2);
  fillStroke(ctx, '#f4f6f8', lw * 0.7);
  // ＋の記号
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = Math.max(1, w * 0.07);
  const px = cx;
  const py = topY + (bottomY - topY) * 0.13;
  const s = w * 0.16;
  ctx.beginPath();
  ctx.moveTo(px - s, py);
  ctx.lineTo(px + s, py);
  ctx.moveTo(px, py - s);
  ctx.lineTo(px, py + s);
  ctx.stroke();
  gloss(ctx, x + w * 0.14, topY + ry, w * 0.12, (bottomY - topY) * 0.86, 0.3);
};

const egg: Draw = (ctx, x, y, w, h, lw) => {
  const cx = x + w / 2;
  const cy = y + h * 0.58;
  const path = () => {
    ctx.beginPath();
    ctx.ellipse(cx, cy, w / 2, h * 0.58, 0, Math.PI, Math.PI * 2);
    ctx.ellipse(cx, cy, w / 2, h * 0.42, 0, 0, Math.PI);
    ctx.closePath();
  };
  path();
  fillStroke(ctx, rad(ctx, x + w * 0.36, y + h * 0.34, h * 0.8, [[0, '#fffbf4'], [0.5, '#f6e4c8'], [1, '#d2ab82']]), lw);
  path();
  shadeRound(ctx, x, y, w, h);
  ctx.fillStyle = 'rgba(255,255,255,0.8)';
  ctx.beginPath();
  ctx.ellipse(x + w * 0.32, y + h * 0.3, w * 0.09, h * 0.13, -0.4, 0, Math.PI * 2);
  ctx.fill();
};

const phone: Draw = (ctx, x, y, w, h, lw, dp) => {
  const r = w * 0.16;
  // 側面（右と上。薄い）
  pathRight(ctx, x, y + r * 0.5, w, h - r, dp);
  fillStroke(ctx, lin(ctx, x + w, 0, x + w + dp, 0, [[0, '#2a2e33'], [1, '#0e1012']]), lw * 0.7, '#0e1012');
  pathTop(ctx, x + r * 0.5, y, w - r, dp);
  fillStroke(ctx, '#3a3f46', lw * 0.7, '#0e1012');
  // 横のボタン
  ctx.fillStyle = '#50565e';
  ctx.fillRect(x + w + dp * 0.25, y + h * 0.22 - dp * 0.25, Math.max(1, dp * 0.5), h * 0.07);
  // 本体
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
  fillStroke(ctx, lin(ctx, x, y, x + w, y, [[0, '#3a3f46'], [0.5, '#22262b'], [1, '#14171a']]), lw, '#14171a');
  const m = w * 0.06;
  const sx = x + m;
  const sy = y + m;
  const sw = w - m * 2;
  const sh = h - m * 2;
  ctx.beginPath();
  ctx.roundRect(sx, sy, sw, sh, r * 0.7);
  ctx.fillStyle = lin(ctx, sx, sy, sx + sw, sy + sh, [[0, '#7fb2ff'], [0.5, '#8f7cf6'], [1, '#f08bc0']]);
  ctx.fill();
  // アプリの並び
  ctx.fillStyle = 'rgba(255,255,255,0.6)';
  const cell = sw / 4;
  for (let row = 0; row < 3; row++)
    for (let col = 0; col < 4; col++) {
      ctx.beginPath();
      ctx.roundRect(sx + cell * col + cell * 0.18, sy + sh * 0.14 + row * cell * 1.05, cell * 0.64, cell * 0.64, cell * 0.16);
      ctx.fill();
    }
  // カメラの穴とホームのバー
  ctx.fillStyle = '#0e1013';
  ctx.beginPath();
  ctx.roundRect(sx + sw * 0.36, sy + sh * 0.02, sw * 0.28, sh * 0.03, sh * 0.015);
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  ctx.beginPath();
  ctx.roundRect(sx + sw * 0.32, sy + sh * 0.955, sw * 0.36, sh * 0.012, sh * 0.006);
  ctx.fill();
  // 画面の映り込み
  ctx.save();
  ctx.beginPath();
  ctx.roundRect(sx, sy, sw, sh, r * 0.7);
  ctx.clip();
  ctx.fillStyle = 'rgba(255,255,255,0.18)';
  ctx.beginPath();
  ctx.moveTo(sx, sy + sh * 0.55);
  ctx.lineTo(sx + sw, sy + sh * 0.25);
  ctx.lineTo(sx + sw, sy + sh * 0.42);
  ctx.lineTo(sx, sy + sh * 0.72);
  ctx.fill();
  ctx.restore();
};

const book: Draw = (ctx, x, y, w, h, lw, dp) => {
  // 右の面：ページの束（小口）と裏表紙の厚み
  pathRight(ctx, x, y, w, h, dp);
  fillStroke(ctx, lin(ctx, x + w, 0, x + w + dp, 0, [[0, '#f6efdd'], [1, '#e3d8bf']]), lw);
  onRight(ctx, x, y, w, h, dp, () => {
    ctx.strokeStyle = 'rgba(160,140,100,0.45)';
    ctx.lineWidth = 0.012;
    for (let u = 0.18; u < 0.92; u += 0.12) {
      ctx.beginPath();
      ctx.moveTo(u, 0.02);
      ctx.lineTo(u, 0.98);
      ctx.stroke();
    }
    ctx.fillStyle = '#a9443c';
    ctx.fillRect(0.88, 0, 0.12, 1);
  });
  // 上の面：ページの束
  pathTop(ctx, x, y, w, dp);
  fillStroke(ctx, '#f8f2e2', lw);
  onTop(ctx, x, y, w, dp, () => {
    ctx.fillStyle = '#b8524a';
    ctx.fillRect(0, 0.88, 1, 0.12);
    ctx.fillRect(0, 0, 0.06, 1);
  });
  // 表紙
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  fillStroke(ctx, lin(ctx, x, y, x + w, y + h, [[0, '#de6d62'], [1, '#a9443c']]), lw);
  // 背の側の折り目
  ctx.fillStyle = 'rgba(0,0,0,0.18)';
  ctx.fillRect(x + w * 0.06, y + lw, Math.max(1, w * 0.02), h - lw * 2);
  // 題名の帯と文字の線
  ctx.fillStyle = '#f7efe0';
  ctx.fillRect(x + w * 0.18, y + h * 0.12, w * 0.68, h * 0.3);
  ctx.fillStyle = '#5a4a3c';
  for (const [ly, lwid] of [[0.19, 0.5], [0.26, 0.38], [0.34, 0.44]] as const) ctx.fillRect(x + w * 0.26, y + h * ly, w * lwid, Math.max(1, h * 0.02));
  ctx.fillStyle = 'rgba(255,255,255,0.75)';
  ctx.fillRect(x + w * 0.3, y + h * 0.82, w * 0.44, Math.max(1, h * 0.018));
  gloss(ctx, x + w * 0.86, y + h * 0.05, w * 0.04, h * 0.9, 0.2);
};

const milk: Draw = (ctx, x, y, w, h, lw, dp) => {
  const yb = y + h * 0.22;
  const hr = h * 0.15;
  const hf = h * 0.05;
  const lx = x + dp / 2;
  const rx = x + w + dp / 2;
  const ridgeY = yb - dp / 2 - hr;
  // 右の面（本体の側面）
  ctx.beginPath();
  ctx.moveTo(x + w, yb);
  ctx.lineTo(x + w + dp, yb - dp);
  ctx.lineTo(x + w + dp, y + h - dp);
  ctx.lineTo(x + w, y + h);
  ctx.closePath();
  fillStroke(ctx, lin(ctx, x + w, 0, x + w + dp, 0, [[0, '#dfe5ea'], [1, '#c3ccd4']]), lw);
  // 側面の青い帯
  const bandT = yb + (y + h - yb) * 0.38;
  const bandH = (y + h - yb) * 0.34;
  ctx.beginPath();
  ctx.moveTo(x + w, bandT);
  ctx.lineTo(x + w + dp, bandT - dp);
  ctx.lineTo(x + w + dp, bandT + bandH - dp);
  ctx.lineTo(x + w, bandT + bandH);
  ctx.closePath();
  ctx.fillStyle = '#2a5ea8';
  ctx.fill();
  // 右の三角（屋根の妻側）
  ctx.beginPath();
  ctx.moveTo(x + w, yb);
  ctx.lineTo(x + w + dp, yb - dp);
  ctx.lineTo(rx, ridgeY);
  ctx.closePath();
  fillStroke(ctx, '#cfd6dc', lw);
  // 屋根（手前の斜めの面）
  ctx.beginPath();
  ctx.moveTo(x, yb);
  ctx.lineTo(x + w, yb);
  ctx.lineTo(rx, ridgeY);
  ctx.lineTo(lx, ridgeY);
  ctx.closePath();
  fillStroke(ctx, lin(ctx, 0, ridgeY, 0, yb, [[0, '#e9edf0'], [1, '#ffffff']]), lw);
  // 上のひれ
  ctx.beginPath();
  ctx.moveTo(lx, ridgeY);
  ctx.lineTo(rx, ridgeY);
  ctx.lineTo(rx, ridgeY - hf);
  ctx.lineTo(lx, ridgeY - hf);
  ctx.closePath();
  fillStroke(ctx, lin(ctx, 0, ridgeY - hf, 0, ridgeY, [[0, '#ffffff'], [1, '#dfe4e8']]), lw * 0.8);
  // 本体（正面）
  ctx.beginPath();
  ctx.rect(x, yb, w, y + h - yb);
  fillStroke(ctx, lin(ctx, x, 0, x + w, 0, [[0, '#ffffff'], [0.75, '#f7f8f9'], [1, '#e6eaee']]), lw);
  // 青い帯と牛乳のしずく
  ctx.fillStyle = lin(ctx, x, 0, x + w, 0, [[0, '#4a8ff0'], [1, '#2c66bf']]);
  ctx.fillRect(x + lw / 2, bandT, w - lw, bandH);
  const dx = x + w / 2;
  const dy = bandT + bandH * 0.55;
  const dr = Math.min(w * 0.18, bandH * 0.28);
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(dx, dy, dr, 0, Math.PI);
  ctx.lineTo(dx, dy - dr * 2.2);
  ctx.closePath();
  ctx.fill();
};

const bottle2l: Draw = (ctx, x, y, w, h, lw) => {
  const cx = x + w / 2;
  const capW = w * 0.34;
  const capRy = capW * 0.14;
  const capH = h * 0.045;
  const neckW = w * 0.3;
  const neckT = y + capRy + capH;
  const neckB = y + h * 0.1;
  const shoulderB = y + h * 0.26;
  const bottomRy = w * 0.09;
  // 胴
  ctx.beginPath();
  ctx.moveTo(cx - neckW / 2, neckT);
  ctx.lineTo(cx - neckW / 2, neckB);
  ctx.bezierCurveTo(x, neckB + h * 0.04, x, shoulderB - h * 0.06, x, shoulderB);
  ctx.lineTo(x, y + h - bottomRy);
  ctx.ellipse(cx, y + h - bottomRy, w / 2, bottomRy, 0, Math.PI, 0, true);
  ctx.lineTo(x + w, shoulderB);
  ctx.bezierCurveTo(x + w, shoulderB - h * 0.06, x + w, neckB + h * 0.04, cx + neckW / 2, neckB);
  ctx.lineTo(cx + neckW / 2, neckT);
  ctx.closePath();
  fillStroke(ctx, cylinder(ctx, x, w, '#d8eef8', '#f6fcff', '#94c6de'), lw, '#5d8fa8');
  // くびれ（楕円の線で立体に）
  ctx.strokeStyle = 'rgba(93,143,168,0.45)';
  ctx.lineWidth = Math.max(1, lw * 0.6);
  for (const k of [0.34, 0.8, 0.88]) {
    ctx.beginPath();
    ctx.ellipse(cx, y + h * k, w / 2 - lw, bottomRy * 0.8, 0, 0, Math.PI);
    ctx.stroke();
  }
  // ラベル（筒に巻いた形）
  const lt = y + h * 0.46;
  const lb = y + h * 0.66;
  ctx.beginPath();
  ctx.moveTo(x + lw / 2, lt);
  ctx.ellipse(cx, lt, w / 2 - lw / 2, bottomRy * 0.8, 0, Math.PI, 0, true);
  ctx.lineTo(x + w - lw / 2, lb);
  ctx.ellipse(cx, lb, w / 2 - lw / 2, bottomRy * 0.8, 0, 0, Math.PI);
  ctx.closePath();
  ctx.fillStyle = cylinder(ctx, x, w, '#3cae7c', '#7adcae', '#1f6e48');
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  ctx.fillRect(x + w * 0.25, y + h * 0.555, w * 0.5, Math.max(1, h * 0.012));
  // キャップ（筒＋上の楕円）
  ctx.beginPath();
  ctx.rect(cx - capW / 2, y + capRy, capW, capH);
  fillStroke(ctx, cylinder(ctx, cx - capW / 2, capW, '#2f8ad6', '#7cc0f2', '#1c5f9a'), lw * 0.8);
  ctx.beginPath();
  ctx.ellipse(cx, y + capRy, capW / 2, capRy, 0, 0, Math.PI * 2);
  fillStroke(ctx, '#5aa8e8', lw * 0.8);
  gloss(ctx, x + w * 0.16, shoulderB + h * 0.02, w * 0.08, h * 0.6, 0.6);
};

const bucket: Draw = (ctx, x, y, w, h, lw) => {
  const rimY = y + h * 0.2;
  const rimH = h * 0.12;
  const inset = w * 0.12;
  const bottomRy = rimH * 0.35;
  // 取っ手（奥側）
  ctx.strokeStyle = '#8b939b';
  ctx.lineWidth = Math.max(1.5, w * 0.022);
  ctx.beginPath();
  ctx.moveTo(x + w * 0.04, rimY + rimH * 0.5);
  ctx.bezierCurveTo(x + w * 0.04, y - h * 0.02, x + w * 0.96, y - h * 0.02, x + w * 0.96, rimY + rimH * 0.5);
  ctx.stroke();
  // 胴（下は楕円の弧）
  ctx.beginPath();
  ctx.moveTo(x + w * 0.02, rimY + rimH / 2);
  ctx.lineTo(x + inset, y + h - bottomRy);
  ctx.ellipse(x + w / 2, y + h - bottomRy, w / 2 - inset, bottomRy, 0, Math.PI, 0, true);
  ctx.lineTo(x + w * 0.98, rimY + rimH / 2);
  ctx.closePath();
  fillStroke(ctx, cylinder(ctx, x, w, '#3f8fdc', '#86c0f3', '#1d5594'), lw);
  // 胴の段（楕円の線）
  ctx.strokeStyle = 'rgba(255,255,255,0.35)';
  ctx.lineWidth = Math.max(1, h * 0.015);
  for (const k of [0.45, 0.8]) {
    const yy = rimY + (y + h - rimY) * k;
    const off = inset * ((yy - rimY) / (y + h - rimY));
    ctx.beginPath();
    ctx.ellipse(x + w / 2, yy, w / 2 - off - w * 0.03, bottomRy, 0, 0, Math.PI);
    ctx.stroke();
  }
  // 口（中は暗く、水が少し見える）
  ctx.beginPath();
  ctx.ellipse(x + w / 2, rimY + rimH / 2, w / 2, rimH / 2, 0, 0, Math.PI * 2);
  fillStroke(ctx, lin(ctx, 0, rimY, 0, rimY + rimH, [[0, '#173f6a'], [1, '#2a6bb0']]), lw);
  ctx.fillStyle = 'rgba(160,215,245,0.55)';
  ctx.beginPath();
  ctx.ellipse(x + w / 2, rimY + rimH * 0.62, w / 2 - w * 0.06, rimH * 0.3, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#a8d2fa';
  ctx.lineWidth = Math.max(1, lw * 0.8);
  ctx.beginPath();
  ctx.ellipse(x + w / 2, rimY + rimH / 2, w / 2 - lw, rimH / 2 - lw * 0.5, 0, Math.PI * 0.05, Math.PI * 0.95);
  ctx.stroke();
};

const bathtub: Draw = (ctx, x, y, w, h, lw, dp) => {
  const rimF = h * 0.1;
  // 右の面
  pathRight(ctx, x, y, w, h, dp);
  fillStroke(ctx, lin(ctx, x + w, 0, x + w + dp, 0, [[0, '#e4ebf1'], [1, '#c7d3dd']]), lw);
  // 上の面（ふち）
  pathTop(ctx, x, y, w, dp);
  fillStroke(ctx, '#ffffff', lw);
  // 湯船の中（お湯）
  onTop(ctx, x, y, w, dp, () => {
    ctx.beginPath();
    ctx.roundRect(0.05, 0.12, 0.9, 0.76, 0.08);
    ctx.fillStyle = lin(ctx, 0, 0, 1, 1, [[0, '#9fdcf7'], [1, '#4aa9dc']]);
    ctx.fill();
    // 水面の光
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    for (const [u, v, rw] of [[0.3, 0.35, 0.12], [0.62, 0.6, 0.08], [0.5, 0.25, 0.06]] as const) {
      ctx.beginPath();
      ctx.ellipse(u, v, rw, 0.025, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  });
  // 泡（水面に浮かぶ）
  ctx.strokeStyle = 'rgba(120,150,170,0.55)';
  ctx.lineWidth = Math.max(1, lw * 0.6);
  for (const [u, v, br] of [
    [0.1, 0.35, 0.05],
    [0.17, 0.5, 0.065],
    [0.26, 0.4, 0.055],
    [0.2, 0.25, 0.04],
    [0.33, 0.6, 0.045],
  ] as const) {
    const bx = x + w * u + dp * v;
    const by = y - dp * v;
    const r = h * br;
    ctx.beginPath();
    ctx.arc(bx, by, r, 0, Math.PI * 2);
    ctx.fillStyle = rad(ctx, bx - r * 0.3, by - r * 0.3, r * 1.3, [[0, '#ffffff'], [1, '#e2edf5']]);
    ctx.fill();
    ctx.stroke();
  }
  // 蛇口（奥の右）
  const fx = x + w * 0.9 + dp * 0.85;
  const fy = y - dp * 0.85;
  ctx.beginPath();
  ctx.roundRect(fx - w * 0.012, fy - h * 0.22, w * 0.024, h * 0.22, w * 0.01);
  fillStroke(ctx, cylinder(ctx, fx - w * 0.012, w * 0.024, '#c9d1d8', '#ffffff', '#87929c'), lw * 0.8);
  ctx.beginPath();
  ctx.roundRect(fx - w * 0.07, fy - h * 0.24, w * 0.08, h * 0.06, h * 0.03);
  fillStroke(ctx, lin(ctx, 0, fy - h * 0.24, 0, fy - h * 0.18, [[0, '#ffffff'], [1, '#9aa5ae']]), lw * 0.8);
  // 正面
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, [0, 0, h * 0.18, h * 0.18]);
  fillStroke(ctx, lin(ctx, 0, y, 0, y + h, [[0, '#ffffff'], [1, '#d6e0e9']]), lw);
  // 正面のふちの厚み
  ctx.fillStyle = 'rgba(200,214,226,0.6)';
  ctx.fillRect(x + lw / 2, y + rimF, w - lw, Math.max(1, lw * 0.8));
  gloss(ctx, x + w * 0.06, y + rimF * 1.8, w * 0.5, h * 0.05, 0.85);
};

const ART: Record<string, Draw> = { sesame, rice, coin1, dice, battery, egg, phone, book, milk, bottle2l, bucket, bathtub };

/** 物の見た目の大きさ（cm）。奥行きのぶん、右と上に広がる */
export function artExtent(o: { w: number; h: number; d?: number }): { w: number; h: number } {
  const dd = (o.d ?? 0) * ART_DEPTH;
  return { w: o.w + dd, h: o.h + dd };
}

/** 物のイラストを、縦横比のまま size×size の枠の中央に描いた canvas（並び・一言の帯で使う小さな絵） */
export function iconCanvas(o: { id: string; w: number; h: number; d?: number }, size: number, pad = 2, lw = 0.8): HTMLCanvasElement {
  const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
  const c = document.createElement('canvas');
  c.width = Math.round(size * dpr);
  c.height = Math.round(size * dpr);
  c.style.width = `${size}px`;
  c.style.height = `${size}px`;
  const ctx = c.getContext('2d');
  if (ctx) {
    ctx.scale(dpr, dpr);
    const ext = artExtent(o);
    const k = Math.min((size - pad * 2) / ext.w, (size - pad * 2) / ext.h);
    const w = o.w * k;
    const h = o.h * k;
    const dp = (o.d ?? 0) * ART_DEPTH * k;
    // 正面の左下が、見た目の枠の左下に来るように置く
    const left = (size - ext.w * k) / 2;
    const bottom = (size + ext.h * k) / 2;
    drawArt(ctx, o.id, left, bottom - h, w, h, lw, dp);
  }
  return c;
}

/**
 * id のイラストがあれば描いて true。なければ false（呼び出し側が shape で描く）。
 * (x, y, w, h) は正面の枠。dp は奥行きのずらし（px。右上へ）
 */
export function drawArt(ctx: Ctx, id: string, x: number, y: number, w: number, h: number, lw: number, dp = 0): boolean {
  const draw = ART[id];
  if (!draw || w < 1 || h < 1) return false;
  ctx.save();
  draw(ctx, x, y, w, h, lw, dp);
  ctx.restore();
  return true;
}

/**
 * 金塊（立方体。正面・上面・右の面の3面）。刻印・ロゴは入れない。
 * x：正面の左、ground：地面、s：一辺（px）、depth：奥行きの割合、sparkle：きらめきの強さ（0〜1）
 */
export function drawGoldCube(ctx: Ctx, x: number, ground: number, s: number, depth: number, sparkle = 0): void {
  if (s < 1) {
    // 1px 未満は 1px の点（設計書 3.3）
    ctx.fillStyle = '#d4a017';
    ctx.fillRect(Math.round(x), ground - 1, 1, 1);
    return;
  }
  const d = s * depth;
  const top = ground - s;
  ctx.save();
  // 床の照り返し（金色のにじみ）
  if (s >= 8) {
    const gw = s * (1 + depth);
    ctx.save();
    ctx.translate(x + gw / 2, ground);
    ctx.scale(1, 0.18);
    ctx.fillStyle = rad(ctx, 0, 0, gw * 0.75, [
      [0, 'rgba(255,200,60,0.35)'],
      [1, 'rgba(255,200,60,0)'],
    ]);
    ctx.beginPath();
    ctx.arc(0, 0, gw * 0.75, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
  // 右の面
  ctx.beginPath();
  ctx.moveTo(x + s, top);
  ctx.lineTo(x + s + d, top - d);
  ctx.lineTo(x + s + d, ground - d);
  ctx.lineTo(x + s, ground);
  ctx.closePath();
  ctx.fillStyle = lin(ctx, x + s, top, x + s + d, ground, [[0, '#d39b12'], [0.6, '#9c7008'], [1, '#6e4f04']]);
  ctx.fill();
  // 上面
  ctx.beginPath();
  ctx.moveTo(x, top);
  ctx.lineTo(x + d, top - d);
  ctx.lineTo(x + s + d, top - d);
  ctx.lineTo(x + s, top);
  ctx.closePath();
  ctx.fillStyle = lin(ctx, x, top - d, x + s, top, [[0, '#fff8d6'], [0.45, '#ffe486'], [1, '#f0bf3a']]);
  ctx.fill();
  // 正面
  ctx.fillStyle = lin(ctx, x, top, x + s, ground, [[0, '#ffdd6e'], [0.45, '#ebb526'], [1, '#b5840a']]);
  ctx.fillRect(x, top, s, s);
  if (s >= 6) {
    // 上面の光の帯
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(x, top);
    ctx.lineTo(x + d, top - d);
    ctx.lineTo(x + s + d, top - d);
    ctx.lineTo(x + s, top);
    ctx.closePath();
    ctx.clip();
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.beginPath();
    ctx.moveTo(x + s * 0.2, top);
    ctx.lineTo(x + s * 0.2 + d, top - d);
    ctx.lineTo(x + s * 0.4 + d, top - d);
    ctx.lineTo(x + s * 0.4, top);
    ctx.fill();
    ctx.restore();
    // 正面の斜めの光の帯
    ctx.save();
    ctx.beginPath();
    ctx.rect(x, top, s, s);
    ctx.clip();
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ctx.beginPath();
    ctx.moveTo(x + s * 0.1, ground);
    ctx.lineTo(x + s * 0.55, top);
    ctx.lineTo(x + s * 0.75, top);
    ctx.lineTo(x + s * 0.3, ground);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.18)';
    ctx.beginPath();
    ctx.moveTo(x + s * 0.4, ground);
    ctx.lineTo(x + s * 0.85, top);
    ctx.lineTo(x + s * 0.92, top);
    ctx.lineTo(x + s * 0.47, ground);
    ctx.fill();
    // 下の縁の照り返し
    ctx.fillStyle = lin(ctx, 0, ground - s * 0.15, 0, ground, [
      [0, 'rgba(255,240,180,0)'],
      [1, 'rgba(255,240,180,0.35)'],
    ]);
    ctx.fillRect(x, ground - s * 0.15, s, s * 0.15);
    ctx.restore();
    // 角の面取りの光
    ctx.lineCap = 'round';
    ctx.strokeStyle = 'rgba(255,252,230,0.95)';
    ctx.lineWidth = Math.max(1, s * 0.028);
    ctx.beginPath();
    ctx.moveTo(x, ground);
    ctx.lineTo(x, top);
    ctx.lineTo(x + s, top);
    ctx.lineTo(x + s + d, top - d);
    ctx.stroke();
    ctx.strokeStyle = 'rgba(255,245,200,0.6)';
    ctx.lineWidth = Math.max(1, s * 0.018);
    ctx.beginPath();
    ctx.moveTo(x, top);
    ctx.lineTo(x + d, top - d);
    ctx.lineTo(x + s + d, top - d);
    ctx.stroke();
    ctx.strokeStyle = 'rgba(110,75,0,0.55)';
    ctx.lineWidth = Math.max(1, s * 0.015);
    ctx.beginPath();
    ctx.moveTo(x + s, top);
    ctx.lineTo(x + s, ground);
    ctx.stroke();
  }
  // きらめき（大きいときはいつも少し、タップの直後は強く）
  if (s >= 14) {
    const k = 0.45 + 0.55 * sparkle;
    star(ctx, x + s * 0.82 + d * 0.5, top - d * 0.55, s * 0.13 * k);
    star(ctx, x + s * 0.18, top + s * 0.2, s * 0.08 * k);
    if (sparkle > 0.2) star(ctx, x + s + d * 0.6, top + s * 0.35, s * 0.1 * sparkle);
  }
  ctx.restore();
}

/** 4つの角のきらめき。color を省くと白 */
export function star(ctx: Ctx, cx: number, cy: number, r: number, color = 'rgba(255,255,255,0.95)'): void {
  if (r < 1.5) return;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(cx, cy - r);
  ctx.quadraticCurveTo(cx, cy, cx + r, cy);
  ctx.quadraticCurveTo(cx, cy, cx, cy + r);
  ctx.quadraticCurveTo(cx, cy, cx - r, cy);
  ctx.quadraticCurveTo(cx, cy, cx, cy - r);
  ctx.fill();
}
