// 金塊と「次に追い越す物」を同じ縮尺で描く（設計書 3.3）。
// 物は輪郭と名前だけの簡単な図形【案】。金塊は正面と上面の2面の立方体。刻印・ロゴは入れない

import { sideCm } from '../core/gold';
import { type CompareObject, config, objects } from '../data';
import { t } from '../i18n';
import type { MessageKey } from '../i18n/types';
import { formatSize } from '../core/format';
import { artExtent, drawArt, drawGoldCube, groundShadow, star } from './art';

/** 物の名前（ja.json の objects。全部の id の名前があることは data.ts で検査済み） */
export function objectName(o: CompareObject): string {
  return t(`objects.${o.id}` as MessageKey);
}

/** 上面の奥行き（一辺に対する割合）。上面は右上へずらして描く */
export const DEPTH = 0.35;
/** 物と金塊のあいだ（px） */
export const GAP_PX = 24;
/** 左右の余白（px） */
const SIDE_PAD = 16;
/** 名前を書かないときの、床の高さ（px） */
const FLOOR_H = 14;
/** 床にものさしを描くときの、床の高さ（px） */
const RULER_H = 26;
const BOUNCE_MS = 160;

type Size = { w: number; h: number };

/**
 * 縮尺（1cm あたりの px）。
 * - 次の物の高さが、絵の領域の高さ×ratio になる縮尺
 * - 金塊（上面の奥行きを含む）が次の物より大きく描かれるときは、金塊が入るように下げる
 * - 物＋あいだ＋金塊の幅が領域に入らないときも下げる（確認事項 Q2：浴槽など横長の物）
 * - 全部追い越したあとは、金塊が領域の ratio になる縮尺で、最後の物と並べる
 */
export function computeScale(
  area: Size,
  side: number,
  next: CompareObject | null,
  last: CompareObject,
  ratio: number,
  pad = SIDE_PAD,
  gap = GAP_PX,
): number {
  const goldExtent = side * (1 + DEPTH);
  const targetH = area.h * ratio;
  const obj = next ?? last;
  // 物は奥行きのぶん右上に広がる（立体の絵。art.ts の artExtent）
  const ext = artExtent(obj);
  let s = next ? targetH / Math.max(ext.h, goldExtent) : targetH / goldExtent;
  const availW = area.w - pad * 2 - gap;
  if (availW > 0) s = Math.min(s, availW / (ext.w + goldExtent));
  return s;
}

export type Scene = {
  el: HTMLCanvasElement;
  /** 状態が変わったら呼ぶ。bounce：タップで金塊を弾ませる */
  update(spent: number, passed: number, bounce: boolean): void;
  /** 金塊の真ん中の位置（画面の座標）。金の粒を飛ばす先 */
  goldPoint(): { x: number; y: number } | null;
  /** 追い越したときのきらめき（金塊のまわりに光が弾ける） */
  burst(): void;
  destroy(): void;
};

const BURST_MS = 700;

function cssVar(name: string, fallback: string): string {
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return v || fallback;
}

function reducedMotion(): boolean {
  return typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
}

type SceneOptions = {
  /** 物の名前を絵の下に書くか（プレイ画面は絵の上に大きく出すので書かない） */
  label?: boolean;
  /** 床に cm のものさしを描くか（名前を書かないときだけ） */
  ruler?: boolean;
  /** 金塊に「一辺〇cm」の札と寸法線を付けるか */
  sizeTag?: boolean;
};

/** 絵の下に取る高さ（名前・ものさし・床） */
function bottomHeight(label: boolean, ruler: boolean, fontPx = 13): number {
  if (label) return fontPx + 15;
  return ruler ? RULER_H : FLOOR_H;
}

