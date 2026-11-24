import React, { useMemo, useState } from 'react';
import { ArrowDown, ArrowUp, Music2, Sparkles } from 'lucide-react';
import {
  CHORD_QUALITIES,
  ChordQualityId,
  ChordVoicing,
  getChordDisplayName,
  getChordVoicings,
} from '../music/chords';
import {
  GuitarTuning,
  KEY_DISPLAY_NAMES,
  getNoteName,
  getScaleById,
  getTuningById,
} from '../music/theory';
import { guitarSynth } from '../audio/guitarSynth';
import { FretboardCanvas, FretboardWood } from './FretboardCanvas';

interface ChordChartsViewProps {
  initialRootPc: number;
  wood: FretboardWood;
  leftHanded: boolean;
  onImproviseOverScale: (rootPc: number, scaleId: string) => void;
}

const STANDARD_TUNING: GuitarTuning = getTuningById('standard');

interface ChordBoxSvgProps {
  voicing: ChordVoicing;
  rootPitchClass: number;
  isSelected: boolean;
  activeStringIdx: number | null;
  onSelect: () => void;
  onPluckString: (stringIdx: number, fret: number) => void;
}

const ChordBoxSvg: React.FC<ChordBoxSvgProps> = ({
  voicing,
  rootPitchClass,
  isSelected,
  activeStringIdx,
  onSelect,
  onPluckString,
}) => {
  const width = 204;
  const height = 224;
  const padLeft = 34;
  const padRight = 18;
  const padTop = 36;
  const padBottom = 26;
  const gridW = width - padLeft - padRight;
  const gridH = height - padTop - padBottom;
  const fretRows = 5;
  const strGap = gridW / 5;
  const fretGap = gridH / fretRows;

  const isNut = voicing.baseFret === 1;

  return (
    <div
      onClick={onSelect}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect();
        }
      }}
      className={`rounded-xl p-4 border transition-colors cursor-pointer ${
        isSelected
          ? 'bg-[#1D2027] border-amber-500/70'
          : 'bg-[#181A1F] border-[#272A32] hover:border-[#3A3F4C]'
      }`}
    >
      <div className="flex items-center justify-between gap-2 mb-2">
        <span className="text-sm font-semibold text-[#F3F4F6] truncate">
          {voicing.label}
        </span>
        <span className="font-mono text-xs text-[#9CA3AF] tabular-nums shrink-0">
          {isNut ? 'Open' : `${voicing.baseFret}fr`}
        </span>
      </div>

      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full max-w-[204px] mx-auto h-auto select-none block"
        role="img"
        aria-label={`${voicing.label} chord fingering chart`}
      >
        {/* Nut or top fret line */}
        <line
          x1={padLeft}
          x2={padLeft + gridW}
          y1={padTop}
          y2={padTop}
          stroke={isNut ? '#E7DFD1' : '#5B6270'}
          strokeWidth={isNut ? 5 : 2}
        />

        {/* Base fret marker */}
        {!isNut && (
          <text
            x={padLeft - 14}
            y={padTop + fretGap * 0.5 + 4}
            textAnchor="middle"
            className="font-mono text-[11px] font-semibold fill-amber-400 tabular-nums"
          >
            {voicing.baseFret}fr
          </text>
        )}

        {/* Fret wires */}
        {Array.from({ length: fretRows }, (_, i) => i + 1).map((row) => (
          <line
            key={`row-${row}`}
            x1={padLeft}
            x2={padLeft + gridW}
            y1={padTop + row * fretGap}
            y2={padTop + row * fretGap}
            stroke="#363B47"
            strokeWidth={1.2}
          />
        ))}

        {/* Vertical strings */}
        {[0, 1, 2, 3, 4, 5].map((strIdx) => {
          const x = padLeft + strIdx * strGap;
          const fret = voicing.frets[strIdx];
          const isMuted = fret === -1;
          const isOpen = fret === 0;
          const isActive = activeStringIdx === strIdx;
          const openMidi = STANDARD_TUNING.midiNotes[strIdx];
          const notePc = fret >= 0 ? (openMidi + fret) % 12 : -1;

          return (
            <g key={`s-${strIdx}`}>
              <line
                x1={x}
                x2={x}
                y1={padTop}
                y2={padTop + gridH}
                stroke={isActive ? '#FBBF24' : isMuted ? '#3B3F4A' : '#7B8496'}
                strokeWidth={2.4 - strIdx * 0.24}
              />

              {/* X or O markers above nut */}
              {isMuted && (
                <text
                  x={x}
                  y={padTop - 13}
                  textAnchor="middle"
                  className="font-mono text-[12px] font-bold fill-[#6B7280]"
                >
                  ×
                </text>
              )}
              {isOpen && (
                <circle
                  cx={x}
                  cy={padTop - 16}
                  r={5.5}
                  fill="none"
                  stroke={notePc === rootPitchClass ? '#F59E0B' : '#D1D5DB'}
                  strokeWidth={2}
                />
              )}

              {/* Bottom sounding note name */}
              <text
                x={x}
                y={padTop + gridH + 17}
                textAnchor="middle"
                className={`font-mono text-[10px] font-semibold ${
                  isMuted
                    ? 'fill-[#4B5563]'
                    : notePc === rootPitchClass
                      ? 'fill-amber-400'
                      : 'fill-[#9CA3AF]'
                }`}
              >
                {isMuted ? '–' : getNoteName(notePc, false)}
              </text>
            </g>
          );
        })}

        {/* Barre Bar if present */}
        {voicing.barre && voicing.barre.fret >= voicing.baseFret && (
          <rect
            x={padLeft + voicing.barre.fromString * strGap - 9}
            y={padTop + (voicing.barre.fret - voicing.baseFret + 0.5) * fretGap - 8}
            width={(voicing.barre.toString - voicing.barre.fromString) * strGap + 18}
            height={16}
            rx={8}
            fill="#38BDF8"
            opacity={0.25}
            stroke="#38BDF8"
            strokeWidth={1.2}
          />
        )}

        {/* Fretted Finger Dots */}
        {voicing.frets.map((fret, strIdx) => {
          if (fret <= 0) return null;
          const relFret = fret - voicing.baseFret + 1;
          if (relFret < 1 || relFret > fretRows) return null;

          const x = padLeft + strIdx * strGap;
          const y = padTop + (relFret - 0.5) * fretGap;
          const midi = STANDARD_TUNING.midiNotes[strIdx] + fret;
          const pc = midi % 12;
          const isRoot = pc === rootPitchClass;
          const finger = voicing.fingers[strIdx];
          const isActive = activeStringIdx === strIdx;

          return (
            <g
              key={`finger-${strIdx}`}
              onClick={(e) => {
                e.stopPropagation();
                onPluckString(strIdx, fret);
              }}
              className="cursor-pointer"
            >
              <circle
                cx={x}
                cy={y}
                r={isActive ? 11.5 : 10}
                fill={isActive ? '#FDE047' : isRoot ? '#F59E0B' : '#38BDF8'}
                stroke="#111214"
                strokeWidth={1.5}
              />
              {finger > 0 && (
                <text
                  x={x}
                  y={y + 3.5}
                  textAnchor="middle"
                  className="font-mono text-[10px] font-bold fill-[#111214] pointer-events-none"
                >
                  {finger}
                </text>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
};

export const ChordChartsView: React.FC<ChordChartsViewProps> = ({
  initialRootPc,
  wood,
  leftHanded,
  onImproviseOverScale,
}) => {
  const [chordRootPc, setChordRootPc] = useState<number>(initialRootPc);
  const [qualityId, setQualityId] = useState<ChordQualityId>('minor');
  const [selectedVoicingIdx, setSelectedVoicingIdx] = useState<number>(0);
  const [activeStringIdx, setActiveStringIdx] = useState<number | null>(null);

  const qualitySpec = useMemo(
    () => CHORD_QUALITIES.find((q) => q.id === qualityId) ?? CHORD_QUALITIES[0],
    [qualityId]
  );

  const voicings = useMemo(
    () => getChordVoicings(chordRootPc, qualityId),
    [chordRootPc, qualityId]
  );

  const safeVoicingIdx = Math.min(selectedVoicingIdx, Math.max(0, voicings.length - 1));
  const activeVoicing = voicings[safeVoicingIdx] ?? voicings[0];

  const chordDisplayName = getChordDisplayName(chordRootPc, qualityId, false);
  const chordTonePitchClasses = useMemo(
    () => qualitySpec.intervals.map((i) => (chordRootPc + i) % 12),
    [chordRootPc, qualitySpec]
  );

  const primaryScale = useMemo(
    () => getScaleById(qualitySpec.recommendedScaleIds[0] ?? 'minor_pentatonic'),
    [qualitySpec]
  );

  const handleStrum = (direction: 'down' | 'up' | 'arpeggio') => {
    if (!activeVoicing) return;
    const playable: { strIdx: number; midi: number }[] = [];
    activeVoicing.frets.forEach((f, strIdx) => {
      if (f >= 0) {
        playable.push({ strIdx, midi: STANDARD_TUNING.midiNotes[strIdx] + f });
      }
    });
    const orderedStrings = direction === 'up' ? [...playable].reverse() : playable;
    guitarSynth.strumChord(
      playable.map((p) => p.midi),
      direction,
      (idx) => {
        const hit = orderedStrings[idx];
        if (hit) {
          setActiveStringIdx(hit.strIdx);
          window.setTimeout(() => {
            setActiveStringIdx((prev) => (prev === hit.strIdx ? null : prev));
          }, 260);
        }
      }
    );
  };

  const handlePluckSingleString = (strIdx: number, fret: number) => {
    const midi = STANDARD_TUNING.midiNotes[strIdx] + fret;
    guitarSynth.pluckMidi(midi, 1.9, 0.8);
    setActiveStringIdx(strIdx);
    window.setTimeout(() => {
      setActiveStringIdx((prev) => (prev === strIdx ? null : prev));
    }, 280);
  };

  return (
    <div className="space-y-6">
      {/* Chord Selector & Playback Bar */}
      <div className="bg-[#181A1F] border border-[#272A32] rounded-xl p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white font-display">
              {chordDisplayName} Chord Charts
            </h1>
            <div className="flex flex-wrap items-center gap-2 text-xs text-[#9CA3AF] mt-1">
              <span>{qualitySpec.label}</span>
              <span aria-hidden="true">·</span>
              <span className="font-mono text-[#D1D5DB]">{qualitySpec.formula}</span>
              <span aria-hidden="true">·</span>
              <span className="font-mono text-[#D1D5DB]">
                {chordTonePitchClasses.map((pc) => getNoteName(pc, false)).join(' – ')}
              </span>
              <span aria-hidden="true">·</span>
              <span>{voicings.length} playable voicings</span>
            </div>
          </div>

          {/* Interactive Playback Actions */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => handleStrum('down')}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-amber-500 text-[#111214] hover:bg-amber-400 text-xs font-semibold transition-colors whitespace-nowrap"
            >
              <ArrowDown className="w-3.5 h-3.5" />
              Strum Down
            </button>
            <button
              type="button"
              onClick={() => handleStrum('up')}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#111214] border border-[#2C303A] text-[#E5E7EB] hover:border-amber-500/50 text-xs font-medium transition-colors whitespace-nowrap"
            >
              <ArrowUp className="w-3.5 h-3.5" />
              Strum Up
            </button>
            <button
              type="button"
              onClick={() => handleStrum('arpeggio')}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#111214] border border-[#2C303A] text-[#E5E7EB] hover:border-amber-500/50 text-xs font-medium transition-colors whitespace-nowrap"
            >
              <Music2 className="w-3.5 h-3.5" />
              Arpeggiate
            </button>
          </div>
        </div>

        {/* Root Key Selector */}
        <div className="grid grid-cols-6 sm:grid-cols-12 gap-1 bg-[#111214] p-1 rounded-lg border border-[#252830]">
          {KEY_DISPLAY_NAMES.map((keyName, idx) => (
            <button
              key={keyName}
              type="button"
              onClick={() => {
                setChordRootPc(idx);
                setSelectedVoicingIdx(0);
              }}
              className={`h-9 rounded-md font-mono text-xs font-semibold transition-colors ${
                idx === chordRootPc
                  ? 'bg-amber-500 text-[#111214]'
                  : 'text-[#D1D5DB] hover:bg-[#22252C] hover:text-white'
              }`}
            >
              {keyName}
            </button>
          ))}
        </div>

        {/* Chord Quality Selector */}
        <div className="flex flex-wrap items-center gap-1.5">
          {CHORD_QUALITIES.map((q) => (
            <button
              key={q.id}
              type="button"
              onClick={() => {
                setQualityId(q.id);
                setSelectedVoicingIdx(0);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors whitespace-nowrap ${
                q.id === qualityId
                  ? 'bg-[#2A2E38] border-[#4B5263] text-white'
                  : 'bg-[#111214] border-[#252830] text-[#9CA3AF] hover:text-white'
              }`}
            >
              {q.label}
            </button>
          ))}
        </div>
      </div>

      {/* Voicing Diagrams Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {voicings.map((v, idx) => (
          <ChordBoxSvg
            key={v.id}
            voicing={v}
            rootPitchClass={chordRootPc}
            isSelected={idx === safeVoicingIdx}
            activeStringIdx={idx === safeVoicingIdx ? activeStringIdx : null}
            onSelect={() => {
              setSelectedVoicingIdx(idx);
              const midis = v.frets
                .map((f, s) => (f >= 0 ? STANDARD_TUNING.midiNotes[s] + f : null))
                .filter((m): m is number => m !== null);
              guitarSynth.strumChord(midis, 'down');
            }}
            onPluckString={handlePluckSingleString}
          />
        ))}
      </div>

      {/* Full-Neck Chord Voicing Projection + Matching Solo Scales */}
      {activeVoicing && (
        <div className="bg-[#181A1F] border border-[#272A32] rounded-xl p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold text-white font-display">
                {chordDisplayName} ({activeVoicing.label}) on the Neck
              </h2>
              <p className="text-xs text-[#9CA3AF] mt-0.5">
                Bright highlighted notes show your chord fingers; subtle background notes map the compatible {getNoteName(chordRootPc)} {primaryScale.name} scale for soloing.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {qualitySpec.recommendedScaleIds.map((scaleId) => {
                const s = getScaleById(scaleId);
                return (
                  <button
                    key={scaleId}
                    type="button"
                    onClick={() => onImproviseOverScale(chordRootPc, scaleId)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#111214] border border-amber-500/40 text-amber-300 hover:bg-amber-500/15 text-xs font-medium transition-colors whitespace-nowrap"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    Solo in {getNoteName(chordRootPc)} {s.shortName}
                  </button>
                );
              })}
            </div>
          </div>

          <FretboardCanvas
            rootPitchClass={chordRootPc}
            scale={primaryScale}
            tuning={STANDARD_TUNING}
            fretCount={15}
            displayMode="notes"
            wood={wood}
            leftHanded={leftHanded}
            highlightChordTones={false}
            highlightCharacteristic={false}
            showOutOfScaleGhost={false}
            activePosition={null}
            targetChordPitchClasses={chordTonePitchClasses}
            targetChordRootPc={chordRootPc}
            chordVoicingFrets={activeVoicing.frets}
          />
        </div>
      )}
    </div>
  );
};
