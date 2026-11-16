// Synthesised sound: every effect is a small WebAudio patch, no audio files.
// The context is created on the first user gesture; M toggles mute.

export function createAudio() {
  let ctx = null;
  let muted = false;
  let drone = null;

  function ensure() {
    if (ctx) return ctx;
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
      return ctx;
    } catch {
      return null;
    }
  }

  function tone(freq, dur, type, gain, when = 0, slideTo = 0) {
    if (muted) return;
    const c = ensure();
    if (!c) return;
    const t0 = c.currentTime + when;
    const osc = c.createOscillator();
    const g = c.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(Math.max(20, slideTo), t0 + dur);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(gain, t0 + 0.015);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(g).connect(c.destination);
    osc.start(t0);
    osc.stop(t0 + dur + 0.05);
  }

  function noise(dur, gain, lowpass) {
    if (muted) return;
    const c = ensure();
    if (!c) return;
    const len = Math.floor(c.sampleRate * dur);
    const buf = c.createBuffer(1, len, c.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i += 1) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = c.createBufferSource();
    src.buffer = buf;
    const filter = c.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = lowpass;
    const g = c.createGain();
    g.gain.value = gain;
    src.connect(filter).connect(g).connect(c.destination);
    src.start();
  }

  return {
    unlock() {
      const c = ensure();
      if (c && c.state === 'suspended') c.resume().catch(() => {});
      if (c && !drone) {
        // A low river drone, barely there, under everything.
        const osc = c.createOscillator();
        const g = c.createGain();
        osc.type = 'sine';
        osc.frequency.value = 55;
        g.gain.value = 0.018;
        const lfo = c.createOscillator();
        const lfoGain = c.createGain();
        lfo.frequency.value = 0.11;
        lfoGain.gain.value = 0.008;
        lfo.connect(lfoGain).connect(g.gain);
        osc.connect(g).connect(c.destination);
        osc.start();
        lfo.start();
        drone = osc;
      }
    },
    click() {
      tone(660, 0.07, 'triangle', 0.12);
    },
    select() {
      tone(784, 0.08, 'triangle', 0.12);
      tone(1046, 0.1, 'triangle', 0.1, 0.05);
    },
    pickup(bright) {
      tone(880, 0.12, 'sine', 0.16);
      tone(1318, 0.16, 'sine', 0.12, 0.06);
      if (bright) tone(1760, 0.2, 'sine', 0.1, 0.12);
    },
    golden() {
      [1046, 1318, 1760].forEach((f, i) => tone(f, 0.18, 'sine', 0.13, i * 0.07));
    },
    board() {
      tone(660, 0.12, 'sine', 0.12);
      tone(880, 0.18, 'sine', 0.1, 0.08);
    },
    graze() {
      tone(1568, 0.09, 'sine', 0.09);
    },
    wind() {
      tone(262, 0.5, 'triangle', 0.14, 0, 523);
      tone(784, 0.5, 'sine', 0.1, 0.15);
    },
    splash() {
      noise(0.35, 0.25, 900);
      tone(180, 0.25, 'sine', 0.14, 0, 60);
    },
    bell() {
      tone(523, 0.5, 'sine', 0.18);
      tone(784, 0.7, 'sine', 0.14, 0.1);
      tone(1046, 0.9, 'sine', 0.08, 0.2);
    },
    win() {
      [523, 659, 784, 1046, 1318].forEach((f, i) => tone(f, 0.5, 'triangle', 0.14, i * 0.12));
    },
    lose() {
      [392, 330, 262, 196].forEach((f, i) => tone(f, 0.5, 'sine', 0.14, i * 0.16));
    },
    toggleMute() {
      muted = !muted;
      return muted;
    },
    get muted() {
      return muted;
    },
  };
}
