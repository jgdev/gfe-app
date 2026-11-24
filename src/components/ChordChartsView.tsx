import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowDown, ArrowUp, Check, Music2, Plus, Sparkles } from 'lucide-react';
import {
  CHORD_QUALITIES,
  ChordQualityId,
  ChordVoicing,
  getChordDisplayName,
  getChordVoicings,
} from '../music/chords';
import {
  GuitarTuning,
  getKeyDisplayNames,
  getNoteName,
  getScaleById,
  getTuningById,
} from '../music/theory';
import { guitarSynth } from '../audio/guitarSynth';
import { FretboardCanvas, FretboardWood } from './FretboardCanvas';
import {
  ChordGroup,
  ChordGroupsPanel,
  SavedChordStep,
  buildStarterChordGroup,
  loadChordGroups,
  saveChordGroups,
} from './ChordGroupsPanel';
import { useI18n } from '../i18n/I18nContext';

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
  const { t, notation } = useI18n();
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
          {isNut ? t.chordsView.open : `${voicing.baseFret}fr`}
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
                className={`font-mono font-semibold ${
                  notation === 'solfege' ? 'text-[9px]' : 'text-[10px]'
                } ${
                  isMuted
                    ? 'fill-[#4B5563]'
                    : notePc === rootPitchClass
                      ? 'fill-amber-400'
                      : 'fill-[#9CA3AF]'
                }`}
              >
                {isMuted ? '–' : getNoteName(notePc, false, notation)}
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
  const { t, notation } = useI18n();
  const keyNames = getKeyDisplayNames(notation);

  const [chordRootPc, setChordRootPc] = useState<number>(initialRootPc);
  const [qualityId, setQualityId] = useState<ChordQualityId>('minor');
  const [selectedVoicingIdx, setSelectedVoicingIdx] = useState<number>(0);
  const [activeStringIdx, setActiveStringIdx] = useState<number | null>(null);
  const [justAdded, setJustAdded] = useState<boolean>(false);

  // Saved Chord Groups state (persisted in localStorage)
  const [groups, setGroups] = useState<ChordGroup[]>(() => loadChordGroups());
  const [activeGroupId, setActiveGroupId] = useState<string | null>(
    () => loadChordGroups()[0]?.id ?? null
  );
  const [playingGroupStep, setPlayingGroupStep] = useState<SavedChordStep | null>(null);

  useEffect(() => {
    saveChordGroups(groups);
  }, [groups]);

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

  const chordDisplayName = getChordDisplayName(chordRootPc, qualityId, false, notation);
  const chordTonePitchClasses = useMemo(
    () => qualitySpec.intervals.map((i) => (chordRootPc + i) % 12),
    [chordRootPc, qualitySpec]
  );

  const primaryScale = useMemo(
    () => getScaleById(qualitySpec.recommendedScaleIds[0] ?? 'minor_pentatonic'),
    [qualitySpec]
  );

  // Sync full-neck chord projection with currently playing Chord Group step if active
  const neckChordRootPc = playingGroupStep ? playingGroupStep.rootPitchClass : chordRootPc;
  const neckQualitySpec = useMemo(() => {
    if (!playingGroupStep) return qualitySpec;
    return CHORD_QUALITIES.find((q) => q.id === playingGroupStep.qualityId) ?? qualitySpec;
  }, [playingGroupStep, qualitySpec]);
  const neckDisplayName = playingGroupStep
    ? getChordDisplayName(
        playingGroupStep.rootPitchClass,
        playingGroupStep.qualityId,
        false,
        notation
      )
    : chordDisplayName;
  const neckVoicingLabel = playingGroupStep
    ? playingGroupStep.voicingLabel
    : activeVoicing?.label ?? '';
  const neckVoicingFrets = playingGroupStep
    ? playingGroupStep.frets
    : activeVoicing?.frets ?? null;
  const neckChordTonePcs = useMemo(
    () => neckQualitySpec.intervals.map((i) => (neckChordRootPc + i) % 12),
    [neckChordRootPc, neckQualitySpec]
  );
  const neckPrimaryScale = useMemo(
    () => getScaleById(neckQualitySpec.recommendedScaleIds[0] ?? 'minor_pentatonic'),
    [neckQualitySpec]
  );

  const handleCreateGroup = (name: string) => {
    const created: ChordGroup = {
      id: `grp_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      name,
      bpm: 96,
      pattern: 'groove',
      steps: [],
    };
    setGroups((prev) => [...prev, created]);
    setActiveGroupId(created.id);
  };

  const handleRenameGroup = (id: string, name: string) => {
    setGroups((prev) => prev.map((g) => (g.id === id ? { ...g, name } : g)));
  };

  const handleDeleteGroup = (id: string) => {
    setGroups((prev) => {
      const next = prev.filter((g) => g.id !== id);
      setActiveGroupId((curr) => (curr === id ? (next[0]?.id ?? null) : curr));
      return next;
    });
  };

  const handleLoadStarterGroup = () => {
    const starter = buildStarterChordGroup(t.chordsView.starterGroupName);
    setGroups((prev) => [...prev, starter]);
    setActiveGroupId(starter.id);
  };

  const handleAddCurrentChordToGroup = () => {
    if (!activeVoicing) return;
    const newStep: SavedChordStep = {
      id: `step_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      rootPitchClass: chordRootPc,
      qualityId,
      voicingId: activeVoicing.id,
      voicingLabel: activeVoicing.label,
      frets: [...activeVoicing.frets] as [number, number, number, number, number, number],
      bars: 1,
    };

    setGroups((prev) => {
      if (prev.length === 0) {
        const autoGroup: ChordGroup = {
          id: `grp_${Date.now()}`,
          name: t.chordsView.defaultGroupName,
          bpm: 96,
          pattern: 'groove',
          steps: [newStep],
        };
        setActiveGroupId(autoGroup.id);
        return [autoGroup];
      }
      const targetId = prev.some((g) => g.id === activeGroupId)
        ? activeGroupId
        : prev[0].id;
      return prev.map((g) =>
        g.id === targetId ? { ...g, steps: [...g.steps, newStep] } : g
      );
    });

    setJustAdded(true);
    window.setTimeout(() => setJustAdded(false), 1100);
  };

  const handleUpdateGroupSettings = (
    id: string,
    patch: Partial<Pick<ChordGroup, 'bpm' | 'pattern'>>
  ) => {
    setGroups((prev) => prev.map((g) => (g.id === id ? { ...g, ...patch } : g)));
  };

  const handleCycleStepBars = (groupId: string, stepId: string) => {
    const nextBars = (b: 1 | 2 | 4): 1 | 2 | 4 => (b === 1 ? 2 : b === 2 ? 4 : 1);
    setGroups((prev) =>
      prev.map((g) =>
        g.id === groupId
          ? {
              ...g,
              steps: g.steps.map((s) =>
                s.id === stepId ? { ...s, bars: nextBars(s.bars) } : s
              ),
            }
          : g
      )
    );
  };

  const handleMoveStep = (groupId: string, stepId: string, delta: -1 | 1) => {
    setGroups((prev) =>
      prev.map((g) => {
        if (g.id !== groupId) return g;
        const idx = g.steps.findIndex((s) => s.id === stepId);
        const nextIdx = idx + delta;
        if (idx === -1 || nextIdx < 0 || nextIdx >= g.steps.length) return g;
        const copy = [...g.steps];
        const [moved] = copy.splice(idx, 1);
        copy.splice(nextIdx, 0, moved);
        return { ...g, steps: copy };
      })
    );
  };

  const handleRemoveStep = (groupId: string, stepId: string) => {
    setGroups((prev) =>
      prev.map((g) =>
        g.id === groupId
          ? { ...g, steps: g.steps.filter((s) => s.id !== stepId) }
          : g
      )
    );
  };

  const handlePreviewStep = (step: SavedChordStep) => {
    setChordRootPc(step.rootPitchClass);
    setQualityId(step.qualityId);
    const matchingVoicings = getChordVoicings(step.rootPitchClass, step.qualityId);
    const foundIdx = matchingVoicings.findIndex(
      (v) => v.id === step.voicingId || v.frets.join(',') === step.frets.join(',')
    );
    setSelectedVoicingIdx(foundIdx >= 0 ? foundIdx : 0);
  };

  const handleActivePlayingStepChange = useCallback((step: SavedChordStep | null) => {
    setPlayingGroupStep(step);
  }, []);

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
              {t.chordsView.chordChartsTitle(chordDisplayName)}
            </h1>
            <div className="flex flex-wrap items-center gap-2 text-xs text-[#9CA3AF] mt-1">
              <span>{t.chordQualities[qualitySpec.id] ?? qualitySpec.label}</span>
              <span aria-hidden="true">·</span>
              <span className="font-mono text-[#D1D5DB]">{qualitySpec.formula}</span>
              <span aria-hidden="true">·</span>
              <span className="font-mono text-[#D1D5DB]">
                {chordTonePitchClasses
                  .map((pc) => getNoteName(pc, false, notation))
                  .join(' – ')}
              </span>
              <span aria-hidden="true">·</span>
              <span>{t.chordsView.playableVoicings(voicings.length)}</span>
            </div>
          </div>

          {/* Interactive Playback & Save-to-Group Actions */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => handleStrum('down')}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-amber-500 text-[#111214] hover:bg-amber-400 text-xs font-semibold transition-colors whitespace-nowrap"
            >
              <ArrowDown className="w-3.5 h-3.5" />
              {t.chordsView.strumDown}
            </button>
            <button
              type="button"
              onClick={() => handleStrum('up')}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#111214] border border-[#2C303A] text-[#E5E7EB] hover:border-amber-500/50 text-xs font-medium transition-colors whitespace-nowrap"
            >
              <ArrowUp className="w-3.5 h-3.5" />
              {t.chordsView.strumUp}
            </button>
            <button
              type="button"
              onClick={() => handleStrum('arpeggio')}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#111214] border border-[#2C303A] text-[#E5E7EB] hover:border-amber-500/50 text-xs font-medium transition-colors whitespace-nowrap"
            >
              <Music2 className="w-3.5 h-3.5" />
              {t.chordsView.arpeggiate}
            </button>
            <button
              type="button"
              onClick={handleAddCurrentChordToGroup}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border text-xs font-semibold transition-colors whitespace-nowrap ${
                justAdded
                  ? 'bg-emerald-500/20 border-emerald-400/60 text-emerald-300'
                  : 'bg-[#111214] border-sky-400/45 text-sky-300 hover:bg-sky-500/15'
              }`}
            >
              {justAdded ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  {t.chordsView.addedFeedback}
                </>
              ) : (
                <>
                  <Plus className="w-3.5 h-3.5" />
                  {t.chordsView.addToGroup}
                </>
              )}
            </button>
          </div>
        </div>

        {/* Root Key Selector */}
        <div className="grid grid-cols-6 sm:grid-cols-12 gap-1 bg-[#111214] p-1 rounded-lg border border-[#252830]">
          {keyNames.map((keyName, idx) => (
            <button
              key={`${idx}-${keyName}`}
              type="button"
              onClick={() => {
                setChordRootPc(idx);
                setSelectedVoicingIdx(0);
              }}
              className={`h-9 rounded-md font-mono font-semibold transition-colors ${
                notation === 'solfege' ? 'text-[11px]' : 'text-xs'
              } ${
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
              {t.chordQualities[q.id] ?? q.label}
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

      {/* Saved Chord Groups Composer & Groove-Style Player */}
      <ChordGroupsPanel
        groups={groups}
        activeGroupId={activeGroupId}
        onSelectGroupId={setActiveGroupId}
        onCreateGroup={handleCreateGroup}
        onRenameGroup={handleRenameGroup}
        onDeleteGroup={handleDeleteGroup}
        onLoadStarterGroup={handleLoadStarterGroup}
        onAddCurrentChord={handleAddCurrentChordToGroup}
        onUpdateGroupSettings={handleUpdateGroupSettings}
        onCycleStepBars={handleCycleStepBars}
        onMoveStep={handleMoveStep}
        onRemoveStep={handleRemoveStep}
        onPreviewStep={handlePreviewStep}
        onActivePlayingStepChange={handleActivePlayingStepChange}
        currentChordName={chordDisplayName}
      />

      {/* Full-Neck Chord Voicing Projection + Matching Solo Scales */}
      {neckVoicingFrets && (
        <div className="bg-[#181A1F] border border-[#272A32] rounded-xl p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold text-white font-display">
                {t.chordsView.onTheNeckTitle(neckDisplayName, neckVoicingLabel)}
              </h2>
              <p className="text-xs text-[#9CA3AF] mt-0.5">
                {t.chordsView.onTheNeckHint(
                  getNoteName(neckChordRootPc, false, notation),
                  t.scaleNames[neckPrimaryScale.id] ?? neckPrimaryScale.name
                )}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {neckQualitySpec.recommendedScaleIds.map((scaleId) => {
                const s = getScaleById(scaleId);
                return (
                  <button
                    key={scaleId}
                    type="button"
                    onClick={() => onImproviseOverScale(neckChordRootPc, scaleId)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#111214] border border-amber-500/40 text-amber-300 hover:bg-amber-500/15 text-xs font-medium transition-colors whitespace-nowrap"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    {t.chordsView.soloInScale(
                      getNoteName(neckChordRootPc, false, notation),
                      t.scaleNames[s.id] ?? s.shortName
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <FretboardCanvas
            rootPitchClass={neckChordRootPc}
            scale={neckPrimaryScale}
            tuning={STANDARD_TUNING}
            fretCount={15}
            displayMode="notes"
            wood={wood}
            leftHanded={leftHanded}
            highlightChordTones={false}
            highlightCharacteristic={false}
            showOutOfScaleGhost={false}
            activePosition={null}
            targetChordPitchClasses={neckChordTonePcs}
            targetChordRootPc={neckChordRootPc}
            chordVoicingFrets={neckVoicingFrets}
          />
        </div>
      )}
    </div>
  );
};
