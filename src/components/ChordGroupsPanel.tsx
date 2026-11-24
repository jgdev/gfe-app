import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  FolderPlus,
  Play,
  Plus,
  Square,
  Trash2,
  Volume2,
  X,
} from 'lucide-react';
import {
  ChordQualityId,
  getChordDisplayName,
  getChordVoicings,
} from '../music/chords';
import { getTuningById } from '../music/theory';
import { guitarSynth } from '../audio/guitarSynth';
import { useI18n } from '../i18n/I18nContext';

export type ChordGroupPattern = 'groove' | 'down' | 'arpeggio';

export interface SavedChordStep {
  id: string;
  rootPitchClass: number;
  qualityId: ChordQualityId;
  voicingId: string;
  voicingLabel: string;
  frets: [number, number, number, number, number, number];
  bars: 1 | 2 | 4;
}

export interface ChordGroup {
  id: string;
  name: string;
  bpm: number;
  pattern: ChordGroupPattern;
  steps: SavedChordStep[];
}

const CHORD_GROUPS_STORAGE_KEY = 'fretcraft_chord_groups_v1';
const STANDARD_TUNING = getTuningById('standard');

export function loadChordGroups(): ChordGroup[] {
  try {
    const raw = window.localStorage.getItem(CHORD_GROUPS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed as ChordGroup[];
  } catch {
    return [];
  }
}

export function saveChordGroups(groups: ChordGroup[]): void {
  try {
    window.localStorage.setItem(CHORD_GROUPS_STORAGE_KEY, JSON.stringify(groups));
  } catch {
    // ignore storage errors
  }
}

export function buildStarterChordGroup(name: string): ChordGroup {
  const specs: { rootPc: number; qualityId: ChordQualityId }[] = [
    { rootPc: 9, qualityId: 'minor' }, // Am
    { rootPc: 5, qualityId: 'major' }, // F
    { rootPc: 0, qualityId: 'major' }, // C
    { rootPc: 7, qualityId: 'major' }, // G
  ];

  const steps: SavedChordStep[] = specs.map((s, idx) => {
    const voicing = getChordVoicings(s.rootPc, s.qualityId)[0];
    return {
      id: `starter_${idx}_${Date.now()}`,
      rootPitchClass: s.rootPc,
      qualityId: s.qualityId,
      voicingId: voicing?.id ?? 'default',
      voicingLabel: voicing?.label ?? 'Open Position',
      frets: voicing?.frets ?? [-1, 0, 2, 2, 1, 0],
      bars: 1,
    };
  });

  return {
    id: `group_starter_${Date.now()}`,
    name,
    bpm: 96,
    pattern: 'groove',
    steps,
  };
}

function fretsToMidiVoicing(frets: [number, number, number, number, number, number]): number[] {
  const midis: number[] = [];
  frets.forEach((f, strIdx) => {
    if (f >= 0) {
      midis.push(STANDARD_TUNING.midiNotes[strIdx] + f);
    }
  });
  return midis;
}

interface ChordGroupsPanelProps {
  groups: ChordGroup[];
  activeGroupId: string | null;
  onSelectGroupId: (id: string | null) => void;
  onCreateGroup: (name: string) => void;
  onRenameGroup: (id: string, name: string) => void;
  onDeleteGroup: (id: string) => void;
  onLoadStarterGroup: () => void;
  onAddCurrentChord: () => void;
  onUpdateGroupSettings: (
    id: string,
    patch: Partial<Pick<ChordGroup, 'bpm' | 'pattern'>>
  ) => void;
  onCycleStepBars: (groupId: string, stepId: string) => void;
  onMoveStep: (groupId: string, stepId: string, delta: -1 | 1) => void;
  onRemoveStep: (groupId: string, stepId: string) => void;
  onPreviewStep: (step: SavedChordStep) => void;
  onActivePlayingStepChange: (step: SavedChordStep | null) => void;
  currentChordName: string;
}

export const ChordGroupsPanel: React.FC<ChordGroupsPanelProps> = ({
  groups,
  activeGroupId,
  onSelectGroupId,
  onCreateGroup,
  onRenameGroup,
  onDeleteGroup,
  onLoadStarterGroup,
  onAddCurrentChord,
  onUpdateGroupSettings,
  onCycleStepBars,
  onMoveStep,
  onRemoveStep,
  onPreviewStep,
  onActivePlayingStepChange,
  currentChordName,
}) => {
  const { t, notation } = useI18n();

  const [newGroupName, setNewGroupName] = useState('');
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameDraft, setRenameDraft] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeBarIdx, setActiveBarIdx] = useState(0);
  const [activeBeat, setActiveBeat] = useState(0);

  const timerRef = useRef<number | null>(null);
  const beatCounterRef = useRef<number>(0);

  const activeGroup = useMemo(
    () => groups.find((g) => g.id === activeGroupId) ?? groups[0] ?? null,
    [groups, activeGroupId]
  );

  // Expand saved chord steps into 1-bar playback slots
  const expandedBars = useMemo(() => {
    if (!activeGroup) return [];
    const list: {
      step: SavedChordStep;
      stepIndex: number;
      barWithinStep: number;
      midiVoicing: number[];
    }[] = [];

    activeGroup.steps.forEach((step, stepIndex) => {
      const midiVoicing = fretsToMidiVoicing(step.frets);
      for (let b = 0; b < step.bars; b++) {
        list.push({ step, stepIndex, barWithinStep: b, midiVoicing });
      }
    });
    return list;
  }, [activeGroup]);

  // Stop playback when switching groups or when group becomes empty
  useEffect(() => {
    if (!activeGroup || activeGroup.steps.length === 0) {
      setIsPlaying(false);
    }
  }, [activeGroup?.id, activeGroup?.steps.length]);

  // Beat scheduler matching the Jam Backing Loop precision
  useEffect(() => {
    if (!isPlaying || !activeGroup || expandedBars.length === 0) {
      if (timerRef.current !== null) {
        window.clearInterval(timerRef.current);
        timerRef.current = null;
      }
      if (!isPlaying) {
        onActivePlayingStepChange(null);
      }
      return;
    }

    const beatDurationMs = (60 / activeGroup.bpm) * 1000;
    const totalBeats = expandedBars.length * 4;

    const triggerBeat = () => {
      const globalBeat = beatCounterRef.current % totalBeats;
      const barIdx = Math.floor(globalBeat / 4);
      const beatInBar = globalBeat % 4;
      const current = expandedBars[barIdx];

      setActiveBarIdx(barIdx);
      setActiveBeat(beatInBar);

      if (current) {
        onActivePlayingStepChange(current.step);
        if (activeGroup.pattern === 'groove') {
          if (beatInBar === 0 || beatInBar === 2) {
            guitarSynth.playBackingHit(
              current.midiVoicing,
              beatInBar === 0,
              (beatDurationMs / 1000) * 1.9
            );
          }
        } else if (activeGroup.pattern === 'down') {
          if (beatInBar === 0) {
            guitarSynth.strumChord(current.midiVoicing, 'down');
          }
        } else if (activeGroup.pattern === 'arpeggio') {
          if (beatInBar === 0) {
            guitarSynth.strumChord(current.midiVoicing, 'arpeggio');
          }
        }
      }

      beatCounterRef.current += 1;
    };

    beatCounterRef.current = 0;
    triggerBeat();
    timerRef.current = window.setInterval(triggerBeat, beatDurationMs);

    return () => {
      if (timerRef.current !== null) {
        window.clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [
    isPlaying,
    activeGroup?.bpm,
    activeGroup?.pattern,
    expandedBars,
    onActivePlayingStepChange,
  ]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current !== null) {
        window.clearInterval(timerRef.current);
      }
      onActivePlayingStepChange(null);
    };
  }, [onActivePlayingStepChange]);

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newGroupName.trim() || `${t.chordsView.defaultGroupName} ${groups.length + 1}`;
    onCreateGroup(trimmed);
    setNewGroupName('');
    setIsPlaying(false);
  };

  const handleCommitRename = (e: React.FormEvent) => {
    e.preventDefault();
    if (activeGroup && renameDraft.trim()) {
      onRenameGroup(activeGroup.id, renameDraft.trim());
    }
    setIsRenaming(false);
  };

  const activeStepId =
    isPlaying && expandedBars[activeBarIdx]
      ? expandedBars[activeBarIdx].step.id
      : null;

  return (
    <section
      aria-label={t.chordsView.groupsTitle}
      className="bg-[#181A1F] border border-[#272A32] rounded-xl p-5 space-y-4"
    >
      {/* Header Row: Title + Create New Group Form */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Volume2 className="w-4 h-4 text-amber-400 shrink-0" />
            <h2 className="text-base font-semibold text-white font-display">
              {t.chordsView.groupsTitle}
            </h2>
          </div>
          <p className="text-xs text-[#9CA3AF] mt-0.5">
            {t.chordsView.groupsSubtitle}
          </p>
        </div>

        <form onSubmit={handleCreateSubmit} className="flex items-center gap-2 w-full sm:w-auto">
          <input
            type="text"
            value={newGroupName}
            onChange={(e) => setNewGroupName(e.target.value)}
            placeholder={t.chordsView.newGroupPlaceholder}
            className="flex-1 sm:w-56 h-9 px-3 rounded-lg bg-[#111214] border border-[#2A2D36] text-xs text-[#F3F4F6] placeholder-[#6B7280] focus:outline-none focus:border-amber-500"
          />
          <button
            type="submit"
            className="inline-flex items-center gap-1.5 px-3.5 h-9 rounded-lg bg-[#111214] border border-[#2C303A] hover:border-amber-500/60 text-xs font-medium text-[#E5E7EB] hover:text-amber-300 transition-colors whitespace-nowrap shrink-0"
          >
            <FolderPlus className="w-3.5 h-3.5" />
            {t.chordsView.createGroup}
          </button>
        </form>
      </div>

      {/* Empty state if user has no chord groups yet */}
      {groups.length === 0 ? (
        <div className="bg-[#111214] border border-[#252830] rounded-xl p-5 flex flex-wrap items-center justify-between gap-4">
          <p className="text-xs text-[#9CA3AF] max-w-xl leading-relaxed">
            {t.chordsView.emptyGroupsHint}
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={onAddCurrentChord}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-amber-500 text-[#111214] hover:bg-amber-400 text-xs font-semibold transition-colors whitespace-nowrap"
            >
              <Plus className="w-3.5 h-3.5" />
              {t.chordsView.addToGroup} ({currentChordName})
            </button>
            <button
              type="button"
              onClick={onLoadStarterGroup}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#181A1F] border border-[#2C303A] hover:border-amber-500/50 text-xs font-medium text-[#E5E7EB] transition-colors whitespace-nowrap"
            >
              {t.chordsView.loadStarterGroup}
            </button>
          </div>
        </div>
      ) : (
        activeGroup && (
          <div className="space-y-4">
            {/* Group Tabs + Group Management + Groove Playback Controls */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-1 border-t border-[#242730]">
              {/* Saved Group Selector Tabs */}
              <div className="flex flex-wrap items-center gap-1.5">
                {groups.map((g) => {
                  const selected = g.id === activeGroup.id;
                  return (
                    <button
                      key={g.id}
                      type="button"
                      onClick={() => {
                        setIsPlaying(false);
                        setIsRenaming(false);
                        onSelectGroupId(g.id);
                      }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                        selected
                          ? 'bg-amber-500/15 border-amber-500/50 text-amber-200'
                          : 'bg-[#111214] border-[#252830] text-[#9CA3AF] hover:text-white'
                      }`}
                    >
                      <span className="truncate max-w-[180px]">{g.name}</span>
                      <span className="font-mono text-[11px] opacity-70 tabular-nums">
                        ({g.steps.length})
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Group Actions: Rename / Delete / Add Current Chord */}
              <div className="flex flex-wrap items-center gap-2">
                {isRenaming ? (
                  <form onSubmit={handleCommitRename} className="flex items-center gap-1.5">
                    <input
                      type="text"
                      value={renameDraft}
                      onChange={(e) => setRenameDraft(e.target.value)}
                      autoFocus
                      className="w-40 h-8 px-2.5 rounded-md bg-[#111214] border border-amber-500 text-xs text-white focus:outline-none"
                    />
                    <button
                      type="submit"
                      className="px-2.5 h-8 rounded-md bg-amber-500 text-[#111214] text-xs font-semibold"
                    >
                      OK
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsRenaming(false)}
                      className="px-2 h-8 rounded-md bg-[#111214] border border-[#2A2D36] text-xs text-[#9CA3AF]"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </form>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={onAddCurrentChord}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#111214] border border-amber-500/45 text-amber-300 hover:bg-amber-500/15 text-xs font-medium transition-colors whitespace-nowrap"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      {t.chordsView.addToGroup} ({currentChordName})
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setRenameDraft(activeGroup.name);
                        setIsRenaming(true);
                      }}
                      className="px-2.5 py-1.5 rounded-lg bg-[#111214] border border-[#252830] text-xs text-[#9CA3AF] hover:text-white transition-colors whitespace-nowrap"
                    >
                      {t.chordsView.renameGroup}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsPlaying(false);
                        onDeleteGroup(activeGroup.id);
                      }}
                      aria-label={t.chordsView.deleteGroup}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#111214] border border-[#252830] text-xs text-[#9CA3AF] hover:text-rose-400 hover:border-rose-500/40 transition-colors whitespace-nowrap"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      {t.chordsView.deleteGroup}
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Playback Controls Bar (Tempo + Pattern + Play/Stop) */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-[#111214] border border-[#252830] rounded-lg px-3.5 py-2.5">
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2.5 text-xs text-[#9CA3AF] font-mono tabular-nums">
                  <label htmlFor="chord-group-bpm" className="whitespace-nowrap">
                    {t.backing.tempo}:{' '}
                    <span className="text-[#F3F4F6] font-semibold">
                      {activeGroup.bpm} BPM
                    </span>
                  </label>
                  <input
                    id="chord-group-bpm"
                    type="range"
                    min={60}
                    max={160}
                    step={2}
                    value={activeGroup.bpm}
                    onChange={(e) =>
                      onUpdateGroupSettings(activeGroup.id, {
                        bpm: Number(e.target.value),
                      })
                    }
                    className="w-24 sm:w-28 accent-amber-500 cursor-pointer"
                  />
                </div>

                {/* Pattern Switcher */}
                <div className="inline-flex items-center gap-1 bg-[#181A1F] p-1 rounded-lg border border-[#252830]">
                  {(
                    [
                      { id: 'groove', label: t.chordsView.patternGroove },
                      { id: 'down', label: t.chordsView.patternDown },
                      { id: 'arpeggio', label: t.chordsView.patternArpeggio },
                    ] as const
                  ).map((pat) => (
                    <button
                      key={pat.id}
                      type="button"
                      onClick={() =>
                        onUpdateGroupSettings(activeGroup.id, { pattern: pat.id })
                      }
                      className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${
                        activeGroup.pattern === pat.id
                          ? 'bg-[#2A2E38] text-white'
                          : 'text-[#9CA3AF] hover:text-white'
                      }`}
                    >
                      {pat.label}
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="button"
                disabled={activeGroup.steps.length === 0}
                onClick={() => setIsPlaying((p) => !p)}
                className={`inline-flex items-center gap-2 px-4 h-9 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap shrink-0 disabled:opacity-40 disabled:cursor-not-allowed ${
                  isPlaying
                    ? 'bg-rose-500 text-white hover:bg-rose-600'
                    : 'bg-amber-500 text-[#111214] hover:bg-amber-400'
                }`}
              >
                {isPlaying ? (
                  <>
                    <Square className="w-3.5 h-3.5 fill-current" />
                    {t.chordsView.stopGroup}
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5 fill-current" />
                    {t.chordsView.playGroup}
                  </>
                )}
              </button>
            </div>

            {/* Recorded Chord Sequence Cards */}
            {activeGroup.steps.length === 0 ? (
              <div className="text-xs text-[#9CA3AF] bg-[#111214] border border-dashed border-[#2C303A] rounded-lg px-4 py-5 text-center">
                {t.chordsView.emptyStepsHint}
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5">
                {activeGroup.steps.map((step, idx) => {
                  const isStepActive = activeStepId === step.id;
                  const stepName = getChordDisplayName(
                    step.rootPitchClass,
                    step.qualityId,
                    false,
                    notation
                  );

                  return (
                    <div
                      key={step.id}
                      className={`rounded-lg border p-3 transition-colors flex flex-col justify-between gap-2 ${
                        isStepActive
                          ? 'bg-amber-500/18 border-amber-400'
                          : 'bg-[#111214] border-[#252830] hover:border-[#3A3F4C]'
                      }`}
                    >
                      {/* Top row: Step index + Remove */}
                      <div className="flex items-center justify-between gap-1">
                        <span className="font-mono text-[10px] text-[#6B7280] tabular-nums">
                          #{idx + 1}
                        </span>
                        <div className="flex items-center gap-0.5">
                          <button
                            type="button"
                            onClick={() => onCycleStepBars(activeGroup.id, step.id)}
                            className="px-1.5 py-0.5 rounded bg-[#181A1F] border border-[#2C303A] font-mono text-[10px] text-[#D1D5DB] hover:border-amber-500/50 tabular-nums"
                          >
                            {t.chordsView.barsShort(step.bars)}
                          </button>
                          <button
                            type="button"
                            onClick={() => onRemoveStep(activeGroup.id, step.id)}
                            aria-label={t.chordsView.removeStep}
                            className="p-1 rounded text-[#6B7280] hover:text-rose-400 transition-colors"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      </div>

                      {/* Main clickable Chord Name + Voicing */}
                      <button
                        type="button"
                        onClick={() => {
                          onPreviewStep(step);
                          guitarSynth.strumChord(fretsToMidiVoicing(step.frets), 'down');
                        }}
                        className="text-left group"
                      >
                        <div
                          className={`text-lg font-bold font-display leading-tight ${
                            isStepActive
                              ? 'text-amber-200'
                              : 'text-white group-hover:text-amber-300'
                          }`}
                        >
                          {stepName}
                        </div>
                        <div className="text-[11px] text-[#9CA3AF] truncate mt-0.5">
                          {step.voicingLabel}
                        </div>
                      </button>

                      {/* Beat LEDs + Reorder Controls */}
                      <div className="flex items-center justify-between gap-1 pt-1 border-t border-[#22252D]">
                        <div className="flex items-center gap-1">
                          {[0, 1, 2, 3].map((b) => (
                            <span
                              key={b}
                              className={`h-1.5 w-2.5 rounded-xs transition-colors ${
                                isStepActive && activeBeat === b
                                  ? 'bg-amber-400'
                                  : isStepActive
                                    ? 'bg-amber-500/35'
                                    : 'bg-[#262932]'
                              }`}
                            />
                          ))}
                        </div>

                        <div className="flex items-center gap-0.5">
                          <button
                            type="button"
                            disabled={idx === 0}
                            onClick={() => onMoveStep(activeGroup.id, step.id, -1)}
                            aria-label={t.chordsView.moveLeft}
                            className="p-0.5 rounded text-[#9CA3AF] hover:text-white disabled:opacity-25"
                          >
                            <ChevronLeft className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            disabled={idx === activeGroup.steps.length - 1}
                            onClick={() => onMoveStep(activeGroup.id, step.id, 1)}
                            aria-label={t.chordsView.moveRight}
                            className="p-0.5 rounded text-[#9CA3AF] hover:text-white disabled:opacity-25"
                          >
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )
      )}
    </section>
  );
};
