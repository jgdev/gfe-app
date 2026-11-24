import React, { useMemo, useState } from 'react';
import {
  GuitarTuning,
  INTERVAL_FULL_NAMES,
  INTERVAL_LABELS,
  ScaleDefinition,
  ScalePositionWindow,
  getNoteName,
  midiToFrequency,
  midiToNoteWithOctave,
  shouldUseFlats,
} from '../music/theory';
import { guitarSynth } from '../audio/guitarSynth';

export type FretboardWood = 'rosewood' | 'ebony' | 'maple';
export type NoteDisplayMode = 'notes' | 'intervals' | 'degrees';

export interface ActiveNoteInspect {
  stringNumber: number; // 1 = High E, 6 = Low E
  fret: number;
  midi: number;
  noteName: string;
  noteWithOctave: string;
  frequency: number;
  intervalSemitones: number;
  intervalShort: string;
  intervalFull: string;
  inScale: boolean;
  isRoot: boolean;
  isTargetChordTone: boolean;
}

interface FretboardCanvasProps {
  rootPitchClass: number;
  scale: ScaleDefinition;
  tuning: GuitarTuning;
  fretCount: 12 | 15 | 22;
  displayMode: NoteDisplayMode;
  wood: FretboardWood;
  leftHanded: boolean;
  highlightChordTones: boolean;
  highlightCharacteristic: boolean;
  showOutOfScaleGhost: boolean;
  activePosition: ScalePositionWindow | null;
  targetChordPitchClasses: number[] | null;
  targetChordRootPc?: number | null;
  activeMidiHighlight?: number | null;
  chordVoicingFrets?: [number, number, number, number, number, number] | null;
  onInspectNote?: (info: ActiveNoteInspect) => void;
}

const INLAY_SINGLE_FRETS = new Set([3, 5, 7, 9, 15, 17, 19, 21]);
const INLAY_DOUBLE_FRETS = new Set([12, 24]);

const WOOD_THEMES: Record<
  FretboardWood,
  {
    bgTop: string;
    bgBottom: string;
    grain: string;
    inlay: string;
    fretWire: string;
    fretHighlight: string;
    nut: string;
    scaleNoteFill: string;
    scaleNoteStroke: string;
    scaleNoteText: string;
    border: string;
  }
> = {
  rosewood: {
    bgTop: '#2D1E17',
    bgBottom: '#211510',
    grain: 'rgba(92, 56, 36, 0.28)',
    inlay: 'rgba(236, 228, 212, 0.42)',
    fretWire: '#8A8F99',
    fretHighlight: '#CFD4DC',
    nut: '#E7DFD1',
    scaleNoteFill: '#1B1E24',
    scaleNoteStroke: '#D1D5DB',
    scaleNoteText: '#F9FAFB',
    border: '#3B2820',
  },
  ebony: {
    bgTop: '#1A1C21',
    bgBottom: '#14161A',
    grain: 'rgba(255, 255, 255, 0.03)',
    inlay: 'rgba(226, 232, 240, 0.36)',
    fretWire: '#767C87',
    fretHighlight: '#BAC1CC',
    nut: '#E5E7EB',
    scaleNoteFill: '#242832',
    scaleNoteStroke: '#CBD5E1',
    scaleNoteText: '#F8FAFC',
    border: '#2B2F39',
  },
  maple: {
    bgTop: '#D4B07A',
    bgBottom: '#C39B62',
    grain: 'rgba(130, 86, 34, 0.16)',
    inlay: 'rgba(30, 24, 18, 0.55)',
    fretWire: '#7E848E',
    fretHighlight: '#E2E5EA',
    nut: '#F5F0E6',
    scaleNoteFill: '#1C1917',
    scaleNoteStroke: '#F5F5F4',
    scaleNoteText: '#FAFAF9',
    border: '#A7814B',
  },
};

