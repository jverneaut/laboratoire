import { createImpulseResponse } from './createImpulseResponse';

const C0_HZ = 16.351597831287414;
const BASS_MAX_HZ = 80;
const BASS_MIN_SEMIS = -12;
const BASS_MAX_SEMIS = 0;
const IOS_SILENCE_MP3_DATA_URL =
  'data:audio/mp3;base64,//MkxAAHiAICWABElBeKPL/RANb2w+yiT1g/gTok//lP/W/l3h8QO/OCdCqCW2Cw//MkxAQHkAIWUAhEmAQXWUOFW2dxPu//9mr60ElY5sseQ+xxesmHKtZr7bsqqX2L//MkxAgFwAYiQAhEAC2hq22d3///9FTV6tA36JdgBJoOGgc+7qvqej5Zu7/7uI9l//MkxBQHAAYi8AhEAO193vt9KGOq+6qcT7hhfN5FTInmwk8RkqKImTM55pRQHQSq//MkxBsGkgoIAABHhTACIJLf99nVI///yuW1uBqWfEu7CgNPWGpUadBmZ////4sL//MkxCMHMAH9iABEmAsKioqKigsLCwtVTEFNRTMuOTkuNVVVVVVVVVVVVVVVVVVV//MkxCkECAUYCAAAAFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV';

const SYNC_SPACE_SECONDS = 26;
const SYNC_CHORD_SECONDS = 22;
const SYNC_ROOT_SECONDS = 60;
const SYNC_MODE_SECONDS = 84;
const SYNC_PAD_SECONDS = 28;
const SYNC_TONALITY_SECONDS = 140;
const SYNC_RHYTHM_SECTION_SECONDS = 96;

let RANDOM = Math.random;

const hash32 = (x) => {
  let t = x | 0;
  t = Math.imul(t ^ (t >>> 16), 0x7feb352d);
  t = Math.imul(t ^ (t >>> 15), 0x846ca68b);
  return (t ^ (t >>> 16)) >>> 0;
};

const hashToUnitFloat = (x) => {
  return hash32(x) / 4294967296;
};

