import React, { useMemo, useState } from 'react';
import { ArrowUpRight, Play, Square } from 'lucide-react';
import {
  GuitarTuning,
  INTERVAL_LABELS,
  KEY_DISPLAY_NAMES,
  SCALES,
  ScaleCategory,
  ScaleDefinition,
  ScalePositionWindow,
  getDiatonicChordsForScale,
  getNoteName,
  getScalePositions,
  getScaleStepFormula,
  shouldUseFlats,
} from '../music/theory';
import { guitarSynth } from '../audio/guitarSynth';
import { NoteDisplayMode } from './FretboardCanvas';

interface ScaleDiagramsViewProps {
  rootPitchClass: number;
  onRootChange: (pc: number) => void;
  scale: ScaleDefinition;
  onScaleChange: (scaleId: string) => void;
  tuning: GuitarTuning;
  displayMode: NoteDisplayMode;
  onDisplayModeChange: (mode: NoteDisplayMode) => void;
  onFocusPositionOnNeck: (positionId: number) => void;
}

const SCALE_CATEGORIES: ScaleCategory[] = [
  'Pentatonic & Blues',
  'Modes',
  'Minor & Jazz',
  'Exotic',
];

interface MiniScaleBoxProps {
  position: ScalePositionWindow;
  rootPitchClass: number;
  scale: ScaleDefinition;
  tuning: GuitarTuning;
  preferFlats: boolean;
  displayMode: NoteDisplayMode;
  isPlayingThisBox: boolean;
  activeMidi: number | null;
  onPlayBox: (pos: ScalePositionWindow) => void;
  onFocusNeck: (posId: number) => void;
}

