// 効果音（設計書 1.4・要件定義書 3章 #14）。素材ファイルは使わず Web Audio で合成する。
// iOS は利用者が触ったときに AudioContext を作る・再開する必要がある（設計書 5.6）

import { settings } from './settings';

let ctx: AudioContext | null = null;

/** 最初のタッチ・クリックで呼ぶ。以後は鳴らせるようになる */
export function unlockAudio(): void {
  try {
    if (!ctx) {
      const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Ctor) return;
      ctx = new Ctor();
    }
    if (ctx.state === 'suspended') void ctx.resume();
  } catch {
    ctx = null;
  }
}

export type Tone = {
  freq: number;
  /** 終わりの周波数（音の高さを動かすとき） */
  to?: number;
  type?: OscillatorType;
  /** 開始までの遅れ（秒） */
  at?: number;
  dur: number;
  gain?: number;
};

/**
 * 鳴っている音（系統ごと）。連打したら同じ系統の前の音を止めて新しい音を鳴らす（設計書 1.4）。
 * 買う音（buy）と、ファンファーレ・結果の音（fx）は別の系統にして、連打でファンファーレが切れないようにする
 */
type Channel = 'buy' | 'fx';
const playing: Record<Channel, OscillatorNode[]> = { buy: [], fx: [] };

function play(tones: Tone[], channel: Channel): void {
  if (!settings.sound || !ctx || ctx.state !== 'running') return;
  for (const osc of playing[channel]) {
    try {
      osc.stop();
    } catch {
      // すでに止まっている
    }
  }
  playing[channel] = [];
  const now = ctx.currentTime;
  for (const tone of tones) {
    const t0 = now + (tone.at ?? 0);
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = tone.type ?? 'sine';
    osc.frequency.setValueAtTime(tone.freq, t0);
    if (tone.to) osc.frequency.exponentialRampToValueAtTime(tone.to, t0 + tone.dur);
    const peak = tone.gain ?? 0.15;
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(peak, t0 + 0.005);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + tone.dur);
    osc.connect(g).connect(ctx.destination);
    osc.start(t0);
    osc.stop(t0 + tone.dur + 0.02);
    playing[channel].push(osc);
  }
}

/**
 * 「チャリン」の音の中身。level は金額の段階（0＝一番小さい金額）、levels は段階の数。
 * 金額が大きいほど低く、長く、少し大きく（重く）する。テストのため音を鳴らさずに作れるようにする
 */
export function chariTones(level: number, levels: number): Tone[] {
  const r = levels > 1 ? Math.min(Math.max(level / (levels - 1), 0), 1) : 0;
  // 2,600Hz（100円）〜 700Hz（1,000万円）を、耳で等間隔に聞こえるよう指数で分ける
  const f = 2600 * (700 / 2600) ** r;
  const dur = 0.09 + 0.22 * r;
  const gain = 0.08 + 0.06 * r;
  return [
    { freq: f, type: 'triangle', dur, gain },
    { freq: f * 2.76, dur: dur * 0.6, gain: gain * 0.35 },
    // 「リン」：少し遅れて上の音
    { freq: f * 1.5, type: 'triangle', at: 0.045, dur: dur * 1.3, gain: gain * 0.8 },
  ];
}

export const sfx = {
  /** 「金を買う」：チャリン（金額が大きいほど低く重い。6段階） */
  buy(level: number, levels: number): void {
    play(chariTones(level, levels), 'buy');
  },
  /** 物を追い越した：短いファンファーレ */
  pass(): void {
    play(
      [
        { freq: 783.99, type: 'square', dur: 0.1, gain: 0.06 },
        { freq: 987.77, type: 'square', at: 0.09, dur: 0.1, gain: 0.06 },
        { freq: 1174.66, type: 'square', at: 0.18, dur: 0.1, gain: 0.06 },
        { freq: 1567.98, type: 'square', at: 0.27, dur: 0.38, gain: 0.07 },
        { freq: 783.99, type: 'triangle', at: 0.27, dur: 0.38, gain: 0.1 },
      ],
      'fx',
    );
    // ファンファーレのときはチャリンを止める（音を1回にする。設計書 1.4）
    play([], 'buy');
  },
  /** 結果画面を開いた：「ちっさ…」という感じの下がる2音 */
  result(): void {
    play(
      [
        { freq: 659.25, to: 622.25, type: 'triangle', dur: 0.22, gain: 0.13 },
        { freq: 440, to: 392, type: 'triangle', at: 0.26, dur: 0.6, gain: 0.13 },
      ],
      'fx',
    );
  },
};
