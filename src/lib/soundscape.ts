/**
 * Web Audio API procedural soundscape engine.
 * Three looping ambient scenes synthesized at runtime — no audio assets,
 * zero copyright concerns. Each scene composes several layers (drone,
 * texture, events) routed through a shared master gain.
 */

export type SceneId = 'tree' | 'corridor' | 'teahouse';

interface Layer {
  start: () => void;
  stop: () => void;
}

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let activeScene: SceneId | null = null;
let activeLayers: Layer[] = [];

/**
 * Generation token — bumped on every playScene/stopScene. Each eventScheduler
 * captures the generation at construction time and refuses to fire once the
 * token has moved on. This guarantees that oscillators scheduled in a
 * previous scene cannot leak into the next one.
 */
let sceneGen = 0;

function ensureContext(): AudioContext {
  if (!ctx) {
    const Ctor = window.AudioContext || (window as any).webkitAudioContext;
    ctx = new Ctor();
    master = ctx.createGain();
    master.gain.value = 0.9;
    master.connect(ctx.destination);
  }
  if (ctx.state === 'suspended') void ctx.resume();
  return ctx;
}

function now(): number {
  return ctx!.currentTime;
}

type FilterType = 'lowpass' | 'bandpass' | 'highpass' | 'lowshelf' | 'highshelf';