export const FretboardCanvas: React.FC<FretboardCanvasProps> = ({
  rootPitchClass,
  scale,
  tuning,
  fretCount,
  displayMode,
  wood,
  leftHanded,
  highlightChordTones,
  highlightCharacteristic,
  showOutOfScaleGhost,
  activePosition,
  targetChordPitchClasses,
  targetChordRootPc = null,
  activeMidiHighlight = null,
  chordVoicingFrets = null,
  onInspectNote,
}) => {
  const [vibratingString, setVibratingString] = useState<number | null>(null);
  const [recentPluckKey, setRecentPluckKey] = useState<string | null>(null);

  const preferFlats = useMemo(
    () => shouldUseFlats(rootPitchClass, scale.id),
    [rootPitchClass, scale.id]
  );

  const scalePitchClasses = useMemo(() => {
    const map = new Map<number, { interval: number; degreeIndex: number }>();
    scale.intervals.forEach((interval, idx) => {
      map.set((rootPitchClass + interval) % 12, { interval, degreeIndex: idx + 1 });
    });
    return map;
  }, [rootPitchClass, scale.intervals]);

  const effectiveTargetSet = useMemo(() => {
    if (targetChordPitchClasses && targetChordPitchClasses.length > 0) {
      return new Set(targetChordPitchClasses);
    }
    if (highlightChordTones) {
      return new Set(scale.chordTones.map((i) => (rootPitchClass + i) % 12));
    }
    return new Set<number>();
  }, [targetChordPitchClasses, highlightChordTones, scale.chordTones, rootPitchClass]);

  const characteristicPc =
    highlightCharacteristic && scale.characteristicInterval !== undefined
      ? (rootPitchClass + scale.characteristicInterval) % 12
      : null;

  // SVG layout coordinates (1440px native aspect ratio for sharp rendering)
  const svgWidth = 1360;
  const svgHeight = 296;
  const padLeft = 64;
  const padRight = 24;
  const boardTop = 26;
  const boardHeight = 226;
  const nutWidth = 14;
  const usableWidth = svgWidth - padLeft - padRight - nutWidth;

  // Compute tapered fret positions (realistic yet legible for 22 frets)
  const fretXPositions = useMemo(() => {
    // Gentle taper factor: 0.968 per fret feels authentic without crushing frets 18-22
    const weights: number[] = [];
    let total = 0;
    for (let f = 1; f <= fretCount; f++) {
      const w = Math.pow(0.968, f - 1);
      weights.push(w);
      total += w;
    }
    const positions: number[] = [0]; // x offset from nut right edge for fret 0
    let acc = 0;
    for (let f = 1; f <= fretCount; f++) {
      acc += (weights[f - 1] / total) * usableWidth;
      positions.push(acc);
    }
    return positions;
  }, [fretCount, usableWidth]);

  // Convert fret wire index (0..fretCount) into actual SVG X coordinate accounting for leftHanded
  const getFretWireX = (fret: number): number => {
    const rawFromNut = fretXPositions[fret];
    if (!leftHanded) {
      return padLeft + nutWidth + rawFromNut;
    }
    return svgWidth - padRight - nutWidth - rawFromNut;
  };

  // Center X of a note marker on a given fret (0 = open string behind the nut)
  const getNoteX = (fret: number): number => {
    if (fret === 0) {
      return leftHanded ? svgWidth - padRight + 4 : padLeft - 14;
    }
    const xPrev = getFretWireX(fret - 1);
    const xCurr = getFretWireX(fret);
    return (xPrev + xCurr) / 2;
  };

  // Strings rendered top-to-bottom: visualRow 0 = High E (tuning index 5), visualRow 5 = Low E (tuning index 0)
  const stringSpacing = (boardHeight - 36) / 5;
  const getStringY = (visualRow: number) => boardTop + 18 + visualRow * stringSpacing;

  const isFretInPosition = (fret: number): boolean => {
    if (!activePosition) return true;
    const inMain = fret >= activePosition.startFret && fret <= activePosition.endFret;
    const inOctave =
      activePosition.octaveStartFret !== undefined &&
      activePosition.octaveEndFret !== undefined &&
      fret >= activePosition.octaveStartFret &&
      fret <= activePosition.octaveEndFret;
    return inMain || inOctave;
  };

  const theme = WOOD_THEMES[wood];

  const handlePluck = (
    tuningIdx: number, // 0 = Low E (String 6), 5 = High E (String 1)
    fret: number
  ) => {
    const midi = tuning.midiNotes[tuningIdx] + fret;
    const pc = ((midi % 12) + 12) % 12;
    const scaleInfo = scalePitchClasses.get(pc);
    const intervalSemitones = (pc - rootPitchClass + 12) % 12;

    guitarSynth.pluckMidi(midi, 2.0, 0.78);

    const visualRow = 5 - tuningIdx;
    setVibratingString(null);
    window.requestAnimationFrame(() => {
      setVibratingString(visualRow);
    });
    const key = `${tuningIdx}_${fret}`;
    setRecentPluckKey(key);
    window.setTimeout(() => {
      setRecentPluckKey((prev) => (prev === key ? null : prev));
    }, 340);

    onInspectNote?.({
      stringNumber: 6 - tuningIdx,
      fret,
      midi,
      noteName: getNoteName(pc, preferFlats),
      noteWithOctave: midiToNoteWithOctave(midi, preferFlats),
      frequency: midiToFrequency(midi),
      intervalSemitones,
      intervalShort: INTERVAL_LABELS[intervalSemitones],
      intervalFull: INTERVAL_FULL_NAMES[intervalSemitones],
      inScale: Boolean(scaleInfo),
      isRoot: pc === rootPitchClass,
      isTargetChordTone: effectiveTargetSet.has(pc),
    });
  };

  const markerRadius = fretCount === 22 ? 12.2 : fretCount === 15 ? 14 : 15;
  const markerFontSize = fretCount === 22 ? 10.5 : 11.5;

  const boardLeftX = leftHanded ? padLeft : padLeft + nutWidth;
  const boardRightX = leftHanded ? svgWidth - padRight - nutWidth : svgWidth - padRight;
  const nutX = leftHanded ? svgWidth - padRight - nutWidth : padLeft;

  return (
    <div className="w-full overflow-x-auto pb-1">
      <svg
        viewBox={`0 0 ${svgWidth} ${svgHeight}`}
        className="w-full min-w-[940px] h-auto select-none block"
        role="img"
        aria-label={`Interactive ${fretCount}-fret guitar neck in ${tuning.shortLabel} showing ${getNoteName(
          rootPitchClass,
          preferFlats
        )} ${scale.name}`}
      >
        <defs>
          <linearGradient id={`wood-grad-${wood}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={theme.bgTop} />
            <stop offset="50%" stopColor={theme.bgBottom} />
            <stop offset="100%" stopColor={theme.bgTop} />
          </linearGradient>
          <linearGradient id="nut-grad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#CFC6B8" />
            <stop offset="50%" stopColor={theme.nut} />
            <stop offset="100%" stopColor="#B8AFA0" />
          </linearGradient>
        </defs>

        {/* Neck Wood Surface */}
        <rect
          x={boardLeftX}
          y={boardTop}
          width={boardRightX - boardLeftX}
          height={boardHeight}
          rx={4}
          fill={`url(#wood-grad-${wood})`}
          stroke={theme.border}
          strokeWidth={1.5}
        />

        {/* Subtle Horizontal Wood Grain Lines */}
        {[0.14, 0.29, 0.44, 0.61, 0.77, 0.9].map((ratio, idx) => (
          <line
            key={idx}
            x1={boardLeftX + 2}
            x2={boardRightX - 2}
            y1={boardTop + boardHeight * ratio}
            y2={boardTop + boardHeight * ratio}
            stroke={theme.grain}
            strokeWidth={idx % 2 === 0 ? 1.5 : 0.8}
          />
        ))}

        {/* Highlighted Position Box Backdrop Shading */}
        {activePosition && (
          <>
            {[
              { start: activePosition.startFret, end: activePosition.endFret },
              ...(activePosition.octaveStartFret !== undefined &&
              activePosition.octaveEndFret !== undefined
                ? [{ start: activePosition.octaveStartFret, end: activePosition.octaveEndFret }]
                : []),
            ].map((win, idx) => {
              const clampedStart = Math.max(0, Math.min(fretCount, win.start));
              const clampedEnd = Math.max(0, Math.min(fretCount, win.end));
              if (clampedStart > fretCount) return null;
              const x1 = getFretWireX(Math.max(0, clampedStart - 1));
              const x2 = getFretWireX(clampedEnd);
              const leftX = Math.min(x1, x2);
              const boxW = Math.abs(x2 - x1);
              return (
                <rect
                  key={idx}
                  x={leftX}
                  y={boardTop + 2}
                  width={boxW}
                  height={boardHeight - 4}
                  fill="rgba(245, 158, 11, 0.08)"
                  stroke="rgba(245, 158, 11, 0.35)"
                  strokeWidth={1}
                  strokeDasharray="4 3"
                  rx={3}
                />
              );
            })}
          </>
        )}

        {/* Bone Nut */}
        <rect
          x={nutX}
          y={boardTop - 1}
          width={nutWidth}
          height={boardHeight + 2}
          rx={2}
          fill="url(#nut-grad)"
          stroke="#4B463F"
          strokeWidth={1}
        />

        {/* Pearloid Fret Inlays */}
        {Array.from({ length: fretCount }, (_, i) => i + 1).map((fret) => {
          const cx = getNoteX(fret);
          if (INLAY_SINGLE_FRETS.has(fret)) {
            return (
              <circle
                key={`inlay-${fret}`}
                cx={cx}
                cy={boardTop + boardHeight / 2}
                r={5.5}
                fill={theme.inlay}
              />
            );
          }
          if (INLAY_DOUBLE_FRETS.has(fret)) {
            return (
              <g key={`inlay-double-${fret}`}>
                <circle
                  cx={cx}
                  cy={boardTop + boardHeight * 0.28}
                  r={5.5}
                  fill={theme.inlay}
                />
                <circle
                  cx={cx}
                  cy={boardTop + boardHeight * 0.72}
                  r={5.5}
                  fill={theme.inlay}
                />
              </g>
            );
          }
          return null;
        })}

        {/* Metallic Fret Wires */}
        {Array.from({ length: fretCount }, (_, i) => i + 1).map((fret) => {
          const x = getFretWireX(fret);
          const isOctave = fret === 12 || fret === 24;
          return (
            <g key={`fret-${fret}`}>
              <line
                x1={x}
                x2={x}
                y1={boardTop + 1}
                y2={boardTop + boardHeight - 1}
                stroke={theme.fretWire}
                strokeWidth={isOctave ? 3 : 2.2}
              />
              <line
                x1={x - 0.6}
                x2={x - 0.6}
                y1={boardTop + 1}
                y2={boardTop + boardHeight - 1}
                stroke={theme.fretHighlight}
                strokeWidth={0.7}
                opacity={0.7}
              />
            </g>
          );
        })}

        {/* Open String Labels (Left or Right Side) */}
        {[5, 4, 3, 2, 1, 0].map((tuningIdx, visualRow) => {
          const y = getStringY(visualRow);
          const openMidi = tuning.midiNotes[tuningIdx];
          const openName = getNoteName(openMidi % 12, preferFlats);
          const labelX = leftHanded ? svgWidth - 10 : 18;
          return (
            <text
              key={`open-label-${tuningIdx}`}
              x={labelX}
              y={y + 4}
              textAnchor="middle"
              className="font-mono text-[11px] font-semibold fill-[#9CA3AF]"
            >
              {openName}
            </text>
          );
        })}

        {/* 6 Tapered Guitar Strings */}
        {[5, 4, 3, 2, 1, 0].map((tuningIdx, visualRow) => {
          const y = getStringY(visualRow);
          // Thinnest (1.25px) at High E (visualRow 0) -> Thickest (3.1px) at Low E (visualRow 5)
          const gauge = 1.25 + visualRow * 0.37;
          const isWound = visualRow >= 3;
          const isVib = vibratingString === visualRow;
          return (
            <g
              key={`string-${tuningIdx}`}
              className={isVib ? 'animate-string-pluck' : undefined}
            >
              {/* Subtle string shadow */}
              <line
                x1={boardLeftX - (leftHanded ? 0 : nutWidth)}
                x2={boardRightX + (leftHanded ? nutWidth : 0)}
                y1={y + 1.5}
                y2={y + 1.5}
                stroke="rgba(0,0,0,0.45)"
                strokeWidth={gauge}
              />
              {/* Main metallic string */}
              <line
                x1={boardLeftX - (leftHanded ? 0 : nutWidth)}
                x2={boardRightX + (leftHanded ? nutWidth : 0)}
                y1={y}
                y2={y}
                stroke={isWound ? '#C9B18B' : '#D5DBE3'}
                strokeWidth={gauge}
                opacity={0.9}
              />
            </g>
          );
        })}

        {/* Fret Numbers Footer Row */}
        {Array.from({ length: fretCount + 1 }, (_, f) => f).map((fret) => {
          const cx = getNoteX(fret);
          const isLandmark = fret === 0 || INLAY_SINGLE_FRETS.has(fret) || INLAY_DOUBLE_FRETS.has(fret);
          return (
            <text
              key={`fret-num-${fret}`}
              x={cx}
              y={boardTop + boardHeight + 24}
              textAnchor="middle"
              className={`font-mono text-[11px] tabular-nums ${
                isLandmark ? 'fill-[#E5E7EB] font-semibold' : 'fill-[#6B7280] font-normal'
              }`}
            >
              {fret === 0 ? '0' : fret}
            </text>
          );
        })}

        {/* Interactive Note Markers Across Full Neck */}
        {[5, 4, 3, 2, 1, 0].map((tuningIdx, visualRow) => {
          const y = getStringY(visualRow);
          const openMidi = tuning.midiNotes[tuningIdx];
          const voicedFret = chordVoicingFrets ? chordVoicingFrets[tuningIdx] : null;

          return Array.from({ length: fretCount + 1 }, (_, fret) => {
            const midi = openMidi + fret;
            const pc = ((midi % 12) + 12) % 12;
            const scaleInfo = scalePitchClasses.get(pc);
            const isInScale = Boolean(scaleInfo);
            const isVoicedChordNote = voicedFret !== null && voicedFret === fret;
            const isRoot = pc === rootPitchClass;
            const isTargetTone = effectiveTargetSet.has(pc);
            const isTargetRoot = targetChordRootPc !== null && pc === targetChordRootPc;
            const isCharacteristic = characteristicPc !== null && pc === characteristicPc;
            const isPlaybackActive = activeMidiHighlight === midi;
            const isRecentPluck = recentPluckKey === `${tuningIdx}_${fret}`;
            const inPosition = isFretInPosition(fret);

            const cx = getNoteX(fret);

            // Compute displayed label inside the marker
            let label = getNoteName(pc, preferFlats);
            if (displayMode === 'intervals') {
              const interval = (pc - rootPitchClass + 12) % 12;
              label = INTERVAL_LABELS[interval];
            } else if (displayMode === 'degrees') {
              label = scaleInfo ? String(scaleInfo.degreeIndex) : '·';
            }

            // Invisible hit target so user can also click non-scale notes to audition any fret
            if (!isInScale && !isVoicedChordNote) {
              return (
                <g
                  key={`cell-${tuningIdx}-${fret}`}
                  onClick={() => handlePluck(tuningIdx, fret)}
                  className="cursor-pointer group"
                >
                  <circle
                    cx={cx}
                    cy={y}
                    r={markerRadius}
                    fill="transparent"
                    className="transition-opacity duration-150"
                  />
                  {showOutOfScaleGhost && (
                    <circle
                      cx={cx}
                      cy={y}
                      r={4.2}
                      fill={wood === 'maple' ? 'rgba(28, 25, 23, 0.22)' : 'rgba(255, 255, 255, 0.14)'}
                      className="group-hover:fill-white/45 transition-colors"
                    />
                  )}
                  <circle
                    cx={cx}
                    cy={y}
                    r={markerRadius - 2}
                    fill="rgba(255,255,255,0.09)"
                    className="opacity-0 group-hover:opacity-100 transition-opacity duration-150"
                  />
                </g>
              );
            }

            // Determine visual hierarchy for scale / target / chord-voicing notes
            let fill = theme.scaleNoteFill;
            let stroke = theme.scaleNoteStroke;
            let textColor = theme.scaleNoteText;
            let strokeWidth = 1.6;
            let showOuterRing = false;
            let ringColor = '#F59E0B';

            if (isVoicedChordNote) {
              fill = isRoot ? '#F59E0B' : '#38BDF8';
              stroke = '#FFFFFF';
              textColor = '#0F172A';
              strokeWidth = 2.2;
              showOuterRing = true;
              ringColor = isRoot ? '#F59E0B' : '#38BDF8';
            } else if (targetChordPitchClasses && targetChordPitchClasses.length > 0 && isTargetTone) {
              // Active backing-chord or target-chord tone inside the scale
              fill = isTargetRoot ? '#F59E0B' : '#38BDF8';
              stroke = isTargetRoot ? '#FEF3C7' : '#E0F2FE';
              textColor = '#0F172A';
              strokeWidth = 2;
              showOuterRing = isTargetRoot;
              ringColor = '#F59E0B';
            } else if (isRoot) {
              fill = '#F59E0B';
              stroke = '#FEF3C7';
              textColor = '#111214';
              strokeWidth = 2;
              showOuterRing = true;
              ringColor = '#F59E0B';
            } else if (isCharacteristic) {
              fill = '#FB7185';
              stroke = '#FFE4E6';
              textColor = '#111214';
              strokeWidth = 1.8;
            } else if (highlightChordTones && isTargetTone) {
              fill = '#38BDF8';
              stroke = '#E0F2FE';
              textColor = '#0F172A';
              strokeWidth = 1.8;
            }

            // Opacity modulation: position filter or backing-chord focus
            let opacity = 1;
            if (!inPosition && !isVoicedChordNote) {
              opacity = 0.24;
            } else if (
              chordVoicingFrets &&
              !isVoicedChordNote
            ) {
              opacity = 0.35;
            } else if (
              targetChordPitchClasses &&
              targetChordPitchClasses.length > 0 &&
              !isTargetTone &&
              !isRoot
            ) {
              opacity = 0.56;
            }

            return (
              <g
                key={`note-${tuningIdx}-${fret}`}
                onClick={() => handlePluck(tuningIdx, fret)}
                className="cursor-pointer group"
                style={{ opacity }}
              >
                {/* Acoustic ring pulse when playing or plucked */}
                {(isPlaybackActive || isRecentPluck) && (
                  <circle
                    cx={cx}
                    cy={y}
                    r={markerRadius + 6}
                    fill="none"
                    stroke="#FBBF24"
                    strokeWidth={2.5}
                    opacity={0.95}
                  />
                )}

                {/* Dual-coded outer ring for Roots & Chord Voicing Anchors (not hue-only) */}
                {showOuterRing && (
                  <circle
                    cx={cx}
                    cy={y}
                    r={markerRadius + 3.2}
                    fill="none"
                    stroke={ringColor}
                    strokeWidth={1.3}
                    opacity={0.75}
                  />
                )}

                {/* Main Note Disc */}
                <circle
                  cx={cx}
                  cy={y}
                  r={isPlaybackActive || isRecentPluck ? markerRadius + 1.5 : markerRadius}
                  fill={isPlaybackActive ? '#FDE047' : fill}
                  stroke={isPlaybackActive ? '#FFFFFF' : stroke}
                  strokeWidth={strokeWidth}
                />

                {/* Note / Interval / Degree Text */}
                <text
                  x={cx}
                  y={y + 3.8}
                  textAnchor="middle"
                  fill={isPlaybackActive ? '#111214' : textColor}
                  style={{ fontSize: `${markerFontSize}px` }}
                  className="font-mono font-bold pointer-events-none select-none"
                >
                  {label}
                </text>
              </g>
            );
          });
        })}
      </svg>
    </div>
  );
};
