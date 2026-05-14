// src/constants/ringtones.js
export const RINGTONE_PRESETS = [
  {
    id: 'classic',
    name: '📱 Classic',
    description: 'Bip-bip klasik',
    play: (ctx) => {
      const ring = () => {
        [0, 0.22].forEach(offset => {
          const osc = ctx.createOscillator(), g = ctx.createGain();
          osc.connect(g); g.connect(ctx.destination);
          osc.type = 'sine'; osc.frequency.value = 520;
          const t = ctx.currentTime + offset;
          g.gain.setValueAtTime(0, t);
          g.gain.linearRampToValueAtTime(0.3, t + 0.02);
          g.gain.linearRampToValueAtTime(0, t + 0.18);
          osc.start(t); osc.stop(t + 0.21);
        });
      };
      ring(); return { ring, interval: 1400 };
    }
  },
  {
    id: 'marimba',
    name: '🎵 Marimba',
    description: 'Nada marimba ceria',
    play: (ctx) => {
      const notes = [523, 659, 784, 659]; // C5 E5 G5 E5
      const ring = () => {
        notes.forEach((freq, i) => {
          const osc = ctx.createOscillator(), g = ctx.createGain();
          osc.connect(g); g.connect(ctx.destination);
          osc.type = 'triangle'; osc.frequency.value = freq;
          const t = ctx.currentTime + i * 0.12;
          g.gain.setValueAtTime(0, t);
          g.gain.linearRampToValueAtTime(0.25, t + 0.01);
          g.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
          osc.start(t); osc.stop(t + 0.19);
        });
      };
      ring(); return { ring, interval: 1800 };
    }
  },
  {
    id: 'digital',
    name: '🤖 Digital',
    description: 'Nada digital futuristik',
    play: (ctx) => {
      const ring = () => {
        [0, 0.1, 0.2, 0.3].forEach((offset, i) => {
          const osc = ctx.createOscillator(), g = ctx.createGain();
          osc.connect(g); g.connect(ctx.destination);
          osc.type = 'square';
          osc.frequency.value = i % 2 === 0 ? 880 : 660;
          const t = ctx.currentTime + offset;
          g.gain.setValueAtTime(0, t);
          g.gain.linearRampToValueAtTime(0.15, t + 0.005);
          g.gain.linearRampToValueAtTime(0, t + 0.07);
          osc.start(t); osc.stop(t + 0.08);
        });
      };
      ring(); return { ring, interval: 1200 };
    }
  },
  {
    id: 'gentle',
    name: '🌊 Gentle',
    description: 'Nada lembut menenangkan',
    play: (ctx) => {
      const ring = () => {
        [[440, 0], [554, 0.3], [659, 0.6]].forEach(([freq, offset]) => {
          const osc = ctx.createOscillator(), g = ctx.createGain();
          osc.connect(g); g.connect(ctx.destination);
          osc.type = 'sine'; osc.frequency.value = freq;
          const t = ctx.currentTime + offset;
          g.gain.setValueAtTime(0, t);
          g.gain.linearRampToValueAtTime(0.2, t + 0.05);
          g.gain.linearRampToValueAtTime(0.1, t + 0.2);
          g.gain.linearRampToValueAtTime(0, t + 0.4);
          osc.start(t); osc.stop(t + 0.41);
        });
      };
      ring(); return { ring, interval: 2200 };
    }
  },
  {
    id: 'urgent',
    name: '🚨 Urgent',
    description: 'Nada mendesak keras',
    play: (ctx) => {
      const ring = () => {
        for (let i = 0; i < 6; i++) {
          const osc = ctx.createOscillator(), g = ctx.createGain();
          osc.connect(g); g.connect(ctx.destination);
          osc.type = 'sawtooth';
          osc.frequency.value = i % 2 === 0 ? 1200 : 900;
          const t = ctx.currentTime + i * 0.08;
          g.gain.setValueAtTime(0, t);
          g.gain.linearRampToValueAtTime(0.18, t + 0.01);
          g.gain.linearRampToValueAtTime(0, t + 0.06);
          osc.start(t); osc.stop(t + 0.07);
        }
      };
      ring(); return { ring, interval: 1100 };
    }
  },
];
