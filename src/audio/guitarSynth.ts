import { midiToFrequency } from '../music/theory';

export type GuitarTone = 'electric' | 'acoustic' | 'nylon';

class GuitarSynthEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private tone: GuitarTone = 'electric';
  private activeTimeouts: number[] = [];
  private refOsc: OscillatorNode | null = null;
  private refGain: GainNode | null = null;

  private ensureContext(): AudioContext {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = 0.55;
      this.masterGain.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') {
      void this.ctx.resume();
    }
    return this.ctx;
  }

  setTone(tone: GuitarTone) {
    this.tone = tone;
  }

  getTone(): GuitarTone {
    return this.tone;
  }

  /**
   * Plucked guitar string synthesis using a hybrid Karplus-Strong filtered impulse
   * combined with velocity-shaped harmonic partials for warm, natural guitar timbre.
   */
  pluckFrequency(freq: number, duration = 2.0, velocity = 0.75, startTimeOffset = 0) {
    const ctx = this.ensureContext();
    if (!this.masterGain) return;

    const now = ctx.currentTime + startTimeOffset;

    // 1. Short pick transient noise burst
    const bufferSize = Math.max(1, Math.floor(ctx.sampleRate * 0.018));
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.28));
    }
    const noise = ctx.createBufferSource();
    noise.buffer = noiseBuffer;

    const pickFilter = ctx.createBiquadFilter();
    pickFilter.type = 'bandpass';
    pickFilter.frequency.value = this.tone === 'acoustic' ? 3200 : this.tone === 'nylon' ? 1600 : 2400;
    pickFilter.Q.value = 1.2;

    const pickGain = ctx.createGain();
    pickGain.gain.setValueAtTime(velocity * (this.tone === 'nylon' ? 0.14 : 0.24), now);
    pickGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.025);

    noise.connect(pickFilter);
    pickFilter.connect(pickGain);
    pickGain.connect(this.masterGain);
    noise.start(now);

    // 2. Dual-oscillator string body with dynamic low-pass string damping
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();

    osc1.type = this.tone === 'nylon' ? 'triangle' : 'sawtooth';
    osc2.type = 'triangle';
    osc1.frequency.setValueAtTime(freq, now);
    osc2.frequency.setValueAtTime(freq * 2, now);
    // Subtle natural string detune on attack
    osc1.detune.setValueAtTime(this.tone === 'acoustic' ? 4 : 2, now);
    osc1.detune.exponentialRampToValueAtTime(0.01, now + 0.12);

    const mix1 = ctx.createGain();
    const mix2 = ctx.createGain();
    mix1.gain.value = this.tone === 'electric' ? 0.65 : this.tone === 'acoustic' ? 0.58 : 0.8;
    mix2.gain.value = this.tone === 'acoustic' ? 0.34 : this.tone === 'nylon' ? 0.15 : 0.22;

    const bodyFilter = ctx.createBiquadFilter();
    bodyFilter.type = 'lowpass';
    const startCutoff =
      this.tone === 'acoustic'
        ? Math.min(7200, freq * 12)
        : this.tone === 'nylon'
          ? Math.min(3400, freq * 5.5)
          : Math.min(5400, freq * 9);
    const endCutoff = Math.max(380, freq * 1.9);
    bodyFilter.frequency.setValueAtTime(startCutoff, now);
    bodyFilter.frequency.exponentialRampToValueAtTime(endCutoff, now + duration * 0.72);
    bodyFilter.Q.value = this.tone === 'electric' ? 1.8 : 0.9;

    const amp = ctx.createGain();
    amp.gain.setValueAtTime(0.0001, now);
    amp.gain.linearRampToValueAtTime(velocity * 0.36, now + 0.006);
    amp.gain.exponentialRampToValueAtTime(velocity * 0.14, now + duration * 0.25);
    amp.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    osc1.connect(mix1);
    osc2.connect(mix2);
    mix1.connect(bodyFilter);
    mix2.connect(bodyFilter);
    bodyFilter.connect(amp);
    amp.connect(this.masterGain);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + duration + 0.05);
    osc2.stop(now + duration + 0.05);
  }

  pluckMidi(midi: number, duration = 2.0, velocity = 0.75, startTimeOffset = 0, a4 = 440) {
    this.pluckFrequency(midiToFrequency(midi, a4), duration, velocity, startTimeOffset);
  }

  strumChord(
    midiNotes: number[],
    direction: 'down' | 'up' | 'arpeggio' = 'down',
    onNoteIndex?: (idx: number) => void
  ) {
    this.clearScheduled();
    const ordered = direction === 'up' ? [...midiNotes].reverse() : [...midiNotes];
    const spacingMs = direction === 'arpeggio' ? 190 : 34;

    ordered.forEach((midi, idx) => {
      const id = window.setTimeout(() => {
        this.pluckMidi(midi, direction === 'arpeggio' ? 1.9 : 2.3, 0.72);
        if (onNoteIndex) onNoteIndex(idx);
      }, idx * spacingMs);
      this.activeTimeouts.push(id);
    });
  }

  playScaleSequence(
    midiNotes: number[],
    tempoBpm = 128,
    onStep?: (stepIndex: number | null) => void,
    onComplete?: () => void
  ) {
    this.clearScheduled();
    const stepMs = Math.round((60 / tempoBpm) * 500); // eighth notes

    midiNotes.forEach((midi, idx) => {
      const id = window.setTimeout(() => {
        this.pluckMidi(midi, 1.35, 0.75);
        onStep?.(idx);
      }, idx * stepMs);
      this.activeTimeouts.push(id);
    });

    const endId = window.setTimeout(() => {
      onStep?.(null);
      onComplete?.();
    }, midiNotes.length * stepMs + 220);
    this.activeTimeouts.push(endId);
  }

  /**
   * Warm rhythmic chord pad + bass hit for backing progression practice
   */
  playBackingHit(chordMidiNotes: number[], isDownbeat: boolean, durationSec: number) {
    const ctx = this.ensureContext();
    if (!this.masterGain) return;
    const now = ctx.currentTime;

    chordMidiNotes.forEach((midi, idx) => {
      const freq = midiToFrequency(midi);
      const velocity = isDownbeat ? (idx === 0 ? 0.52 : 0.32) : idx === 0 ? 0.34 : 0.22;
      const stagger = idx * 0.018;
      this.pluckFrequency(freq, Math.max(0.6, durationSec * 1.1), velocity, stagger);
    });

    // Subtle percussive muted click on groove pulse
    const clickOsc = ctx.createOscillator();
    const clickGain = ctx.createGain();
    clickOsc.type = 'sine';
    clickOsc.frequency.setValueAtTime(isDownbeat ? 115 : 82, now);
    clickOsc.frequency.exponentialRampToValueAtTime(42, now + 0.07);
    clickGain.gain.setValueAtTime(isDownbeat ? 0.22 : 0.1, now);
    clickGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.08);
    clickOsc.connect(clickGain);
    clickGain.connect(this.masterGain);
    clickOsc.start(now);
    clickOsc.stop(now + 0.09);
  }

  /**
   * Sustained pure/warm reference tone for ear tuning
   */
  startReferenceTone(freq: number) {
    this.stopReferenceTone();
    const ctx = this.ensureContext();
    if (!this.masterGain) return;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, now);
    filter.type = 'lowpass';
    filter.frequency.value = Math.min(2600, freq * 5);

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(0.28, now + 0.06);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);

    this.refOsc = osc;
    this.refGain = gain;
  }

  stopReferenceTone() {
    if (this.refOsc && this.refGain && this.ctx) {
      const now = this.ctx.currentTime;
      try {
        this.refGain.gain.cancelScheduledValues(now);
        this.refGain.gain.setTargetAtTime(0.0001, now, 0.03);
        this.refOsc.stop(now + 0.14);
      } catch {
        // already stopped
      }
    }
    this.refOsc = null;
    this.refGain = null;
  }

  clearScheduled() {
    this.activeTimeouts.forEach((id) => window.clearTimeout(id));
    this.activeTimeouts = [];
  }
}

export const guitarSynth = new GuitarSynthEngine();
