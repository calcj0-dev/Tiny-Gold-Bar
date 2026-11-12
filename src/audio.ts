// 効果音（設計書 1.4）。素材ファイルは使わず Web Audio で合成する。
// iOS は利用者が触ったときに AudioContext を作る・再開する必要がある（設計書 5.6）。
// 音の中身（チャリン・ファンファーレ・下がる2音）は作業 #4 で足す

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

/** 鳴っている音。連打したら前の音を止めて新しい音を鳴らす（設計書 1.4） */
let playing: OscillatorNode[] = [];

export function play(tones: Tone[]): void {
  if (!settings.sound || !ctx || ctx.state !== 'running') return;
  for (const osc of playing) {
    try {
      osc.stop();
    } catch {
      // すでに止まっている
    }
  }
  playing = [];
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
    g.gain.exponentialRampToValueAtTime(peak, t0 + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + tone.dur);
    osc.connect(g).connect(ctx.destination);
    osc.start(t0);
    osc.stop(t0 + tone.dur + 0.02);
    playing.push(osc);
  }
}
