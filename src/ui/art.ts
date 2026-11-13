// 比べる物と金塊のイラスト（オーナー指摘 2026-11-13：図形だけでは楽しくない → コードで描くイラストにする）。
// 画像の素材は使わない。物は id ごとに描き、知らない id は objects.json の shape で輪郭を描く（物の追加は JSON だけでできる）。
// 実在の商品名・ロゴ・刻印は描かない

type Ctx = CanvasRenderingContext2D;

const OUT = '#4a4238';

function lin(ctx: Ctx, x0: number, y0: number, x1: number, y1: number, stops: [number, string][]): CanvasGradient {
  const g = ctx.createLinearGradient(x0, y0, x1, y1);
  for (const [o, c] of stops) g.addColorStop(o, c);
  return g;
}

function rad(ctx: Ctx, x: number, y: number, r: number, stops: [number, string][]): CanvasGradient {
  const g = ctx.createRadialGradient(x, y, 0, x, y, r);
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

/** 円柱の横方向の陰影（左が少し暗く、左寄りに光、右が暗い） */
function cylinder(ctx: Ctx, x: number, w: number, base: string, light: string, dark: string): CanvasGradient {
  return lin(ctx, x, 0, x + w, 0, [
    [0, dark],
    [0.25, light],
    [0.45, base],
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

/** 地面の影（物の下のやわらかい楕円） */
export function groundShadow(ctx: Ctx, cx: number, ground: number, w: number): void {
  if (w < 2) return;
  ctx.fillStyle = 'rgba(60,45,20,0.12)';
  ctx.beginPath();
  ctx.ellipse(cx, ground, w * 0.52, Math.max(1.5, Math.min(w * 0.07, 14)), 0, 0, Math.PI * 2);
  ctx.fill();
}

type Draw = (ctx: Ctx, x: number, y: number, w: number, h: number, lw: number) => void;

const sesame: Draw = (ctx, x, y, w, h, lw) => {
  const cy = y + h / 2;
  ctx.beginPath();
  ctx.moveTo(x + w, cy);
  ctx.bezierCurveTo(x + w * 0.62, y - h * 0.08, x, y, x, cy);
  ctx.bezierCurveTo(x, y + h, x + w * 0.62, y + h * 1.08, x + w, cy);
  fillStroke(ctx, rad(ctx, x + w * 0.35, y + h * 0.35, w * 0.8, [[0, '#fbf3dc'], [0.6, '#ecd9a8'], [1, '#c9a764']]), lw);
  // 真ん中の筋
  ctx.strokeStyle = 'rgba(160,120,60,0.45)';
  ctx.lineWidth = Math.max(1, lw * 0.6);
  ctx.beginPath();
  ctx.moveTo(x + w * 0.12, cy);
  ctx.quadraticCurveTo(x + w * 0.55, cy - h * 0.06, x + w * 0.9, cy);
  ctx.stroke();
  gloss(ctx, x + w * 0.18, y + h * 0.2, w * 0.3, h * 0.12, 0.6);
};

const rice: Draw = (ctx, x, y, w, h, lw) => {
  ctx.beginPath();
  ctx.ellipse(x + w / 2, y + h / 2, w / 2, h / 2, 0, 0, Math.PI * 2);
  fillStroke(ctx, rad(ctx, x + w * 0.38, y + h * 0.32, w * 0.75, [[0, '#ffffff'], [0.55, '#f7f3e8'], [1, '#d8cfb8']]), lw);
  // 胚芽のくぼみ
  ctx.fillStyle = 'rgba(190,170,120,0.55)';
  ctx.beginPath();
  ctx.ellipse(x + w * 0.1, y + h * 0.62, w * 0.07, h * 0.16, -0.5, 0, Math.PI * 2);
  ctx.fill();
  gloss(ctx, x + w * 0.25, y + h * 0.18, w * 0.42, h * 0.14, 0.9);
};

const coin1: Draw = (ctx, x, y, w, h, lw) => {
  const cx = x + w / 2;
  const cy = y + h / 2;
  const r = Math.min(w, h) / 2;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  fillStroke(ctx, rad(ctx, cx - r * 0.35, cy - r * 0.35, r * 1.5, [[0, '#ffffff'], [0.45, '#dfe3e7'], [1, '#9aa3ac']]), lw, '#6f7880');
  ctx.strokeStyle = 'rgba(120,130,140,0.6)';
  ctx.lineWidth = Math.max(1, r * 0.04);
  ctx.beginPath();
  ctx.arc(cx, cy, r * 0.84, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = '#8b949c';
  ctx.font = `700 ${Math.round(r * 1.05)}px system-ui, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('1', cx, cy + r * 0.05);
};

const dice: Draw = (ctx, x, y, w, h, lw) => {
  const r = Math.min(w, h) * 0.18;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
  fillStroke(ctx, lin(ctx, x, y, x + w, y + h, [[0, '#ffffff'], [0.6, '#f1eee8'], [1, '#d6d0c4']]), lw);
  const pip = (px: number, py: number, pr: number, c: string) => {
    ctx.fillStyle = c;
    ctx.beginPath();
    ctx.arc(x + w * px, y + h * py, Math.min(w, h) * pr, 0, Math.PI * 2);
    ctx.fill();
  };
  // 5の目（真ん中は赤）
  for (const [px, py] of [[0.26, 0.26], [0.74, 0.26], [0.26, 0.74], [0.74, 0.74]] as const) pip(px, py, 0.085, '#2b2724');
  pip(0.5, 0.5, 0.11, '#d63a3a');
};

const battery: Draw = (ctx, x, y, w, h, lw) => {
  const nubH = h * 0.05;
  const bodyY = y + nubH;
  const bodyH = h - nubH;
  // プラス極の出っぱり
  ctx.beginPath();
  ctx.roundRect(x + w * 0.32, y, w * 0.36, nubH + 1, [w * 0.06, w * 0.06, 0, 0]);
  fillStroke(ctx, cylinder(ctx, x + w * 0.32, w * 0.36, '#d9dde1', '#ffffff', '#8c949b'), lw * 0.8);
  // 本体
  ctx.beginPath();
  ctx.roundRect(x, bodyY, w, bodyH, w * 0.12);
  fillStroke(ctx, cylinder(ctx, x, w, '#33373c', '#6b7178', '#1d2023'), lw);
  // 色の帯（上の6割）
  ctx.save();
  ctx.beginPath();
  ctx.roundRect(x, bodyY, w, bodyH, w * 0.12);
  ctx.clip();
  ctx.fillStyle = cylinder(ctx, x, w, '#e0702e', '#f5a46d', '#a9461a');
  ctx.fillRect(x, bodyY, w, bodyH * 0.58);
  ctx.fillStyle = 'rgba(255,255,255,0.18)';
  ctx.fillRect(x, bodyY + bodyH * 0.58, w, Math.max(1, bodyH * 0.012));
  ctx.restore();
  // ＋の記号
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = Math.max(1, w * 0.07);
  const px = x + w / 2;
  const py = bodyY + bodyH * 0.12;
  const s = w * 0.16;
  ctx.beginPath();
  ctx.moveTo(px - s, py);
  ctx.lineTo(px + s, py);
  ctx.moveTo(px, py - s);
  ctx.lineTo(px, py + s);
  ctx.stroke();
  gloss(ctx, x + w * 0.16, bodyY + bodyH * 0.06, w * 0.12, bodyH * 0.86, 0.22);
};

const egg: Draw = (ctx, x, y, w, h, lw) => {
  const cx = x + w / 2;
  const cy = y + h * 0.58;
  ctx.beginPath();
  ctx.ellipse(cx, cy, w / 2, h * 0.58, 0, Math.PI, Math.PI * 2);
  ctx.ellipse(cx, cy, w / 2, h * 0.42, 0, 0, Math.PI);
  ctx.closePath();
  fillStroke(ctx, rad(ctx, x + w * 0.36, y + h * 0.34, h * 0.8, [[0, '#fffaf2'], [0.5, '#f6e4c8'], [1, '#d4b088']]), lw);
  ctx.fillStyle = 'rgba(255,255,255,0.75)';
  ctx.beginPath();
  ctx.ellipse(x + w * 0.32, y + h * 0.3, w * 0.09, h * 0.13, -0.4, 0, Math.PI * 2);
  ctx.fill();
};

const phone: Draw = (ctx, x, y, w, h, lw) => {
  const r = w * 0.16;
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
  ctx.fillStyle = 'rgba(255,255,255,0.55)';
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
  ctx.fillStyle = 'rgba(255,255,255,0.16)';
  ctx.beginPath();
  ctx.moveTo(sx, sy + sh * 0.55);
  ctx.lineTo(sx + sw, sy + sh * 0.25);
  ctx.lineTo(sx + sw, sy + sh * 0.42);
  ctx.lineTo(sx, sy + sh * 0.72);
  ctx.fill();
  ctx.restore();
};

const book: Draw = (ctx, x, y, w, h, lw) => {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, w * 0.03);
  fillStroke(ctx, lin(ctx, x, y, x + w, y + h, [[0, '#d8665c'], [1, '#a9443c']]), lw);
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
  gloss(ctx, x + w * 0.86, y + h * 0.05, w * 0.04, h * 0.9, 0.18);
};

const milk: Draw = (ctx, x, y, w, h, lw) => {
  const finH = h * 0.05;
  const roofB = y + h * 0.2;
  // 上のひれ
  ctx.beginPath();
  ctx.rect(x + w * 0.08, y, w * 0.84, finH);
  fillStroke(ctx, '#e8ecef', lw * 0.8);
  // 屋根（奥へ傾く面なので少し暗く）
  ctx.beginPath();
  ctx.moveTo(x + w * 0.08, y + finH);
  ctx.lineTo(x + w * 0.92, y + finH);
  ctx.lineTo(x + w, roofB);
  ctx.lineTo(x, roofB);
  ctx.closePath();
  fillStroke(ctx, lin(ctx, 0, y + finH, 0, roofB, [[0, '#d5dbe0'], [1, '#f4f6f8']]), lw);
  // 本体
  ctx.beginPath();
  ctx.rect(x, roofB, w, y + h - roofB);
  fillStroke(ctx, lin(ctx, x, 0, x + w, 0, [[0, '#ffffff'], [0.7, '#f6f7f8'], [1, '#dde2e6']]), lw);
  // 青い帯と牛乳のしずく
  const bandY = roofB + (y + h - roofB) * 0.38;
  const bandH = (y + h - roofB) * 0.34;
  ctx.fillStyle = lin(ctx, x, 0, x + w, 0, [[0, '#3f86e6'], [1, '#2a62b8']]);
  ctx.fillRect(x + lw / 2, bandY, w - lw, bandH);
  const dx = x + w / 2;
  const dy = bandY + bandH * 0.55;
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
  const capH = h * 0.05;
  const neckW = w * 0.3;
  const neckB = y + h * 0.1;
  const shoulderB = y + h * 0.26;
  // 胴
  ctx.beginPath();
  ctx.moveTo(cx - neckW / 2, y + capH);
  ctx.lineTo(cx - neckW / 2, neckB);
  ctx.bezierCurveTo(x, neckB + h * 0.04, x, shoulderB - h * 0.06, x, shoulderB);
  ctx.lineTo(x, y + h - w * 0.12);
  ctx.quadraticCurveTo(x, y + h, x + w * 0.12, y + h);
  ctx.lineTo(x + w * 0.88, y + h);
  ctx.quadraticCurveTo(x + w, y + h, x + w, y + h - w * 0.12);
  ctx.lineTo(x + w, shoulderB);
  ctx.bezierCurveTo(x + w, shoulderB - h * 0.06, x + w, neckB + h * 0.04, cx + neckW / 2, neckB);
  ctx.lineTo(cx + neckW / 2, y + capH);
  ctx.closePath();
  fillStroke(ctx, cylinder(ctx, x, w, '#d8eef8', '#f4fbff', '#9fcde3'), lw, '#5d8fa8');
  // 水の線と、くびれ
  ctx.strokeStyle = 'rgba(93,143,168,0.45)';
  ctx.lineWidth = Math.max(1, lw * 0.6);
  for (const k of [0.34, 0.8, 0.88]) {
    ctx.beginPath();
    ctx.moveTo(x + lw, y + h * k);
    ctx.lineTo(x + w - lw, y + h * k);
    ctx.stroke();
  }
  // ラベル
  ctx.fillStyle = cylinder(ctx, x, w, '#3cae7c', '#6fd3a4', '#23784f');
  ctx.fillRect(x + lw / 2, y + h * 0.46, w - lw, h * 0.2);
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  ctx.fillRect(x + w * 0.25, y + h * 0.54, w * 0.5, Math.max(1, h * 0.012));
  // キャップ
  ctx.beginPath();
  ctx.roundRect(cx - capW / 2, y, capW, capH, capW * 0.12);
  fillStroke(ctx, cylinder(ctx, cx - capW / 2, capW, '#2f8ad6', '#7cc0f2', '#1c5f9a'), lw * 0.8);
  gloss(ctx, x + w * 0.16, shoulderB + h * 0.02, w * 0.08, h * 0.6, 0.55);
};

const bucket: Draw = (ctx, x, y, w, h, lw) => {
  const rimY = y + h * 0.2;
  const rimH = h * 0.09;
  const inset = w * 0.12;
  // 取っ手
  ctx.strokeStyle = '#8b939b';
  ctx.lineWidth = Math.max(1.5, w * 0.022);
  ctx.beginPath();
  ctx.moveTo(x + w * 0.04, rimY + rimH * 0.5);
  ctx.bezierCurveTo(x + w * 0.04, y - h * 0.02, x + w * 0.96, y - h * 0.02, x + w * 0.96, rimY + rimH * 0.5);
  ctx.stroke();
  // 胴
  ctx.beginPath();
  ctx.moveTo(x + w * 0.02, rimY + rimH / 2);
  ctx.lineTo(x + w * 0.98, rimY + rimH / 2);
  ctx.lineTo(x + w - inset, y + h);
  ctx.lineTo(x + inset, y + h);
  ctx.closePath();
  fillStroke(ctx, cylinder(ctx, x, w, '#3f8fdc', '#7fbaf0', '#235e9c'), lw);
  // 胴の段
  ctx.strokeStyle = 'rgba(255,255,255,0.35)';
  ctx.lineWidth = Math.max(1, h * 0.015);
  for (const k of [0.45, 0.8]) {
    const yy = rimY + (y + h - rimY) * k;
    const off = inset * ((yy - rimY) / (y + h - rimY));
    ctx.beginPath();
    ctx.moveTo(x + off + w * 0.03, yy);
    ctx.lineTo(x + w - off - w * 0.03, yy);
    ctx.stroke();
  }
  // 縁（上から少し見える口）
  ctx.beginPath();
  ctx.ellipse(x + w / 2, rimY + rimH / 2, w / 2, rimH / 2, 0, 0, Math.PI * 2);
  fillStroke(ctx, lin(ctx, 0, rimY, 0, rimY + rimH, [[0, '#1f4f82'], [1, '#2f73bb']]), lw);
  ctx.strokeStyle = '#9fcaf5';
  ctx.lineWidth = Math.max(1, lw * 0.8);
  ctx.beginPath();
  ctx.ellipse(x + w / 2, rimY + rimH / 2, w / 2 - lw, rimH / 2 - lw * 0.5, 0, Math.PI * 0.05, Math.PI * 0.95);
  ctx.stroke();
};

const bathtub: Draw = (ctx, x, y, w, h, lw) => {
  const rimY = y + h * 0.3;
  const rimH = h * 0.12;
  // 泡（ふちの上に盛り上がる）
  ctx.strokeStyle = 'rgba(120,150,170,0.55)';
  ctx.lineWidth = Math.max(1, lw * 0.6);
  for (const [bx, by, br] of [
    [0.1, 0.26, 0.1],
    [0.18, 0.17, 0.14],
    [0.29, 0.22, 0.12],
    [0.39, 0.15, 0.13],
    [0.5, 0.23, 0.1],
    [0.6, 0.18, 0.12],
    [0.7, 0.25, 0.09],
  ] as const) {
    ctx.beginPath();
    ctx.arc(x + w * bx, y + h * by, h * br, 0, Math.PI * 2);
    ctx.fillStyle = rad(ctx, x + w * bx - h * br * 0.3, y + h * by - h * br * 0.3, h * br * 1.3, [[0, '#ffffff'], [1, '#e2edf5']]);
    ctx.fill();
    ctx.stroke();
  }
  // 蛇口
  ctx.beginPath();
  ctx.roundRect(x + w * 0.86, y + h * 0.08, w * 0.025, rimY - y - h * 0.08, w * 0.01);
  fillStroke(ctx, cylinder(ctx, x + w * 0.86, w * 0.025, '#c9d1d8', '#ffffff', '#87929c'), lw * 0.8);
  ctx.beginPath();
  ctx.roundRect(x + w * 0.8, y + h * 0.06, w * 0.085, h * 0.07, h * 0.03);
  fillStroke(ctx, lin(ctx, 0, y, 0, y + h * 0.13, [[0, '#ffffff'], [1, '#9aa5ae']]), lw * 0.8);
  // 本体
  ctx.beginPath();
  ctx.roundRect(x + w * 0.02, rimY + rimH / 2, w * 0.96, y + h - rimY - rimH / 2, [0, 0, h * 0.28, h * 0.28]);
  fillStroke(ctx, lin(ctx, 0, rimY, 0, y + h, [[0, '#ffffff'], [1, '#d9e2ea']]), lw);
  // ふち
  ctx.beginPath();
  ctx.roundRect(x, rimY, w, rimH, rimH / 2);
  fillStroke(ctx, lin(ctx, 0, rimY, 0, rimY + rimH, [[0, '#ffffff'], [1, '#e3eaf0']]), lw);
  gloss(ctx, x + w * 0.08, rimY + rimH * 1.4, w * 0.5, h * 0.04, 0.8);
};

const ART: Record<string, Draw> = { sesame, rice, coin1, dice, battery, egg, phone, book, milk, bottle2l, bucket, bathtub };

/** id のイラストがあれば描いて true。なければ false（呼び出し側が shape で描く） */
export function drawArt(ctx: Ctx, id: string, x: number, y: number, w: number, h: number, lw: number): boolean {
  const draw = ART[id];
  if (!draw || w < 1 || h < 1) return false;
  ctx.save();
  draw(ctx, x, y, w, h, lw);
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
  // 右の面
  ctx.beginPath();
  ctx.moveTo(x + s, top);
  ctx.lineTo(x + s + d, top - d);
  ctx.lineTo(x + s + d, ground - d);
  ctx.lineTo(x + s, ground);
  ctx.closePath();
  ctx.fillStyle = lin(ctx, x + s, top, x + s + d, ground, [[0, '#c9930f'], [1, '#7d5a05']]);
  ctx.fill();
  // 上面
  ctx.beginPath();
  ctx.moveTo(x, top);
  ctx.lineTo(x + d, top - d);
  ctx.lineTo(x + s + d, top - d);
  ctx.lineTo(x + s, top);
  ctx.closePath();
  ctx.fillStyle = lin(ctx, x, top - d, x + s, top, [[0, '#fff4c4'], [0.5, '#ffe07a'], [1, '#f0bf3a']]);
  ctx.fill();
  // 正面
  ctx.fillStyle = lin(ctx, x, top, x + s, ground, [[0, '#ffd75e'], [0.45, '#e9b223'], [1, '#b8860b']]);
  ctx.fillRect(x, top, s, s);
  if (s >= 6) {
    // 斜めの光の帯
    ctx.save();
    ctx.beginPath();
    ctx.rect(x, top, s, s);
    ctx.clip();
    ctx.fillStyle = 'rgba(255,255,255,0.28)';
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
    ctx.restore();
    // 角の光
    ctx.strokeStyle = 'rgba(255,250,220,0.9)';
    ctx.lineWidth = Math.max(1, s * 0.025);
    ctx.beginPath();
    ctx.moveTo(x, ground);
    ctx.lineTo(x, top);
    ctx.lineTo(x + s, top);
    ctx.lineTo(x + s + d, top - d);
    ctx.stroke();
    ctx.strokeStyle = 'rgba(120,80,0,0.5)';
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

/** 4つの角のきらめき */
function star(ctx: Ctx, cx: number, cy: number, r: number): void {
  if (r < 1.5) return;
  ctx.fillStyle = 'rgba(255,255,255,0.95)';
  ctx.beginPath();
  ctx.moveTo(cx, cy - r);
  ctx.quadraticCurveTo(cx, cy, cx + r, cy);
  ctx.quadraticCurveTo(cx, cy, cx, cy + r);
  ctx.quadraticCurveTo(cx, cy, cx - r, cy);
  ctx.quadraticCurveTo(cx, cy, cx, cy - r);
  ctx.fill();
}
