/** Tiny Web Audio SFX — no external assets needed. */
export class AudioBus {
  constructor() {
    this.ctx = null;
    this.enabled = true;
  }

  ensure() {
    if (!this.ctx) {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) {
        this.enabled = false;
        return null;
      }
      this.ctx = new Ctx();
    }
    if (this.ctx.state === "suspended") this.ctx.resume();
    return this.ctx;
  }

  tone({ freq = 220, dur = 0.08, type = "square", gain = 0.05, slide = 0 }) {
    const ctx = this.ensure();
    if (!ctx || !this.enabled) return;
    const t0 = ctx.currentTime;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    if (slide) osc.frequency.exponentialRampToValueAtTime(Math.max(40, freq + slide), t0 + dur);
    g.gain.setValueAtTime(gain, t0);
    g.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
    osc.connect(g);
    g.connect(ctx.destination);
    osc.start(t0);
    osc.stop(t0 + dur + 0.02);
  }

  fire() {
    this.tone({ freq: 140, dur: 0.12, type: "sawtooth", gain: 0.06, slide: -80 });
    this.tone({ freq: 60, dur: 0.18, type: "square", gain: 0.04, slide: -30 });
  }

  hit() {
    this.tone({ freq: 90, dur: 0.1, type: "triangle", gain: 0.05, slide: -50 });
  }

  explode() {
    this.tone({ freq: 70, dur: 0.35, type: "sawtooth", gain: 0.07, slide: -55 });
    this.tone({ freq: 40, dur: 0.45, type: "square", gain: 0.05, slide: -20 });
  }

  win() {
    this.tone({ freq: 330, dur: 0.12, type: "triangle", gain: 0.05 });
    setTimeout(() => this.tone({ freq: 440, dur: 0.14, type: "triangle", gain: 0.05 }), 100);
    setTimeout(() => this.tone({ freq: 554, dur: 0.22, type: "triangle", gain: 0.055 }), 220);
  }

  lose() {
    this.tone({ freq: 200, dur: 0.2, type: "sawtooth", gain: 0.05, slide: -120 });
    setTimeout(() => this.tone({ freq: 90, dur: 0.35, type: "triangle", gain: 0.045, slide: -40 }), 120);
  }
}