export function createScene(opts: SceneOptions = {}): Scene {
  const label = opts.label ?? true;
  const ruler = !label && (opts.ruler ?? false);
  const sizeTag = opts.sizeTag ?? false;
  const bottomH = bottomHeight(label, ruler);
  const canvas = document.createElement('canvas');
  canvas.className = 'scene';
  const ctx = canvas.getContext('2d');
  const last = objects[objects.length - 1]!;

  let size: Size = { w: 0, h: 0 };
  let spent = 0;
  let passed = 0;
  let scale = 0;
  // ズーム（次の物が替わったとき、zoomMs かけて縮尺を変える）
  let zoom: { from: number; start: number } | null = null;
  let bounceStart = -Infinity;
  let burstStart = -Infinity;
  let gold: GoldBox | null = null;
  let raf = 0;

  const next = () => objects[passed] ?? null;
  const side = () => sideCm(spent, config.gold);
  const target = () => (size.h > 0 ? computeScale({ w: size.w, h: size.h - bottomH }, side(), next(), last, config.view.nextObjectHeightRatio) : 0);

  const resize = () => {
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    size = { w: rect.width, h: rect.height };
    canvas.width = Math.round(rect.width * dpr);
    canvas.height = Math.round(rect.height * dpr);
    ctx?.setTransform(dpr, 0, 0, dpr, 0, 0);
    zoom = null;
    scale = target();
    draw(performance.now());
  };

  const ro = new ResizeObserver(resize);
  ro.observe(canvas);

  function frame(now: number) {
    raf = 0;
    draw(now);
    const zooming = zoom !== null;
    const bouncing = now - bounceStart < BOUNCE_MS;
    const bursting = now - burstStart < BURST_MS;
    if (zooming || bouncing || bursting) raf = requestAnimationFrame(frame);
  }

  function kick() {
    if (!raf) raf = requestAnimationFrame(frame);
  }

  function draw(now: number) {
    if (!ctx || size.w === 0) return;
    const goal = target();
    if (zoom) {
      const p = Math.min(1, (now - zoom.start) / config.view.zoomMs);
      const e = 1 - (1 - p) ** 3;
      // 縮尺は何百倍も変わるので、対数で補間して一定の速さで引いて見せる
      scale = zoom.from > 0 && goal > 0 ? Math.exp(Math.log(zoom.from) + (Math.log(goal) - Math.log(zoom.from)) * e) : goal;
      if (p >= 1) zoom = null;
    } else {
      scale = goal;
    }

    ctx.clearRect(0, 0, size.w, size.h);
    // 金塊（タップで少し弾む。下を軸に伸び縮み）
    const bp = (now - bounceStart) / BOUNCE_MS;
    const k = bp >= 0 && bp < 1 && !reducedMotion() ? 1 + 0.08 * Math.sin(Math.PI * bp) : 1;
    gold = paintScene(ctx, { x: 0, y: 0, w: size.w, h: size.h }, spent, passed, scale, { bounce: k, label, ruler, sizeTag });
    const bt = (now - burstStart) / BURST_MS;
    if (bt >= 0 && bt < 1 && gold) paintBurst(ctx, gold, bt);
  }

  return {
    el: canvas,
    goldPoint() {
      if (!gold) return null;
      const r = canvas.getBoundingClientRect();
      return { x: r.left + gold.cx, y: r.top + gold.cy };
    },
    burst() {
      if (reducedMotion()) return;
      burstStart = performance.now();
      kick();
    },
    update(nextSpent, nextPassed, bounce) {
      const nextChanged = nextPassed !== passed;
      if (nextChanged && !reducedMotion() && scale > 0) zoom = { from: scale, start: performance.now() };
      spent = nextSpent;
      passed = nextPassed;
      if (bounce) bounceStart = performance.now();
      kick();
    },
    destroy() {
      ro.disconnect();
      if (raf) cancelAnimationFrame(raf);
    },
  };
}

type Box = { x: number; y: number; w: number; h: number };
/** 描いた金塊の真ん中（cx, cy）と見た目の大きさ（size：上面と右の面を含めた幅） */
type GoldBox = { cx: number; cy: number; size: number };

/** 追い越したときのきらめき。t は 0〜1（経過の割合） */
function paintBurst(ctx: CanvasRenderingContext2D, g: GoldBox, t: number): void {
  const size = Math.max(g.size, 24);
  const ease = 1 - (1 - t) ** 2;
  const alpha = 1 - t;
  // 金色の輪が広がる
  ctx.strokeStyle = `rgba(242,201,76,${0.7 * alpha})`;
  ctx.lineWidth = 3 * (1 - t) + 1;
  ctx.beginPath();
  ctx.arc(g.cx, g.cy, size * (0.4 + 0.9 * ease), 0, Math.PI * 2);
  ctx.stroke();
  // きらめきが外へ飛ぶ
  const n = 10;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 + (i % 2) * 0.3;
    const d = size * (0.35 + (i % 2 ? 0.75 : 1.05) * ease);
    const r = size * 0.09 * (1 - t * 0.6) * (i % 2 ? 0.7 : 1);
    star(ctx, g.cx + Math.cos(a) * d, g.cy + Math.sin(a) * d, r, i % 3 === 0 ? `rgba(255,255,255,${alpha})` : `rgba(255,214,90,${alpha})`);
  }
}
type PaintOptions = {
  bounce?: number;
  fontPx?: number;
  lineWidth?: number;
  pad?: number;
  gap?: number;
  label?: boolean;
  ruler?: boolean;
  sizeTag?: boolean;
  /** 札の文字の大きさ（px） */
  tagPx?: number;
};

