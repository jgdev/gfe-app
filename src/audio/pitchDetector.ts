import { getNoteName } from '../music/theory';

export interface DetectedPitch {
  frequency: number;
  midiFloat: number;
  nearestMidi: number;
  noteName: string;
  octave: number;
  cents: number; // -50 to +50
  rms: number;
  clarity: number; // 0..1
}

/**
 * High-accuracy guitar pitch detector using YIN-inspired difference function
 * with cumulative mean normalization and parabolic interpolation.
 * Covers full guitar fundamental range: ~65 Hz (Drop C / Low C2) to 1400 Hz (High F6).
 */
export function detectPitchYIN(
  buffer: Float32Array,
  sampleRate: number,
  a4 = 440,
  rmsThreshold = 0.012
): DetectedPitch | null {
  // 1. Compute RMS level for noise gate
  let sumSq = 0;
  for (let i = 0; i < buffer.length; i++) {
    sumSq += buffer[i] * buffer[i];
  }
  const rms = Math.sqrt(sumSq / buffer.length);
  if (rms < rmsThreshold) {
    return null;
  }

  const halfLen = Math.floor(buffer.length / 2);
  const minLag = Math.floor(sampleRate / 1450); // ~1450 Hz max
  const maxLag = Math.min(halfLen - 2, Math.floor(sampleRate / 62)); // ~62 Hz min

  if (maxLag <= minLag) return null;

  // 2. Difference function d(tau)
  const diff = new Float32Array(maxLag + 1);
  for (let tau = 1; tau <= maxLag; tau++) {
    let sum = 0;
    for (let j = 0; j < halfLen; j++) {
      const delta = buffer[j] - buffer[j + tau];
      sum += delta * delta;
    }
    diff[tau] = sum;
  }

  // 3. Cumulative mean normalized difference function (CMND)
  const cmnd = new Float32Array(maxLag + 1);
  cmnd[0] = 1;
  let runningSum = 0;
  for (let tau = 1; tau <= maxLag; tau++) {
    runningSum += diff[tau];
    cmnd[tau] = runningSum === 0 ? 1 : (diff[tau] * tau) / runningSum;
  }

  // 4. Absolute threshold search (first local minimum below 0.16)
  const threshold = 0.16;
  let bestTau = -1;
  for (let tau = minLag; tau < maxLag; tau++) {
    if (cmnd[tau] < threshold) {
      while (tau + 1 < maxLag && cmnd[tau + 1] < cmnd[tau]) {
        tau++;
      }
      bestTau = tau;
      break;
    }
  }

  // Fallback to global minimum if signal is slightly noisy
  if (bestTau === -1) {
    let minVal = 1;
    for (let tau = minLag; tau < maxLag; tau++) {
      if (cmnd[tau] < minVal) {
        minVal = cmnd[tau];
        bestTau = tau;
      }
    }
    if (minVal > 0.32) {
      return null;
    }
  }

  // 5. Parabolic interpolation around bestTau for sub-sample precision
  const x0 = bestTau > 1 ? cmnd[bestTau - 1] : cmnd[bestTau];
  const x1 = cmnd[bestTau];
  const x2 = bestTau + 1 < cmnd.length ? cmnd[bestTau + 1] : cmnd[bestTau];
  const denom = 2 * x1 - x2 - x0;
  const shift = denom !== 0 ? (x2 - x0) / (2 * denom) : 0;
  const refinedTau = bestTau + Math.max(-0.5, Math.min(0.5, shift));

  const frequency = sampleRate / refinedTau;
  if (!Number.isFinite(frequency) || frequency < 60 || frequency > 1500) {
    return null;
  }

  const midiFloat = 69 + 12 * Math.log2(frequency / a4);
  const nearestMidi = Math.round(midiFloat);
  const cents = (midiFloat - nearestMidi) * 100;
  const pitchClass = ((nearestMidi % 12) + 12) % 12;
  const octave = Math.floor(nearestMidi / 12) - 1;
  const noteName = getNoteName(pitchClass, false);
  const clarity = Math.max(0, Math.min(1, 1 - cmnd[bestTau]));

  return {
    frequency,
    midiFloat,
    nearestMidi,
    noteName,
    octave,
    cents,
    rms,
    clarity,
  };
}