const mulberry32 = (seed) => {
  let t = seed >>> 0;
  return () => {
    t += 0x6d2b79f5;
    let x = Math.imul(t ^ (t >>> 15), 1 | t);
    x ^= x + Math.imul(x ^ (x >>> 7), 61 | x);
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
};

const seedFromNow = (bucketMs) => {
  const b = Math.max(1, Math.floor(bucketMs));
  return Math.floor(Date.now() / b) >>> 0;
};

const clamp01 = (value) => {
  return Math.min(1, Math.max(0, value));
};

const clamp = (value, min, max) => {
  return Math.min(max, Math.max(min, value));
};

const randomBetween = (min, max) => {
  return min + RANDOM() * (max - min);
};

const pickWeighted = (items) => {
  const total = items.reduce((sum, entry) => sum + entry.weight, 0);
  let r = RANDOM() * total;
  for (const entry of items) {
    r -= entry.weight;
    if (r <= 0) return entry.item;
  }
  return items[items.length - 1].item;
};

const shuffleInPlace = (items) => {
  for (let i = items.length - 1; i > 0; i--) {
    const j = Math.floor(RANDOM() * (i + 1));
    [items[i], items[j]] = [items[j], items[i]];
  }
  return items;
};

const createNoiseBuffer = (context, seconds = 2, seed = 0) => {
  const sampleRate = context.sampleRate;
  const length = Math.max(1, Math.floor(sampleRate * seconds));
  const buffer = context.createBuffer(1, length, sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < length; i++) {
    data[i] = hashToUnitFloat(seed + i) * 2 - 1;
  }
  return buffer;
};

const semitonesToRatio = (semitones) => {
  return Math.pow(2, semitones / 12);
};

const limitBassSemis = (rootHz, semis) => {
  let s = semis;
  while (s > BASS_MAX_SEMIS) s -= 12;
  s = clamp(s, BASS_MIN_SEMIS, BASS_MAX_SEMIS);
  let hz = rootHz * semitonesToRatio(s);
  let guard = 0;
  while (hz > BASS_MAX_HZ && guard++ < 6) {
    s -= 12;
    if (s < BASS_MIN_SEMIS) {
      s = BASS_MIN_SEMIS;
      break;
    }
    hz *= 0.5;
  }
  return clamp(s, BASS_MIN_SEMIS, BASS_MAX_SEMIS);
};

export class DroneEngine {
  constructor(options = {}) {
    this.state = 'stopped';
    this.startedOnce = false;
    this.htmlAudioUnlocked = false;
    this.htmlUnlockTag = null;
    this.context = null;
    this.analyser = null;
    this.masterGain = null;
    this.outputGain = null;
    this.oscillator = null;
    this.lfo = null;
    this.voices = [];
    this.harmonyVoices = [];
    this.harmonicVoices = [];
    this.bass = null;
    this.fx = null;
    this.harmonyFx = null;
    this.mastering = null;
    this.tape = null;
    this.noise = null;
    this.kick = null;
    this.delay = null;
    this.snare = null;
    this.reverb = null;
    this.pad = null;
    this.evolutionTimer = null;
    const seedBucketMs = options.seedBucketMs ?? 86400000;
    const seedWasProvided = typeof options.seed === 'number';
    const seed = options.seed ?? seedFromNow(seedBucketMs);
    this.options = {
      frequencyHz: options.frequencyHz ?? C0_HZ,
      volume: clamp01(options.volume ?? 0.35),
      reverbSeconds: options.reverbSeconds ?? 9,
      reverbDecay: options.reverbDecay ?? 4.8,
      seed,
      seedBucketMs,
      syncToWallClock: options.syncToWallClock ?? true,
    };
    this.rootHz = this.options.frequencyHz;
    this.seedBucketMs = seedBucketMs;
    this.syncToWallClock = this.options.syncToWallClock;
    this.seed = seed;
    this.seedWasProvided = seedWasProvided;
  }

  getState() {
    return this.state;
  }

  getSeed() {
    return this.seed;
  }

  setSeed(seed) {
    this.seed = seed >>> 0;
    this.options.seed = this.seed;
    this.seedWasProvided = true;
  }

  getAnalyserNode() {
    return this.analyser;
  }

  setVolume(volume) {
    const next = clamp01(volume);
    this.options.volume = next;
    if (!this.context || !this.outputGain) return;
    this.outputGain.gain.setTargetAtTime(next, this.context.currentTime, 0.05);
  }

  async start() {
    if (this.state === 'running' || this.state === 'starting') return;
    this.state = 'starting';
    if (!this.context) {
      const AudioContextCtor =
        globalThis.AudioContext || globalThis.webkitAudioContext;
      if (!AudioContextCtor) {
        this.state = 'stopped';
        throw new Error('WebAudio is not available in this browser.');
      }
      this.context = new AudioContextCtor({ latencyHint: 'playback' });
    }
    // iOS Safari often needs an explicit "unlock" started from a user gesture.
    // Important: do not `await` before calling these, or iOS may consider them
    // outside of the user gesture call stack.
    const resumePromise = this.context.resume();
    try {
      const unlock = this.context.createBufferSource();
      unlock.buffer = this.context.createBuffer(1, 1, this.context.sampleRate);
      unlock.connect(this.context.destination);
      unlock.start(0);
      unlock.stop(0);
    } catch {
      // Ignore
    }
    // Some iOS setups (mute switch) also require an HTML5 audio element to be played
    // during a user gesture before WebAudio will output.
    if (!this.htmlAudioUnlocked) {
      try {
        const doc = globalThis.document;
        if (doc) {
          const tag =
            this.htmlUnlockTag ??
            (() => {
              const el = doc.createElement('audio');
              el.preload = 'auto';
              el.loop = false;
              el.controls = false;
              el.muted = false;
              el.volume = 1;
              el.setAttribute('playsinline', '');
              el.setAttribute('webkit-playsinline', '');
              el.playsInline = true;
              el.src = IOS_SILENCE_MP3_DATA_URL;
              el.style.position = 'fixed';
              el.style.left = '0';
              el.style.top = '0';
              el.style.width = '0';
              el.style.height = '0';
              el.style.opacity = '0';
              (doc.body ?? doc.documentElement)?.appendChild(el);
              this.htmlUnlockTag = el;
              return el;
            })();
          try {
            tag.currentTime = 0;
          } catch {
            // Ignore
          }
          try {
            tag.load();
          } catch {
            // Ignore
          }
          const p = tag.play();
          if (p && typeof p.then === 'function') {
            p.then(() => {
              this.htmlAudioUnlocked = true;
            }).catch(() => {});
          } else {
            this.htmlAudioUnlocked = true;
          }
        }
      } catch {
        // Ignore
      }
    }
    await resumePromise;
    const ctx = this.context;
    // Keep the seed stable across play/pause. If the user didn't provide a seed,
    // we still pick a Date-based seed, but only on the first start.
    if (!this.seedWasProvided && !this.startedOnce) {
      this.seed = seedFromNow(this.seedBucketMs);
      this.options.seed = this.seed;
    }
    this.startedOnce = true;
    RANDOM = mulberry32(this.seed);
    const seedEpochMs =
      Math.floor(Date.now() / this.seedBucketMs) * this.seedBucketMs;
    const timeSeed = (tag, index) => {
      return hash32(
        this.seed ^
          Math.imul(tag | 0, 0x9e3779b9) ^
          Math.imul((index + 1) | 0, 0x85ebca6b)
      );
    };
    const withTimeRng = (tag, index, fn) => {
      const prev = RANDOM;
      RANDOM = mulberry32(timeSeed(tag, index));
      try {
        fn();
      } finally {
        RANDOM = prev;
      }
    };
    let bufferSeedCounter = 1;
    const nextBufferSeed = () =>
      (this.seed ^ Math.imul(bufferSeedCounter++, 0x9e3779b9)) >>> 0;
    let irSeedCounter = 1;
    const nextIrSeed = () =>
      (this.seed ^ Math.imul(irSeedCounter++, 0x85ebca6b)) >>> 0;
    const sourceBus = ctx.createGain();
    sourceBus.gain.value = 0.75;
    const duckGain = ctx.createGain();
    duckGain.gain.value = 1;
    const masterGain = ctx.createGain();
    masterGain.gain.value = 0;
    const outputGain = ctx.createGain();
    outputGain.gain.value = 0;
    const masterHP = ctx.createBiquadFilter();
    masterHP.type = 'highpass';
    masterHP.frequency.value = 26;
    masterHP.Q.value = 0.7;
    const lowShelf = ctx.createBiquadFilter();
    lowShelf.type = 'lowshelf';
    lowShelf.frequency.value = 140;
    lowShelf.gain.value = -4.0;
    const highShelf = ctx.createBiquadFilter();
    highShelf.type = 'highshelf';
    highShelf.frequency.value = 6200;
    highShelf.gain.value = -1.2;
    const glue = ctx.createDynamicsCompressor();
    glue.threshold.value = -19;
    glue.knee.value = 32;
    glue.ratio.value = 1.25;
    glue.attack.value = 0.055;
    glue.release.value = 0.62;
    const makeup = ctx.createGain();
    makeup.gain.value = 1.85;
    const limiter = ctx.createDynamicsCompressor();
    limiter.threshold.value = -3.4;
    limiter.knee.value = 8;
    limiter.ratio.value = 14;
    limiter.attack.value = 0.004;
    limiter.release.value = 0.19;
    const clip = ctx.createWaveShaper();
    {
      const len = 2048;
      const curve = new Float32Array(len);
      for (let i = 0; i < len; i++) {
        const x = (i / (len - 1)) * 2 - 1;
        curve[i] = Math.tanh(x * 1.03);
      }
      clip.curve = curve;
      clip.oversample = '2x';
    }
    const reverbIn = ctx.createGain();
    reverbIn.gain.value = 1;
    const convolverA = ctx.createConvolver();
    convolverA.buffer = createImpulseResponse(
      ctx,
      this.options.reverbSeconds,
      this.options.reverbDecay,
      nextIrSeed()
    );
    const convolverB = ctx.createConvolver();
    convolverB.buffer = convolverA.buffer;
    const reverbWetA = ctx.createGain();
    reverbWetA.gain.value = 1;
    const reverbWetB = ctx.createGain();
    reverbWetB.gain.value = 0;
    const morphReverbImpulse = (seconds, decay) => {
      const now = ctx.currentTime;
      const fadeSeconds = 6.5;
      const nextBuffer = createImpulseResponse(
        ctx,
        seconds,
        decay,
        nextIrSeed()
      );
      if (reverbWetA.gain.value >= reverbWetB.gain.value) {
        convolverB.buffer = nextBuffer;
        reverbWetB.gain.cancelScheduledValues(now);
        reverbWetA.gain.cancelScheduledValues(now);
        reverbWetB.gain.setValueAtTime(reverbWetB.gain.value, now);
        reverbWetA.gain.setValueAtTime(reverbWetA.gain.value, now);
        reverbWetB.gain.linearRampToValueAtTime(1, now + fadeSeconds);
        reverbWetA.gain.linearRampToValueAtTime(0, now + fadeSeconds);
      } else {
        convolverA.buffer = nextBuffer;
        reverbWetA.gain.cancelScheduledValues(now);
        reverbWetB.gain.cancelScheduledValues(now);
        reverbWetA.gain.setValueAtTime(reverbWetA.gain.value, now);
        reverbWetB.gain.setValueAtTime(reverbWetB.gain.value, now);
        reverbWetA.gain.linearRampToValueAtTime(1, now + fadeSeconds);
        reverbWetB.gain.linearRampToValueAtTime(0, now + fadeSeconds);
      }
    };
    const delayIn = ctx.createGain();
    delayIn.gain.value = 0.08;
    const delay = ctx.createDelay(2.5);
    delay.delayTime.value = randomBetween(0.28, 0.54);
    const delayFilter = ctx.createBiquadFilter();
    delayFilter.type = 'lowpass';
    delayFilter.frequency.value = randomBetween(850, 1600);
    delayFilter.Q.value = 0.6;
    const delayFeedback = ctx.createGain();
    delayFeedback.gain.value = randomBetween(0.25, 0.55);
    const delayReturn = ctx.createGain();
    delayReturn.gain.value = randomBetween(0.12, 0.22);
    const delayVerbSend = ctx.createGain();
    delayVerbSend.gain.value = 0.16;
    delayIn.connect(delay);
    delay.connect(delayFilter);
    delayFilter.connect(delayReturn);
    delayReturn.connect(masterGain);
    delayReturn.connect(delayVerbSend).connect(reverbIn);
    delayFilter.connect(delayFeedback).connect(delay);
    const delayLfo = ctx.createOscillator();
    delayLfo.type = 'sine';
    delayLfo.frequency.value = randomBetween(0.008, 0.02);
    const delayLfoGain = ctx.createGain();
    delayLfoGain.gain.value = randomBetween(0.004, 0.013);
    delayLfo.connect(delayLfoGain).connect(delay.delayTime);
    const snareDelayIn = ctx.createGain();
    snareDelayIn.gain.value = 1;
    const snareDelay = ctx.createDelay(2.5);
    snareDelay.delayTime.value = 0.32;
    const snareDelayFilter = ctx.createBiquadFilter();
    snareDelayFilter.type = 'lowpass';
    snareDelayFilter.frequency.value = 2600;
    snareDelayFilter.Q.value = 0.6;
    const snareDelayFeedback = ctx.createGain();
    snareDelayFeedback.gain.value = 0.55;
    const snareDelayReturn = ctx.createGain();
    snareDelayReturn.gain.value = 0.16;
    const snareDelayVerbSend = ctx.createGain();
    snareDelayVerbSend.gain.value = 0.1;
    const snareDelayPanner = ctx.createStereoPanner();
    snareDelayPanner.pan.value = 0;
    snareDelayIn.connect(snareDelay);
    snareDelay.connect(snareDelayFilter);
    snareDelayFilter
      .connect(snareDelayPanner)
      .connect(snareDelayReturn)
      .connect(masterGain);
    snareDelayReturn.connect(snareDelayVerbSend).connect(reverbIn);
    snareDelayFilter.connect(snareDelayFeedback).connect(snareDelay);
    const snareDelayLfo = ctx.createOscillator();
    snareDelayLfo.type = 'sine';
    snareDelayLfo.frequency.value = randomBetween(0.05, 0.13);
    const snareDelayLfoGain = ctx.createGain();
    snareDelayLfoGain.gain.value = randomBetween(0.65, 0.95);
    snareDelayLfo.connect(snareDelayLfoGain).connect(snareDelayPanner.pan);
    const padGain = ctx.createGain();
    padGain.gain.value = 0;
    const padPre = ctx.createGain();
    padPre.gain.value = randomBetween(0.85, 1.35);
    const padDrive = ctx.createWaveShaper();
    {
      const len = 1024;
      const curve = new Float32Array(len);
      for (let i = 0; i < len; i++) {
        const x = (i / (len - 1)) * 2 - 1;
        curve[i] = Math.tanh(x * 1.4);
      }
      padDrive.curve = curve;
      padDrive.oversample = '2x';
    }
    const padBp = ctx.createBiquadFilter();
    padBp.type = 'bandpass';
    padBp.frequency.value = randomBetween(220, 520);
    padBp.Q.value = randomBetween(0.6, 1.3);
    const padLp = ctx.createBiquadFilter();
    padLp.type = 'lowpass';
    padLp.frequency.value = randomBetween(900, 1800);
    padLp.Q.value = 0.55;
    const padDry = ctx.createGain();
    padDry.gain.value = 0.12;
    const padVerbSend = ctx.createGain();
    padVerbSend.gain.value = 0.42;
    const padDelaySend = ctx.createGain();
    padDelaySend.gain.value = 0.22;
    padGain.connect(padPre).connect(padDrive).connect(padBp).connect(padLp);
    padLp.connect(padDry).connect(masterGain);
    padLp.connect(padVerbSend).connect(reverbIn);
    padLp.connect(padDelaySend).connect(delayIn);
    const padLfo = ctx.createOscillator();
    padLfo.type = 'sine';
    padLfo.frequency.value = randomBetween(0.006, 0.018);
    const padLfoGain = ctx.createGain();
    padLfoGain.gain.value = randomBetween(70, 190);
    padLfo.connect(padLfoGain).connect(padBp.frequency);
    const padOscs = Array.from({ length: 3 }, () => {
      const osc = ctx.createOscillator();
      osc.type = RANDOM() < 0.5 ? 'sawtooth' : 'triangle';
      osc.detune.value = randomBetween(-10, 10);
      const g = ctx.createGain();
      g.gain.value = 0.16;
      osc.connect(g).connect(padGain);
      return osc;
    });
    const oscillator = ctx.createOscillator();
    oscillator.type = 'triangle';
    oscillator.frequency.value = this.rootHz;
    const fundamentalGain = ctx.createGain();
    fundamentalGain.gain.value = 0.58;
    const bassNoteGain = ctx.createGain();
    bassNoteGain.gain.value = 1;
    const bassSceneGain = ctx.createGain();
    bassSceneGain.gain.value = 1;
    const bassMix = ctx.createGain();
    bassMix.gain.value = 0.82;
    const bassPre = ctx.createGain();
    bassPre.gain.value = randomBetween(0.7, 1.2);
    const bassDrive = ctx.createWaveShaper();
    {
      const len = 1024;
      const curve = new Float32Array(len);
      for (let i = 0; i < len; i++) {
        const x = (i / (len - 1)) * 2 - 1;
        curve[i] = Math.tanh(x * 1.0);
      }
      bassDrive.curve = curve;
      bassDrive.oversample = '2x';
    }
    const bassDriveLP = ctx.createBiquadFilter();
    bassDriveLP.type = 'lowpass';
    bassDriveLP.frequency.value = randomBetween(140, 260);
    bassDriveLP.Q.value = 0.65;
    const bassDriveGain = ctx.createGain();
    bassDriveGain.gain.value = 1;
    const bassCleanLP = ctx.createBiquadFilter();
    bassCleanLP.type = 'lowpass';
    bassCleanLP.frequency.value = randomBetween(120, 220);
    bassCleanLP.Q.value = 0.55;
    const bassCleanGain = ctx.createGain();
    bassCleanGain.gain.value = 0.0001;
    const bassPulseGain = ctx.createGain();
    bassPulseGain.gain.value = 1;
    const bassGateGain = ctx.createGain();
    bassGateGain.gain.value = 1;
    const bassHp = ctx.createBiquadFilter();
    bassHp.type = 'highpass';
    bassHp.frequency.value = 24;
    bassHp.Q.value = 0.6;
    const bassComp = ctx.createDynamicsCompressor();
    bassComp.threshold.value = -30;
    bassComp.knee.value = 18;
    bassComp.ratio.value = 4;
    bassComp.attack.value = 0.01;
    bassComp.release.value = 0.18;
    bassMix
      .connect(bassPre)
      .connect(bassDrive)
      .connect(bassDriveLP)
      .connect(bassDriveGain)
      .connect(bassPulseGain);
    bassMix.connect(bassCleanLP).connect(bassCleanGain).connect(bassPulseGain);
    bassPulseGain.connect(bassGateGain).connect(bassHp).connect(bassComp);
    const bassToFxGain = ctx.createGain();
    bassToFxGain.gain.value = 1;
    const bassToDirectGain = ctx.createGain();
    bassToDirectGain.gain.value = 0;
    const bassDirectDuck = ctx.createGain();
    bassDirectDuck.gain.value = 1;
    const bassDirectPan = ctx.createStereoPanner();
    bassDirectPan.pan.value = 0;
    bassComp.connect(bassToFxGain).connect(sourceBus);
    bassComp
      .connect(bassToDirectGain)
      .connect(bassDirectDuck)
      .connect(bassDirectPan)
      .connect(masterGain);
    oscillator
      .connect(fundamentalGain)
      .connect(bassNoteGain)
      .connect(bassSceneGain)
      .connect(bassMix);
    const harmonicMultiples = [2, 3, 4, 5, 6, 8, 10, 12];
    const harmonicVoices = harmonicMultiples.map((multiple) => {
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = this.rootHz * multiple;
      osc.detune.value = randomBetween(-6, 6);
      const gain = ctx.createGain();
      gain.gain.value = 0;
      osc.connect(gain).connect(sourceBus);
      return { osc, gain, multiple };
    });
    const harmonyBus = ctx.createGain();
    harmonyBus.gain.value = 1;
    const harmonyDrivePre = ctx.createGain();
    harmonyDrivePre.gain.value = randomBetween(0.7, 1.35);
    const harmonyDrive = ctx.createWaveShaper();
    {
      const len = 1024;
      const curve = new Float32Array(len);
      for (let i = 0; i < len; i++) {
        const x = (i / (len - 1)) * 2 - 1;
        curve[i] = Math.tanh(x * 1.6);
      }
      harmonyDrive.curve = curve;
      harmonyDrive.oversample = '2x';
    }
    const harmonyBp = ctx.createBiquadFilter();
    harmonyBp.type = 'peaking';
    harmonyBp.frequency.value = randomBetween(220, 520);
    harmonyBp.Q.value = randomBetween(0.35, 1.1);
    harmonyBp.gain.value = randomBetween(2, 7);
    const harmonyLp = ctx.createBiquadFilter();
    harmonyLp.type = 'lowpass';
    harmonyLp.frequency.value = randomBetween(1400, 3800);
    harmonyLp.Q.value = 0.55;
    harmonyBus
      .connect(harmonyDrivePre)
      .connect(harmonyDrive)
      .connect(harmonyBp)
      .connect(harmonyLp)
      .connect(sourceBus);
    const harmonyGrainSource = ctx.createBufferSource();
    harmonyGrainSource.buffer = createNoiseBuffer(ctx, 1.7, nextBufferSeed());
    harmonyGrainSource.loop = true;
    const harmonyGrainHp = ctx.createBiquadFilter();
    harmonyGrainHp.type = 'highpass';
    harmonyGrainHp.frequency.value = randomBetween(800, 1600);
    harmonyGrainHp.Q.value = 0.55;
    const harmonyGrainLp = ctx.createBiquadFilter();
    harmonyGrainLp.type = 'lowpass';
    harmonyGrainLp.frequency.value = randomBetween(3500, 7200);
    harmonyGrainLp.Q.value = 0.5;
    const harmonyGrainGain = ctx.createGain();
    harmonyGrainGain.gain.value = 0.0001;
    harmonyGrainSource
      .connect(harmonyGrainHp)
      .connect(harmonyGrainLp)
      .connect(harmonyGrainGain)
      .connect(harmonyBus);
    const harmonyVoices = Array.from({ length: 4 }, () => {
      const osc = ctx.createOscillator();
      osc.type = pickWeighted([
        { item: 'triangle', weight: 1.7 },
        { item: 'sine', weight: 1.1 },
        { item: 'sawtooth', weight: 0.45 },
      ]);
      osc.frequency.value = this.rootHz * 8;
      osc.detune.value = randomBetween(-8, 8);
      const gain = ctx.createGain();
      gain.gain.value = 0;
      const panner = ctx.createStereoPanner();
      panner.pan.value = randomBetween(-0.55, 0.55);
      osc.connect(gain).connect(panner).connect(harmonyBus);
      return { osc, gain, panner };
    });
    const noiseSource = ctx.createBufferSource();
    noiseSource.buffer = createNoiseBuffer(ctx, 2.5, nextBufferSeed());
    noiseSource.loop = true;
    const noiseHighpass = ctx.createBiquadFilter();
    noiseHighpass.type = 'highpass';
    noiseHighpass.frequency.value = 120;
    noiseHighpass.Q.value = 0.6;
    const noiseBandpass = ctx.createBiquadFilter();
    noiseBandpass.type = 'bandpass';
    noiseBandpass.frequency.value = 320;
    noiseBandpass.Q.value = 1.2;
    const noiseLowpass = ctx.createBiquadFilter();
    noiseLowpass.type = 'lowpass';
    noiseLowpass.frequency.value = 1200;
    noiseLowpass.Q.value = 0.45;
    const noiseGain = ctx.createGain();
    noiseGain.gain.value = 0.0009;
    const noiseDuck = ctx.createGain();
    noiseDuck.gain.value = 1;
    const noisePanner = ctx.createStereoPanner();
    noisePanner.pan.value = 0;
    const noiseDry = ctx.createGain();
    noiseDry.gain.value = 0.14;
    const noiseWet = ctx.createGain();
    noiseWet.gain.value = 0.12;
    const noiseLfoFreq = ctx.createOscillator();
    noiseLfoFreq.type = 'sine';
    noiseLfoFreq.frequency.value = 0.018;
    const noiseLfoFreqGain = ctx.createGain();
    noiseLfoFreqGain.gain.value = 220;
    noiseLfoFreq.connect(noiseLfoFreqGain).connect(noiseBandpass.frequency);
    const noiseLfoLowpass = ctx.createOscillator();
    noiseLfoLowpass.type = 'sine';
    noiseLfoLowpass.frequency.value = 0.009;
    const noiseLfoLowpassGain = ctx.createGain();
    noiseLfoLowpassGain.gain.value = 900;
    noiseLfoLowpass
      .connect(noiseLfoLowpassGain)
      .connect(noiseLowpass.frequency);
    const noiseLfoAmp = ctx.createOscillator();
    noiseLfoAmp.type = 'sine';
    noiseLfoAmp.frequency.value = 0.022;
    const noiseLfoAmpGain = ctx.createGain();
    noiseLfoAmpGain.gain.value = 0.00065;
    noiseLfoAmp.connect(noiseLfoAmpGain).connect(noiseGain.gain);
    const noiseLfoPan = ctx.createOscillator();
    noiseLfoPan.type = 'sine';
    noiseLfoPan.frequency.value = 0.0065;
    const noiseLfoPanGain = ctx.createGain();
    noiseLfoPanGain.gain.value = 0.35;
    noiseLfoPan.connect(noiseLfoPanGain).connect(noisePanner.pan);
    const noiseComp = ctx.createDynamicsCompressor();
    noiseComp.threshold.value = -32;
    noiseComp.knee.value = 30;
    noiseComp.ratio.value = 2.6;
    noiseComp.attack.value = 0.04;
    noiseComp.release.value = 0.65;
    noiseSource
      .connect(noiseHighpass)
      .connect(noiseBandpass)
      .connect(noiseLowpass)
      .connect(noiseGain)
      .connect(noiseDuck)
      .connect(noisePanner);
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 220;
    filter.Q.value = 0.7;
    const lfo = ctx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.value = 0.06;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 180;
    lfo.connect(lfoGain).connect(filter.frequency);
    const kickDry = ctx.createGain();
    kickDry.gain.value = 0.23;
    const kickWet = ctx.createGain();
    kickWet.gain.value = 0.16;
    const dryGain = ctx.createGain();
    dryGain.gain.value = 0.18;
    const wetGain = ctx.createGain();
    wetGain.gain.value = 0.92;
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 2048;
    analyser.smoothingTimeConstant = 0.9;
    sourceBus.connect(duckGain).connect(filter);
    const fxMix = ctx.createGain();
    fxMix.gain.value = 1;
    const fxDry = ctx.createGain();
    fxDry.gain.value = 1;
    const fxWet = ctx.createGain();
    fxWet.gain.value = 0;
    const chorusDelay = ctx.createDelay(0.1);
    chorusDelay.delayTime.value = 0.022;
    const chorusFilter = ctx.createBiquadFilter();
    chorusFilter.type = 'lowpass';
    chorusFilter.frequency.value = 2600;
    chorusFilter.Q.value = 0.55;
    const chorusLfo = ctx.createOscillator();
    chorusLfo.type = 'sine';
    chorusLfo.frequency.value = randomBetween(0.09, 0.22);
    const chorusLfoGain = ctx.createGain();
    chorusLfoGain.gain.value = randomBetween(0.0015, 0.0045);
    chorusLfo.connect(chorusLfoGain).connect(chorusDelay.delayTime);
    const phaserStages = Array.from({ length: 4 }, () => {
      const stage = ctx.createBiquadFilter();
      stage.type = 'allpass';
      stage.frequency.value = randomBetween(350, 900);
      stage.Q.value = randomBetween(0.6, 1.2);
      return stage;
    });
    const phaserLfo = ctx.createOscillator();
    phaserLfo.type = 'sine';
    phaserLfo.frequency.value = randomBetween(0.03, 0.08);
    const phaserLfoGain = ctx.createGain();
    phaserLfoGain.gain.value = randomBetween(250, 900);
    phaserLfo.connect(phaserLfoGain);
    for (const stage of phaserStages) phaserLfoGain.connect(stage.frequency);
    filter.connect(fxDry).connect(fxMix);
    filter.connect(chorusDelay);
    chorusDelay.connect(chorusFilter);
    let phaserHead = chorusFilter;
    for (const stage of phaserStages) {
      phaserHead.connect(stage);
      phaserHead = stage;
    }
    phaserHead.connect(fxWet).connect(fxMix);
    fxMix.connect(dryGain);
    fxMix.connect(reverbIn);
    reverbIn.connect(convolverA);
    reverbIn.connect(convolverB);
    convolverA.connect(reverbWetA);
    convolverB.connect(reverbWetB);
    reverbWetA.connect(wetGain);
    reverbWetB.connect(wetGain);
    convolverA.normalize = true;
    convolverB.normalize = true;
    fxMix.connect(delayIn);
    const kickComp = ctx.createDynamicsCompressor();
    kickComp.threshold.value = -22;
    kickComp.knee.value = 12;
    kickComp.ratio.value = 4;
    kickComp.attack.value = 0.005;
    kickComp.release.value = 0.12;
    const kickHP = ctx.createBiquadFilter();
    kickHP.type = 'highpass';
    kickHP.frequency.value = 34;
    kickHP.Q.value = 0.7;
    const kickLowShelf = ctx.createBiquadFilter();
    kickLowShelf.type = 'lowshelf';
    kickLowShelf.frequency.value = 120;
    kickLowShelf.gain.value = -2.5;
    kickDry
      .connect(kickHP)
      .connect(kickLowShelf)
      .connect(kickComp)
      .connect(masterGain);
    kickWet.connect(reverbIn);
    noisePanner.connect(noiseComp);
    noiseComp.connect(noiseDry).connect(masterGain);
    noiseComp.connect(noiseWet).connect(reverbIn);
    dryGain.connect(masterGain);
    wetGain.connect(masterGain);
    masterGain
      .connect(masterHP)
      .connect(lowShelf)
      .connect(highShelf)
      .connect(glue)
      .connect(makeup)
      .connect(limiter)
      .connect(clip)
      .connect(outputGain);
    outputGain.connect(analyser);
    analyser.connect(ctx.destination);
    const now = ctx.currentTime;
    masterGain.gain.setValueAtTime(0, now);
    masterGain.gain.linearRampToValueAtTime(1, now + 2);
    outputGain.gain.setValueAtTime(0, now);
    outputGain.gain.linearRampToValueAtTime(this.options.volume, now + 2.2);
    const tapeLfo = ctx.createOscillator();
    tapeLfo.type = 'sine';
    tapeLfo.frequency.value = randomBetween(0.012, 0.028);
    const tapeLfoGain = ctx.createGain();
    tapeLfoGain.gain.value = randomBetween(3.5, 8.5);
    tapeLfo.connect(tapeLfoGain);
    tapeLfoGain.connect(oscillator.detune);
    for (const voice of harmonicVoices) tapeLfoGain.connect(voice.osc.detune);
    for (const voice of harmonyVoices) tapeLfoGain.connect(voice.osc.detune);
    oscillator.start();
    lfo.start();
    tapeLfo.start();
    delayLfo.start();
    padLfo.start();
    chorusLfo.start();
    phaserLfo.start();
    harmonyGrainSource.start();
    for (const voice of harmonicVoices) voice.osc.start();
    for (const voice of harmonyVoices) voice.osc.start();
    for (const osc of padOscs) osc.start();
    noiseSource.start();
    noiseLfoFreq.start();
    noiseLfoAmp.start();
    noiseLfoLowpass.start();
    noiseLfoPan.start();
    snareDelayLfo.start();
    const scheduleHarmonics = () => {
      const t = ctx.currentTime;
      for (const voice of harmonicVoices) {
        const base = 0.11 / Math.pow(voice.multiple, 1.05);
        const target = base * Math.pow(RANDOM(), 1.6);
        voice.gain.gain.setTargetAtTime(target, t, 4.5);
        voice.osc.detune.setTargetAtTime(randomBetween(-9, 9), t, 8);
      }
    };
    const chordFlavors = [
      { name: 'minor', ratios: [1, 6 / 5, 3 / 2], weight: 1.6 },
      { name: 'major', ratios: [1, 5 / 4, 3 / 2], weight: 1.2 },
      { name: 'sus2', ratios: [1, 9 / 8, 3 / 2], weight: 1.5 },
      { name: 'sus4', ratios: [1, 4 / 3, 3 / 2], weight: 1.4 },
      { name: 'min7', ratios: [1, 6 / 5, 3 / 2, 9 / 5], weight: 1.0 },
      { name: 'maj7', ratios: [1, 5 / 4, 3 / 2, 15 / 8], weight: 0.9 },
      { name: 'add9', ratios: [1, 5 / 4, 3 / 2, 9 / 4], weight: 1.3 },
      { name: 'min9', ratios: [1, 6 / 5, 3 / 2, 9 / 4], weight: 0.8 },
      { name: 'sixth', ratios: [1, 5 / 4, 3 / 2, 5 / 3], weight: 1.0 },
    ];
    let nextChordAt = ctx.currentTime + randomBetween(8, 14);
    let nextRootAt = ctx.currentTime + randomBetween(28, 55);
    let nextSpaceAt = ctx.currentTime + randomBetween(14, 26);
    let nextModeAt = ctx.currentTime + randomBetween(38, 75);
    let nextPadAt = ctx.currentTime + randomBetween(7, 18);
    let nextTonalityAt = ctx.currentTime + randomBetween(45, 120);
    let motionMode = 'glide';
    let syncSpaceIndex = -1;
    let syncChordIndex = -1;
    let syncRootIndex = -1;
    let syncModeIndex = -1;
    let syncPadIndex = -1;
    let syncTonalityIndex = -1;
    const tonalities = [
      { name: 'ionian', scale: [0, 2, 4, 5, 7, 9, 11], weight: 1.25 },
      { name: 'mixolydian', scale: [0, 2, 4, 5, 7, 9, 10], weight: 1.15 },
      { name: 'dorian', scale: [0, 2, 3, 5, 7, 9, 10], weight: 1.1 },
      { name: 'aeolian', scale: [0, 2, 3, 5, 7, 8, 10], weight: 1.0 },
    ];
    let harmonyMode = pickWeighted([
      { item: 'scale', weight: 1.8 },
      { item: 'color', weight: 1.0 },
    ]);
    let tonality = pickWeighted(
      tonalities.map((t) => ({ item: t, weight: t.weight }))
    );
    let rootDegreeIndex = 0;
    let rootOctave = 0;
    const byName = (name) => chordFlavors.find((c) => c.name === name);
    const chordPalettes = {
      warm: [byName('major'), byName('add9'), byName('sixth'), byName('maj7')],
      neutral: [
        byName('sus2'),
        byName('sus4'),
        byName('add9'),
        byName('major'),
      ],
      dark: [byName('minor'), byName('min7'), byName('min9'), byName('sus4')],
    };
    let chordPaletteName = 'neutral';
    let activeChordFlavors = chordPalettes[chordPaletteName];
    let sceneVerb = 1;
    let sceneDelay = 1;
    let sceneNear = 1;
    let harmonyRegister = pickWeighted([
      { item: 4, weight: 0.9 },
      { item: 8, weight: 2.3 },
      { item: 16, weight: 1.0 },
    ]);
    let currentChordSemis = [0, 7, 12];
    let bassNoteSemis = 0;
    let bassNotePattern = new Array(16).fill(0);
    let bassWetMode = 'hybrid';
    let consonantScene = RANDOM() < 0.55;
    let harmonyVoiceSemis = [];
    let rootSlew = 10;
    let harmonySlew = 6.5;
    let padSlew = 7.5;
    let stepRamp = 0.25;
    let progressionEnabled = false;
    let progressionDegrees = [0, 3, 4, 0];
    let progressionIndex = 0;
    const diatonicOffset = (degreeOffset, octaveAdd = 0) => {
      const scale = tonality.scale;
      const len = Math.max(1, scale.length);
      const baseIndex = ((rootDegreeIndex % len) + len) % len;
      const baseSemis = scale[baseIndex] ?? 0;
      const absoluteIndex = baseIndex + degreeOffset;
      const targetIndex = ((absoluteIndex % len) + len) % len;
      const wraps = Math.floor(absoluteIndex / len);
      const targetSemis = (scale[targetIndex] ?? 0) + 12 * wraps;
      return targetSemis - baseSemis + 12 * octaveAdd;
    };
    const closestOffset = (current, allowed) => {
      let best = allowed[0] ?? 0;
      let bestDist = Number.POSITIVE_INFINITY;
      for (const a of allowed) {
        for (const shift of [-12, 0, 12, 24]) {
          const cand = a + shift;
          const dist = Math.abs(cand - current);
          if (dist < bestDist) {
            bestDist = dist;
            best = cand;
          }
        }
      }
      return best;
    };
    const scheduleTonality = () => {
      const t = ctx.currentTime;
      consonantScene = RANDOM() < 0.55;
      harmonyMode = consonantScene
        ? 'scale'
        : pickWeighted([
            { item: 'scale', weight: 2.0 },
            { item: 'color', weight: 1.0 },
          ]);
      if (harmonyMode === 'scale') {
        tonality = consonantScene
          ? pickWeighted([
              { item: tonalities[0], weight: 1.7 }, // ionian
              { item: tonalities[1], weight: 1.3 }, // mixolydian
              { item: tonalities[2], weight: 0.8 }, // dorian
            ])
          : pickWeighted(
              tonalities.map((x) => ({ item: x, weight: x.weight }))
            );
        rootDegreeIndex = Math.floor(RANDOM() * tonality.scale.length);
        rootOctave = pickWeighted([
          { item: 0, weight: 2.1 },
          { item: 1, weight: 1.2 },
          { item: 2, weight: consonantScene ? 0.15 : 0.25 },
        ]);
        // More "functional"/consonant scenes: shorten slew and prepare diatonic progressions.
        rootSlew = consonantScene
          ? randomBetween(0.9, 2.4)
          : randomBetween(5, 12);
        harmonySlew = consonantScene
          ? randomBetween(1.6, 4.2)
          : randomBetween(4.5, 9);
        padSlew = consonantScene
          ? randomBetween(2.5, 5.5)
          : randomBetween(5.5, 10);
        stepRamp = consonantScene
          ? randomBetween(0.08, 0.18)
          : randomBetween(0.18, 0.35);
        progressionEnabled = consonantScene;
        if (progressionEnabled) {
          progressionDegrees = pickWeighted([
            { item: [0, 5, 3, 4, 0], weight: 2.0 }, // I-vi-IV-V-I
            { item: [0, 3, 4, 0], weight: 2.3 }, // I-IV-V-I
            { item: [0, 4, 5, 3, 0], weight: 1.2 }, // I-V-vi-IV-I
            { item: [0, 1, 4, 0], weight: 0.8 }, // I-ii-V-I
          ]);
          progressionIndex = 0;
        }
      } else {
        chordPaletteName = pickWeighted([
          { item: 'neutral', weight: 1.9 },
          { item: 'warm', weight: 1.4 },
          { item: 'dark', weight: 0.9 },
        ]);
        activeChordFlavors = chordPalettes[chordPaletteName];
        rootSlew = randomBetween(6, 14);
        harmonySlew = randomBetween(5, 10);
        padSlew = randomBetween(6, 12);
        stepRamp = randomBetween(0.18, 0.35);
        progressionEnabled = false;
      }
      harmonyRegister = pickWeighted([
        { item: 4, weight: harmonyMode === 'scale' ? 1.2 : 0.75 },
        { item: 8, weight: 2.0 },
        { item: 16, weight: 1.15 },
      ]);
      noiseGain.gain.setTargetAtTime(randomBetween(0.00035, 0.00125), t, 14);
    };
    const scheduleHarmony = () => {
      const t = ctx.currentTime;
      let ratios = [];
      let semitoneIntervals = [];
      if (harmonyMode === 'scale') {
        const third = diatonicOffset(2);
        const fifth = diatonicOffset(4);
        const seventh = diatonicOffset(6);
        const ninth = diatonicOffset(1, 1);
        const eleventh = diatonicOffset(3, 1);
        const thirteenth = diatonicOffset(5, 1);
        semitoneIntervals = pickWeighted([
          { item: [third, fifth], weight: 2.1 },
          { item: [third, fifth, seventh], weight: 1.2 },
          { item: [third, fifth, ninth], weight: 1.2 },
          { item: [third, seventh], weight: 0.8 },
          { item: [fifth, ninth], weight: 0.7 },
          { item: [third, fifth, seventh, ninth], weight: 1.2 },
          { item: [third, fifth, ninth, eleventh], weight: 0.9 },
          { item: [third, fifth, seventh, thirteenth], weight: 0.7 },
          { item: [fifth, ninth, eleventh], weight: 0.7 },
        ]).slice();
        shuffleInPlace(semitoneIntervals);
        currentChordSemis = Array.from(new Set([0, ...semitoneIntervals]));
      } else {
        const flavor = pickWeighted(
          activeChordFlavors.map((c) => ({ item: c, weight: c.weight }))
        );
        ratios = shuffleInPlace(flavor.ratios.slice(1));
        const extensions = shuffleInPlace([9 / 8, 4 / 3, 5 / 3, 15 / 8, 9 / 5]);
        while (ratios.length < harmonyVoices.length && extensions.length > 0) {
          if (RANDOM() < 0.7) ratios.push(extensions.pop());
          else break;
        }
        currentChordSemis = Array.from(
          new Set([0, ...ratios.map((r) => Math.round(12 * Math.log2(r)))])
        );
      }
      if (motionMode === 'hold') {
        for (let i = 0; i < harmonyVoices.length; i++) {
          const voice = harmonyVoices[i];
          const targetGain =
            randomBetween(0.004, 0.02) * Math.pow(RANDOM(), 1.3);
          voice.gain.gain.setTargetAtTime(targetGain, t, 10);
        }
        noiseGain.gain.setTargetAtTime(randomBetween(0.0004, 0.00135), t, 14);
        noiseBandpass.Q.setTargetAtTime(randomBetween(0.75, 2.5), t, 14);
        noiseLowpass.frequency.setTargetAtTime(randomBetween(650, 2200), t, 12);
        return;
      }
      const harmonyRoot = this.rootHz * harmonyRegister;
      const allowedOffsets =
        harmonyMode === 'scale'
          ? [0, ...semitoneIntervals]
          : [0, ...currentChordSemis.filter((s) => s !== 0)];
      if (harmonyVoiceSemis.length !== harmonyVoices.length) {
        harmonyVoiceSemis = Array.from(
          { length: harmonyVoices.length },
          (_, i) => {
            const base = allowedOffsets[i % allowedOffsets.length] ?? 0;
            const octave = pickWeighted([
              { item: -12, weight: 0.7 },
              { item: 0, weight: 2.4 },
              { item: 12, weight: 1.6 },
              { item: 24, weight: 0.25 },
            ]);
            return base + octave;
          }
        );
      } else {
        const next = harmonyVoiceSemis.map((s) =>
          closestOffset(s, allowedOffsets)
        );
        const singleMove = consonantScene && RANDOM() < 0.6;
        if (singleMove && allowedOffsets.length > 1) {
          const idx = Math.floor(RANDOM() * next.length);
          const current = next[idx] ?? 0;
          const candidates = allowedOffsets
            .flatMap((a) => [a - 12, a, a + 12])
            .filter((a) => a !== current)
            .sort((a, b) => Math.abs(a - current) - Math.abs(b - current));
          const chosen = candidates[0] ?? current;
          next[idx] = chosen;
        }
        harmonyVoiceSemis = next;
      }
      for (let i = 0; i < harmonyVoices.length; i++) {
        const voice = harmonyVoices[i];
        const offset = harmonyVoiceSemis[i] ?? 0;
        const nextFreq = clamp(harmonyRoot * semitonesToRatio(offset), 55, 900);
        if (motionMode === 'step') {
          voice.osc.frequency.cancelScheduledValues(t);
          voice.osc.frequency.setValueAtTime(voice.osc.frequency.value, t);
          voice.osc.frequency.linearRampToValueAtTime(nextFreq, t + stepRamp);
        } else {
          voice.osc.frequency.setTargetAtTime(nextFreq, t, harmonySlew);
        }
        voice.osc.detune.setTargetAtTime(randomBetween(-10, 10), t, 10);
        voice.panner.pan.setTargetAtTime(randomBetween(-0.8, 0.8), t, 16);
        const targetGain =
          randomBetween(0.004, 0.04) * Math.pow(RANDOM(), 1.25);
        voice.gain.gain.setTargetAtTime(
          targetGain,
          t,
          motionMode === 'step' ? 5.5 : 8.5
        );
      }
      noiseGain.gain.setTargetAtTime(randomBetween(0.0004, 0.00135), t, 14);
      noiseBandpass.Q.setTargetAtTime(randomBetween(0.75, 2.5), t, 14);
      noiseLowpass.frequency.setTargetAtTime(randomBetween(650, 2200), t, 12);
    };
    const scheduleSpace = () => {
      const t = ctx.currentTime;
      sceneVerb = randomBetween(0.55, 1.35);
      sceneDelay = randomBetween(0.55, 1.35);
      sceneNear = randomBetween(0.75, 1.22);
      const grit = pickWeighted([
        { item: 1.0, weight: 2.6 },
        { item: 1.12, weight: 1.6 },
        { item: 1.26, weight: 0.8 },
        { item: 1.38, weight: 0.35 },
      ]);
      const chorusAmt = pickWeighted([
        { item: 0, weight: 2.2 },
        { item: randomBetween(0.1, 0.35), weight: 1.2 },
        { item: randomBetween(0.35, 0.65), weight: 0.55 },
      ]);
      const phaserAmt = pickWeighted([
        { item: 0, weight: 2.1 },
        { item: randomBetween(0.1, 0.4), weight: 1.1 },
        { item: randomBetween(0.4, 0.7), weight: 0.55 },
      ]);
      const chorusScale = consonantScene ? 0.85 : 1;
      const phaserScale = consonantScene ? 0.8 : 1;
      const wetTarget = clamp(0.75 * (chorusAmt + phaserAmt), 0, 0.9);
      fxWet.gain.setTargetAtTime(wetTarget, t, 18);
      fxDry.gain.setTargetAtTime(1 - wetTarget, t, 18);
      chorusLfo.frequency.setTargetAtTime(randomBetween(0.08, 0.24), t, 22);
      chorusLfoGain.gain.setTargetAtTime(
        randomBetween(0.001, 0.005) * (chorusAmt || 0.25) * chorusScale,
        t,
        22
      );
      phaserLfo.frequency.setTargetAtTime(randomBetween(0.025, 0.085), t, 22);
      phaserLfoGain.gain.setTargetAtTime(
        randomBetween(220, 980) * (phaserAmt || 0.25) * phaserScale,
        t,
        22
      );
      filter.frequency.setTargetAtTime(randomBetween(150, 420), t, 18);
      filter.Q.setTargetAtTime(randomBetween(0.55, 1.1), t, 22);
      lfoGain.gain.setTargetAtTime(randomBetween(110, 240), t, 24);
      dryGain.gain.setTargetAtTime(randomBetween(0.14, 0.22), t, 20);
      wetGain.gain.setTargetAtTime(randomBetween(0.86, 0.98), t, 20);
      kickDry.gain.setTargetAtTime(
        randomBetween(0.18, 0.28) * sceneNear,
        t,
        18
      );
      kickWet.gain.setTargetAtTime(
        randomBetween(0.09, 0.19) * sceneVerb,
        t,
        18
      );
      noiseDry.gain.setTargetAtTime(
        randomBetween(0.16, 0.32) * sceneNear,
        t,
        22
      );
      noiseWet.gain.setTargetAtTime(
        randomBetween(0.08, 0.2) * sceneVerb,
        t,
        22
      );
      harmonyDrivePre.gain.setTargetAtTime(randomBetween(0.55, 1.55), t, 22);
      harmonyGrainGain.gain.setTargetAtTime(
        randomBetween(0.00015, 0.0022) * sceneNear,
        t,
        26
      );
      harmonyBp.frequency.setTargetAtTime(randomBetween(240, 820), t, 22);
      harmonyBp.Q.setTargetAtTime(randomBetween(0.65, 2.1), t, 26);
      harmonyBp.gain.setTargetAtTime(randomBetween(1.5, 9), t, 26);
      harmonyLp.frequency.setTargetAtTime(randomBetween(900, 3800), t, 24);
      harmonyGrainHp.frequency.setTargetAtTime(randomBetween(700, 1900), t, 30);
      harmonyGrainLp.frequency.setTargetAtTime(
        randomBetween(2800, 7600),
        t,
        30
      );
      delayIn.gain.setTargetAtTime(randomBetween(0.04, 0.12), t, 18);
      delay.delayTime.setTargetAtTime(randomBetween(0.26, 0.68), t, 16);
      delayFeedback.gain.setTargetAtTime(randomBetween(0.18, 0.62), t, 18);
      delayFilter.frequency.setTargetAtTime(randomBetween(900, 4200), t, 20);
      delayReturn.gain.setTargetAtTime(randomBetween(0.09, 0.22), t, 18);
      delayVerbSend.gain.setTargetAtTime(
        randomBetween(0.09, 0.2) * sceneVerb,
        t,
        18
      );
      delayLfoGain.gain.setTargetAtTime(randomBetween(0.003, 0.016), t, 24);
      delayLfo.frequency.setTargetAtTime(randomBetween(0.007, 0.02), t, 30);
      tapeLfoGain.gain.setTargetAtTime(randomBetween(2.8, 9.5), t, 26);
      tapeLfo.frequency.setTargetAtTime(randomBetween(0.01, 0.032), t, 28);
      padPre.gain.setTargetAtTime(
        randomBetween(0.75, 1.35) * sceneNear * grit,
        t,
        22
      );
      harmonyDrivePre.gain.setTargetAtTime(
        randomBetween(0.55, 1.35) * grit,
        t,
        22
      );
      bassPre.gain.setTargetAtTime(randomBetween(0.6, 1.1) * grit, t, 22);
      bassDriveLP.frequency.setTargetAtTime(randomBetween(120, 290), t, 22);
      bassCleanLP.frequency.setTargetAtTime(randomBetween(95, 220), t, 22);
      if (!consonantScene && RANDOM() < 0.22) {
        morphReverbImpulse(randomBetween(6, 14), randomBetween(3.1, 6.2));
      }
    };
    const scheduleRoot = () => {
      if (motionMode === 'hold') return;
      const t = ctx.currentTime;
      let semis = 0;
      if (harmonyMode === 'scale') {
        if (progressionEnabled && consonantScene) {
          rootDegreeIndex =
            progressionDegrees[progressionIndex % progressionDegrees.length] ??
            0;
          progressionIndex += 1;
        } else {
          const move = pickWeighted([
            { item: -2, weight: 0.65 },
            { item: -1, weight: 1.2 },
            { item: 0, weight: 2.3 },
            { item: 1, weight: 1.25 },
            { item: 2, weight: 0.75 },
          ]);
          rootDegreeIndex =
            (rootDegreeIndex + move + tonality.scale.length) %
            tonality.scale.length;
        }
        if (RANDOM() < (consonantScene ? 0.08 : 0.12)) {
          rootOctave = clamp(
            rootOctave + (RANDOM() < 0.5 ? -1 : 1),
            0,
            consonantScene ? 1 : 2
          );
        }
        semis = (tonality.scale[rootDegreeIndex] ?? 0) + 12 * rootOctave;
      } else {
        const offsets = [
          { item: -2, weight: 0.7 },
          { item: 0, weight: 2.2 },
          { item: 2, weight: 1.2 },
          { item: 3, weight: 1.0 },
          { item: 5, weight: 1.05 },
          { item: 7, weight: 1.0 },
          { item: 10, weight: 0.75 },
        ];
        const octave = RANDOM() < 0.18 ? 12 : 0;
        const degree = pickWeighted(
          offsets.map((o) => ({ item: o.item, weight: o.weight }))
        );
        semis = octave + degree;
      }
      const cents = randomBetween(-8, 8);
      const nextHz = C0_HZ * semitonesToRatio(semis + cents / 100);
      bassNoteSemis = limitBassSemis(nextHz, bassNoteSemis);
      let nextBassHz = nextHz * semitonesToRatio(bassNoteSemis);
      this.rootHz = nextHz;
      if (motionMode === 'step') {
        oscillator.frequency.cancelScheduledValues(t);
        oscillator.frequency.setValueAtTime(oscillator.frequency.value, t);
        oscillator.frequency.linearRampToValueAtTime(nextBassHz, t + stepRamp);
      } else {
        oscillator.frequency.setTargetAtTime(nextBassHz, t, rootSlew);
      }
      for (const voice of harmonicVoices) {
        const next = nextHz * voice.multiple;
        if (motionMode === 'step') {
          voice.osc.frequency.cancelScheduledValues(t);
          voice.osc.frequency.setValueAtTime(voice.osc.frequency.value, t);
          voice.osc.frequency.linearRampToValueAtTime(next, t + stepRamp);
        } else {
          voice.osc.frequency.setTargetAtTime(next, t, rootSlew);
        }
      }
    };
    const scheduleMode = () => {
      const t = ctx.currentTime;
      const mode = pickWeighted([
        { item: 'glide', weight: consonantScene ? 0.6 : 1.4 },
        { item: 'step', weight: consonantScene ? 2.2 : 1.4 },
        { item: 'hold', weight: consonantScene ? 1.2 : 1.0 },
      ]);
      motionMode = mode;
      if (mode === 'hold') {
        delayFeedback.gain.setTargetAtTime(randomBetween(0.08, 0.32), t, 20);
        delayIn.gain.setTargetAtTime(randomBetween(0.02, 0.07), t, 20);
        padGain.gain.setTargetAtTime(0.0001, t, 6);
      } else {
        padGain.gain.setTargetAtTime(randomBetween(0.018, 0.05), t, 10);
      }
      noiseGain.gain.setTargetAtTime(randomBetween(0.00035, 0.00125), t, 14);
    };
    const schedulePad = () => {
      const t = ctx.currentTime;
      if (motionMode === 'hold') {
        padGain.gain.setTargetAtTime(0.0001, t, 6);
        return;
      }
      const base =
        this.rootHz *
        pickWeighted([
          { item: 8, weight: 1.1 },
          { item: 16, weight: 2.2 },
          { item: 32, weight: 0.55 },
        ]);
      let ratios = [];
      let semitoneIntervals = [];
      if (harmonyMode === 'scale') {
        const third = diatonicOffset(2);
        const fifth = diatonicOffset(4);
        const seventh = diatonicOffset(6);
        const ninth = diatonicOffset(1, 1);
        semitoneIntervals = pickWeighted([
          { item: [0, third, fifth], weight: 2.0 },
          { item: [0, third, fifth, seventh], weight: 1.2 },
          { item: [0, third, fifth, ninth], weight: 1.0 },
          { item: [0, fifth, ninth], weight: 0.7 },
        ]).slice();
        shuffleInPlace(semitoneIntervals);
      } else {
        const flavor = pickWeighted(
          activeChordFlavors.map((c) => ({ item: c, weight: c.weight }))
        );
        ratios = flavor.ratios.slice(0, 4);
      }
      for (let i = 0; i < padOscs.length; i++) {
        let freq = base;
        if (harmonyMode === 'scale') {
          const interval =
            semitoneIntervals[
              (i + Math.floor(RANDOM() * semitoneIntervals.length)) %
                semitoneIntervals.length
            ] ?? 0;
          const octave = pickWeighted([
            { item: 0, weight: 2.2 },
            { item: 12, weight: 1.4 },
            { item: -12, weight: 0.35 },
          ]);
          freq = clamp(base * semitonesToRatio(interval + octave), 90, 1200);
        } else {
          const ratio =
            ratios[
              (i + Math.floor(RANDOM() * ratios.length)) % ratios.length
            ] ?? 1;
          const octave = pickWeighted([
            { item: 1, weight: 2.2 },
            { item: 2, weight: 1.2 },
            { item: 0.5, weight: 0.3 },
          ]);
          freq = clamp(base * ratio * octave, 90, 1200);
        }
        const osc = padOscs[i];
        if (motionMode === 'step') {
          osc.frequency.cancelScheduledValues(t);
          osc.frequency.setValueAtTime(osc.frequency.value, t);
          osc.frequency.linearRampToValueAtTime(freq, t + stepRamp);
        } else {
          osc.frequency.setTargetAtTime(freq, t, padSlew);
        }
      }
      padBp.frequency.setTargetAtTime(randomBetween(180, 620), t, 16);
      padBp.Q.setTargetAtTime(randomBetween(0.55, 1.5), t, 18);
      padLp.frequency.setTargetAtTime(randomBetween(750, 2200), t, 18);
      padDry.gain.setTargetAtTime(randomBetween(0.05, 0.14) * sceneNear, t, 16);
      padVerbSend.gain.setTargetAtTime(
        randomBetween(0.22, 0.56) * sceneVerb,
        t,
        18
      );
      padDelaySend.gain.setTargetAtTime(
        randomBetween(0.1, 0.34) * sceneDelay,
        t,
        18
      );
      padGain.gain.setTargetAtTime(randomBetween(0.015, 0.06), t, 12);
    };
    if (this.syncToWallClock) {
      const wallElapsed = (Date.now() - seedEpochMs) / 1000;
      syncTonalityIndex = Math.floor(wallElapsed / SYNC_TONALITY_SECONDS);
      syncSpaceIndex = Math.floor(wallElapsed / SYNC_SPACE_SECONDS);
      syncChordIndex = Math.floor(wallElapsed / SYNC_CHORD_SECONDS);
      syncRootIndex = Math.floor(wallElapsed / SYNC_ROOT_SECONDS);
      syncModeIndex = Math.floor(wallElapsed / SYNC_MODE_SECONDS);
      syncPadIndex = Math.floor(wallElapsed / SYNC_PAD_SECONDS);
      withTimeRng(100, syncTonalityIndex, () => scheduleTonality());
      withTimeRng(110, syncSpaceIndex, () => scheduleSpace());
      withTimeRng(120, syncChordIndex, () => scheduleHarmony());
      withTimeRng(130, syncRootIndex, () => {
        scheduleRoot();
        scheduleHarmony();
      });
      withTimeRng(140, syncModeIndex, () => scheduleMode());
      withTimeRng(150, syncPadIndex, () => schedulePad());
      withTimeRng(160, syncChordIndex, () => scheduleHarmonics());
    } else {
      scheduleTonality();
      scheduleHarmonics();
      scheduleHarmony();
      scheduleSpace();
      scheduleMode();
      schedulePad();
    }
    this.evolutionTimer = setInterval(() => {
      if (!this.context) return;
      const t = this.context.currentTime;
      if (this.syncToWallClock) {
        const wallElapsed = (Date.now() - seedEpochMs) / 1000;
        const tonIdx = Math.floor(wallElapsed / SYNC_TONALITY_SECONDS);
        const spaceIdx = Math.floor(wallElapsed / SYNC_SPACE_SECONDS);
        const chordIdx = Math.floor(wallElapsed / SYNC_CHORD_SECONDS);
        const rootIdx = Math.floor(wallElapsed / SYNC_ROOT_SECONDS);
        const modeIdx = Math.floor(wallElapsed / SYNC_MODE_SECONDS);
        const padIdx = Math.floor(wallElapsed / SYNC_PAD_SECONDS);
        if (tonIdx !== syncTonalityIndex) {
          syncTonalityIndex = tonIdx;
          withTimeRng(100, tonIdx, () => scheduleTonality());
          withTimeRng(120, chordIdx, () => scheduleHarmony());
          withTimeRng(150, padIdx, () => schedulePad());
        }
        if (spaceIdx !== syncSpaceIndex) {
          syncSpaceIndex = spaceIdx;
          withTimeRng(110, spaceIdx, () => scheduleSpace());
        }
        if (chordIdx !== syncChordIndex) {
          syncChordIndex = chordIdx;
          withTimeRng(120, chordIdx, () => scheduleHarmony());
          withTimeRng(160, chordIdx, () => scheduleHarmonics());
        }
        if (rootIdx !== syncRootIndex) {
          syncRootIndex = rootIdx;
          withTimeRng(130, rootIdx, () => {
            scheduleRoot();
            scheduleHarmony();
          });
        }
        if (modeIdx !== syncModeIndex) {
          syncModeIndex = modeIdx;
          withTimeRng(140, modeIdx, () => scheduleMode());
        }
        if (padIdx !== syncPadIndex) {
          syncPadIndex = padIdx;
          withTimeRng(150, padIdx, () => schedulePad());
        }
        return;
      }
      // Non-sync mode: catch up deterministically even if the interval drifts.
      while (t >= nextSpaceAt) {
        scheduleSpace();
        nextSpaceAt += randomBetween(18, 32);
      }
      while (t >= nextChordAt) {
        if (progressionEnabled && consonantScene && harmonyMode === 'scale') {
          scheduleRoot();
          scheduleHarmony();
          schedulePad();
          nextChordAt += randomBetween(22, 55);
        } else {
          scheduleHarmony();
          nextChordAt += randomBetween(18, 32);
        }
        scheduleHarmonics();
      }
      while (t >= nextRootAt) {
        scheduleRoot();
        scheduleHarmony();
        nextRootAt += randomBetween(45, 95);
      }
      while (t >= nextModeAt) {
        scheduleMode();
        nextModeAt += randomBetween(55, 120);
      }
      while (t >= nextPadAt) {
        schedulePad();
        nextPadAt += randomBetween(18, 48);
      }
      while (t >= nextTonalityAt) {
        scheduleTonality();
        scheduleHarmony();
        schedulePad();
        nextTonalityAt += randomBetween(70, 170);
      }
    }, 6500);
    let bpmCurrent = randomBetween(106, 126);
    let bpmTarget = clamp(bpmCurrent + randomBetween(-8, 8), 92, 132);
    let nextTempoAt = ctx.currentTime + randomBetween(8, 18);
    let swing = randomBetween(0.02, 0.12);
    let nextBurstAt = ctx.currentTime + randomBetween(9, 26);
    let delayCreativeMode = 'steady';
    let syncRhythmIndex = -1;
    const patterns = [
      {
        name: 'fourFloorSoft',
        length: 16,
        kick: [1, 0, 0, 0, 0.75, 0, 0, 0, 0.95, 0, 0, 0, 0.75, 0, 0, 0],
        hat: [0, 0, 0.25, 0, 0, 0, 0.4, 0, 0, 0, 0.25, 0, 0, 0, 0.55, 0],
      },
      {
        name: 'broken',
        length: 16,
        kick: [1, 0, 0, 0, 0, 0, 0.7, 0, 0.8, 0, 0, 0.35, 0, 0, 0.55, 0],
        hat: [
          0, 0.2, 0, 0.35, 0, 0.25, 0, 0.4, 0, 0.22, 0, 0.38, 0, 0.28, 0, 0.42,
        ],
      },
      {
        name: 'halfTime',
        length: 16,
        kick: [1, 0, 0, 0, 0, 0, 0, 0, 0.75, 0, 0, 0, 0, 0, 0, 0],
        hat: [0, 0, 0.3, 0, 0, 0, 0.45, 0, 0, 0, 0.3, 0, 0, 0, 0.55, 0],
      },
      {
        name: 'ghosty',
        length: 16,
        kick: [
          1, 0, 0.25, 0, 0.75, 0, 0, 0.22, 0.85, 0, 0.18, 0, 0.65, 0, 0, 0.2,
        ],
        hat: [
          0, 0.22, 0, 0.32, 0, 0.22, 0, 0.38, 0, 0.22, 0, 0.34, 0, 0.2, 0, 0.42,
        ],
      },
    ];
    let currentPattern = pickWeighted(
      patterns.map((p) => ({ item: p, weight: 1 }))
    );
    let sectionStepsRemaining = Math.floor(randomBetween(256, 1024));
    let rhythmScene = 'minimal';
    let kickEnabled = true;
    let hatsEnabled = true;
    let pulseEnabled = true;
    let pulsePattern = [1, 0, 0.75, 0.35];
    let bassEnabled = true;
    let bassEnterAt = -1;
    let burstEnabled = true;
    let bassGateEnabled = false;
    let bassGatePattern = [
      1, 0, 0, 0, 0.85, 0, 0, 0, 0.95, 0, 0, 0, 0.8, 0, 0, 0,
    ];
    let bassGateFloor = 0.7;
    let bassGateAttack = 0.03;
    let bassGateRelease = 0.16;
    let kickPitchStart = randomBetween(52, 95);
    let kickPitchEnd = randomBetween(32, 50);
    let kickPitchTime = randomBetween(0.05, 0.095);
    let kickDecayScale = randomBetween(0.85, 1.3);
    let kickToneBase = randomBetween(90, 160);
    let kickTransient = randomBetween(0.65, 1.2);
    let kickOscType = 'sine';
    let kickNoiseAmount = randomBetween(0, 1);
    let droneAccentEnabled = true;
    let droneAccentPattern = [1, 0.25, 0.7, 0.12];
    let harmonyAccentEnabled = true;
    let harmonyAccentPattern = [1, 0, 0.6, 0.2];
    let arpEnabled = true;
    let arpEverySteps = 2;
    let arpPatternSemis = [0, 7, 12, 7];
    let arpIndex = 0;
    let arpOctaveBase = 24;
    let arpProbability = 0.65;
    let arpIntensityPattern = [1, 0.75, 0.55, 0.85, 0.6];
    let arpVelIndex = 0;
    let arp2Enabled = true;
    let arp2EverySteps = 4;
    let arp2PatternSemis = [0, 7, 3, 10];
    let arp2Index = 0;
    let arp2OctaveBase = 12;
    let arp2Probability = 0.42;
    let arp2IntensityPattern = [1, 0.75, 0.55, 0.9, 0.65];
    let arp2VelIndex = 0;
    let snareEnabled = true;
    let snareProbability = 0.82;
    let snareDelaySteps = 3; // 3/16
    let snareGhostProbability = 0.12;
    let kickStyle = 'soft';
    let step = 0;
    const reseedRhythm = () => {
      const t = ctx.currentTime;
      rhythmScene = pickWeighted([
        { item: 'drone', weight: 1.3 },
        { item: 'minimal', weight: 2.0 },
        { item: 'dub', weight: 1.1 },
        { item: 'busy', weight: 0.55 },
      ]);
      sectionStepsRemaining = Math.floor(
        rhythmScene === 'drone'
          ? randomBetween(2048, 6144)
          : rhythmScene === 'minimal'
          ? randomBetween(1024, 3072)
          : randomBetween(512, 2048)
      );
      currentPattern = pickWeighted([
        { item: patterns[0], weight: 2.1 },
        { item: patterns[1], weight: 1.3 },
        { item: patterns[2], weight: 1.0 },
        { item: patterns[3], weight: 1.2 },
      ]);
      delayCreativeMode = pickWeighted([
        { item: 'steady', weight: 2.2 },
        { item: 'wow', weight: 1.4 },
        { item: 'wander', weight: 0.75 },
      ]);
      if (delayCreativeMode === 'steady') {
        delayLfo.frequency.setTargetAtTime(randomBetween(0.006, 0.02), t, 24);
        delayLfoGain.gain.setTargetAtTime(randomBetween(0.0025, 0.01), t, 24);
      } else if (delayCreativeMode === 'wow') {
        delayLfo.frequency.setTargetAtTime(randomBetween(0.0015, 0.006), t, 40);
        delayLfoGain.gain.setTargetAtTime(randomBetween(0.006, 0.018), t, 40);
      } else {
        delayLfo.frequency.setTargetAtTime(
          randomBetween(0.0009, 0.0032),
          t,
          55
        );
        delayLfoGain.gain.setTargetAtTime(randomBetween(0.008, 0.022), t, 55);
      }
      const dropKick =
        rhythmScene === 'drone'
          ? true
          : rhythmScene === 'minimal'
          ? RANDOM() < 0.5
          : RANDOM() < 0.22;
      kickStyle = rhythmScene === 'dub' ? 'dub' : 'soft';
      kickEnabled = !dropKick && rhythmScene !== 'drone';
      hatsEnabled =
        rhythmScene === 'drone'
          ? false
          : RANDOM() < (rhythmScene === 'busy' ? 0.96 : 0.82);
      pulseEnabled =
        rhythmScene === 'drone'
          ? false
          : RANDOM() < (dropKick ? 0.55 : rhythmScene === 'busy' ? 0.82 : 0.68);
      burstEnabled =
        rhythmScene === 'drone'
          ? false
          : RANDOM() <
            (rhythmScene === 'minimal'
              ? 0.28
              : rhythmScene === 'dub'
              ? 0.72
              : 0.62);
      const bassMode = pickWeighted([
        { item: 'on', weight: rhythmScene === 'dub' ? 2.0 : 1.6 },
        { item: 'late', weight: rhythmScene === 'minimal' ? 1.8 : 1.1 },
        { item: 'off', weight: rhythmScene === 'drone' ? 2.4 : 0.75 },
      ]);
      if (bassMode === 'off') {
        bassEnabled = false;
        bassEnterAt = -1;
        bassSceneGain.gain.setTargetAtTime(0.0001, t, 8);
      } else if (bassMode === 'late') {
        bassEnabled = false;
        bassEnterAt = t + randomBetween(12, 55);
        bassSceneGain.gain.setTargetAtTime(0.0001, t, 10);
      } else {
        bassEnabled = true;
        bassEnterAt = -1;
        bassSceneGain.gain.setTargetAtTime(1, t, 10);
      }
      pulsePattern = shuffleInPlace([1, 0, 0.8, 0.35, 0.55]).slice(
        0,
        RANDOM() < 0.6 ? 4 : 5
      );
      const bassRhythmMode = pickWeighted([
        {
          item: 'sustain',
          weight:
            rhythmScene === 'drone'
              ? 4.2
              : rhythmScene === 'minimal'
              ? 3.2
              : 2.6,
        },
        { item: 'quarters', weight: rhythmScene === 'busy' ? 1.4 : 0.95 },
        { item: 'eighths', weight: rhythmScene === 'busy' ? 0.55 : 0.25 },
        { item: 'dub', weight: rhythmScene === 'dub' ? 1.25 : 0.6 },
        { item: 'sync', weight: rhythmScene === 'dub' ? 0.75 : 0.4 },
        { item: 'stabs', weight: rhythmScene === 'dub' ? 0.22 : 0.11 },
      ]);
      if (rhythmScene === 'drone' || bassRhythmMode === 'sustain') {
        bassGateEnabled = false;
        bassGateFloor = 1;
      } else {
        bassGateEnabled = true;
        bassGateAttack = randomBetween(0.018, 0.05);
        bassGateRelease = randomBetween(0.12, 0.28);
        bassGateFloor = pickWeighted([
          { item: randomBetween(0.55, 0.78), weight: 2.0 },
          { item: randomBetween(0.38, 0.6), weight: 1.2 },
          {
            item: randomBetween(0.22, 0.42),
            weight: bassRhythmMode === 'stabs' ? 1.4 : 0.45,
          },
        ]);
        if (bassRhythmMode === 'quarters') {
          bassGatePattern = [
            1, 0, 0, 0, 0.85, 0, 0, 0, 0.95, 0, 0, 0, 0.8, 0, 0, 0,
          ];
        } else if (bassRhythmMode === 'eighths') {
          bassGatePattern = [
            1, 0, 0.75, 0, 0.9, 0, 0.7, 0, 0.95, 0, 0.65, 0, 0.85, 0, 0.7, 0,
          ];
        } else if (bassRhythmMode === 'dub') {
          bassGatePattern = [
            1, 0, 0, 0, 0, 0.7, 0, 0, 0.9, 0, 0.35, 0, 0, 0.6, 0, 0,
          ];
        } else if (bassRhythmMode === 'sync') {
          bassGatePattern = [
            1, 0, 0, 0, 0, 0, 0.8, 0, 0.85, 0, 0, 0.55, 0, 0, 0.7, 0,
          ];
        } else {
          bassGatePattern = [
            1, 0, 0, 0, 0, 0.65, 0, 0, 0.85, 0, 0, 0, 0, 0.55, 0, 0,
          ];
        }
        if (RANDOM() < 0.35) {
          const rot = Math.floor(randomBetween(0, bassGatePattern.length));
          bassGatePattern = bassGatePattern.map(
            (_, i) => bassGatePattern[(i + rot) % bassGatePattern.length] ?? 0
          );
        }
      }
      bassWetMode = pickWeighted([
        { item: 'hybrid', weight: 2.2 },
        { item: 'dry', weight: dropKick ? 1.35 : 0.9 },
        { item: 'wet', weight: 1.1 },
      ]);
      if (rhythmScene === 'drone') {
        bassWetMode = pickWeighted([
          { item: 'dry', weight: 2.4 },
          { item: 'hybrid', weight: 1.4 },
          { item: 'wet', weight: 0.4 },
        ]);
      }
      if (bassWetMode === 'dry') {
        bassToFxGain.gain.setTargetAtTime(0.12, t, 10);
        bassToDirectGain.gain.setTargetAtTime(0.55, t, 10);
      } else if (bassWetMode === 'wet') {
        bassToFxGain.gain.setTargetAtTime(0.75, t, 12);
        bassToDirectGain.gain.setTargetAtTime(0.02, t, 12);
      } else {
        bassToFxGain.gain.setTargetAtTime(0.55, t, 12);
        bassToDirectGain.gain.setTargetAtTime(0.12, t, 12);
      }
      const pickBassNote = (prev) => {
        if (harmonyMode === 'scale') {
          const fifth = limitBassSemis(
            this.rootHz,
            Math.round(diatonicOffset(4))
          );
          const third = limitBassSemis(
            this.rootHz,
            Math.round(diatonicOffset(2))
          );
          const sixth = limitBassSemis(
            this.rootHz,
            Math.round(diatonicOffset(5))
          );
          return limitBassSemis(
            this.rootHz,
            pickWeighted([
              { item: 0, weight: 3.2 },
              { item: -12, weight: 1.2 },
              { item: fifth, weight: 1.25 },
              { item: third, weight: consonantScene ? 0.8 : 0.5 },
              { item: sixth, weight: consonantScene ? 0.65 : 0.45 },
              { item: prev, weight: 0.75 },
            ])
          );
        }
        const chordPool = Array.from(
          new Set(
            [0, ...currentChordSemis]
              .map((s) => ((s % 12) + 12) % 12)
              .map((s) => (s > 6 ? s - 12 : s))
          )
        ).filter((s) => Math.abs(s) !== 1 && Math.abs(s) !== 6);
        const pool = Array.from(new Set([...chordPool, 7, -12]))
          .map((s) => (s > 0 ? s - 12 : s))
          .filter((s) => Math.abs(s) !== 1 && Math.abs(s) !== 6);
        return limitBassSemis(
          this.rootHz,
          pickWeighted(
            pool.map((s) => ({
              item: s,
              weight:
                s === 0
                  ? 2.8
                  : s === -12
                  ? 1.4
                  : s === -5 || s === -7
                  ? 1.7
                  : s === -8 || s === -9
                  ? 0.95
                  : 0.65,
            }))
          )
        );
      };
      bassNotePattern = new Array(16).fill(0);
      let prev = bassNoteSemis;
      for (let i = 0; i < bassNotePattern.length; i++) {
        const gate = bassGateEnabled
          ? bassGatePattern[i % bassGatePattern.length] ?? 0
          : 1;
        const wants = gate > 0.001;
        const isQuarter = i % 4 === 0;
        const allowInnerBarChanges = rhythmScene !== 'drone' && bassGateEnabled;
        const beatChangeChance =
          rhythmScene === 'busy'
            ? 0.25
            : rhythmScene === 'minimal'
            ? 0.16
            : 0.2;
        const offChangeChance = beatChangeChance * 0.18;
        const canChange =
          wants &&
          (i === 0 ||
            (allowInnerBarChanges &&
              (isQuarter
                ? RANDOM() < beatChangeChance
                : RANDOM() < offChangeChance)));
        if (canChange) prev = pickBassNote(prev);
        bassNotePattern[i] = limitBassSemis(this.rootHz, prev);
      }
      bassNoteSemis = limitBassSemis(this.rootHz, bassNotePattern[0] ?? 0);
      oscillator.frequency.setTargetAtTime(
        this.rootHz * semitonesToRatio(bassNoteSemis),
        t,
        0.25
      );
      swing = randomBetween(0.02, 0.14);
      if (dropKick) {
        duckGain.gain.setTargetAtTime(1, t, 0.2);
        delayFeedback.gain.setTargetAtTime(randomBetween(0.28, 0.68), t, 8);
        delayIn.gain.setTargetAtTime(randomBetween(0.06, 0.14), t, 8);
      }
      bassDriveLP.frequency.setTargetAtTime(randomBetween(120, 280), t, 18);
      bassDriveLP.Q.setTargetAtTime(randomBetween(0.55, 0.9), t, 22);
      bassCleanLP.frequency.setTargetAtTime(randomBetween(95, 220), t, 18);
      bassCleanLP.Q.setTargetAtTime(randomBetween(0.5, 0.85), t, 22);
      bassHp.frequency.setTargetAtTime(
        rhythmScene === 'drone'
          ? randomBetween(28, 42)
          : rhythmScene === 'minimal'
          ? randomBetween(24, 36)
          : randomBetween(22, 30),
        t,
        20
      );
      const bassCharacter = pickWeighted([
        { item: 'drive', weight: rhythmScene === 'dub' ? 1.9 : 1.1 },
        { item: 'clean', weight: rhythmScene === 'drone' ? 2.8 : 1.9 },
        { item: 'hybrid', weight: 1.4 },
      ]);
      if (bassCharacter === 'clean') {
        bassDriveGain.gain.setTargetAtTime(0.06, t, 10);
        bassCleanGain.gain.setTargetAtTime(1.05, t, 10);
        bassPre.gain.setTargetAtTime(randomBetween(0.5, 0.95), t, 16);
        bassCleanLP.frequency.setTargetAtTime(randomBetween(120, 280), t, 16);
        bassCleanLP.Q.setTargetAtTime(randomBetween(0.65, 1.05), t, 18);
        oscillator.type =
          rhythmScene === 'drone'
            ? 'sine'
            : RANDOM() < 0.62
            ? 'sawtooth'
            : 'triangle';
      } else if (bassCharacter === 'hybrid') {
        bassDriveGain.gain.setTargetAtTime(
          rhythmScene === 'drone' ? 0.22 : 0.45,
          t,
          10
        );
        bassCleanGain.gain.setTargetAtTime(0.7, t, 10);
        bassPre.gain.setTargetAtTime(randomBetween(0.55, 1.05), t, 16);
        bassCleanLP.frequency.setTargetAtTime(randomBetween(110, 260), t, 16);
        bassCleanLP.Q.setTargetAtTime(randomBetween(0.55, 0.95), t, 18);
        oscillator.type =
          rhythmScene === 'drone'
            ? 'sine'
            : RANDOM() < 0.35
            ? 'sawtooth'
            : 'triangle';
      } else {
        bassDriveGain.gain.setTargetAtTime(
          rhythmScene === 'dub' ? 0.95 : 0.75,
          t,
          10
        );
        bassCleanGain.gain.setTargetAtTime(0.0001, t, 10);
        bassPre.gain.setTargetAtTime(
          randomBetween(
            rhythmScene === 'dub' ? 0.72 : 0.58,
            rhythmScene === 'dub' ? 1.15 : 0.95
          ),
          t,
          20
        );
        oscillator.type = 'triangle';
      }
      kickPitchStart = randomBetween(52, 105);
      kickPitchEnd = randomBetween(32, 56);
      kickPitchTime = randomBetween(0.045, 0.1);
      kickDecayScale = dropKick
        ? randomBetween(1.05, 1.7)
        : randomBetween(0.85, 1.3);
      kickToneBase = randomBetween(80, 170);
      kickTransient = randomBetween(0.55, 1.35);
      kickOscType = pickWeighted([
        { item: 'sine', weight: 2.1 },
        { item: 'triangle', weight: 1.2 },
        { item: 'square', weight: 0.25 },
      ]);
      kickNoiseAmount = randomBetween(0, 1);
      if (kickStyle === 'dub') {
        kickTransient = randomBetween(0.85, 1.55);
        kickToneBase = randomBetween(95, 190);
        kickNoiseAmount = clamp(
          kickNoiseAmount + randomBetween(0.25, 0.65),
          0,
          1
        );
      }
      droneAccentEnabled = RANDOM() < (dropKick ? 0.78 : 0.55);
      droneAccentPattern = shuffleInPlace([1, 0.6, 0.25, 0.75, 0.15]).slice(
        0,
        RANDOM() < 0.65 ? 4 : 5
      );
      harmonyAccentEnabled = RANDOM() < (dropKick ? 0.68 : 0.42);
      harmonyAccentPattern = shuffleInPlace([1, 0.55, 0, 0.25, 0.35]).slice(
        0,
        RANDOM() < 0.7 ? 4 : 5
      );
      arpEnabled =
        rhythmScene === 'drone'
          ? false
          : RANDOM() <
            (dropKick ? 0.75 : rhythmScene === 'minimal' ? 0.38 : 0.6);
      arpEverySteps = pickWeighted([
        { item: 1, weight: 0.25 }, // 16ths (rare)
        { item: 2, weight: 2.2 }, // 8ths
        { item: 4, weight: 1.4 }, // quarters
      ]);
      arpIndex = Math.floor(RANDOM() * 16);
      arpOctaveBase = pickWeighted([
        { item: 12, weight: 0.4 },
        { item: 24, weight: 1.9 },
        { item: 36, weight: 1.1 },
      ]);
      arpProbability = clamp(
        (dropKick ? randomBetween(0.6, 0.92) : randomBetween(0.45, 0.78)) *
          (consonantScene ? 1.15 : 1),
        0.35,
        0.98
      );
      arpIntensityPattern = shuffleInPlace([
        1, 0.85, 0.7, 0.55, 0.9, 0.45,
      ]).slice(0, RANDOM() < 0.65 ? 5 : 6);
      arpVelIndex = Math.floor(RANDOM() * 32);
      if (harmonyMode === 'scale') {
        const third = diatonicOffset(2);
        const fifth = diatonicOffset(4);
        const seventh = diatonicOffset(6);
        const ninth = diatonicOffset(1, 1);
        const pool = shuffleInPlace(
          consonantScene
            ? [0, third, fifth, seventh, ninth]
            : [0, diatonicOffset(1), third, fifth, diatonicOffset(5, 1)]
        );
        arpPatternSemis = pool.slice(0, RANDOM() < 0.6 ? 4 : 5);
      } else {
        const pool = shuffleInPlace([0, ...currentChordSemis, 7, 12]);
        arpPatternSemis = pool.slice(0, RANDOM() < 0.6 ? 4 : 6);
      }
      arp2Enabled =
        rhythmScene === 'drone'
          ? false
          : RANDOM() <
            (dropKick ? 0.78 : rhythmScene === 'minimal' ? 0.35 : 0.62);
      arp2EverySteps = pickWeighted([
        { item: 2, weight: 0.8 }, // 8ths
        { item: 4, weight: 2.0 }, // quarters
        { item: 8, weight: 1.4 }, // half notes
      ]);
      arp2Index = Math.floor(RANDOM() * 64);
      arp2OctaveBase = pickWeighted([
        { item: 0, weight: 0.6 },
        { item: 12, weight: 2.2 },
        { item: 24, weight: 1.2 },
      ]);
      arp2Probability = clamp(
        (dropKick ? randomBetween(0.45, 0.8) : randomBetween(0.3, 0.65)) *
          (consonantScene ? 1.1 : 1),
        0.2,
        0.92
      );
      arp2IntensityPattern = shuffleInPlace([
        1, 0.85, 0.7, 0.55, 0.9, 0.45,
      ]).slice(0, RANDOM() < 0.65 ? 5 : 6);
      arp2VelIndex = Math.floor(RANDOM() * 128);
      if (harmonyMode === 'scale') {
        const third = diatonicOffset(2);
        const fifth = diatonicOffset(4);
        const seventh = diatonicOffset(6);
        const ninth = diatonicOffset(1, 1);
        const eleventh = diatonicOffset(3, 1);
        const octave = 12;
        arp2PatternSemis = pickWeighted([
          { item: [0, third, fifth, seventh], weight: 2.2 },
          { item: [0, fifth, third, seventh], weight: 1.2 },
          { item: [0, third, fifth, ninth, fifth, third], weight: 1.1 },
          { item: [0, third, fifth, seventh, ninth, eleventh], weight: 0.8 },
          { item: [0, octave, seventh, fifth], weight: 0.6 },
        ]).slice();
      } else {
        const pool = Array.from(new Set([0, 12, ...currentChordSemis, 7, -5]))
          .filter((s) => typeof s === 'number')
          .filter((s) => Math.abs(s) !== 1 && Math.abs(s) !== 6)
          .filter((s) => Math.abs(s) <= 24);
        const picked = shuffleInPlace(pool).slice(0, RANDOM() < 0.55 ? 4 : 6);
        arp2PatternSemis =
          picked.length > 0 ? picked : [0, 7, 12, 7].slice(0, 4);
      }
      snareEnabled =
        rhythmScene === 'drone'
          ? false
          : RANDOM() <
            (dropKick ? 0.62 : rhythmScene === 'minimal' ? 0.72 : 0.9);
      snareProbability = clamp(
        (dropKick ? randomBetween(0.55, 0.88) : randomBetween(0.72, 0.96)) *
          (consonantScene ? 0.95 : 1),
        0.4,
        0.98
      );
      snareGhostProbability = consonantScene
        ? randomBetween(0.06, 0.16)
        : randomBetween(0.1, 0.22);
      snareDelaySteps = pickWeighted([
        { item: 2, weight: 0.7 }, // 1/8
        { item: 3, weight: 2.2 }, // 3/16
        { item: 4, weight: 1.1 }, // 1/4
        { item: 6, weight: 0.6 }, // 3/8 (rare)
      ]);
      snareDelayIn.gain.setTargetAtTime(randomBetween(0.55, 0.95), t, 10);
      snareDelayFeedback.gain.setTargetAtTime(randomBetween(0.35, 0.68), t, 10);
      snareDelayReturn.gain.setTargetAtTime(
        randomBetween(0.12, 0.22) * sceneNear,
        t,
        10
      );
      snareDelayVerbSend.gain.setTargetAtTime(
        randomBetween(0.06, 0.14) * sceneVerb,
        t,
        12
      );
      snareDelayFilter.frequency.setTargetAtTime(
        randomBetween(1400, 3200),
        t,
        12
      );
      snareDelayLfo.frequency.setTargetAtTime(
        randomBetween(0.045, 0.14),
        t,
        14
      );
      snareDelayLfoGain.gain.setTargetAtTime(randomBetween(0.55, 0.95), t, 14);
    };
    reseedRhythm();
    if (this.syncToWallClock) {
      const wallElapsed = (Date.now() - seedEpochMs) / 1000;
      syncRhythmIndex = Math.floor(wallElapsed / SYNC_RHYTHM_SECTION_SECONDS);
      withTimeRng(200, syncRhythmIndex, () => {
        reseedRhythm();
        // Keep a deterministic tempo per sync section.
        bpmCurrent = randomBetween(106, 126);
        bpmTarget = bpmCurrent;
        nextTempoAt = Infinity;
        swing = randomBetween(0.02, 0.12);
      });
    }
    let nextStepAt = ctx.currentTime + 0.15;
    if (this.syncToWallClock) {
      const wallElapsedSeconds = (Date.now() - seedEpochMs) / 1000;
      const stepSeconds = 60 / bpmCurrent / 4;
      const stepFloat = wallElapsedSeconds / stepSeconds;
      const stepIndex = Math.floor(stepFloat);
      step = ((stepIndex % 256) + 256) % 256;
      const frac = stepFloat - stepIndex;
      const toNext = (1 - frac) * stepSeconds;
      nextStepAt = ctx.currentTime + 0.15 + toNext;
    }
    const sidechain = (at, amount) => {
      const depth = clamp(1 - amount, 0.22, 1);
      const release = randomBetween(0.35, 0.85);
      duckGain.gain.setValueAtTime(1, at);
      duckGain.gain.linearRampToValueAtTime(depth, at + 0.02);
      duckGain.gain.setTargetAtTime(1, at + 0.04, release);
      const noiseDepth = clamp(1 - 0.55 * amount, 0.4, 1);
      noiseDuck.gain.cancelScheduledValues(at);
      noiseDuck.gain.setValueAtTime(noiseDuck.gain.value, at);
      noiseDuck.gain.linearRampToValueAtTime(noiseDepth, at + 0.025);
      noiseDuck.gain.setTargetAtTime(
        1,
        at + 0.05,
        release + randomBetween(0.2, 0.6)
      );
      const bassDepth = clamp(1 - 0.55 * amount, 0.55, 1);
      bassDirectDuck.gain.cancelScheduledValues(at);
      bassDirectDuck.gain.setValueAtTime(bassDirectDuck.gain.value, at);
      bassDirectDuck.gain.linearRampToValueAtTime(bassDepth, at + 0.02);
      bassDirectDuck.gain.setTargetAtTime(
        1,
        at + 0.05,
        release + randomBetween(0.25, 0.65)
      );
    };
    const triggerKick = (at, intensity, isMain, delayScale = 1) => {
      const osc = ctx.createOscillator();
      osc.type = kickOscType;
      const kickGain = ctx.createGain();
      kickGain.gain.setValueAtTime(0.0001, at);
      const pitchStart = kickPitchStart * randomBetween(0.92, 1.08);
      const pitchEnd = kickPitchEnd * randomBetween(0.92, 1.08);
      const pitchTime = kickPitchTime * randomBetween(0.85, 1.2);
      osc.frequency.setValueAtTime(pitchStart, at);
      osc.frequency.exponentialRampToValueAtTime(pitchEnd, at + pitchTime);
      const attack = isMain && RANDOM() < 0.55 ? 0.0045 : 0.008;
      const decay = randomBetween(0.55, 1.05) * kickDecayScale;
      const peak = clamp(
        0.18 * intensity * sceneNear * kickTransient,
        0.04,
        0.28
      );
      kickGain.gain.linearRampToValueAtTime(peak, at + attack);
      kickGain.gain.setTargetAtTime(0.0001, at + attack, decay);
      const tone = ctx.createBiquadFilter();
      tone.type = 'lowpass';
      tone.frequency.value = kickToneBase * randomBetween(0.85, 1.15);
      tone.Q.value = 0.55;
      osc.connect(kickGain).connect(tone);
      tone.connect(kickDry);
      let send = null;
      const sendAmount = clamp(0.22 * Math.pow(intensity, 1.4), 0, 0.2);
      if (sendAmount > 0.001) {
        send = ctx.createGain();
        send.gain.value = sendAmount * sceneVerb;
        tone.connect(send).connect(kickWet);
      }
      let dsend = null;
      const delaySendAmt = clamp(
        0.11 * Math.pow(intensity, 1.2) * delayScale,
        0,
        0.18
      );
      if (delaySendAmt > 0.001) {
        dsend = ctx.createGain();
        dsend.gain.value = delaySendAmt * sceneDelay;
        tone.connect(dsend).connect(delayIn);
      }
      let n = null;
      let nHp = null;
      let nGain = null;
      if (RANDOM() < (isMain ? 0.75 : 0.45) * kickNoiseAmount) {
        n = ctx.createBufferSource();
        n.buffer = kickNoiseBuffer;
        n.loop = false;
        nHp = ctx.createBiquadFilter();
        nHp.type = 'highpass';
        nHp.frequency.value = randomBetween(1800, 5200);
        nHp.Q.value = 0.7;
        nGain = ctx.createGain();
        nGain.gain.setValueAtTime(0.0001, at);
        const nPeak = clamp(
          0.0125 * intensity * (isMain ? 1.6 : 1),
          0.001,
          0.024
        );
        nGain.gain.linearRampToValueAtTime(nPeak, at + 0.002);
        nGain.gain.setTargetAtTime(
          0.0001,
          at + 0.003,
          randomBetween(0.01, 0.05)
        );
        n.connect(nHp).connect(nGain);
        nGain.connect(kickDry);
        if (RANDOM() < 0.4) {
          const nVerb = ctx.createGain();
          nVerb.gain.value = randomBetween(0.04, 0.12) * sceneVerb;
          nGain.connect(nVerb).connect(reverbIn);
          n.onended = () => nVerb.disconnect();
        }
        n.start(at);
        n.stop(at + 0.15);
      }
      osc.onended = () => {
        osc.disconnect();
        kickGain.disconnect();
        tone.disconnect();
        send?.disconnect();
        dsend?.disconnect();
        n?.disconnect();
        nHp?.disconnect();
        nGain?.disconnect();
      };
      osc.start(at);
      osc.stop(at + 2.0);
    };
    const kickNoiseBuffer = createNoiseBuffer(ctx, 0.9, nextBufferSeed());
    const hatNoiseBuffer = createNoiseBuffer(ctx, 1.0, nextBufferSeed());
    const snareNoiseBuffer = createNoiseBuffer(ctx, 1.0, nextBufferSeed());
    const triggerSnare = (at, intensity) => {
      const src = ctx.createBufferSource();
      src.buffer = snareNoiseBuffer;
      src.loop = false;
      const amp = ctx.createGain();
      amp.gain.setValueAtTime(0.0001, at);
      const attack = randomBetween(0.0015, 0.006);
      const hold = randomBetween(0.006, 0.02);
      const decay = randomBetween(0.12, 0.24);
      const peak = clamp(0.06 * intensity * sceneNear, 0.01, 0.09);
      amp.gain.linearRampToValueAtTime(peak, at + attack);
      amp.gain.setTargetAtTime(0.0001, at + attack + hold, decay);
      const hp = ctx.createBiquadFilter();
      hp.type = 'highpass';
      hp.frequency.value = randomBetween(180, 360);
      hp.Q.value = 0.7;
      const bp = ctx.createBiquadFilter();
      bp.type = 'bandpass';
      bp.frequency.value = randomBetween(1200, 2400);
      bp.Q.value = randomBetween(0.7, 1.5);
      const lp = ctx.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.value = randomBetween(3800, 7200);
      lp.Q.value = 0.6;
      src.connect(hp).connect(bp).connect(lp).connect(amp);
      const dry = ctx.createGain();
      dry.gain.value = 0.06 * sceneNear;
      amp.connect(dry).connect(masterGain);
      let verb = null;
      if (RANDOM() < 0.55) {
        verb = ctx.createGain();
        verb.gain.value = randomBetween(0.05, 0.22) * sceneVerb * intensity;
        amp.connect(verb).connect(reverbIn);
      }
      const send = ctx.createGain();
      send.gain.value = clamp(randomBetween(0.6, 1.05) * intensity, 0, 1.2);
      amp.connect(send).connect(snareDelayIn);
      src.onended = () => {
        src.disconnect();
        hp.disconnect();
        bp.disconnect();
        lp.disconnect();
        amp.disconnect();
        dry.disconnect();
        send.disconnect();
        verb?.disconnect();
      };
      src.start(at);
      src.stop(at + 0.6);
    };
    const triggerHat = (at, intensity) => {
      const src = ctx.createBufferSource();
      src.buffer = hatNoiseBuffer;
      src.loop = false;
      const amp = ctx.createGain();
      amp.gain.setValueAtTime(0.0001, at);
      const attack = 0.0015;
      const decay = randomBetween(0.03, 0.09);
      const peak = clamp(0.02 * intensity, 0.002, 0.022);
      amp.gain.linearRampToValueAtTime(peak, at + attack);
      amp.gain.setTargetAtTime(0.0001, at + attack, decay);
      const hp = ctx.createBiquadFilter();
      hp.type = 'highpass';
      hp.frequency.value = randomBetween(3500, 8500);
      hp.Q.value = 0.7;
      const bp = ctx.createBiquadFilter();
      bp.type = 'bandpass';
      bp.frequency.value = randomBetween(5200, 10000);
      bp.Q.value = randomBetween(0.8, 2.2);
      src.connect(hp).connect(bp).connect(amp);
      const dry = ctx.createGain();
      dry.gain.value = 0.062 * sceneNear;
      amp.connect(dry).connect(masterGain);
      const send = ctx.createGain();
      send.gain.value = randomBetween(0.08, 0.28) * sceneVerb;
      amp.connect(send).connect(reverbIn);
      const dsend = ctx.createGain();
      dsend.gain.value = randomBetween(0.03, 0.12) * sceneDelay;
      amp.connect(dsend).connect(delayIn);
      src.onended = () => {
        src.disconnect();
        hp.disconnect();
        bp.disconnect();
        amp.disconnect();
        dry.disconnect();
        send.disconnect();
        dsend.disconnect();
      };
      src.start(at);
      src.stop(at + 0.25);
    };
    const burstNoiseBuffer = createNoiseBuffer(ctx, 1.2, nextBufferSeed());
    const triggerNoiseBurst = (at, intensity) => {
      const src = ctx.createBufferSource();
      src.buffer = burstNoiseBuffer;
      src.loop = false;
      const env = ctx.createGain();
      env.gain.setValueAtTime(0.0001, at);
      const attack = randomBetween(0.01, 0.035);
      const hold = randomBetween(0.01, 0.08);
      const decay = randomBetween(0.18, 0.75);
      const peak = clamp(0.0085 * intensity * sceneNear, 0.001, 0.012);
      env.gain.linearRampToValueAtTime(peak, at + attack);
      env.gain.setTargetAtTime(0.0001, at + attack + hold, decay);
      const hp = ctx.createBiquadFilter();
      hp.type = 'highpass';
      hp.frequency.value = randomBetween(260, 1400);
      hp.Q.value = 0.55;
      const bp = ctx.createBiquadFilter();
      bp.type = 'bandpass';
      bp.frequency.value = randomBetween(750, 3800);
      bp.Q.value = randomBetween(0.45, 1.25);
      const lp = ctx.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.value = randomBetween(2200, 5200);
      lp.Q.value = 0.5;
      src.connect(hp).connect(bp).connect(lp).connect(env);
      const spread = randomBetween(0.55, 0.9);
      const leftPan = ctx.createStereoPanner();
      leftPan.pan.value = -spread;
      const rightPan = ctx.createStereoPanner();
      rightPan.pan.value = spread;
      const leftDelay = ctx.createDelay(0.05);
      const rightDelay = ctx.createDelay(0.05);
      const haas = randomBetween(0.005, 0.02);
      const swap = RANDOM() < 0.5;
      leftDelay.delayTime.value = swap ? haas : 0;
      rightDelay.delayTime.value = swap ? 0 : haas;
      const leftGain = ctx.createGain();
      leftGain.gain.value = 0.22;
      const rightGain = ctx.createGain();
      rightGain.gain.value = 0.22;
      env
        .connect(leftDelay)
        .connect(leftPan)
        .connect(leftGain)
        .connect(noiseComp);
      env
        .connect(rightDelay)
        .connect(rightPan)
        .connect(rightGain)
        .connect(noiseComp);
      const sendDelay = ctx.createGain();
      sendDelay.gain.value = randomBetween(0.01, 0.06) * sceneDelay * intensity;
      env.connect(sendDelay).connect(delayIn);
      src.onended = () => {
        src.disconnect();
        hp.disconnect();
        bp.disconnect();
        lp.disconnect();
        env.disconnect();
        leftDelay.disconnect();
        rightDelay.disconnect();
        leftPan.disconnect();
        rightPan.disconnect();
        leftGain.disconnect();
        rightGain.disconnect();
        sendDelay.disconnect();
      };
      src.start(at);
      src.stop(at + 1.2);
    };
    const arpNoiseBuffer = createNoiseBuffer(ctx, 0.8, nextBufferSeed());
    const triggerArpNote = (at, semis, intensity) => {
      const octave = pickWeighted([
        { item: -12, weight: 0.35 },
        { item: 0, weight: 2.2 },
        { item: 12, weight: 1.2 },
      ]);
      const freq = clamp(
        this.rootHz * semitonesToRatio(arpOctaveBase + semis + octave),
        90,
        2600
      );
      const osc = ctx.createOscillator();
      osc.type = pickWeighted([
        { item: 'triangle', weight: 1.8 },
        { item: 'sine', weight: 1.0 },
        { item: 'sawtooth', weight: 0.45 },
      ]);
      osc.frequency.value = freq;
      osc.detune.value = randomBetween(-14, 14);
      const amp = ctx.createGain();
      amp.gain.setValueAtTime(0.0001, at);
      const attack = randomBetween(0.002, 0.018);
      const decay = randomBetween(0.08, 0.28);
      const peak = clamp(0.14 * intensity * sceneNear, 0.012, 0.2);
      amp.gain.linearRampToValueAtTime(peak, at + attack);
      amp.gain.setTargetAtTime(0.0001, at + attack, decay);
      const bp = ctx.createBiquadFilter();
      bp.type = 'bandpass';
      bp.frequency.value = clamp(freq * randomBetween(0.9, 1.35), 180, 4200);
      bp.Q.value = randomBetween(0.6, 1.5);
      const lp = ctx.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.value = randomBetween(2200, 7600);
      lp.Q.value = 0.55;
      const panner = ctx.createStereoPanner();
      panner.pan.value = randomBetween(-0.85, 0.85);
      osc.connect(amp).connect(bp).connect(lp).connect(panner);
      const dry = ctx.createGain();
      dry.gain.value = 0.16 * sceneNear;
      panner.connect(dry).connect(masterGain);
      const sendDelay = ctx.createGain();
      const delayAmt = pickWeighted([
        { item: randomBetween(0.04, 0.14), weight: 2.4 },
        { item: randomBetween(0.18, 0.48), weight: 1.4 },
        { item: randomBetween(0.55, 1.05), weight: 0.6 },
      ]);
      sendDelay.gain.value = delayAmt * sceneDelay * intensity;
      panner.connect(sendDelay).connect(delayIn);
      const sendVerb = ctx.createGain();
      sendVerb.gain.value = randomBetween(0.06, 0.22) * sceneVerb * intensity;
      panner.connect(sendVerb).connect(reverbIn);
      if (RANDOM() < 0.28) {
        const n = ctx.createBufferSource();
        n.buffer = arpNoiseBuffer;
        n.loop = false;
        const nGain = ctx.createGain();
        nGain.gain.setValueAtTime(0.0001, at);
        nGain.gain.linearRampToValueAtTime(
          clamp(0.0038 * intensity, 0.0006, 0.007),
          at + 0.002
        );
        nGain.gain.setTargetAtTime(
          0.0001,
          at + 0.003,
          randomBetween(0.01, 0.04)
        );
        const nHp = ctx.createBiquadFilter();
        nHp.type = 'highpass';
        nHp.frequency.value = randomBetween(2200, 8200);
        nHp.Q.value = 0.7;
        n.connect(nHp).connect(nGain).connect(panner);
        n.start(at);
        n.stop(at + 0.12);
        n.onended = () => {
          n.disconnect();
          nHp.disconnect();
          nGain.disconnect();
        };
      }
      osc.onended = () => {
        osc.disconnect();
        amp.disconnect();
        bp.disconnect();
        lp.disconnect();
        panner.disconnect();
        dry.disconnect();
        sendDelay.disconnect();
        sendVerb.disconnect();
      };
      osc.start(at);
      osc.stop(at + 1.5);
    };
    const triggerSynthArpNote = (at, semis, intensity) => {
      const octave = pickWeighted([
        { item: -12, weight: 0.35 },
        { item: 0, weight: 2.2 },
        { item: 12, weight: 1.05 },
      ]);
      const freq = clamp(
        this.rootHz * semitonesToRatio(arp2OctaveBase + semis + octave),
        55,
        1400
      );
      const oscA = ctx.createOscillator();
      oscA.type = pickWeighted([
        { item: 'triangle', weight: 2.2 },
        { item: 'sine', weight: 1.0 },
        { item: 'sawtooth', weight: 0.25 },
      ]);
      oscA.frequency.value = freq;
      oscA.detune.value = randomBetween(-10, 10);
      const oscB = ctx.createOscillator();
      oscB.type = 'sine';
      oscB.frequency.value = freq * randomBetween(0.995, 1.005);
      oscB.detune.value = randomBetween(-6, 6);
      const mix = ctx.createGain();
      mix.gain.value = 1;
      const bGain = ctx.createGain();
      bGain.gain.value = 0.55;
      oscB.connect(bGain).connect(mix);
      oscA.connect(mix);
      const drive = ctx.createWaveShaper();
      {
        const len = 1024;
        const curve = new Float32Array(len);
        for (let i = 0; i < len; i++) {
          const x = (i / (len - 1)) * 2 - 1;
          curve[i] = Math.tanh(x * 1.18);
        }
        drive.curve = curve;
        drive.oversample = '2x';
      }
      const lp = ctx.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.value = clamp(freq * randomBetween(2.2, 5.2), 300, 6500);
      lp.Q.value = randomBetween(0.35, 0.85);
      const bp = ctx.createBiquadFilter();
      bp.type = 'peaking';
      bp.frequency.value = clamp(freq * randomBetween(1.2, 2.8), 200, 4200);
      bp.Q.value = randomBetween(0.35, 1.1);
      bp.gain.value = randomBetween(0.5, 3.2);
      const amp = ctx.createGain();
      amp.gain.setValueAtTime(0.0001, at);
      const attack = randomBetween(0.01, 0.06);
      const hold = randomBetween(0.02, 0.12);
      const decay = randomBetween(0.22, 1.05);
      const peak = clamp(0.28 * intensity * sceneNear, 0.014, 0.38);
      amp.gain.linearRampToValueAtTime(peak, at + attack);
      amp.gain.setTargetAtTime(0.0001, at + attack + hold, decay);
      const panner = ctx.createStereoPanner();
      panner.pan.value = randomBetween(-0.75, 0.75);
      mix.connect(drive).connect(bp).connect(lp).connect(amp).connect(panner);
      const dry = ctx.createGain();
      dry.gain.value = 0.28 * sceneNear;
      panner.connect(dry).connect(masterGain);
      const sendDelay = ctx.createGain();
      const delayAmt = pickWeighted([
        { item: randomBetween(0.06, 0.18), weight: 2.2 },
        { item: randomBetween(0.22, 0.62), weight: 1.6 },
        { item: randomBetween(0.65, 1.25), weight: 0.7 },
      ]);
      sendDelay.gain.value = delayAmt * sceneDelay * intensity;
      panner.connect(sendDelay).connect(delayIn);
      const sendVerb = ctx.createGain();
      sendVerb.gain.value = randomBetween(0.04, 0.18) * sceneVerb * intensity;
      panner.connect(sendVerb).connect(reverbIn);
      if (RANDOM() < 0.18) {
        const n = ctx.createBufferSource();
        n.buffer = arpNoiseBuffer;
        n.loop = false;
        const nGain = ctx.createGain();
        nGain.gain.setValueAtTime(0.0001, at);
        nGain.gain.linearRampToValueAtTime(
          clamp(0.0024 * intensity, 0.00035, 0.0045),
          at + 0.002
        );
        nGain.gain.setTargetAtTime(
          0.0001,
          at + 0.003,
          randomBetween(0.02, 0.07)
        );
        const nHp = ctx.createBiquadFilter();
        nHp.type = 'highpass';
        nHp.frequency.value = randomBetween(1400, 7200);
        nHp.Q.value = 0.6;
        n.connect(nHp).connect(nGain).connect(panner);
        n.start(at);
        n.stop(at + 0.12);
        n.onended = () => {
          n.disconnect();
          nHp.disconnect();
          nGain.disconnect();
        };
      }
      oscA.onended = () => {
        oscA.disconnect();
        oscB.disconnect();
        bGain.disconnect();
        mix.disconnect();
        drive.disconnect();
        bp.disconnect();
        lp.disconnect();
        amp.disconnect();
        panner.disconnect();
        dry.disconnect();
        sendDelay.disconnect();
        sendVerb.disconnect();
      };
      oscA.start(at);
      oscB.start(at);
      oscA.stop(at + 2.2);
      oscB.stop(at + 2.2);
    };
    const triggerChordWisp = (at) => {
      const chordRoot =
        this.rootHz *
        pickWeighted([
          { item: 8, weight: 0.9 },
          { item: 16, weight: 2.3 },
          { item: 32, weight: 0.7 },
        ]);
      let semitoneIntervals = [];
      let ratios = [];
      if (harmonyMode === 'scale') {
        const third = diatonicOffset(2);
        const fifth = diatonicOffset(4);
        const seventh = diatonicOffset(6);
        const ninth = diatonicOffset(1, 1);
        const eleventh = diatonicOffset(3, 1);
        semitoneIntervals = shuffleInPlace(
          pickWeighted([
            { item: [0, third, fifth], weight: 2.0 },
            { item: [0, third, fifth, seventh], weight: 1.2 },
            { item: [0, third, fifth, ninth], weight: 1.2 },
            { item: [0, third, fifth, eleventh], weight: 0.9 },
          ]).slice()
        );
      } else {
        const flavor = pickWeighted(
          activeChordFlavors.map((c) => ({ item: c, weight: c.weight }))
        );
        ratios = flavor.ratios.slice(0, 5);
      }
      const src = ctx.createBufferSource();
      src.buffer = createNoiseBuffer(ctx, 1.2, nextBufferSeed());
      src.loop = false;
      const env = ctx.createGain();
      env.gain.setValueAtTime(0.0001, at);
      const attack = randomBetween(0.02, 0.08);
      const hold = randomBetween(0.02, 0.12);
      const decay = randomBetween(1.8, 4.8);
      const peak = clamp(0.035 * sceneNear, 0.01, 0.06);
      env.gain.linearRampToValueAtTime(peak, at + attack);
      env.gain.setTargetAtTime(0.0001, at + attack + hold, decay);
      const hp = ctx.createBiquadFilter();
      hp.type = 'highpass';
      hp.frequency.value = randomBetween(90, 160);
      hp.Q.value = 0.55;
      const lp = ctx.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.value = randomBetween(1600, 3200);
      lp.Q.value = 0.45;
      const drive = ctx.createWaveShaper();
      {
        const len = 1024;
        const curve = new Float32Array(len);
        for (let i = 0; i < len; i++) {
          const x = (i / (len - 1)) * 2 - 1;
          curve[i] = Math.tanh(x * 1.15);
        }
        drive.curve = curve;
        drive.oversample = '2x';
      }
      const resonatorCount = clamp(
        pickWeighted([
          { item: 4, weight: 2.2 },
          { item: 5, weight: 1.2 },
          { item: 6, weight: 0.55 },
        ]),
        3,
        7
      );
      const freqs = [];
      for (let i = 0; i < resonatorCount; i++) {
        if (harmonyMode === 'scale') {
          const interval = semitoneIntervals[i % semitoneIntervals.length] ?? 0;
          const octave = pickWeighted([
            { item: -12, weight: 0.55 },
            { item: 0, weight: 2.0 },
            { item: 12, weight: 1.2 },
            { item: 24, weight: 0.35 },
          ]);
          freqs.push(
            clamp(chordRoot * semitonesToRatio(interval + octave), 60, 2600)
          );
        } else {
          const ratio = ratios[i % ratios.length] ?? 1;
          const octave = pickWeighted([
            { item: 0.5, weight: 0.55 },
            { item: 1, weight: 2.0 },
            { item: 2, weight: 1.1 },
            { item: 4, weight: 0.25 },
          ]);
          freqs.push(clamp(chordRoot * ratio * octave, 60, 2600));
        }
      }
      const bus = ctx.createGain();
      bus.gain.value = 1;
      const panner = ctx.createStereoPanner();
      panner.pan.value = randomBetween(-0.35, 0.35);
      const resonators = [];
      const resonatorGains = [];
      for (let i = 0; i < freqs.length; i++) {
        const f = freqs[i];
        const bp = ctx.createBiquadFilter();
        bp.type = 'bandpass';
        bp.frequency.value = f;
        bp.Q.value = randomBetween(6, 18);
        const g = ctx.createGain();
        const tilt = Math.pow(120 / Math.max(120, f), 0.55);
        g.gain.value = clamp(
          0.15 * tilt * randomBetween(0.75, 1.25),
          0.01,
          0.22
        );
        drive.connect(bp).connect(g).connect(bus);
        resonators.push(bp);
        resonatorGains.push(g);
      }
      src.connect(hp).connect(env).connect(lp).connect(drive);
      const postLP = ctx.createBiquadFilter();
      postLP.type = 'lowpass';
      postLP.frequency.value = randomBetween(1800, 4200);
      postLP.Q.value = 0.45;
      const postHP = ctx.createBiquadFilter();
      postHP.type = 'highpass';
      postHP.frequency.value = randomBetween(70, 130);
      postHP.Q.value = 0.5;
      bus.connect(postLP).connect(postHP).connect(panner);
      const dry = ctx.createGain();
      dry.gain.value = 0.09 * sceneNear;
      panner.connect(dry).connect(masterGain);
      const sendVerb = ctx.createGain();
      sendVerb.gain.value = randomBetween(0.25, 0.65) * sceneVerb;
      panner.connect(sendVerb).connect(reverbIn);
      const sendDelay = ctx.createGain();
      sendDelay.gain.value = randomBetween(0.15, 0.55) * sceneDelay;
      panner.connect(sendDelay).connect(delayIn);
      src.onended = () => {
        src.disconnect();
        hp.disconnect();
        env.disconnect();
        lp.disconnect();
        drive.disconnect();
        bus.disconnect();
        postLP.disconnect();
        postHP.disconnect();
        panner.disconnect();
        dry.disconnect();
        sendVerb.disconnect();
        sendDelay.disconnect();
        for (const r of resonators) r.disconnect();
        for (const g of resonatorGains) g.disconnect();
      };
      src.start(at);
      src.stop(at + 1.2);
    };
    const shouldHatAtStep = (s) => {
      const offbeat = s % 8 === 4;
      if (offbeat) return RANDOM() < 0.68;
      const sprinkle = s % 16 === 14 && RANDOM() < 0.16;
      return sprinkle;
    };
    const intensityForPattern = (value, isMain) => {
      if (value <= 0) return 0;
      const scale = isMain
        ? randomBetween(0.8, 1.05)
        : randomBetween(0.22, 0.75);
      return clamp(value * scale, 0, 1.2);
    };
    const bassNoteComp = (semis) => {
      if (semis <= 0) return 1;
      const oct = semis / 12;
      const comp = 1 / Math.pow(2, 1.15 * oct);
      return clamp(comp, 0.45, 1);
    };
    const mixPhaseState = {
      phase: 'none',
      startAt: 0,
      endAt: 0,
      pendingReseed: false,
    };
    const kickTimer = setInterval(() => {
      if (!this.context) return;
      const lookAhead = 0.15;
      const now = this.context.currentTime;
      if (mixPhaseState.phase !== 'none' && now >= mixPhaseState.endAt) {
        if (mixPhaseState.phase === 'out' && mixPhaseState.pendingReseed) {
          reseedRhythm();
          mixPhaseState.pendingReseed = false;
          mixPhaseState.phase = 'in';
          mixPhaseState.startAt = now;
          mixPhaseState.endAt = now + randomBetween(10, 22);
        } else {
          mixPhaseState.phase = 'none';
        }
      }
      const mixFadeAt = (t) => {
        if (mixPhaseState.phase === 'out') {
          const a = clamp(
            (t - mixPhaseState.startAt) /
              Math.max(0.001, mixPhaseState.endAt - mixPhaseState.startAt),
            0,
            1
          );
          return 1 - a;
        }
        if (mixPhaseState.phase === 'in') {
          const a = clamp(
            (t - mixPhaseState.startAt) /
              Math.max(0.001, mixPhaseState.endAt - mixPhaseState.startAt),
            0,
            1
          );
          return a;
        }
        return 1;
      };
      while (nextBurstAt < this.context.currentTime + lookAhead) {
        const at = nextBurstAt;
        const fade = mixFadeAt(at);
        if (burstEnabled && fade > 0.2) {
          const intensity =
            randomBetween(0.2, 0.7) *
            (kickEnabled ? 0.85 : 1.05) *
            fade *
            (rhythmScene === 'minimal' ? 0.65 : 1);
          triggerNoiseBurst(at, intensity);
          if (RANDOM() < 0.14 * fade) {
            triggerNoiseBurst(
              at + randomBetween(0.22, 0.95),
              intensity * randomBetween(0.22, 0.6)
            );
          }
        }
        nextBurstAt =
          at +
          (rhythmScene === 'drone'
            ? randomBetween(60, 180)
            : rhythmScene === 'minimal'
            ? randomBetween(32, 95)
            : rhythmScene === 'dub'
            ? randomBetween(18, 60)
            : randomBetween(22, 75));
      }
      while (nextStepAt < this.context.currentTime + lookAhead) {
        const now = this.context.currentTime;
        if (!this.syncToWallClock && now >= nextTempoAt) {
          bpmTarget = clamp(bpmCurrent + randomBetween(-10, 10), 90, 134);
          nextTempoAt = now + randomBetween(9, 22);
        }
        if (!this.syncToWallClock) {
          bpmCurrent += (bpmTarget - bpmCurrent) * 0.02;
        }
        const stepSeconds = 60 / bpmCurrent / 4;
        if (this.syncToWallClock) {
          const wallElapsed = (Date.now() - seedEpochMs) / 1000;
          const idx = Math.floor(wallElapsed / SYNC_RHYTHM_SECTION_SECONDS);
          if (idx !== syncRhythmIndex) {
            syncRhythmIndex = idx;
            withTimeRng(200, idx, () => {
              reseedRhythm();
              bpmCurrent = randomBetween(106, 126);
              bpmTarget = bpmCurrent;
              nextTempoAt = Infinity;
              swing = randomBetween(0.02, 0.12);
            });
          }
        }
        if (step % 8 === 0) {
          snareDelay.delayTime.setTargetAtTime(
            clamp(stepSeconds * snareDelaySteps, 0.08, 0.9),
            now,
            0.35
          );
          if (delayCreativeMode === 'wander') {
            const base = clamp(
              stepSeconds *
                pickWeighted([
                  { item: 3, weight: 1.4 },
                  { item: 4, weight: 1.2 },
                  { item: 6, weight: 0.9 },
                  { item: 8, weight: 0.6 },
                ]),
              0.22,
              0.85
            );
            delay.delayTime.setTargetAtTime(base, now, 18);
            delayFilter.frequency.setTargetAtTime(
              randomBetween(1200, 5200),
              now,
              22
            );
          }
        }
        if (sectionStepsRemaining <= 0) {
          if (mixPhaseState.phase === 'none' && RANDOM() < 0.35) {
            mixPhaseState.phase = 'out';
            mixPhaseState.startAt = now;
            mixPhaseState.endAt = now + randomBetween(8, 18);
            mixPhaseState.pendingReseed = true;
            bassSceneGain.gain.setTargetAtTime(0.0001, now, 6);
            sectionStepsRemaining = 999999;
          } else if (mixPhaseState.phase === 'none') {
            reseedRhythm();
          }
        }
        sectionStepsRemaining -= 1;
        const swingOffset = step % 2 === 1 ? stepSeconds * swing : 0;
        const at = nextStepAt + swingOffset;
        const pStep = step % currentPattern.length;
        const barIndex = Math.floor(step / 16);
        const isBar = step % 16 === 0;
        const fade = mixFadeAt(at);
        if (!bassEnabled && bassEnterAt > 0 && at >= bassEnterAt) {
          bassEnabled = true;
          bassEnterAt = -1;
          bassSceneGain.gain.setTargetAtTime(1, at, 10);
        }
        if (isBar && pulseEnabled) {
          if (droneAccentEnabled) {
            const amt =
              droneAccentPattern[barIndex % droneAccentPattern.length] ?? 0;
            if (amt > 0 && RANDOM() < 0.9) {
              const base = fundamentalGain.gain.value;
              const peak = base * (1 + 0.12 * clamp(amt, 0, 1.2));
              fundamentalGain.gain.cancelScheduledValues(at);
              fundamentalGain.gain.setValueAtTime(base, at);
              fundamentalGain.gain.linearRampToValueAtTime(
                peak,
                at + randomBetween(0.012, 0.035)
              );
              fundamentalGain.gain.setTargetAtTime(
                base,
                at + randomBetween(0.04, 0.09),
                randomBetween(0.25, 1.2)
              );
            }
          }
          if (harmonyAccentEnabled) {
            const amt =
              harmonyAccentPattern[barIndex % harmonyAccentPattern.length] ?? 0;
            if (amt > 0 && RANDOM() < 0.85) {
              const bump = 1 + 0.22 * clamp(amt, 0, 1.2);
              harmonyDrivePre.gain.cancelScheduledValues(at);
              harmonyDrivePre.gain.setValueAtTime(
                harmonyDrivePre.gain.value,
                at
              );
              harmonyDrivePre.gain.linearRampToValueAtTime(
                harmonyDrivePre.gain.value * bump,
                at + randomBetween(0.01, 0.03)
              );
              harmonyDrivePre.gain.setTargetAtTime(
                harmonyDrivePre.gain.value,
                at + randomBetween(0.03, 0.08),
                randomBetween(0.3, 1.1)
              );
              harmonyGrainGain.gain.setTargetAtTime(
                harmonyGrainGain.gain.value * randomBetween(1.05, 1.4),
                at,
                randomBetween(0.4, 1.4)
              );
            }
          }
          const pulse = pulsePattern[barIndex % pulsePattern.length] ?? 0;
          if (pulse > 0 && RANDOM() < 0.92) {
            const amount = clamp(pulse * randomBetween(0.7, 1.1), 0, 1.2);
            bassPulseGain.gain.cancelScheduledValues(at);
            bassPulseGain.gain.setValueAtTime(1, at);
            bassPulseGain.gain.linearRampToValueAtTime(
              1 + 0.16 * amount,
              at + randomBetween(0.012, 0.028)
            );
            bassPulseGain.gain.setTargetAtTime(
              1,
              at + randomBetween(0.035, 0.075),
              randomBetween(0.28, 0.9)
            );
            if (RANDOM() < 0.55) {
              bassDriveLP.frequency.setTargetAtTime(
                randomBetween(135, 320),
                at,
                randomBetween(0.3, 1.1)
              );
            }
          }
        }
        const kickVal = currentPattern.kick[pStep] ?? 0;
        const hatVal = currentPattern.hat[pStep] ?? 0;
        const isMainKick = pStep % 4 === 0;
        if (kickStyle === 'dub') {
          currentPattern = pickWeighted([
            { item: patterns[0], weight: 2.6 },
            { item: patterns[1], weight: 1.0 },
            { item: patterns[3], weight: 1.1 },
            { item: patterns[2], weight: 0.6 },
          ]);
        }
        if (
          kickEnabled &&
          fade > 0.15 &&
          kickVal > 0 &&
          RANDOM() < 0.95 * fade
        ) {
          const intensity = intensityForPattern(kickVal, isMainKick);
          const i2 = intensity * (0.35 + 0.65 * fade);
          triggerKick(at, i2, isMainKick, kickStyle === 'dub' ? 1.25 : 1);
          sidechain(at, 0.55 * i2);
          // Dub techno "throws": occasional late/ghost kick into the delay.
          if (kickStyle === 'dub' && isMainKick && RANDOM() < 0.18 * fade) {
            const ghostAt =
              at +
              stepSeconds *
                pickWeighted([
                  { item: 1.5, weight: 1.2 }, // dotted 8th feel
                  { item: 1.0, weight: 1.0 }, // 8th
                  { item: 2.0, weight: 0.8 }, // quarter
                ]);
            triggerKick(
              ghostAt,
              clamp(i2 * randomBetween(0.22, 0.45), 0.08, 0.6),
              false,
              randomBetween(2.2, 3.6)
            );
          }
        }
        const snareStep = pStep % 16 === 4 || pStep % 16 === 12;
        const ghostSnare = pStep % 16 === 14;
        if (
          snareEnabled &&
          fade > 0.2 &&
          (snareStep || ghostSnare) &&
          RANDOM() <
            (snareStep ? snareProbability : snareGhostProbability) * fade
        ) {
          const intensity = clamp(
            (snareStep ? randomBetween(0.65, 1.0) : randomBetween(0.25, 0.55)) *
              (kickEnabled ? 0.9 : 1.05),
            0.2,
            1.1
          );
          triggerSnare(
            at + randomBetween(-0.01, 0.016),
            intensity * (0.35 + 0.65 * fade)
          );
        }
        {
          const desiredSemis =
            bassNotePattern[pStep % bassNotePattern.length] ?? bassNoteSemis;
          if (!bassEnabled) {
            bassNoteSemis = 0;
          } else if (bassGateEnabled) {
            bassNoteSemis = limitBassSemis(this.rootHz, desiredSemis);
          } else {
            bassNoteSemis = 0;
          }
          const targetHz = this.rootHz * semitonesToRatio(bassNoteSemis);
          const tc = motionMode === 'step' ? 0.06 : 0.12;
          oscillator.frequency.cancelScheduledValues(at);
          oscillator.frequency.setValueAtTime(oscillator.frequency.value, at);
          oscillator.frequency.setTargetAtTime(targetHz, at, tc);
          const gainTc = motionMode === 'step' ? 0.08 : 0.18;
          bassNoteGain.gain.cancelScheduledValues(at);
          bassNoteGain.gain.setValueAtTime(bassNoteGain.gain.value, at);
          bassNoteGain.gain.setTargetAtTime(
            bassEnabled ? bassNoteComp(bassNoteSemis) : 0.0001,
            at,
            gainTc
          );
        }
        if (bassGateEnabled) {
          const v = bassGatePattern[pStep % bassGatePattern.length] ?? 0;
          const target = clamp(
            bassGateFloor + (1 - bassGateFloor) * clamp(v, 0, 1),
            0,
            1
          );
          const tc = v > 0 ? bassGateAttack : bassGateRelease;
          bassGateGain.gain.cancelScheduledValues(at);
          bassGateGain.gain.setValueAtTime(bassGateGain.gain.value, at);
          bassGateGain.gain.setTargetAtTime(target, at, tc);
        } else {
          if (bassGateGain.gain.value !== 1) {
            bassGateGain.gain.cancelScheduledValues(at);
            bassGateGain.gain.setTargetAtTime(1, at, 0.25);
          }
        }
        if (hatsEnabled && fade > 0.2) {
          const fromPattern = hatVal > 0 && RANDOM() < 0.58 + 0.22 * hatVal;
          if (fromPattern || shouldHatAtStep(step)) {
            const intensity = clamp(
              (fromPattern ? hatVal : randomBetween(0.18, 0.7)) *
                randomBetween(0.6, 1.1),
              0.12,
              1
            );
            triggerHat(
              at + randomBetween(-0.01, 0.012),
              intensity * (0.35 + 0.65 * fade)
            );
          }
        }
        if (
          arpEnabled &&
          step % arpEverySteps === 0 &&
          arpPatternSemis.length > 0
        ) {
          if (fade > 0.25 && RANDOM() < arpProbability * fade) {
            const idx = arpIndex++ % arpPatternSemis.length;
            const semi = arpPatternSemis[idx] ?? 0;
            const drift =
              !consonantScene && RANDOM() < 0.08
                ? pickWeighted([
                    { item: -1, weight: 1 },
                    { item: 1, weight: 1 },
                  ])
                : 0;
            const vel =
              arpIntensityPattern[arpVelIndex++ % arpIntensityPattern.length] ??
              0.75;
            const intensity = clamp(
              randomBetween(0.4, 0.95) *
                vel *
                (kickEnabled ? 0.9 : 1.0) *
                (consonantScene ? 0.95 : 1),
              0.2,
              1.1
            );
            triggerArpNote(
              at + randomBetween(-0.012, 0.02),
              semi + drift,
              intensity * (0.35 + 0.65 * fade)
            );
          }
        }
        if (
          arp2Enabled &&
          step % arp2EverySteps === 0 &&
          arp2PatternSemis.length > 0
        ) {
          if (fade > 0.25 && RANDOM() < arp2Probability * fade) {
            const idx = arp2Index++ % arp2PatternSemis.length;
            const semi = arp2PatternSemis[idx] ?? 0;
            const vel =
              arp2IntensityPattern[
                arp2VelIndex++ % arp2IntensityPattern.length
              ] ?? 0.75;
            const drift =
              !consonantScene && RANDOM() < 0.06
                ? pickWeighted([
                    { item: -1, weight: 1 },
                    { item: 1, weight: 1 },
                  ])
                : 0;
            const intensity = clamp(
              randomBetween(0.35, 0.85) *
                vel *
                (kickEnabled ? 0.9 : 1.05) *
                (consonantScene ? 0.9 : 1),
              0.18,
              1
            );
            triggerSynthArpNote(
              at + randomBetween(-0.02, 0.03),
              semi + drift,
              intensity * (0.35 + 0.65 * fade)
            );
          }
        }
        if (step % 64 === 0 && RANDOM() < (consonantScene ? 0.22 : 0.3)) {
          triggerChordWisp(at + randomBetween(0.02, 0.18));
        }
        step = (step + 1) % 256;
        nextStepAt += stepSeconds;
      }
    }, 75);
    this.oscillator = oscillator;
    this.lfo = lfo;
    this.harmonicVoices = harmonicVoices;
    this.harmonyVoices = harmonyVoices;
    this.voices = [
      ...harmonicVoices.map((v) => v.osc),
      ...harmonyVoices.map((v) => v.osc),
    ];
    this.bass = {
      mix: bassMix,
      pre: bassPre,
      drive: bassDrive,
      driveLP: bassDriveLP,
      driveGain: bassDriveGain,
      cleanLP: bassCleanLP,
      cleanGain: bassCleanGain,
      noteGain: bassNoteGain,
      sceneGain: bassSceneGain,
      pulseGain: bassPulseGain,
      gateGain: bassGateGain,
      hp: bassHp,
      toFx: bassToFxGain,
      toDirect: bassToDirectGain,
      directDuck: bassDirectDuck,
      directPan: bassDirectPan,
    };
    this.fx = {
      mix: fxMix,
      dry: fxDry,
      wet: fxWet,
      chorusDelay,
      chorusFilter,
      chorusLfo,
      chorusLfoGain,
      phaserStages,
      phaserLfo,
      phaserLfoGain,
    };
    this.harmonyFx = {
      bus: harmonyBus,
      drivePre: harmonyDrivePre,
      drive: harmonyDrive,
      bp: harmonyBp,
      lp: harmonyLp,
      grainSource: harmonyGrainSource,
      grainHp: harmonyGrainHp,
      grainLp: harmonyGrainLp,
      grainGain: harmonyGrainGain,
    };
    this.noise = {
      source: noiseSource,
      highpass: noiseHighpass,
      bandpass: noiseBandpass,
      lowpass: noiseLowpass,
      gain: noiseGain,
      duck: noiseDuck,
      panner: noisePanner,
      dry: noiseDry,
      wet: noiseWet,
      lfoFreq: noiseLfoFreq,
      lfoFreqGain: noiseLfoFreqGain,
      lfoAmp: noiseLfoAmp,
      lfoAmpGain: noiseLfoAmpGain,
      lfoLowpass: noiseLfoLowpass,
      lfoLowpassGain: noiseLfoLowpassGain,
      lfoPan: noiseLfoPan,
      lfoPanGain: noiseLfoPanGain,
    };
    this.kick = { duckGain, kickDry, kickWet, timer: kickTimer };
    this.delay = {
      in: delayIn,
      delay,
      feedback: delayFeedback,
      filter: delayFilter,
      return: delayReturn,
      verbSend: delayVerbSend,
      lfo: delayLfo,
      lfoGain: delayLfoGain,
    };
    this.snare = {
      delayIn: snareDelayIn,
      delay: snareDelay,
      feedback: snareDelayFeedback,
      filter: snareDelayFilter,
      panner: snareDelayPanner,
      return: snareDelayReturn,
      verbSend: snareDelayVerbSend,
      lfo: snareDelayLfo,
      lfoGain: snareDelayLfoGain,
    };
    this.reverb = {
      in: reverbIn,
      a: convolverA,
      b: convolverB,
      wetA: reverbWetA,
      wetB: reverbWetB,
      active: 'a',
    };
    this.tape = { lfo: tapeLfo, gain: tapeLfoGain };
    this.pad = {
      gain: padGain,
      pre: padPre,
      drive: padDrive,
      bp: padBp,
      lp: padLp,
      dry: padDry,
      verbSend: padVerbSend,
      delaySend: padDelaySend,
      oscs: padOscs,
      lfo: padLfo,
      lfoGain: padLfoGain,
    };
    this.mastering = {
      masterHP,
      lowShelf,
      highShelf,
      glue,
      makeup,
      limiter,
      clip,
      bassComp,
      noiseComp,
      kickComp,
    };
    this.masterGain = masterGain;
    this.outputGain = outputGain;
    this.analyser = analyser;
    this.state = 'running';
  }

  async stop() {
    if (this.state === 'stopped' || this.state === 'stopping') return;
    if (!this.context) {
      this.state = 'stopped';
      return;
    }
    this.state = 'stopping';
    const ctx = this.context;
    const now = ctx.currentTime;
    const kick = this.kick;
    const delay = this.delay;
    const snare = this.snare;
    const reverb = this.reverb;
    const tape = this.tape;
    const pad = this.pad;
    const bass = this.bass;
    const fx = this.fx;
    const mastering = this.mastering;
    const harmonyFx = this.harmonyFx;
    if (this.evolutionTimer) {
      clearInterval(this.evolutionTimer);
      this.evolutionTimer = null;
    }
    if (kick) clearInterval(kick.timer);
    if (this.outputGain) {
      this.outputGain.gain.cancelScheduledValues(now);
      this.outputGain.gain.setValueAtTime(this.outputGain.gain.value, now);
      this.outputGain.gain.linearRampToValueAtTime(0.0001, now + 1.2);
    }
    const stopAt = now + 1.25;
    this.oscillator?.stop(stopAt);
    this.lfo?.stop(stopAt);
    tape?.lfo.stop(stopAt);
    delay?.lfo.stop(stopAt);
    snare?.lfo.stop(stopAt);
    pad?.lfo.stop(stopAt);
    fx?.chorusLfo.stop(stopAt);
    fx?.phaserLfo.stop(stopAt);
    harmonyFx?.grainSource.stop(stopAt);
    for (const voice of this.voices) voice.stop(stopAt);
    this.noise?.source.stop(stopAt);
    this.noise?.lfoFreq.stop(stopAt);
    this.noise?.lfoAmp.stop(stopAt);
    this.noise?.lfoLowpass.stop(stopAt);
    this.noise?.lfoPan.stop(stopAt);
    for (const osc of pad?.oscs ?? []) osc.stop(stopAt);
    await new Promise((resolve) => {
      const timeoutMs = Math.ceil((stopAt - now) * 1000) + 50;
      setTimeout(() => resolve(), timeoutMs);
    });
    this.oscillator?.disconnect();
    bass?.mix.disconnect();
    bass?.pre.disconnect();
    bass?.drive.disconnect();
    bass?.driveLP.disconnect();
    bass?.driveGain.disconnect();
    bass?.cleanLP.disconnect();
    bass?.cleanGain.disconnect();
    bass?.noteGain.disconnect();
    bass?.sceneGain.disconnect();
    bass?.pulseGain.disconnect();
    bass?.gateGain.disconnect();
    bass?.hp.disconnect();
    bass?.toFx.disconnect();
    bass?.toDirect.disconnect();
    bass?.directDuck.disconnect();
    bass?.directPan.disconnect();
    this.lfo?.disconnect();
    tape?.lfo.disconnect();
    tape?.gain.disconnect();
    fx?.mix.disconnect();
    fx?.dry.disconnect();
    fx?.wet.disconnect();
    fx?.chorusDelay.disconnect();
    fx?.chorusFilter.disconnect();
    fx?.chorusLfo.disconnect();
    fx?.chorusLfoGain.disconnect();
    for (const stage of fx?.phaserStages ?? []) stage.disconnect();
    fx?.phaserLfo.disconnect();
    fx?.phaserLfoGain.disconnect();
    reverb?.in.disconnect();
    reverb?.a.disconnect();
    reverb?.b.disconnect();
    reverb?.wetA.disconnect();
    reverb?.wetB.disconnect();
    mastering?.bassComp.disconnect();
    mastering?.noiseComp.disconnect();
    mastering?.kickComp.disconnect();
    mastering?.masterHP.disconnect();
    mastering?.lowShelf.disconnect();
    mastering?.highShelf.disconnect();
    mastering?.glue.disconnect();
    mastering?.makeup.disconnect();
    mastering?.limiter.disconnect();
    mastering?.clip.disconnect();
    harmonyFx?.bus.disconnect();
    harmonyFx?.drivePre.disconnect();
    harmonyFx?.drive.disconnect();
    harmonyFx?.bp.disconnect();
    harmonyFx?.lp.disconnect();
    harmonyFx?.grainSource.disconnect();
    harmonyFx?.grainHp.disconnect();
    harmonyFx?.grainLp.disconnect();
    harmonyFx?.grainGain.disconnect();
    pad?.gain.disconnect();
    pad?.pre.disconnect();
    pad?.drive.disconnect();
    pad?.bp.disconnect();
    pad?.lp.disconnect();
    pad?.dry.disconnect();
    pad?.verbSend.disconnect();
    pad?.delaySend.disconnect();
    pad?.lfo.disconnect();
    pad?.lfoGain.disconnect();
    for (const osc of pad?.oscs ?? []) osc.disconnect();
    delay?.in.disconnect();
    delay?.delay.disconnect();
    delay?.feedback.disconnect();
    delay?.filter.disconnect();
    delay?.return.disconnect();
    delay?.verbSend.disconnect();
    delay?.lfo.disconnect();
    delay?.lfoGain.disconnect();
    snare?.delayIn.disconnect();
    snare?.delay.disconnect();
    snare?.feedback.disconnect();
    snare?.filter.disconnect();
    snare?.panner.disconnect();
    snare?.return.disconnect();
    snare?.verbSend.disconnect();
    snare?.lfo.disconnect();
    snare?.lfoGain.disconnect();
    for (const voice of this.harmonicVoices) voice.osc.disconnect();
    for (const voice of this.harmonyVoices) {
      voice.osc.disconnect();
      voice.panner.disconnect();
    }
    this.noise?.source.disconnect();
    this.noise?.highpass.disconnect();
    this.noise?.bandpass.disconnect();
    this.noise?.lowpass.disconnect();
    this.noise?.gain.disconnect();
    this.noise?.duck.disconnect();
    this.noise?.panner.disconnect();
    this.noise?.dry.disconnect();
    this.noise?.wet.disconnect();
    this.noise?.lfoFreq.disconnect();
    this.noise?.lfoFreqGain.disconnect();
    this.noise?.lfoAmp.disconnect();
    this.noise?.lfoAmpGain.disconnect();
    this.noise?.lfoLowpass.disconnect();
    this.noise?.lfoLowpassGain.disconnect();
    this.noise?.lfoPan.disconnect();
    this.noise?.lfoPanGain.disconnect();
    kick?.duckGain.disconnect();
    kick?.kickDry.disconnect();
    kick?.kickWet.disconnect();
    this.masterGain?.disconnect();
    this.outputGain?.disconnect();
    this.analyser?.disconnect();
    this.oscillator = null;
    this.lfo = null;
    this.voices = [];
    this.harmonicVoices = [];
    this.harmonyVoices = [];
    this.bass = null;
    this.fx = null;
    this.mastering = null;
    this.harmonyFx = null;
    this.tape = null;
    this.reverb = null;
    this.noise = null;
    this.kick = null;
    this.delay = null;
    this.snare = null;
    this.pad = null;
    this.masterGain = null;
    this.outputGain = null;
    this.analyser = null;
    this.state = 'stopped';
  }

  async dispose() {
    await this.stop();
    await this.context?.close();
    this.context = null;
    if (this.htmlUnlockTag) {
      try {
        this.htmlUnlockTag.pause();
      } catch {
        // Ignore
      }
      try {
        this.htmlUnlockTag.remove();
      } catch {
        // Ignore
      }
      this.htmlUnlockTag = null;
    }
  }
}