const FONT = '"TGB Rounded", system-ui, "Hiragino Sans", "Noto Sans JP", sans-serif';
/** ものさしの1目盛りの候補（cm） */
const RULER_UNITS = [0.01, 0.02, 0.05, 0.1, 0.2, 0.5, 1, 2, 5, 10, 20, 50, 100, 200, 500, 1000];

/** 床のものさし（UI 改善 ★2）。物の左端を 0 にして、縮尺に合わせて 1cm・10cm・1m などの目盛りを描く */
function paintRuler(ctx: CanvasRenderingContext2D, x0: number, xEnd: number, ground: number, height: number, s: number): void {
  if (!(s > 0) || xEnd - x0 < 30) return;
  const u = RULER_UNITS.find((c) => c * s >= 52) ?? RULER_UNITS[RULER_UNITS.length - 1]!;
  const major = u * s;
  const minorN = major / 5 >= 6 ? 5 : major / 2 >= 6 ? 2 : 1;
  const top = ground + 2;
  // 木のものさしの帯
  ctx.fillStyle = 'rgba(236,214,166,0.55)';
  ctx.fillRect(x0, top, xEnd - x0, height - 4);
  ctx.strokeStyle = '#a8916a';
  ctx.fillStyle = '#7a6a4e';
  ctx.lineWidth = 1;
  ctx.font = `700 10px ${FONT}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'bottom';
  for (let i = 0; x0 + (i * major) / minorN <= xEnd + 0.5; i++) {
    const x = Math.round(x0 + (i * major) / minorN) + 0.5;
    const isMajor = i % minorN === 0;
    ctx.beginPath();
    ctx.moveTo(x, top);
    ctx.lineTo(x, top + (isMajor ? 8 : 4));
    ctx.stroke();
    if (isMajor) {
      const text = i === 0 ? '0' : formatSize((i / minorN) * u);
      const tw = ctx.measureText(text).width;
      if (x + tw / 2 <= xEnd) ctx.fillText(text, x, top + height - 4);
    }
  }
}

/** 金塊の「一辺〇cm」の札と、左側の寸法線（UI 改善 ★1） */
function paintSizeTag(ctx: CanvasRenderingContext2D, box: Box, gx: number, ground: number, gs: number, sideCmValue: number, px: number): void {
  const d = gs * DEPTH;
  const top = ground - gs;
  const color = '#a87b0a';
  // 寸法線（正面の左、上から地面まで）
  if (gs >= 16) {
    const lx = Math.round(gx - Math.max(6, px * 0.5)) + 0.5;
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(lx, top + 1);
    ctx.lineTo(lx, ground - 1);
    ctx.moveTo(lx - 4, top + 1);
    ctx.lineTo(lx + 4, top + 1);
    ctx.moveTo(lx - 4, ground - 1);
    ctx.lineTo(lx + 4, ground - 1);
    ctx.stroke();
  }
  // 札（金塊の上。はみ出すときは枠の中に収める）
  const text = t('play.sideTag', { size: formatSize(sideCmValue) });
  ctx.font = `800 ${px}px ${FONT}`;
  const tw = ctx.measureText(text).width;
  const pw = tw + px * 1.2;
  const ph = px * 1.7;
  const cx = gx + (gs * (1 + DEPTH)) / 2;
  const tipY = Math.max(top - d - 4, box.y + ph + 8);
  const py = tipY - 6 - ph;
  const pxl = Math.min(Math.max(cx - pw / 2, box.x + 4), box.x + box.w - pw - 4);
  ctx.fillStyle = 'rgba(255,255,255,0.95)';
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.roundRect(pxl, py, pw, ph, ph / 2);
  ctx.fill();
  ctx.stroke();
  // 金塊を指す小さな三角
  const ax = Math.min(Math.max(cx, pxl + ph / 2), pxl + pw - ph / 2);
  ctx.beginPath();
  ctx.moveTo(ax - 5, py + ph - 0.5);
  ctx.lineTo(ax, tipY);
  ctx.lineTo(ax + 5, py + ph - 0.5);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(ax - 5, py + ph);
  ctx.lineTo(ax, tipY);
  ctx.lineTo(ax + 5, py + ph);
  ctx.stroke();
  ctx.fillStyle = color;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, pxl + pw / 2, py + ph / 2 + 1);
}

/**
 * 枠 box の中に、地面・次の物（全部追い越したら最後の物）・物の名前・金塊を描く。
 * scale を省くと、その枠に合う縮尺（computeScale）で描く。プレイ・結果画面と結果画像で使う
 */
export function paintScene(ctx: CanvasRenderingContext2D, box: Box, spent: number, passed: number, scale?: number, opt: PaintOptions = {}): GoldBox {
  const fontPx = opt.fontPx ?? 13;
  const label = opt.label ?? true;
  const ruler = !label && (opt.ruler ?? false);
  const labelH = bottomHeight(label, ruler, fontPx);
  const pad = opt.pad ?? SIDE_PAD;
  const gap = opt.gap ?? GAP_PX;
  const k = opt.bounce ?? 1;
  const last = objects[objects.length - 1]!;
  const next = objects[passed] ?? null;
  const side = sideCm(spent, config.gold);
  const s = scale ?? computeScale({ w: box.w, h: box.h - labelH }, side, next, last, config.view.nextObjectHeightRatio, pad, gap);

  const ground = box.y + box.h - labelH;
  const obj = next ?? last;
  const sidePx = side * s;
  const objW = obj.w * s;
  // 物の奥行き（右上へのずらし）と、奥行きを含めた見た目の幅
  const dp = (obj.d ?? 0) * DEPTH * s;
  const extW = objW + dp;
  const goldW = sidePx * (1 + DEPTH);
  const x0 = box.x + (box.w - (extW + gap + goldW)) / 2;

  // 床（地面から下をうすい色で塗り、上との境に線）
  ctx.fillStyle = 'rgba(214,196,160,0.18)';
  ctx.fillRect(box.x, ground, box.w, box.y + box.h - ground);
  ctx.strokeStyle = cssVar('--line', '#e6e3da');
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(box.x + pad, ground + 0.5);
  ctx.lineTo(box.x + box.w - pad, ground + 0.5);
  ctx.stroke();
  if (ruler) paintRuler(ctx, x0, box.x + box.w - pad, ground, labelH, s);

  // 影
  groundShadow(ctx, x0 + extW / 2, ground, extW);
  groundShadow(ctx, x0 + extW + gap + goldW / 2, ground, goldW * k);

  drawObject(ctx, obj, x0, ground, objW, obj.h * s, opt.lineWidth ?? 2, dp);

  // 物の名前
  if (label) {
    ctx.fillStyle = cssVar('--text-sub', '#6b665c');
    ctx.font = `700 ${fontPx}px "TGB Rounded", system-ui, "Hiragino Sans", "Noto Sans JP", sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText(objectName(obj), x0 + objW / 2, ground + Math.round(fontPx * 0.45));
  }

  // 弾んでいる間（k > 1）はきらめきを強くする
  const gx = x0 + extW + gap + (goldW - goldW * k) / 2;
  drawGoldCube(ctx, gx, ground, sidePx * k, DEPTH, Math.min(1, (k - 1) / 0.08));
  const gs = sidePx * k;
  if (opt.sizeTag && spent > 0) paintSizeTag(ctx, box, gx, ground, gs, side, opt.tagPx ?? 12);
  return { cx: gx + (gs * (1 + DEPTH)) / 2, cy: ground - (gs * (1 + DEPTH)) / 2, size: gs * (1 + DEPTH) };
}