const MiniScaleBox: React.FC<MiniScaleBoxProps> = ({
  position,
  rootPitchClass,
  scale,
  tuning,
  preferFlats,
  displayMode,
  isPlayingThisBox,
  activeMidi,
  onPlayBox,
  onFocusNeck,
}) => {
  const scaleMap = useMemo(() => {
    const m = new Map<number, { interval: number; degree: number }>();
    scale.intervals.forEach((intVal, idx) => {
      m.set((rootPitchClass + intVal) % 12, { interval: intVal, degree: idx + 1 });
    });
    return m;
  }, [rootPitchClass, scale.intervals]);

  // Display 5 frets vertically starting from displayStart
  const displayStart = Math.max(1, position.startFret);
  const includesOpen = position.startFret === 0;
  const fretRows = 5;

  const width = 228;
  const height = 226;
  const leftPad = 36;
  const rightPad = 20;
  const topPad = 32;
  const bottomPad = 22;
  const gridW = width - leftPad - rightPad;
  const gridH = height - topPad - bottomPad;
  const stringGap = gridW / 5;
  const fretGap = gridH / fretRows;

  return (
    <div className="bg-[#181A1F] border border-[#272A32] rounded-xl p-4 flex flex-col justify-between gap-3">
      {/* Card Header */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="text-base font-semibold text-[#F3F4F6] font-display">
            {position.name}
          </h3>
          <div className="text-xs text-[#9CA3AF] mt-0.5 flex items-center gap-1.5 font-mono tabular-nums">
            <span>{position.cagedShape}</span>
            <span aria-hidden="true">·</span>
            <span>
              Frets {position.startFret}–{position.endFret}
            </span>
          </div>
        </div>
        <button
          type="button"
          onClick={() => onPlayBox(position)}
          aria-label={isPlayingThisBox ? `Stop ${position.name}` : `Play ${position.name}`}
          className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
            isPlayingThisBox
              ? 'bg-rose-500 text-white'
              : 'bg-[#111214] border border-[#2C303A] text-[#E5E7EB] hover:border-amber-500/60 hover:text-amber-300'
          }`}
        >
          {isPlayingThisBox ? (
            <>
              <Square className="w-3 h-3 fill-current" />
              Stop
            </>
          ) : (
            <>
              <Play className="w-3 h-3 fill-current" />
              Play
            </>
          )}
        </button>
      </div>

      {/* Vertical Guitar Neck Box SVG (Left = String 6 Low E, Right = String 1 High E) */}
      <div className="flex justify-center">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full max-w-[240px] h-auto select-none"
          role="img"
          aria-label={`${position.name} scale box diagram`}
        >
          {/* Nut or Top Fret Bar */}
          <line
            x1={leftPad}
            x2={leftPad + gridW}
            y1={topPad}
            y2={topPad}
            stroke={includesOpen ? '#E7DFD1' : '#525866'}
            strokeWidth={includesOpen ? 5 : 2}
          />

          {/* Starting Fret Number Indicator */}
          <text
            x={leftPad - 14}
            y={topPad + fretGap * 0.5 + 4}
            textAnchor="middle"
            className="font-mono text-[11px] font-semibold fill-[#9CA3AF] tabular-nums"
          >
            {displayStart}fr
          </text>

          {/* Horizontal Fret Lines */}
          {Array.from({ length: fretRows }, (_, i) => i + 1).map((row) => {
            const y = topPad + row * fretGap;
            return (
              <line
                key={`f-${row}`}
                x1={leftPad}
                x2={leftPad + gridW}
                y1={y}
                y2={y}
                stroke="#353A45"
                strokeWidth={1.2}
              />
            );
          })}

          {/* Vertical Strings (0 = Low E on left -> 5 = High E on right) */}
          {[0, 1, 2, 3, 4, 5].map((strIdx) => {
            const x = leftPad + strIdx * stringGap;
            const gauge = 2.4 - strIdx * 0.24;
            const openPc = tuning.midiNotes[strIdx] % 12;
            return (
              <g key={`str-${strIdx}`}>
                <line
                  x1={x}
                  x2={x}
                  y1={topPad}
                  y2={topPad + gridH}
                  stroke="#687082"
                  strokeWidth={gauge}
                />
                <text
                  x={x}
                  y={topPad + gridH + 16}
                  textAnchor="middle"
                  className="font-mono text-[10px] fill-[#6B7280]"
                >
                  {getNoteName(openPc, preferFlats)}
                </text>
              </g>
            );
          })}

          {/* Scale Notes inside this Position Window */}
          {[0, 1, 2, 3, 4, 5].map((strIdx) => {
            const x = leftPad + strIdx * stringGap;
            const openMidi = tuning.midiNotes[strIdx];

            // Check open string if window starts at 0
            const fretsToCheck: number[] = [];
            if (includesOpen) fretsToCheck.push(0);
            for (let f = displayStart; f < displayStart + fretRows; f++) {
              if (f >= position.startFret && f <= position.endFret) {
                fretsToCheck.push(f);
              }
            }

            return fretsToCheck.map((fret) => {
              const midi = openMidi + fret;
              const pc = ((midi % 12) + 12) % 12;
              const info = scaleMap.get(pc);
              if (!info) return null;

              const isRoot = pc === rootPitchClass;
              const isChar =
                scale.characteristicInterval !== undefined &&
                info.interval === scale.characteristicInterval;
              const isActive = activeMidi === midi;

              const y =
                fret === 0
                  ? topPad - 13
                  : topPad + (fret - displayStart + 0.5) * fretGap;

              const label =
                displayMode === 'notes'
                  ? getNoteName(pc, preferFlats)
                  : displayMode === 'intervals'
                    ? INTERVAL_LABELS[info.interval]
                    : String(info.degree);

              const fill = isActive
                ? '#FDE047'
                : isRoot
                  ? '#F59E0B'
                  : isChar
                    ? '#FB7185'
                    : '#262B35';
              const stroke = isActive
                ? '#FFFFFF'
                : isRoot
                  ? '#FEF3C7'
                  : isChar
                    ? '#FFE4E6'
                    : '#CBD5E1';
              const textFill = isActive || isRoot || isChar ? '#111214' : '#F8FAFC';

              return (
                <g
                  key={`dot-${strIdx}-${fret}`}
                  onClick={() => guitarSynth.pluckMidi(midi, 1.8, 0.78)}
                  className="cursor-pointer"
                >
                  {isRoot && (
                    <circle
                      cx={x}
                      cy={y}
                      r={12.5}
                      fill="none"
                      stroke="#F59E0B"
                      strokeWidth={1.2}
                      opacity={0.7}
                    />
                  )}
                  <circle
                    cx={x}
                    cy={y}
                    r={fret === 0 ? 9.5 : 10.2}
                    fill={fill}
                    stroke={stroke}
                    strokeWidth={1.5}
                  />
                  <text
                    x={x}
                    y={y + 3.4}
                    textAnchor="middle"
                    fill={textFill}
                    className="font-mono text-[9.5px] font-bold pointer-events-none"
                  >
                    {label}
                  </text>
                </g>
              );
            });
          })}
        </svg>
      </div>

      {/* Card Action Footer */}
      <button
        type="button"
        onClick={() => onFocusNeck(position.id)}
        className="w-full py-2 px-3 rounded-lg bg-[#111214] border border-[#262932] hover:border-amber-500/50 text-xs font-medium text-[#D1D5DB] hover:text-amber-300 transition-colors inline-flex items-center justify-center gap-1.5 whitespace-nowrap"
      >
        Open on Full Neck
        <ArrowUpRight className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};

export const ScaleDiagramsView: React.FC<ScaleDiagramsViewProps> = ({
  rootPitchClass,
  onRootChange,
  scale,
  onScaleChange,
  tuning,
  displayMode,
  onDisplayModeChange,
  onFocusPositionOnNeck,
}) => {
  const [playingBoxId, setPlayingBoxId] = useState<number | null>(null);
  const [activeMidi, setActiveMidi] = useState<number | null>(null);

  const preferFlats = useMemo(
    () => shouldUseFlats(rootPitchClass, scale.id),
    [rootPitchClass, scale.id]
  );

  const rootName = getNoteName(rootPitchClass, preferFlats);

  const positions = useMemo(
    () => getScalePositions(rootPitchClass, scale, tuning),
    [rootPitchClass, scale, tuning]
  );

  const diatonicChords = useMemo(
    () => getDiatonicChordsForScale(rootPitchClass, scale),
    [rootPitchClass, scale]
  );

  const stepFormula = useMemo(
    () => getScaleStepFormula(scale.intervals),
    [scale.intervals]
  );

  const scaleNotesList = useMemo(
    () =>
      scale.intervals.map((intVal, idx) => ({
        note: getNoteName((rootPitchClass + intVal) % 12, preferFlats),
        interval: INTERVAL_LABELS[intVal],
        degree: idx + 1,
        isRoot: intVal === 0,
        isCharacteristic: scale.characteristicInterval === intVal,
      })),
    [rootPitchClass, scale, preferFlats]
  );

  const handlePlayPositionBox = (pos: ScalePositionWindow) => {
    if (playingBoxId === pos.id) {
      guitarSynth.clearScheduled();
      setPlayingBoxId(null);
      setActiveMidi(null);
      return;
    }

    const scalePcSet = new Set(scale.intervals.map((i) => (rootPitchClass + i) % 12));
    const midis: number[] = [];

    for (let strIdx = 0; strIdx < 6; strIdx++) {
      const openMidi = tuning.midiNotes[strIdx];
      for (let f = pos.startFret; f <= pos.endFret; f++) {
        const m = openMidi + f;
        if (scalePcSet.has(((m % 12) + 12) % 12)) {
          if (!midis.includes(m)) midis.push(m);
        }
      }
    }
    midis.sort((a, b) => a - b);

    setPlayingBoxId(pos.id);
    guitarSynth.playScaleSequence(
      midis,
      138,
      (stepIdx) => {
        setActiveMidi(stepIdx !== null ? midis[stepIdx] : null);
      },
      () => {
        setPlayingBoxId(null);
        setActiveMidi(null);
      }
    );
  };

  const handlePlayDiatonicChord = (rootPc: number, pitchClasses: number[]) => {
    const bassMidi = 40 + ((rootPc - 4 + 12) % 12);
    const voicing = [
      bassMidi,
      ...pitchClasses.map((pc, idx) => 48 + pc + (idx > 0 && pc < rootPc ? 12 : 0)),
    ];
    guitarSynth.strumChord(voicing, 'down');
  };

  return (
    <div className="space-y-6">
      {/* Top Control & Scale Theory Header */}
      <div className="bg-[#181A1F] border border-[#272A32] rounded-xl p-5 space-y-5">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white font-display">
              {rootName} {scale.name} Diagrams
            </h1>
            <div className="flex flex-wrap items-center gap-2 text-xs text-[#9CA3AF]">
              <span>{scale.category}</span>
              <span aria-hidden="true">·</span>
              <span>{scale.intervals.length} notes</span>
              <span aria-hidden="true">·</span>
              <span className="font-mono text-[#D1D5DB]">{stepFormula}</span>
              <span aria-hidden="true">·</span>
              <span>{tuning.shortLabel}</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <select
              aria-label="Choose scale"
              value={scale.id}
              onChange={(e) => onScaleChange(e.target.value)}
              className="h-10 px-3.5 rounded-lg bg-[#111214] border border-[#2A2D36] text-sm font-medium text-[#F3F4F6] focus:outline-none focus:border-amber-500"
            >
              {SCALE_CATEGORIES.map((cat) => (
                <optgroup key={cat} label={cat} className="bg-[#181A1F]">
                  {SCALES.filter((s) => s.category === cat).map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>

            <div className="inline-flex items-center gap-1 bg-[#111214] p-1 rounded-lg border border-[#252830]">
              {(
                [
                  { id: 'notes', label: 'Notes' },
                  { id: 'intervals', label: 'Intervals' },
                  { id: 'degrees', label: 'Degrees' },
                ] as const
              ).map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => onDisplayModeChange(opt.id)}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${
                    displayMode === opt.id
                      ? 'bg-[#2A2E38] text-white'
                      : 'text-[#9CA3AF] hover:text-white'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 12-Key Strip */}
        <div className="grid grid-cols-6 sm:grid-cols-12 gap-1 bg-[#111214] p-1 rounded-lg border border-[#252830]">
          {KEY_DISPLAY_NAMES.map((k, idx) => (
            <button
              key={k}
              type="button"
              onClick={() => onRootChange(idx)}
              className={`h-9 rounded-md font-mono text-xs font-semibold transition-colors ${
                idx === rootPitchClass
                  ? 'bg-amber-500 text-[#111214]'
                  : 'text-[#D1D5DB] hover:bg-[#22252C] hover:text-white'
              }`}
            >
              {k}
            </button>
          ))}
        </div>

        {/* Scale Tones Breakdown & Soloing Guidance */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 pt-2 border-t border-[#242730]">
          <div className="lg:col-span-7 space-y-2">
            <div className="text-xs font-medium text-[#9CA3AF]">
              Scale Notes &amp; Intervals
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {scaleNotesList.map((item) => (
                <div
                  key={`${item.degree}-${item.note}`}
                  className={`px-3 py-2 rounded-lg border text-center min-w-[54px] ${
                    item.isRoot
                      ? 'bg-amber-500/15 border-amber-500/50 text-amber-200'
                      : item.isCharacteristic
                        ? 'bg-rose-500/15 border-rose-500/45 text-rose-200'
                        : 'bg-[#111214] border-[#262932] text-[#F3F4F6]'
                  }`}
                >
                  <div className="font-mono text-sm font-bold">{item.note}</div>
                  <div className="font-mono text-[11px] text-[#9CA3AF]">
                    {item.interval}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-5 space-y-1.5">
            <div className="text-xs font-medium text-[#9CA3AF]">
              Improvisation Phrasing Note
            </div>
            <p className="text-sm text-[#D1D5DB] leading-relaxed">
              {scale.soloTip}
            </p>
            <div className="text-xs text-[#9CA3AF] pt-0.5">
              Character: <span className="text-[#E5E7EB]">{scale.mood}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 5 Neck Box Positions Grid */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-lg font-semibold text-white font-display">
            Five Connected Neck Positions
          </h2>
          <p className="text-xs text-[#9CA3AF]">
            Click any dot inside a diagram to hear its pitch, or open a box directly on the full neck.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          {positions.map((pos) => (
            <MiniScaleBox
              key={pos.id}
              position={pos}
              rootPitchClass={rootPitchClass}
              scale={scale}
              tuning={tuning}
              preferFlats={preferFlats}
              displayMode={displayMode}
              isPlayingThisBox={playingBoxId === pos.id}
              activeMidi={playingBoxId === pos.id ? activeMidi : null}
              onPlayBox={handlePlayPositionBox}
              onFocusNeck={onFocusPositionOnNeck}
            />
          ))}
        </div>
      </div>

      {/* Diatonic Harmony Reference for this Scale */}
      <div className="bg-[#181A1F] border border-[#272A32] rounded-xl p-5 space-y-3">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-base font-semibold text-white font-display">
            Harmonized Chords in {rootName} {scale.name}
          </h2>
          <span className="text-xs text-[#9CA3AF]">
            Click any chord to audition its voicing
          </span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-2.5">
          {diatonicChords.map((ch) => (
            <button
              key={`${ch.degreeNumeral}-${ch.name}`}
              type="button"
              onClick={() => handlePlayDiatonicChord(ch.rootPitchClass, ch.pitchClasses)}
              className="p-3 rounded-lg bg-[#111214] border border-[#262932] hover:border-amber-500/50 text-left transition-colors group"
            >
              <div className="flex items-center justify-between text-xs font-mono text-[#9CA3AF]">
                <span>{ch.degreeNumeral}</span>
                <span>{ch.role}</span>
              </div>
              <div className="text-base font-semibold text-[#F3F4F6] group-hover:text-amber-300 mt-1">
                {ch.name}
              </div>
              <div className="text-[11px] font-mono text-[#6B7280] mt-1">
                {ch.pitchClasses.map((pc) => getNoteName(pc, preferFlats)).join(' · ')}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
