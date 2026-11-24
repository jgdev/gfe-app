import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Play, Square, Volume2 } from 'lucide-react';
import {
  DiatonicChord,
  ScaleDefinition,
  getBackingProgressionsForScale,
  getDiatonicChordsForScale,
  getNoteName,
  shouldUseFlats,
} from '../music/theory';
import { guitarSynth } from '../audio/guitarSynth';
import { useI18n } from '../i18n/I18nContext';

interface BackingTrackBarProps {
  rootPitchClass: number;
  scale: ScaleDefinition;
  selectedSoloChord: DiatonicChord | null;
  onSelectSoloChord: (chord: DiatonicChord | null) => void;
  onActiveLoopChordChange: (pitchClasses: number[] | null, chordRootPc: number | null, chordLabel: string | null) => void;
}

export const BackingTrackBar: React.FC<BackingTrackBarProps> = ({
  rootPitchClass,
  scale,
  selectedSoloChord,
  onSelectSoloChord,
  onActiveLoopChordChange,
}) => {
  const { t, notation } = useI18n();

  const preferFlats = useMemo(
    () => shouldUseFlats(rootPitchClass, scale.id),
    [rootPitchClass, scale.id]
  );

  const diatonicChords = useMemo(
    () => getDiatonicChordsForScale(rootPitchClass, scale, notation),
    [rootPitchClass, scale, notation]
  );

  const progressions = useMemo(
    () => getBackingProgressionsForScale(scale),
    [scale]
  );

  const [selectedProgId, setSelectedProgId] = useState<string>(progressions[0]?.id ?? '');
  const [bpm, setBpm] = useState<number>(96);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [activeBarIndex, setActiveBarIndex] = useState<number>(0);
  const [activeBeat, setActiveBeat] = useState<number>(0);

  const timerRef = useRef<number | null>(null);
  const stepRef = useRef<number>(0);

  // Sync progression when scale changes
  useEffect(() => {
    if (!progressions.some((p) => p.id === selectedProgId)) {
      setSelectedProgId(progressions[0]?.id ?? '');
    }
  }, [progressions, selectedProgId]);

  const activeProgression = useMemo(
    () => progressions.find((p) => p.id === selectedProgId) ?? progressions[0],
    [progressions, selectedProgId]
  );

  // Expand bars so each bar has an explicit chord object
  const barSequence = useMemo(() => {
    if (!activeProgression) return [];
    const bars: {
      roman: string;
      name: string;
      rootPc: number;
      pitchClasses: number[];
      midiVoicing: number[];
    }[] = [];

    activeProgression.chords.forEach((ch) => {
      const chordRootPc = (rootPitchClass + ch.offset) % 12;
      const noteName = getNoteName(chordRootPc, preferFlats, notation);
      const pitchClasses = ch.intervals.map((i) => (chordRootPc + i) % 12);
      // Warm mid-register guitar voicing around C3..G4 (MIDI 48..67)
      const bassMidi = 40 + ((chordRootPc - 4 + 12) % 12);
      const midiVoicing = [
        bassMidi,
        ...ch.intervals.map((i) => 48 + ((chordRootPc + i) % 12)),
      ];

      for (let b = 0; b < ch.bars; b++) {
        bars.push({
          roman: ch.label,
          name: `${noteName}${ch.qualitySuffix}`,
          rootPc: chordRootPc,
          pitchClasses,
          midiVoicing,
        });
      }
    });
    return bars;
  }, [activeProgression, rootPitchClass, preferFlats, notation]);

  // Cleanup timer on unmount or stop
  useEffect(() => {
    if (!isPlaying || barSequence.length === 0) {
      if (timerRef.current !== null) {
        window.clearInterval(timerRef.current);
        timerRef.current = null;
      }
      if (!isPlaying) {
        onActiveLoopChordChange(null, null, null);
      }
      return;
    }

    const beatDurationMs = (60 / bpm) * 1000;
    const totalBeats = barSequence.length * 4;

    const triggerBeat = () => {
      const currentBeatGlobal = stepRef.current % totalBeats;
      const barIdx = Math.floor(currentBeatGlobal / 4);
      const beatInBar = currentBeatGlobal % 4;
      const currentBar = barSequence[barIdx];

      setActiveBarIndex(barIdx);
      setActiveBeat(beatInBar);

      if (currentBar) {
        onActiveLoopChordChange(currentBar.pitchClasses, currentBar.rootPc, currentBar.name);
        // Play chord on beat 1 and gentle rhythmic comp on beat 3
        if (beatInBar === 0 || beatInBar === 2) {
          guitarSynth.playBackingHit(
            currentBar.midiVoicing,
            beatInBar === 0,
            (beatDurationMs / 1000) * 1.9
          );
        }
      }

      stepRef.current += 1;
    };

    stepRef.current = 0;
    triggerBeat();
    timerRef.current = window.setInterval(triggerBeat, beatDurationMs);

    return () => {
      if (timerRef.current !== null) {
        window.clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [isPlaying, bpm, barSequence, onActiveLoopChordChange]);

  const handleTogglePlay = () => {
    if (!isPlaying) {
      onSelectSoloChord(null);
      setIsPlaying(true);
    } else {
      setIsPlaying(false);
    }
  };

  const handleClickDiatonicChord = (chord: DiatonicChord) => {
    setIsPlaying(false);
    const isSame = selectedSoloChord?.name === chord.name && selectedSoloChord?.degreeNumeral === chord.degreeNumeral;
    if (isSame) {
      onSelectSoloChord(null);
      return;
    }
    onSelectSoloChord(chord);
    // Audition the clicked chord so guitarist hears the harmony they are soloing over
    const bassMidi = 40 + ((chord.rootPitchClass - 4 + 12) % 12);
    const midiVoicing = [
      bassMidi,
      ...chord.pitchClasses.map((pc, idx) => 48 + pc + (idx > 0 && pc < chord.rootPitchClass ? 12 : 0)),
    ];
    guitarSynth.strumChord(midiVoicing, 'down');
  };

  return (
    <div className="bg-[#181A1F] border border-[#272A32] rounded-xl p-4 sm:p-5 space-y-4">
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-center">
        {/* Left: Solo Over Single Chord (Live Chord-Tone Target Switcher) */}
        <div className="xl:col-span-6 space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-sm font-semibold text-[#F3F4F6]">
              {t.backing.soloOverChordTones}
            </h3>
            <span className="text-xs text-[#9CA3AF]">
              {t.backing.clickChordHint}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => {
                setIsPlaying(false);
                onSelectSoloChord(null);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors whitespace-nowrap ${
                selectedSoloChord === null && !isPlaying
                  ? 'bg-[#2A2E38] border-[#3F4554] text-white'
                  : 'bg-[#111214] border-[#252830] text-[#9CA3AF] hover:text-white'
              }`}
            >
              {t.backing.allScaleNotes}
            </button>
            {diatonicChords.map((chord) => {
              const isSelected =
                !isPlaying &&
                selectedSoloChord?.name === chord.name &&
                selectedSoloChord?.degreeNumeral === chord.degreeNumeral;
              return (
                <button
                  key={`${chord.degreeNumeral}-${chord.name}`}
                  type="button"
                  onClick={() => handleClickDiatonicChord(chord)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-sky-500/20 border-sky-400/60 text-sky-200'
                      : 'bg-[#111214] border-[#252830] text-[#D1D5DB] hover:border-[#3E4350] hover:text-white'
                  }`}
                >
                  <span className="font-mono text-[11px] text-[#9CA3AF]">
                    {chord.degreeNumeral}
                  </span>
                  <span className="font-semibold">{chord.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right: Live Backing Groove Loop (Auto-Tracks Chord Changes on Fretboard) */}
        <div className="xl:col-span-6 xl:border-l xl:border-[#242730] xl:pl-5 space-y-2.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Volume2 className="w-4 h-4 text-amber-400 shrink-0" />
              <h3 className="text-sm font-semibold text-[#F3F4F6]">
                {t.backing.jamBackingLoop}
              </h3>
            </div>

            <div className="flex items-center gap-3 text-xs text-[#9CA3AF] font-mono tabular-nums">
              <label htmlFor="bpm-slider" className="whitespace-nowrap">
                {t.backing.tempo}: <span className="text-[#F3F4F6] font-semibold">{bpm} BPM</span>
              </label>
              <input
                id="bpm-slider"
                type="range"
                min={60}
                max={160}
                step={2}
                value={bpm}
                onChange={(e) => setBpm(Number(e.target.value))}
                className="w-24 accent-amber-500 cursor-pointer"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <select
              aria-label={t.backing.jamBackingLoop}
              value={selectedProgId}
              onChange={(e) => {
                setSelectedProgId(e.target.value);
                stepRef.current = 0;
              }}
              className="flex-1 min-w-[200px] h-9 px-3 rounded-lg bg-[#111214] border border-[#2A2D36] text-xs font-medium text-[#F3F4F6] focus:outline-none focus:border-amber-500"
            >
              {progressions.map((p) => (
                <option key={p.id} value={p.id} className="bg-[#181A1F]">
                  {p.name} · {p.feel}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={handleTogglePlay}
              className={`inline-flex items-center gap-2 px-4 h-9 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                isPlaying
                  ? 'bg-rose-500 text-white hover:bg-rose-600'
                  : 'bg-amber-500 text-[#111214] hover:bg-amber-400'
              }`}
            >
              {isPlaying ? (
                <>
                  <Square className="w-3.5 h-3.5 fill-current" />
                  {t.backing.stopLoop}
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-current" />
                  {t.backing.playGroove}
                </>
              )}
            </button>
          </div>

          {/* Live Progression Bar Strip */}
          {barSequence.length > 0 && (
            <div className="flex items-center gap-1.5 overflow-x-auto pt-0.5">
              {barSequence.slice(0, 12).map((bar, idx) => {
                const active = isPlaying && activeBarIndex === idx;
                return (
                  <div
                    key={idx}
                    className={`flex-1 min-w-[46px] px-2 py-1.5 rounded-md border text-center transition-colors ${
                      active
                        ? 'bg-amber-500/20 border-amber-400 text-amber-200'
                        : 'bg-[#111214] border-[#252830] text-[#9CA3AF]'
                    }`}
                  >
                    <div className="font-mono text-xs font-semibold truncate">
                      {bar.name}
                    </div>
                    <div className="flex items-center justify-center gap-0.5 mt-1">
                      {[0, 1, 2, 3].map((b) => (
                        <span
                          key={b}
                          className={`h-1 w-2 rounded-xs transition-colors ${
                            active && activeBeat === b
                              ? 'bg-amber-400'
                              : active
                                ? 'bg-amber-500/35'
                                : 'bg-[#262932]'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