/** White-noise buffer source, looped. */
function createNoiseSource(): AudioBufferSourceNode {
  const c = ctx!;
  const len = c.sampleRate * 2;
  const buf = c.createBuffer(1, len, c.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
  const src = c.createBufferSource();
  src.buffer = buf;
  src.loop = true;
  return src;
}

/** Pink-ish noise via filtered white noise. */
function pinkLayer(opts: {
  freq: number;
  q?: number;
  gain: number;
  type?: FilterType;
}): Layer {
  const c = ctx!;
  const out = c.createGain();
  out.gain.value = opts.gain;

  const filter = c.createBiquadFilter();
  filter.type = opts.type ?? 'bandpass';
  filter.frequency.value = opts.freq;
  filter.Q.value = opts.q ?? 1;

  const src = createNoiseSource();
  src.connect(filter).connect(out).connect(master!);
  src.start();

  return {
    start: () => {},
    stop: () => {
      const t = now();
      src.stop(t + 0.1);
    },
  };
}

/** Slowly modulated noise layer (e.g. flowing water, rain). */
function modulatedNoiseLayer(opts: {
  baseFreq: number;
  lfoFreq: number;
  depth: number;
  gain: number;
  type?: FilterType;
}): Layer {
  const c = ctx!;
  const out = c.createGain();
  out.gain.value = opts.gain;

  const filter = c.createBiquadFilter();
  filter.type = opts.type ?? 'bandpass';
  filter.frequency.value = opts.baseFreq;
  filter.Q.value = 0.8;

  const lfo = c.createOscillator();
  lfo.frequency.value = opts.lfoFreq;
  const lfoGain = c.createGain();
  lfoGain.gain.value = opts.depth;
  lfo.connect(lfoGain).connect(filter.frequency);

  const src = createNoiseSource();
  src.connect(filter).connect(out).connect(master!);
  src.start();
  lfo.start();

  return {
    start: () => {},
    stop: () => {
      const t = now();
      src.stop(t + 0.1);
      lfo.stop(t + 0.1);
    },
  };
}

/** Soft sustained pad via sine/triangle oscillators — warm, non-buzzy bed. */
function stringDroneLayer(opts: {
  freqs: number[];
  gain: number;
  detune?: number;
}): Layer {
  const c = ctx!;
  const out = c.createGain();
  out.gain.value = 0;
  out.gain.linearRampToValueAtTime(opts.gain, now() + 1.5);

  const filter = c.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = 900;
  filter.Q.value = 0.35;
  filter.connect(out).connect(master!);

  const oscs = opts.freqs.map((f, i) => {
    const o = c.createOscillator();
    o.type = 'triangle';
    o.frequency.value = f;
    o.detune.value = (i - 1) * (opts.detune ?? 4);
    o.connect(filter);
    o.start();
    return o;
  });

  return {
    start: () => {},
    stop: () => {
      const t = now();
      out.gain.cancelScheduledValues(t);
      out.gain.setValueAtTime(out.gain.value, t);
      out.gain.linearRampToValueAtTime(0, t + 0.4);
      oscs.forEach((o) => o.stop(t + 0.5));
    },
  };
}

/** Scheduler that fires discrete events (gong hits, bird chirps, etc.). */
function eventScheduler(opts: {
  minInterval: number;
  maxInterval: number;
  fire: (when: number) => void;
}): Layer {
  let stopped = false;
  let timer: ReturnType<typeof setTimeout> | null = null;
  let nextAt = now() + 0.5 + Math.random() * 0.5;
  // Capture the generation this scheduler belongs to — stale schedulers refuse to fire.
  const myGen = sceneGen;

  const tick = () => {
    if (stopped || myGen !== sceneGen) return;
    const t = now();
    if (t >= nextAt) {
      opts.fire(t);
      const gap = opts.minInterval + Math.random() * (opts.maxInterval - opts.minInterval);
      nextAt = t + gap;
    }
    timer = setTimeout(tick, 120);
  };
  timer = setTimeout(tick, 120);

  return {
    start: () => {},
    stop: () => {
      stopped = true;
      if (timer) clearTimeout(timer);
    },
  };
}

/**
 * Guqin (古琴) pluck — silk-string zither with a deep, woody resonance.
 * Triangle carrier (warmer fundamental than sine) + gentle FM upper-partial
 * that adds harmonics without metallic ringing + a tuned body resonance
 * peak. Pluck envelope: sharp transient, long exponential decay (~4s) —
 * the signature sustained singing tone of the guqin.
 */
function guqinPluck(when: number, freq: number, gain = 0.18): void {
  const c = ctx!;

  // Fundamental — triangle gives a soft but present body, like a finger-plucked silk string.
  const carrier = c.createOscillator();
  carrier.type = 'triangle';
  carrier.frequency.value = freq;

  // Subtle harmonic exciter via light FM — ratio 3:1 yields the second octave
  // partial that makes the string sound "alive" without going metallic.
  // The modulator's gain is shaped by the same envelope as the carrier so it
  // decays with the note — otherwise the running modulator keeps wobbling the
  // carrier's frequency at low amplitude and produces a "breath / hiss" tail.
  const mod = c.createOscillator();
  mod.type = 'sine';
  mod.frequency.value = freq * 3.0;
  const modGain = c.createGain();
  modGain.gain.setValueAtTime(0, when);

  // Body resonance — a peaking filter at ~1.4× the fundamental, broad and
  // gentle so it colours the timbre without spiking a single frequency
  // (which would produce a "boop" attack transient).
  const body = c.createBiquadFilter();
  body.type = 'peaking';
  body.frequency.value = freq * 1.4;
  body.Q.value = 1.0;
  body.gain.value = 3;

  // Overall warmth — smooth low-pass removes any string harshness.
  const warm = c.createBiquadFilter();
  warm.type = 'lowpass';
  warm.frequency.value = 2000;
  warm.Q.value = 0.4;

  // Pluck envelope: 5ms transient (the finger nail catch) → long exp decay.
  const env = c.createGain();
  env.gain.setValueAtTime(0, when);
  env.gain.linearRampToValueAtTime(gain, when + 0.005);
  env.gain.linearRampToValueAtTime(gain * 0.6, when + 0.12);
  env.gain.exponentialRampToValueAtTime(0.0001, when + 4.0);

  // Modulator depth follows the carrier envelope so the FM effect decays
  // with the note — no lingering modulation after the pluck has died away.
  const modDepth = freq * 0.18;
  modGain.gain.linearRampToValueAtTime(modDepth, when + 0.005);
  modGain.gain.exponentialRampToValueAtTime(0.0001, when + 3.0);

  mod.connect(modGain).connect(carrier.frequency);
  carrier.connect(body).connect(warm).connect(env).connect(master!);
  carrier.start(when);
  mod.start(when);
  carrier.stop(when + 4.1);
  mod.stop(when + 4.1);
}

/** Gong/drum hit — low sine burst with fast decay. */
function gongHit(when: number, freq = 110, gain = 0.35): void {
  const c = ctx!;
  const osc = c.createOscillator();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(freq * 2.2, when);
  osc.frequency.exponentialRampToValueAtTime(freq, when + 0.08);

  const env = c.createGain();
  env.gain.setValueAtTime(0, when);
  env.gain.linearRampToValueAtTime(gain, when + 0.005);
  env.gain.exponentialRampToValueAtTime(0.0001, when + 0.9);

  osc.connect(env).connect(master!);
  osc.start(when);
  osc.stop(when + 1.0);
}

/** Pentatonic scale notes for guqin melody (C major pentatonic). */
const GUQIN_NOTES = [261.63, 293.66, 329.63, 392.0, 440.0, 523.25];

/**
 * Gaohu (高胡) style sustained bowed note — the signature lead instrument
 * of Cantonese music. Triangle carrier + slight FM vibrato + slow bow-style
 * attack/release envelope gives the singing, sustained tone quality.
 */
function gaohuNote(when: number, freq: number, dur: number, gain = 0.12): void {
  const c = ctx!;
  const carrier = c.createOscillator();
  carrier.type = 'triangle';
  carrier.frequency.value = freq;

  // Subtle vibrato — bow hand wobble characteristic of bowed strings.
  const vibrato = c.createOscillator();
  vibrato.type = 'sine';
  vibrato.frequency.value = 5.2;
  const vibratoGain = c.createGain();
  vibratoGain.gain.value = freq * 0.006;
  vibrato.connect(vibratoGain).connect(carrier.frequency);

  // Warm body resonance, gentle low-pass to remove any harshness.
  const filter = c.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = 2200;
  filter.Q.value = 0.6;

  // Bow-style envelope: slow swell in, sustain, slow release.
  const env = c.createGain();
  env.gain.setValueAtTime(0, when);
  env.gain.linearRampToValueAtTime(gain, when + 0.18);
  env.gain.setValueAtTime(gain, when + dur - 0.5);
  env.gain.exponentialRampToValueAtTime(0.0001, when + dur);

  carrier.connect(filter).connect(env).connect(master!);
  carrier.start(when);
  vibrato.start(when);
  carrier.stop(when + dur + 0.05);
  vibrato.stop(when + dur + 0.05);
}

/**
 * Yangqin (扬琴) — struck dulcimer; bright, percussive, grain-like notes that
 * decorate the beat. Fast-attack sine + upper harmonic, near-instant decay.
 */
function yangqinNote(when: number, freq: number, gain = 0.08): void {
  const c = ctx!;
  const fundamental = c.createOscillator();
  fundamental.type = 'sine';
  fundamental.frequency.value = freq;
  const harmonic = c.createOscillator();
  harmonic.type = 'sine';
  harmonic.frequency.value = freq * 3.94; // inharmonic metallic zither partial
  const harmonicGain = c.createGain();
  harmonicGain.gain.value = 0.35;

  const filter = c.createBiquadFilter();
  filter.type = 'highpass';
  filter.frequency.value = 280;

  const env = c.createGain();
  env.gain.setValueAtTime(0, when);
  env.gain.linearRampToValueAtTime(gain, when + 0.005);
  env.gain.exponentialRampToValueAtTime(0.0001, when + 0.55);

  fundamental.connect(env);
  harmonic.connect(harmonicGain).connect(env);
  env.connect(filter).connect(master!);
  fundamental.start(when);
  harmonic.start(when);
  fundamental.stop(when + 0.6);
  harmonic.stop(when + 0.6);
}

/**
 * Qinqin (秦琴) — mid-register plucked silk-string lute; warm, soft chordal
 * pad that anchors the ensemble's harmony. Triangle pair, slow pluck envelope.
 */
function qinqinChord(when: number, freqs: number[], dur: number, gain = 0.05): void {
  const c = ctx!;
  const filter = c.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.value = 700;
  filter.Q.value = 0.5;

  const env = c.createGain();
  env.gain.setValueAtTime(0, when);
  env.gain.linearRampToValueAtTime(gain, when + 0.03);
  env.gain.exponentialRampToValueAtTime(0.0001, when + dur);

  freqs.forEach((f) => {
    const o = c.createOscillator();
    o.type = 'triangle';
    o.frequency.value = f;
    o.connect(env);
    o.start(when);
    o.stop(when + dur + 0.05);
  });

  env.connect(filter).connect(master!);
}

/**
 * Dizi (笛子) — bamboo transverse flute; bright, airy counter-melody voice.
 * Sine + triangle blend with breath noise and pronounced vibrato. Plays an
 * octave above the gaohu for the canonical ensemble "answer" voice.
 */
function diziNote(when: number, freq: number, dur: number, gain = 0.07): void {
  const c = ctx!;
  const carrier = c.createOscillator();
  carrier.type = 'sine';
  carrier.frequency.value = freq;

  const airy = c.createOscillator();
  airy.type = 'triangle';
  airy.frequency.value = freq;
  const airyGain = c.createGain();
  airyGain.gain.value = 0.4;

  // Stronger, slower vibrato than gaohu — dizi has the most pronounced breath wobble.
  const vibrato = c.createOscillator();
  vibrato.type = 'sine';
  vibrato.frequency.value = 5.6;
  const vibratoGain = c.createGain();
  vibratoGain.gain.value = freq * 0.012;
  vibrato.connect(vibratoGain).connect(carrier.frequency);
  vibrato.connect(vibratoGain).connect(airy.frequency);

  // Breath noise component — soft band-passed hiss that gives "air through bamboo".
  const breath = createNoiseSource();
  const breathFilter = c.createBiquadFilter();
  breathFilter.type = 'bandpass';
  breathFilter.frequency.value = freq * 2;
  breathFilter.Q.value = 0.7;
  const breathGain = c.createGain();
  breathGain.gain.value = gain * 0.18;

  const filter = c.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = 3200;
  filter.Q.value = 0.4;

  const env = c.createGain();
  env.gain.setValueAtTime(0, when);
  env.gain.linearRampToValueAtTime(gain, when + 0.1);
  env.gain.setValueAtTime(gain, when + dur - 0.4);
  env.gain.exponentialRampToValueAtTime(0.0001, when + dur);

  carrier.connect(filter);
  airy.connect(airyGain).connect(filter);
  breath.connect(breathFilter).connect(breathGain).connect(filter);
  filter.connect(env).connect(master!);

  carrier.start(when);
  airy.start(when);
  vibrato.start(when);
  breath.start(when);
  carrier.stop(when + dur + 0.05);
  airy.stop(when + dur + 0.05);
  vibrato.stop(when + dur + 0.05);
  breath.stop(when + dur + 0.05);
}

/**
 * Bangzi (梆子 / 木鱼) — hardwood clapper that marks the beat in Cantonese
 * opera percussion (锣鼓经). Short filtered noise burst + low thunk.
 */
function bangziHit(when: number, gain = 0.16): void {
  const c = ctx!;
  // Wood "clack" — very short high-frequency noise transient.
  const len = Math.floor(c.sampleRate * 0.04);
  const buf = c.createBuffer(1, len, c.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) {
    data[i] = (Math.random() * 2 - 1) * (1 - i / len);
  }
  const src = c.createBufferSource();
  src.buffer = buf;
  const hp = c.createBiquadFilter();
  hp.type = 'highpass';
  hp.frequency.value = 1800;
  const clackEnv = c.createGain();
  clackEnv.gain.setValueAtTime(gain * 0.8, when);
  clackEnv.gain.exponentialRampToValueAtTime(0.0001, when + 0.04);
  src.connect(hp).connect(clackEnv).connect(master!);
  src.start(when);

  // Resonant "thunk" body.
  const body = c.createOscillator();
  body.type = 'sine';
  body.frequency.setValueAtTime(420, when);
  body.frequency.exponentialRampToValueAtTime(180, when + 0.05);
  const bodyEnv = c.createGain();
  bodyEnv.gain.setValueAtTime(gain, when);
  bodyEnv.gain.exponentialRampToValueAtTime(0.0001, when + 0.12);
  body.connect(bodyEnv).connect(master!);
  body.start(when);
  body.stop(when + 0.14);
}

/**
 * Small gong (小锣) — bright metallic ping, the colouristic accent in
 * Cantonese opera percussion. Two detuned sines with quick exponential decay.
 */
function smallGongHit(when: number, gain = 0.12): void {
  const c = ctx!;
  const fundamental = 1450 + Math.random() * 150;
  const osc1 = c.createOscillator();
  osc1.type = 'sine';
  osc1.frequency.value = fundamental;
  const osc2 = c.createOscillator();
  osc2.type = 'sine';
  osc2.frequency.value = fundamental * 2.76; // inharmonic metallic relationship

  const env = c.createGain();
  env.gain.setValueAtTime(0, when);
  env.gain.linearRampToValueAtTime(gain, when + 0.004);
  env.gain.exponentialRampToValueAtTime(0.0001, when + 0.6);

  osc1.connect(env);
  osc2.connect(env);
  env.connect(master!);
  osc1.start(when);
  osc2.start(when);
  osc1.stop(when + 0.65);
  osc2.stop(when + 0.65);
}

/**
 * Distant stage murmur — faint band-passed noise evoking a teahouse-theatre
 * audience rustling behind the performance. No discernible voices, just
 * atmospheric presence so the bangzi/gaohu feel "on stage".
 */
function stageMurmur(when: number, dur: number, gain = 0.018): void {
  const c = ctx!;
  const src = createNoiseSource();
  const bp = c.createBiquadFilter();
  bp.type = 'bandpass';
  bp.frequency.value = 600;
  bp.Q.value = 0.6;
  const env = c.createGain();
  env.gain.setValueAtTime(0, when);
  env.gain.linearRampToValueAtTime(gain, when + 0.4);
  env.gain.linearRampToValueAtTime(gain, when + dur - 0.4);
  env.gain.linearRampToValueAtTime(0, when + dur);
  src.connect(bp).connect(env).connect(master!);
  src.start(when);
  src.stop(when + dur + 0.05);
}

/** Bird chirp — fast frequency-swept sine pair. */
function birdChirp(when: number): void {
  const c = ctx!;
  const base = 2400 + Math.random() * 1200;
  const osc = c.createOscillator();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(base, when);
  osc.frequency.linearRampToValueAtTime(base * 1.4, when + 0.06);
  osc.frequency.linearRampToValueAtTime(base * 0.9, when + 0.12);

  const env = c.createGain();
  env.gain.setValueAtTime(0, when);
  env.gain.linearRampToValueAtTime(0.12, when + 0.01);
  env.gain.exponentialRampToValueAtTime(0.0001, when + 0.18);

  osc.connect(env).connect(master!);
  osc.start(when);
  osc.stop(when + 0.2);
}

/** Market bustle — short filtered noise burst with formant band. */
function marketBurst(when: number): void {
  const c = ctx!;
  const src = c.createBufferSource();
  const len = Math.floor(c.sampleRate * 0.35);
  const buf = c.createBuffer(1, len, c.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) {
    const a = 1 - i / len;
    data[i] = (Math.random() * 2 - 1) * a * a;
  }
  src.buffer = buf;

  const filter = c.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.value = 700 + Math.random() * 600;
  filter.Q.value = 4;

  const env = c.createGain();
  env.gain.value = 0.08;

  src.connect(filter).connect(env).connect(master!);
  src.start(when);
}

/**
 * Teahouse chatter bed (茶馆人声嗡嗡) — the aggregate murmur of a full hall
 * of patrons, too distant to resolve into words but warm and present.
 * Two stacked band-passed noise layers (one around male fundamental ~150Hz,
 * one around female/formant ~500Hz) with independent slow LFOs so the
 * "crowd" swells and breathes naturally rather than sitting flat.
 */
function teahouseChatterBed(gain = 0.022): Layer {
  const c = ctx!;

  const out = c.createGain();
  out.gain.value = gain;

  const makeBand = (centre: number, lfoFreq: number, depth: number): void => {
    const src = createNoiseSource();
    const bp = c.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = centre;
    bp.Q.value = 0.7;

    // Slow LFO modulates the band centre — the crowd's energy wanders,
    // never locking to one frequency.
    const lfo = c.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.value = lfoFreq;
    const lfoGain = c.createGain();
    lfoGain.gain.value = depth;
    lfo.connect(lfoGain).connect(bp.frequency);

    src.connect(bp).connect(out).connect(master!);
    src.start();
    lfo.start();
  };

  // Male-formant low band + female/formant mid band.
  makeBand(165, 0.13, 35);
  makeBand(520, 0.21, 90);

  return {
    start: () => {},
    stop: () => {},
  };
}

/**
 * Cup clink (杯盏轻碰) — ceramic-on-ceramic or lid-on-cup impact; the
 * signature frequent sound of a teahouse in action. Two stacked inharmonic
 * sines with a very fast exponential decay, pitched high (1.8–3.2kHz) and
 * soft (low gain) so a constant chatter never becomes fatiguing.
 */
function cupClink(when: number, gain = 0.05): void {
  const c = ctx!;
  const base = 1800 + Math.random() * 1400;
  const osc1 = c.createOscillator();
  osc1.type = 'sine';
  osc1.frequency.value = base;
  const osc2 = c.createOscillator();
  osc2.type = 'sine';
  osc2.frequency.value = base * 1.84; // ceramic inharmonic partial

  const env = c.createGain();
  env.gain.setValueAtTime(0, when);
  env.gain.linearRampToValueAtTime(gain, when + 0.002);
  env.gain.exponentialRampToValueAtTime(0.0001, when + 0.18);

  osc1.connect(env);
  osc2.connect(env);
  env.connect(master!);
  osc1.start(when);
  osc2.start(when);
  osc1.stop(when + 0.2);
  osc2.stop(when + 0.2);
}

/**
 * Distant furniture thud (远处桌椅闷响) — a low, muffled impact from across
 * the hall: a chair shifted, a stack of trays set down, an abacus dropped
 * on a counter. Low-passed noise burst + sub thump, kept very quiet.
 */
function furnitureThud(when: number, gain = 0.07): void {
  const c = ctx!;

  // Soft noise body — low-passed, evokes wood-on-wood bloom.
  const len = Math.floor(c.sampleRate * 0.18);
  const buf = c.createBuffer(1, len, c.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) {
    const a = 1 - i / len;
    data[i] = (Math.random() * 2 - 1) * a * a;
  }
  const src = c.createBufferSource();
  src.buffer = buf;
  const lp = c.createBiquadFilter();
  lp.type = 'lowpass';
  lp.frequency.value = 320;
  const env = c.createGain();
  env.gain.value = gain * 0.7;
  src.connect(lp).connect(env).connect(master!);
  src.start(when);

  // Sub thump — sine pitched low, short decay.
  const thump = c.createOscillator();
  thump.type = 'sine';
  thump.frequency.setValueAtTime(120, when);
  thump.frequency.exponentialRampToValueAtTime(70, when + 0.12);
  const thumpEnv = c.createGain();
  thumpEnv.gain.setValueAtTime(0, when);
  thumpEnv.gain.linearRampToValueAtTime(gain, when + 0.01);
  thumpEnv.gain.exponentialRampToValueAtTime(0.0001, when + 0.3);
  thump.connect(thumpEnv).connect(master!);
  thump.start(when);
  thump.stop(when + 0.35);
}

/**
 * Raindrop on wooden corridor (雨打木廊) — a single soft splash-thock.
 * Short mid-band noise transient (water impact) + low resonant thunk
 * (wooden plank vibrating). Layered at varying intervals to evoke a
 * corridor roof being pattered by rain.
 */
function raindropHit(when: number, gain = 0.06): void {
  const c = ctx!;

  // Water "tick" — very short high-passed noise transient.
  const len = Math.floor(c.sampleRate * 0.03);
  const buf = c.createBuffer(1, len, c.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
  const src = c.createBufferSource();
  src.buffer = buf;
  const hp = c.createBiquadFilter();
  hp.type = 'highpass';
  hp.frequency.value = 2400;
  const tickEnv = c.createGain();
  tickEnv.gain.setValueAtTime(gain * 0.7, when);
  tickEnv.gain.exponentialRampToValueAtTime(0.0001, when + 0.03);
  src.connect(hp).connect(tickEnv).connect(master!);
  src.start(when);

  // Wooden plank resonance — pitched sine thunk that rings briefly.
  const body = c.createOscillator();
  body.type = 'sine';
  const bodyFreq = 180 + Math.random() * 80;
  body.frequency.setValueAtTime(bodyFreq * 1.6, when);
  body.frequency.exponentialRampToValueAtTime(bodyFreq, when + 0.04);
  const bodyEnv = c.createGain();
  bodyEnv.gain.setValueAtTime(0, when);
  bodyEnv.gain.linearRampToValueAtTime(gain, when + 0.005);
  bodyEnv.gain.exponentialRampToValueAtTime(0.0001, when + 0.18);
  body.connect(bodyEnv).connect(master!);
  body.start(when);
  body.stop(when + 0.2);
}

/** Tea pour — rising filtered noise (water into cup). */
/**
 * Tea pour (茶汤注入声) — water streaming from a pot into a small teacup.
 * Built entirely from filtered noise so there is no pitched "boop" transient:
 *   1. Main pour body — soft low-passed noise with a slow swell, the core
 *      "ssshhh" of the stream.
 *   2. Cup-filling pitch rise — a band-passed layer whose centre frequency
 *      climbs as the cup fills (the well-known ascending whistle of liquid
 *      in a vessel).
 *   3. Surface splash — sparse, very short high-passed noise bursts for the
 *      droplets bouncing off the tea surface.
 * No sine pulses — every component is broadband, so the ear hears flowing
 * water rather than a synthesised "ting" or "boop".
 */
function teaPour(when: number): void {
  const c = ctx!;

  // 1. Main pour body — the soft ssshhh of the stream.
  const body = createNoiseSource();
  const bodyFilter = c.createBiquadFilter();
  bodyFilter.type = 'lowpass';
  bodyFilter.frequency.value = 900;
  bodyFilter.Q.value = 0.5;
  const bodyEnv = c.createGain();
  bodyEnv.gain.setValueAtTime(0, when);
  // Gentle ramp-in — the stream doesn't start instantly.
  bodyEnv.gain.linearRampToValueAtTime(0.09, when + 0.18);
  bodyEnv.gain.linearRampToValueAtTime(0.07, when + 1.0);
  bodyEnv.gain.exponentialRampToValueAtTime(0.0001, when + 1.5);
  body.connect(bodyFilter).connect(bodyEnv).connect(master!);
  body.start(when);
  body.stop(when + 1.6);

  // 2. Cup-filling pitch rise — band-passed noise whose centre climbs as
  // the cup fills. This is the cue that reads unambiguously as "liquid
  // in a vessel" to the ear.
  const fill = createNoiseSource();
  const fillFilter = c.createBiquadFilter();
  fillFilter.type = 'bandpass';
  fillFilter.frequency.setValueAtTime(700, when);
  fillFilter.frequency.exponentialRampToValueAtTime(1800, when + 1.2);
  fillFilter.Q.value = 1.4;
  const fillEnv = c.createGain();
  fillEnv.gain.setValueAtTime(0, when);
  fillEnv.gain.linearRampToValueAtTime(0.05, when + 0.2);
  fillEnv.gain.linearRampToValueAtTime(0.04, when + 1.0);
  fillEnv.gain.exponentialRampToValueAtTime(0.0001, when + 1.4);
  fill.connect(fillFilter).connect(fillEnv).connect(master!);
  fill.start(when);
  fill.stop(when + 1.5);

  // 3. Surface splash — 2–4 brief high-passed noise bursts (droplets
  // striking the surface). High-passed noise grains sound like real splash
  // particles, unlike sine pulses which read as synthetic "ticks".
  const dropCount = 2 + Math.floor(Math.random() * 3);
  for (let i = 0; i < dropCount; i++) {
    const dt = when + 0.3 + Math.random() * 1.0;
    const grainLen = Math.floor(c.sampleRate * 0.05);
    const buf = c.createBuffer(1, grainLen, c.sampleRate);
    const data = buf.getChannelData(0);
    for (let j = 0; j < grainLen; j++) data[j] = (Math.random() * 2 - 1) * (1 - j / grainLen);
    const grain = c.createBufferSource();
    grain.buffer = buf;
    const hp = c.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.value = 3000;
    const gEnv = c.createGain();
    gEnv.gain.value = 0.025;
    grain.connect(hp).connect(gEnv).connect(master!);
    grain.start(dt);
  }
}

/** === SCENE BUILDERS === */

/**
 * Compose and play one Cantonese-opera ensemble phrase starting at `when`.
 * Gaohu lead + dizi canon answer + yangqin grace + qinqin chord pad,
 * under a bangzi beat and small-gong cadence. `scale` attenuates every
 * voice so the same phrase can be reused as "distant" ambience.
 */
function playOperaPhrase(when: number, scale = 1): void {
  const t = when;

  // Bangzi keeps a slow two-beat pulse under the phrase.
  bangziHit(t + 0.1, 0.12 * scale);
  bangziHit(t + 1.6, 0.1 * scale);
  bangziHit(t + 3.1, 0.1 * scale);

  // Compose a shared 3-note pentatonic phrase once — gaohu plays it,
  // dizi echoes it canon-style one beat later an octave up.
  const phraseLen = 3;
  const phrase: number[] = [];
  let prevIdx = Math.floor(Math.random() * GUQIN_NOTES.length);
  for (let i = 0; i < phraseLen; i++) {
    const step = (Math.random() < 0.5 ? 1 : -1) * (1 + Math.floor(Math.random() * 2));
    let idx = (prevIdx + step + GUQIN_NOTES.length) % GUQIN_NOTES.length;
    if (idx === prevIdx) idx = (idx + 1) % GUQIN_NOTES.length;
    prevIdx = idx;
    phrase.push(GUQIN_NOTES[idx]);
  }

  const beat = 1.05;
  const gaohuStart = t + 0.2;
  phrase.forEach((f, i) => {
    gaohuNote(gaohuStart + i * beat, f, 1.6, 0.1 * scale);
    diziNote(gaohuStart + (i + 1) * beat, f * 2, 1.4, 0.06 * scale);
    yangqinNote(gaohuStart + i * beat + 0.02, f * 2, 0.06 * scale);
  });

  qinqinChord(gaohuStart, [phrase[0] / 2, (phrase[0] / 2) * 1.5], phraseLen * beat + 0.8, 0.04 * scale);

  smallGongHit(gaohuStart + phraseLen * beat + 0.15, 0.09 * scale);
}

function buildTreeScene(): Layer[] {
  return [
    // Faint warm pad — barely-there harmonic bed (NOT a buzzing drone).
    stringDroneLayer({ freqs: [130.81, 196.0], gain: 0.014 }),
    // Cantonese opera ensemble scene: gaohu lead + dizi canon answer +
    // yangqin arpeggio decoration + qinqin chord pad, under bangzi beat
    // and small-gong cadence. Scheduled together so they feel like one
    // performance on a distant stage. Emphasised — 粤曲弦乐 is one of the
    // two headline elements of this zone.
    eventScheduler({
      minInterval: 5.5,
      maxInterval: 8.5,
      fire: (t) => {
        // Underlying theatre ambience for the duration of the phrase.
        stageMurmur(t, 4.6, 0.01);
        playOperaPhrase(t, 1.25);
      },
    }),
    // Soft flowing water — kept as a quiet background bed so the gaohu and
    // birds remain the foreground of this zone.
    modulatedNoiseLayer({ baseFreq: 380, lfoFreq: 0.18, depth: 160, gain: 0.011, type: 'lowpass' }),
    // Morning birdsong — emphasised. Frequent short bursts of 2–3 chirps
    // so 晨鸟鸣啼 reads as a co-headline alongside the gaohu ensemble.
    eventScheduler({
      minInterval: 3.0,
      maxInterval: 6.0,
      fire: (t) => {
        const calls = 2 + Math.floor(Math.random() * 2);
        for (let i = 0; i < calls; i++) {
          birdChirp(t + i * (0.18 + Math.random() * 0.14));
        }
      },
    }),
  ];
}

function buildCorridorScene(): Layer[] {
  return [
    // Distant corridor ambience — soft band-passed air, footsteps-and-wind feel.
    pinkLayer({ freq: 2200, q: 0.4, gain: 0.03, type: 'bandpass' }),
    // Continuous rainfall wash — wide low-passed noise, the "wet curtain" behind the drops.
    modulatedNoiseLayer({ baseFreq: 900, lfoFreq: 0.6, depth: 280, gain: 0.025, type: 'lowpass' }),
    // 锣鼓声 — distant Cantonese percussion cadence.
    eventScheduler({
      minInterval: 2.5,
      maxInterval: 5.5,
      fire: (t) => {
        gongHit(t, 90 + Math.random() * 50, 0.3);
        if (Math.random() < 0.4) gongHit(t + 0.18, 160, 0.18);
      },
    }),
    // 市集叫卖 — filtered formant bursts evoking a bustling market beyond the corridor.
    eventScheduler({
      minInterval: 1.8,
      maxInterval: 3.5,
      fire: (t) => marketBurst(t),
    }),
    // 雨打木廊 — individual raindrops striking the wooden corridor roof.
    // Sparse bursts of 3–6 drops, then silence, mimicking intermittent rain.
    eventScheduler({
      minInterval: 3.0,
      maxInterval: 6.0,
      fire: (t) => {
        const count = 3 + Math.floor(Math.random() * 4);
        for (let i = 0; i < count; i++) {
          raindropHit(t + i * (0.08 + Math.random() * 0.14), 0.05 + Math.random() * 0.03);
        }
      },
    }),
  ];
}

function buildTeahouseScene(): Layer[] {
  return [
    // Crowd chatter bed — the warm murmur of a full teahouse, the soul of
    // the "馆" (public hall) atmosphere. Without this the scene reads as a
    // private studio, not a teahouse.
    teahouseChatterBed(0.022),
    // Guqin (古琴) in the background — pushed back in the mix so it feels
    // like a player in a corner of the hall rather than a featured recital.
    // Sparse, slow, low gain: a texture, not a performance.
    eventScheduler({
      minInterval: 8.0,
      maxInterval: 14.0,
      fire: (t) => {
        const notesInPhrase = Math.random() < 0.6 ? 1 : 2;
        let prevIdx = Math.floor(Math.random() * GUQIN_NOTES.length);
        for (let i = 0; i < notesInPhrase; i++) {
          const step = (Math.random() < 0.5 ? 1 : -1) * (1 + Math.floor(Math.random() * 2));
          let idx = (prevIdx + step + GUQIN_NOTES.length) % GUQIN_NOTES.length;
          if (idx === prevIdx) idx = (idx + 1) % GUQIN_NOTES.length;
          prevIdx = idx;
          guqinPluck(t + i * 2.4, GUQIN_NOTES[idx], 0.16);
        }
      },
    }),
    // 茶汤注入声 — servers refilling cups across the hall.
    eventScheduler({
      minInterval: 3.0,
      maxInterval: 5.0,
      fire: (t) => teaPour(t),
    }),
    // 杯盏轻碰 — the most frequent sound in a real teahouse: lids lifted,
    // cups set down, saucers knocked. Often in quick bursts (2–3 in a row).
    eventScheduler({
      minInterval: 1.5,
      maxInterval: 3.0,
      fire: (t) => {
        const count = 1 + Math.floor(Math.random() * 3);
        for (let i = 0; i < count; i++) {
          cupClink(t + i * (0.08 + Math.random() * 0.12), 0.045 + Math.random() * 0.02);
        }
      },
    }),
    // 远处桌椅闷响 — occasional low thuds of chairs shifting, trays set down,
    // an abacus dropped. Sparse punctuation that gives the hall a sense of
    // scale and distance.
    eventScheduler({
      minInterval: 8.0,
      maxInterval: 15.0,
      fire: (t) => furnitureThud(t, 0.06),
    }),
  ];
}

const builders: Record<SceneId, () => Layer[]> = {
  tree: buildTreeScene,
  corridor: buildCorridorScene,
  teahouse: buildTeahouseScene,
};

/** Start a scene; stops any scene currently playing. */
export function playScene(id: SceneId): void {
  ensureContext();
  stopScene();

  // Bump generation so any lingering schedulers / oscillators from the
  // previous scene stop firing. New layers built below capture this token.
  sceneGen += 1;
  activeScene = id;
  activeLayers = builders[id]();
  activeLayers.forEach((l) => l.start());

  // Fade the master back up — the stop above would have muted it to silence
  // any oscillators that were already scheduled to play in the near future.
  if (master) {
    const t = now();
    master.gain.cancelScheduledValues(t);
    master.gain.setValueAtTime(master.gain.value, t);
    master.gain.linearRampToValueAtTime(0.9, t + 0.25);
  }
}

/** Stop the active scene (if any) with a short fade. */
export function stopScene(): void {
  // Bump generation first so any pending eventScheduler fires are voided.
  sceneGen += 1;

  if (activeLayers.length) {
    activeLayers.forEach((l) => l.stop());
  }
  activeLayers = [];
  activeScene = null;

  // Master mute-and-clear: any oscillators that were already scheduled (e.g.
  // a guqin note with a 3.2s decay, or a stageMurmur noise source with 4s
  // remaining) would otherwise keep bleeding into the next scene. Snap the
  // master gain to silence to guarantee a clean cut.
  if (master && ctx) {
    const t = ctx.currentTime;
    master.gain.cancelScheduledValues(t);
    master.gain.setValueAtTime(master.gain.value, t);
    master.gain.linearRampToValueAtTime(0, t + 0.05);
  }
}

export function getActiveScene(): SceneId | null {
  return activeScene;
}