function drawObject(ctx: CanvasRenderingContext2D, obj: CompareObject, x: number, ground: number, w: number, h: number, lineWidth: number, dp: number) {
  const y = ground - h;
  // イラストがある物はイラストで描く。ない物（JSON で足した物）は shape の輪郭で描く
  if (drawArt(ctx, obj.id, x, y, w, h, lineWidth, dp)) return;
  ctx.fillStyle = cssVar('--surface', '#f5f5f2');
  ctx.strokeStyle = cssVar('--text-sub', '#6b665c');
  ctx.lineWidth = lineWidth;
  ctx.beginPath();
  switch (obj.shape) {
    case 'ellipse':
    case 'circle':
      ctx.ellipse(x + w / 2, y + h / 2, w / 2, h / 2, 0, 0, Math.PI * 2);
      break;
    case 'roundRect':
      ctx.roundRect(x, y, w, h, Math.min(w, h) * 0.18);
      break;
    case 'trapezoid': {
      const inset = w * 0.12;
      ctx.moveTo(x, y);
      ctx.lineTo(x + w, y);
      ctx.lineTo(x + w - inset, ground);
      ctx.lineTo(x + inset, ground);
      ctx.closePath();
      break;
    }
    default:
      ctx.rect(x, y, w, h);
  }
  ctx.fill();
  ctx.stroke();
}
