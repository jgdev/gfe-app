import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Mic, MicOff, Volume2, VolumeX } from 'lucide-react';
import {
  GuitarTuning,
  TUNINGS,
  getNoteName,
  midiToFrequency,
} from '../music/theory';
import { DetectedPitch, detectPitchYIN } from '../audio/pitchDetector';
import { guitarSynth } from '../audio/guitarSynth';

interface TunerViewProps {
  tuning: GuitarTuning;
  onTuningChange: (tuningId: string) => void;
}

export const TunerView: React.FC<TunerViewProps> = ({ tuning, onTuningChange }) => {
  const [micActive, setMicActive] = useState(false);
  const [micError, setMicError] = useState<string | null>(null);
  const [a4Freq, setA4Freq] = useState<number>(440);
  const [sensitivity, setSensitivity] = useState<number>(0.012);
  const [targetStringIdx, setTargetStringIdx] = useState<number | null>(null); // null = Auto-detect
  const [playingRefStringIdx, setPlayingRefStringIdx] = useState<number | null>(null);
  const [detected, setDetected] = useState<DetectedPitch | null>(null);
  const [smoothedCents, setSmoothedCents] = useState<number>(0);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const rafRef = useRef<number | null>(null);
  const centsSmoothRef = useRef<number>(0);
  const a4Ref = useRef<number>(a4Freq);
  const sensitivityRef = useRef<number>(sensitivity);

  useEffect(() => {
    a4Ref.current = a4Freq;
  }, [a4Freq]);

  useEffect(() => {
    sensitivityRef.current = sensitivity;
  }, [sensitivity]);

  // Stop mic and reference tone on unmount
  useEffect(() => {
    return () => {
      stopMic();
      guitarSynth.stopReferenceTone();
    };
  }, []);

  const stopMic = () => {
    if (rafRef.current !== null) {
      window.cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (audioCtxRef.current) {
      void audioCtxRef.current.close();
      audioCtxRef.current = null;
    }
    analyserRef.current = null;
    setMicActive(false);
  };

  const startMic = async () => {
    setMicError(null);
    guitarSynth.stopReferenceTone();
    setPlayingRefStringIdx(null);

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setMicError('Microphone access is not available in this browser context. Use the Reference Tone pegs below to tune by ear.');
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
        },
      });

      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new AudioCtx();
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 4096;
      analyser.smoothingTimeConstant = 0.0;
      source.connect(analyser);

      audioCtxRef.current = ctx;
      streamRef.current = stream;
      analyserRef.current = analyser;
      setMicActive(true);

      const buffer = new Float32Array(analyser.fftSize);
      let silentFrames = 0;

      const loop = () => {
        if (!analyserRef.current || !audioCtxRef.current) return;
        analyserRef.current.getFloatTimeDomainData(buffer);
        const pitch = detectPitchYIN(
          buffer,
          audioCtxRef.current.sampleRate,
          a4Ref.current,
          sensitivityRef.current
        );

        if (pitch) {
          silentFrames = 0;
          setDetected(pitch);
          centsSmoothRef.current = centsSmoothRef.current * 0.72 + pitch.cents * 0.28;
          setSmoothedCents(centsSmoothRef.current);
        } else {
          silentFrames += 1;
          if (silentFrames > 35) {
            setDetected(null);
            centsSmoothRef.current *= 0.85;
            setSmoothedCents(centsSmoothRef.current);
          }
        }
        rafRef.current = window.requestAnimationFrame(loop);
      };

      rafRef.current = window.requestAnimationFrame(loop);
    } catch (err) {
      const msg =
        err instanceof Error && err.name === 'NotAllowedError'
          ? 'Microphone permission was denied. Allow microphone access in your browser, or use the Reference Tone pegs below to tune by ear.'
          : 'Could not open microphone input. Use the Reference Tone pegs below to tune by ear.';
      setMicError(msg);
      stopMic();
    }
  };

  // Compute string specs for current tuning
  const strings = useMemo(() => {
    return tuning.midiNotes.map((midi, idx) => {
      const freq = midiToFrequency(midi, a4Freq);
      const noteName = getNoteName(midi % 12, false);
      const octave = Math.floor(midi / 12) - 1;
      return {
        idx, // 0 = String 6 (Low E) .. 5 = String 1 (High E)
        stringNumber: 6 - idx,
        midi,
        noteName,
        octave,
        freq,
      };
    });
  }, [tuning, a4Freq]);

  // Determine active comparison cents (against locked string if selected, else nearest chromatic note)
  const displayReading = useMemo(() => {
    if (!detected) return null;

    if (targetStringIdx !== null) {
      const target = strings[targetStringIdx];
      const centsFromTarget = 1200 * Math.log2(detected.frequency / target.freq);
      return {
        noteName: target.noteName,
        octave: target.octave,
        frequency: detected.frequency,
        targetFrequency: target.freq,
        cents: Math.max(-50, Math.min(50, centsFromTarget)),
        rawCents: centsFromTarget,
        closestStringIdx: targetStringIdx,
      };
    }

    // Find closest guitar string in current tuning
    let bestIdx = 0;
    let minDiff = Infinity;
    strings.forEach((s, idx) => {
      const d = Math.abs(detected.midiFloat - s.midi);
      if (d < minDiff) {
        minDiff = d;
        bestIdx = idx;
      }
    });

    return {
      noteName: detected.noteName,
      octave: detected.octave,
      frequency: detected.frequency,
      targetFrequency: midiToFrequency(detected.nearestMidi, a4Freq),
      cents: Math.max(-50, Math.min(50, smoothedCents)),
      rawCents: detected.cents,
      closestStringIdx: minDiff < 1.5 ? bestIdx : null,
    };
  }, [detected, targetStringIdx, strings, smoothedCents, a4Freq]);

  const tuningStatus = useMemo(() => {
    if (!displayReading) {
      return {
        label: micActive ? 'Listening — Pluck a String' : 'Microphone Off',
        toneClass: 'text-[#9CA3AF]',
        glyph: '○',
        isInTune: false,
      };
    }
    const c = displayReading.rawCents;
    if (Math.abs(c) <= 4.5) {
      return {
        label: 'In Tune',
        toneClass: 'text-emerald-400',
        glyph: '●',
        isInTune: true,
      };
    }
    if (c < -4.5) {
      return {
        label: 'Flat — Tune Up',
        toneClass: 'text-amber-400',
        glyph: '▼',
        isInTune: false,
      };
    }
    return {
      label: 'Sharp — Tune Down',
      toneClass: 'text-rose-400',
      glyph: '▲',
      isInTune: false,
    };
  }, [displayReading, micActive]);

  const handleToggleRefTone = (strIdx: number) => {
    if (playingRefStringIdx === strIdx) {
      guitarSynth.stopReferenceTone();
      setPlayingRefStringIdx(null);
      return;
    }
    const s = strings[strIdx];
    setPlayingRefStringIdx(strIdx);
    guitarSynth.startReferenceTone(s.freq);
  };

  const handlePluckReferenceString = (strIdx: number) => {
    guitarSynth.stopReferenceTone();
    setPlayingRefStringIdx(null);
    const s = strings[strIdx];
    guitarSynth.pluckFrequency(s.freq, 2.8, 0.85);
  };

  // SVG Arc Needle geometry (-50c = -58 deg, 0c = 0 deg, +50c = +58 deg)
  const clampedCents = displayReading ? displayReading.cents : 0;
  const needleAngleDeg = (clampedCents / 50) * 58;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* Left / Main Precision Chromatic Gauge */}
      <div className="lg:col-span-7 bg-[#181A1F] border border-[#272A32] rounded-xl p-6 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-white font-display">
              Chromatic Guitar Tuner
            </h1>
            <div className="text-xs text-[#9CA3AF] mt-0.5 flex items-center gap-2 font-mono tabular-nums">
              <span>{tuning.shortLabel}</span>
              <span aria-hidden="true">·</span>
              <span>A4 = {a4Freq} Hz</span>
              <span aria-hidden="true">·</span>
              <span>
                {targetStringIdx === null
                  ? 'Auto String Detect'
                  : `Locked to String ${strings[targetStringIdx].stringNumber} (${strings[targetStringIdx].noteName}${strings[targetStringIdx].octave})`}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={micActive ? stopMic : () => void startMic()}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
              micActive
                ? 'bg-rose-500 text-white hover:bg-rose-600'
                : 'bg-amber-500 text-[#111214] hover:bg-amber-400'
            }`}
          >
            {micActive ? (
              <>
                <MicOff className="w-4 h-4" />
                Stop Microphone
              </>
            ) : (
              <>
                <Mic className="w-4 h-4" />
                Enable Microphone
              </>
            )}
          </button>
        </div>

        {micError && (
          <div className="p-3.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-xs text-rose-200 leading-relaxed">
            {micError}
          </div>
        )}

        {/* Precision Analog-Digital Cent Gauge */}
        <div className="bg-[#111214] border border-[#252830] rounded-xl px-4 py-6 flex flex-col items-center">
          <svg
            viewBox="0 0 420 215"
            className="w-full max-w-[440px] h-auto select-none"
            role="img"
            aria-label="Chromatic tuning needle gauge from minus 50 cents to plus 50 cents"
          >
            {/* Tick marks along arc centered at (210, 200), radius 155 */}
            {Array.from({ length: 21 }, (_, i) => -50 + i * 5).map((centTick) => {
              const angleRad = (((centTick / 50) * 58 - 90) * Math.PI) / 180;
              const isCenter = centTick === 0;
              const isMajor = centTick % 25 === 0 || centTick === -10 || centTick === 10;
              const rOuter = 158;
              const rInner = isCenter ? 132 : isMajor ? 140 : 148;
              const x1 = 210 + rInner * Math.cos(angleRad);
              const y1 = 200 + rInner * Math.sin(angleRad);
              const x2 = 210 + rOuter * Math.cos(angleRad);
              const y2 = 200 + rOuter * Math.sin(angleRad);

              const labelR = 174;
              const lx = 210 + labelR * Math.cos(angleRad);
              const ly = 200 + labelR * Math.sin(angleRad);

              return (
                <g key={centTick}>
                  <line
                    x1={x1}
                    y1={y1}
                    x2={x2}
                    y2={y2}
                    stroke={
                      isCenter
                        ? '#34D399'
                        : Math.abs(centTick) <= 5
                          ? '#34D399'
                          : isMajor
                            ? '#9CA3AF'
                            : '#4B5563'
                    }
                    strokeWidth={isCenter ? 3 : isMajor ? 2 : 1.2}
                    strokeLinecap="round"
                  />
                  {(centTick === -50 || centTick === -25 || centTick === 0 || centTick === 25 || centTick === 50) && (
                    <text
                      x={lx}
                      y={ly + 4}
                      textAnchor="middle"
                      className={`font-mono text-[10.5px] tabular-nums ${
                        isCenter ? 'fill-emerald-400 font-bold' : 'fill-[#6B7280]'
                      }`}
                    >
                      {centTick > 0 ? `+${centTick}` : centTick}
                    </text>
                  )}
                </g>
              );
            })}

            {/* Green In-Tune Center Window Arc (-4.5c to +4.5c) */}
            <path
              d="M 195.8 45.7 A 155 155 0 0 1 224.2 45.7"
              fill="none"
              stroke={tuningStatus.isInTune ? '#34D399' : '#1E3A34'}
              strokeWidth={5}
              strokeLinecap="round"
            />

            {/* Pivoting Indicator Needle */}
            <g
              style={{
                transform: `rotate(${displayReading ? needleAngleDeg : 0}deg)`,
                transformOrigin: '210px 200px',
                transition: 'transform 90ms cubic-bezier(0.16, 1, 0.3, 1)',
              }}
            >
              <line
                x1={210}
                y1={200}
                x2={210}
                y2={54}
                stroke={
                  !displayReading
                    ? '#4B5563'
                    : tuningStatus.isInTune
                      ? '#34D399'
                      : Math.abs(clampedCents) < 15
                        ? '#F59E0B'
                        : '#FB7185'
                }
                strokeWidth={3}
                strokeLinecap="round"
              />
              <circle
                cx={210}
                cy={200}
                r={7}
                fill="#272B35"
                stroke="#9CA3AF"
                strokeWidth={2}
              />
            </g>
          </svg>

          {/* Numeric Pitch Readout */}
          <div className="text-center mt-2 space-y-1.5">
            <div className="flex items-baseline justify-center gap-1">
              <span className="text-5xl font-bold font-display tracking-tight text-white">
                {displayReading ? displayReading.noteName : '—'}
              </span>
              {displayReading && (
                <span className="text-xl font-mono font-semibold text-[#9CA3AF]">
                  {displayReading.octave}
                </span>
              )}
            </div>

            <div className={`text-sm font-semibold flex items-center justify-center gap-1.5 ${tuningStatus.toneClass}`}>
              <span aria-hidden="true">{tuningStatus.glyph}</span>
              <span>{tuningStatus.label}</span>
            </div>

            <div className="flex items-center justify-center gap-4 pt-1 font-mono text-xs text-[#9CA3AF] tabular-nums">
              <span>
                {displayReading ? `${displayReading.frequency.toFixed(1)} Hz` : '0.0 Hz'}
              </span>
              <span aria-hidden="true">·</span>
              <span>
                {displayReading
                  ? `${displayReading.rawCents >= 0 ? '+' : ''}${displayReading.rawCents.toFixed(1)} cents`
                  : '0.0 cents'}
              </span>
            </div>
          </div>
        </div>

        {/* Calibration Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <label htmlFor="a4-slider" className="text-[#9CA3AF] font-medium">
                Reference Pitch (A4)
              </label>
              <span className="font-mono text-[#F3F4F6] tabular-nums font-semibold">
                {a4Freq} Hz
              </span>
            </div>
            <div className="flex items-center gap-2">
              <input
                id="a4-slider"
                type="range"
                min={432}
                max={448}
                step={1}
                value={a4Freq}
                onChange={(e) => setA4Freq(Number(e.target.value))}
                className="flex-1 accent-amber-500 cursor-pointer"
              />
              {a4Freq !== 440 && (
                <button
                  type="button"
                  onClick={() => setA4Freq(440)}
                  className="text-xs font-mono text-amber-400 hover:underline whitespace-nowrap"
                >
                  Reset 440
                </button>
              )}
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <label htmlFor="gate-slider" className="text-[#9CA3AF] font-medium">
                Input Noise Gate
              </label>
              <span className="font-mono text-[#F3F4F6] tabular-nums font-semibold">
                {Math.round(sensitivity * 1000)} mV
              </span>
            </div>
            <input
              id="gate-slider"
              type="range"
              min={0.004}
              max={0.04}
              step={0.002}
              value={sensitivity}
              onChange={(e) => setSensitivity(Number(e.target.value))}
              className="w-full accent-amber-500 cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* Right: Tuning Presets & 6-String Ear-Tuning Reference Deck */}
      <div className="lg:col-span-5 bg-[#181A1F] border border-[#272A32] rounded-xl p-6 space-y-5">
        <div className="space-y-2">
          <label
            htmlFor="tuner-preset-select"
            className="block text-sm font-semibold text-white font-display"
          >
            Tuning Preset &amp; Reference Pitches
          </label>
          <select
            id="tuner-preset-select"
            value={tuning.id}
            onChange={(e) => {
              onTuningChange(e.target.value);
              setTargetStringIdx(null);
              guitarSynth.stopReferenceTone();
              setPlayingRefStringIdx(null);
            }}
            className="w-full h-10 px-3.5 rounded-lg bg-[#111214] border border-[#2A2D36] text-sm font-medium text-[#F3F4F6] focus:outline-none focus:border-amber-500"
          >
            {TUNINGS.map((t) => (
              <option key={t.id} value={t.id} className="bg-[#181A1F]">
                {t.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center justify-between text-xs text-[#9CA3AF]">
          <span>Click a string to lock target, or play its reference tone</span>
          {targetStringIdx !== null && (
            <button
              type="button"
              onClick={() => setTargetStringIdx(null)}
              className="text-amber-400 hover:underline font-medium whitespace-nowrap"
            >
              Auto Detect
            </button>
          )}
        </div>

        {/* 6 String Peg Rows (High E down to Low E or Low E to High E — ordered String 6 -> String 1) */}
        <div className="space-y-2">
          {strings.map((s) => {
            const isLocked = targetStringIdx === s.idx;
            const isDetectedClosest =
              targetStringIdx === null && displayReading?.closestStringIdx === s.idx;
            const isRefPlaying = playingRefStringIdx === s.idx;

            return (
              <div
                key={s.idx}
                className={`flex items-center justify-between gap-3 p-3 rounded-lg border transition-colors ${
                  isLocked
                    ? 'bg-amber-500/12 border-amber-500/60'
                    : isDetectedClosest
                      ? 'bg-emerald-500/10 border-emerald-500/40'
                      : 'bg-[#111214] border-[#252830]'
                }`}
              >
                <button
                  type="button"
                  onClick={() =>
                    setTargetStringIdx((prev) => (prev === s.idx ? null : s.idx))
                  }
                  className="flex items-center gap-3 text-left flex-1 min-w-0"
                >
                  <span className="w-8 h-8 rounded-md bg-[#1D2027] border border-[#2E323D] flex items-center justify-center font-mono text-xs font-bold text-[#9CA3AF] shrink-0">
                    {s.stringNumber}
                  </span>
                  <div className="min-w-0">
                    <div className="flex items-baseline gap-1.5">
                      <span className="font-mono text-base font-bold text-white">
                        {s.noteName}
                        <span className="text-xs text-[#9CA3AF] font-normal">
                          {s.octave}
                        </span>
                      </span>
                      <span className="font-mono text-xs text-[#9CA3AF] tabular-nums">
                        {s.freq.toFixed(2)} Hz
                      </span>
                    </div>
                    <div className="text-[11px] text-[#6B7280]">
                      {isLocked
                        ? 'Target locked'
                        : isDetectedClosest
                          ? 'Active detected string'
                          : 'Click to lock target'}
                    </div>
                  </div>
                </button>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => handlePluckReferenceString(s.idx)}
                    className="px-2.5 py-1.5 rounded-md bg-[#1D2027] border border-[#2E323D] hover:border-amber-500/50 text-xs font-medium text-[#E5E7EB] transition-colors whitespace-nowrap"
                  >
                    Pluck
                  </button>
                  <button
                    type="button"
                    onClick={() => handleToggleRefTone(s.idx)}
                    aria-label={isRefPlaying ? `Stop ${s.noteName} tone` : `Sustain ${s.noteName} tone`}
                    className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-medium border transition-colors whitespace-nowrap ${
                      isRefPlaying
                        ? 'bg-amber-500 text-[#111214] border-amber-400'
                        : 'bg-[#1D2027] border-[#2E323D] text-[#D1D5DB] hover:text-white'
                    }`}
                  >
                    {isRefPlaying ? (
                      <>
                        <VolumeX className="w-3.5 h-3.5" />
                        Mute
                      </>
                    ) : (
                      <>
                        <Volume2 className="w-3.5 h-3.5" />
                        Tone
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
