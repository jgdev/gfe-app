import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Keyboard, Menu, Play, Square, X } from 'lucide-react';
import {
  DiatonicChord,
  INTERVAL_LABELS,
  PlayableFretNote,
  QWERTY_CODE_TO_INDEX,
  computeOrderedPlayableNotes,
  getNoteName,
  getScaleById,
  getScalePositions,
  getTuningById,
  midiToFrequency,
  midiToNoteWithOctave,
  shouldUseFlats,
} from './music/theory';
import { GuitarTone, guitarSynth } from './audio/guitarSynth';
import {
  ActiveNoteInspect,
  FretboardCanvas,
  FretboardWood,
  NoteDisplayMode,
} from './components/FretboardCanvas';
import { SoloToolbar } from './components/SoloToolbar';
import { BackingTrackBar } from './components/BackingTrackBar';
import { ScaleDiagramsView } from './components/ScaleDiagramsView';
import { ChordChartsView } from './components/ChordChartsView';
import { TunerView } from './components/TunerView';
import { useI18n } from './i18n/I18nContext';
import { LOCALE_OPTIONS } from './i18n/translations';

type AppTab = 'fretboard' | 'scales' | 'chords' | 'tuner';

const STORAGE_KEY = 'fretcraft_prefs_v1';

interface SavedPrefs {
  rootPitchClass: number;
  scaleId: string;
  tuningId: string;
  wood: FretboardWood;
  fretCount: 12 | 15 | 22;
  leftHanded: boolean;
  displayMode: NoteDisplayMode;
  showKeyHints: boolean;
}

function loadPrefs(): Partial<SavedPrefs> {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as Partial<SavedPrefs>;
  } catch {
    return {};
  }
}

function isEditableElement(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true;
  return target.isContentEditable;
}

export default function App() {
  const { locale, setLocale, notation, setNotation, t } = useI18n();
  const initialPrefs = useMemo(() => loadPrefs(), []);

  const [activeTab, setActiveTab] = useState<AppTab>('fretboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);
  const [rootPitchClass, setRootPitchClass] = useState<number>(
    typeof initialPrefs.rootPitchClass === 'number' ? initialPrefs.rootPitchClass : 9 // A
  );
  const [scaleId, setScaleId] = useState<string>(
    initialPrefs.scaleId ?? 'minor_pentatonic'
  );
  const [tuningId, setTuningId] = useState<string>(
    initialPrefs.tuningId ?? 'standard'
  );
  const [fretCount, setFretCount] = useState<12 | 15 | 22>(
    initialPrefs.fretCount ?? 22
  );
  const [displayMode, setDisplayMode] = useState<NoteDisplayMode>(
    initialPrefs.displayMode ?? 'notes'
  );
  const [wood, setWood] = useState<FretboardWood>(
    initialPrefs.wood ?? 'rosewood'
  );
  const [leftHanded, setLeftHanded] = useState<boolean>(
    initialPrefs.leftHanded ?? false
  );
  const [showKeyHints, setShowKeyHints] = useState<boolean>(
    initialPrefs.showKeyHints ?? true
  );
  const [guitarTone, setGuitarTone] = useState<GuitarTone>('electric');

  // Improvisation overlay toggles
  const [highlightChordTones, setHighlightChordTones] = useState<boolean>(true);
  const [highlightCharacteristic, setHighlightCharacteristic] = useState<boolean>(true);
  const [showOutOfScaleGhost, setShowOutOfScaleGhost] = useState<boolean>(false);
  const [selectedPositionId, setSelectedPositionId] = useState<number | null>(null);

  // Fretboard keyboard focus & active note navigation state
  const [isFretboardFocused, setIsFretboardFocused] = useState<boolean>(true);
  const [focusedNoteId, setFocusedNoteId] = useState<string | null>(null);
  const [externalPluckPulse, setExternalPluckPulse] = useState<{
    id: string;
    tuningIdx: number;
    nonce: number;
  } | null>(null);
  const pluckNonceRef = useRef<number>(0);

  // Active chord target (either manually picked or driven by live backing loop)
  const [selectedSoloChord, setSelectedSoloChord] = useState<DiatonicChord | null>(null);
  const [loopChordState, setLoopChordState] = useState<{
    pitchClasses: number[] | null;
    rootPc: number | null;
    label: string | null;
  }>({ pitchClasses: null, rootPc: null, label: null });

  // Scale playback state
  const [isPlayingScale, setIsPlayingScale] = useState<boolean>(false);
  const [activePlaybackMidi, setActivePlaybackMidi] = useState<number | null>(null);

  // Last plucked note readout
  const [inspectedNote, setInspectedNote] = useState<ActiveNoteInspect | null>(null);

  const scale = useMemo(() => getScaleById(scaleId), [scaleId]);
  const tuning = useMemo(() => getTuningById(tuningId), [tuningId]);
  const preferFlats = useMemo(
    () => shouldUseFlats(rootPitchClass, scale.id),
    [rootPitchClass, scale.id]
  );
  const rootName = getNoteName(rootPitchClass, preferFlats, notation);
  const localizedScaleName = t.scaleNames[scale.id] ?? scale.name;
  const localizedScaleTip = t.scaleTips[scale.id] ?? scale.soloTip;

  const positions = useMemo(
    () => getScalePositions(rootPitchClass, scale, tuning),
    [rootPitchClass, scale, tuning]
  );

  const activePosition = useMemo(
    () => positions.find((p) => p.id === selectedPositionId) ?? null,
    [positions, selectedPositionId]
  );

  // Ordered playable scale notes: String 6 -> String 1, low fret -> high fret
  const orderedPlayableNotes = useMemo(
    () =>
      computeOrderedPlayableNotes(
        rootPitchClass,
        scale,
        tuning,
        fretCount,
        activePosition
      ),
    [rootPitchClass, scale, tuning, fretCount, activePosition]
  );

  const keyHintMap = useMemo(() => {
    const map = new Map<string, string>();
    orderedPlayableNotes.forEach((n) => {
      if (n.keyHint) map.set(n.id, n.keyHint);
    });
    return map;
  }, [orderedPlayableNotes]);

  const focusedPlayableNote = useMemo(
    () =>
      focusedNoteId
        ? orderedPlayableNotes.find((n) => n.id === focusedNoteId) ?? null
        : null,
    [focusedNoteId, orderedPlayableNotes]
  );

  // Persist user preferences quietly in localStorage
  useEffect(() => {
    try {
      const payload: SavedPrefs = {
        rootPitchClass,
        scaleId,
        tuningId,
        wood,
        fretCount,
        leftHanded,
        displayMode,
        showKeyHints,
      };
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch {
      // ignore quota/storage errors
    }
  }, [
    rootPitchClass,
    scaleId,
    tuningId,
    wood,
    fretCount,
    leftHanded,
    displayMode,
    showKeyHints,
  ]);

  // Reset single-chord override when key or scale changes
  useEffect(() => {
    setSelectedSoloChord(null);
  }, [rootPitchClass, scaleId]);

  // Auto-focus fretboard and reset focused note whenever Key, Scale, Tuning, or Position changes
  useEffect(() => {
    setIsFretboardFocused(true);
    setFocusedNoteId(null);
  }, [rootPitchClass, scaleId, tuningId, selectedPositionId]);

  // Restore fretboard focus when returning to the Fretboard tab
  useEffect(() => {
    if (activeTab === 'fretboard') {
      setIsFretboardFocused(true);
    }
  }, [activeTab]);

  // Pause fretboard keyboard focus when user focuses a form input/select/textarea
  useEffect(() => {
    if (activeTab !== 'fretboard') return;
    const handleFocusIn = (e: FocusEvent) => {
      if (isEditableElement(e.target)) {
        setIsFretboardFocused(false);
      }
    };
    document.addEventListener('focusin', handleFocusIn);
    return () => document.removeEventListener('focusin', handleFocusIn);
  }, [activeTab]);

  // Close mobile menu on Escape key
  useEffect(() => {
    if (!mobileMenuOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMobileMenuOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mobileMenuOpen]);

  // Determine effective target chord pitch classes for the fretboard
  const effectiveTargetPcs =
    loopChordState.pitchClasses ?? selectedSoloChord?.pitchClasses ?? null;
  const effectiveTargetRoot =
    loopChordState.rootPc ?? selectedSoloChord?.rootPitchClass ?? null;
  const activeOverlayChordName =
    loopChordState.label ?? selectedSoloChord?.name ?? null;

  const triggerPlayableNote = useCallback(
    (note: PlayableFretNote) => {
      setIsFretboardFocused(true);
      setFocusedNoteId(note.id);
      guitarSynth.pluckMidi(note.midi, 2.0, 0.78);
      pluckNonceRef.current += 1;
      setExternalPluckPulse({
        id: note.id,
        tuningIdx: note.tuningIdx,
        nonce: pluckNonceRef.current,
      });

      const intervalSemitones = (note.pitchClass - rootPitchClass + 12) % 12;
      const isRoot = intervalSemitones === 0;
      const isTargetChordTone =
        effectiveTargetPcs !== null
          ? effectiveTargetPcs.includes(note.pitchClass)
          : isRoot;

      setInspectedNote({
        stringNumber: note.stringNumber,
        fret: note.fret,
        midi: note.midi,
        noteName: getNoteName(note.pitchClass, preferFlats, notation),
        noteWithOctave: midiToNoteWithOctave(note.midi, preferFlats, notation),
        frequency: midiToFrequency(note.midi),
        intervalSemitones,
        intervalShort: INTERVAL_LABELS[intervalSemitones],
        intervalFull: t.intervalsFull[intervalSemitones] ?? INTERVAL_LABELS[intervalSemitones],
        inScale: true,
        isRoot,
        isTargetChordTone,
      });
    },
    [effectiveTargetPcs, notation, preferFlats, rootPitchClass, t.intervalsFull]
  );

  // Global keyboard controls for the fretboard (Arrows, QWERTY letters, Space/Enter)
  useEffect(() => {
    if (activeTab !== 'fretboard' || !isFretboardFocused) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (isEditableElement(e.target)) return;
      if (orderedPlayableNotes.length === 0) return;

      if (e.key === 'ArrowRight') {
        e.preventDefault();
        const currIdx = focusedNoteId
          ? orderedPlayableNotes.findIndex((n) => n.id === focusedNoteId)
          : -1;
        const nextIdx =
          currIdx === -1 ? 0 : (currIdx + 1) % orderedPlayableNotes.length;
        triggerPlayableNote(orderedPlayableNotes[nextIdx]);
        return;
      }

      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        const currIdx = focusedNoteId
          ? orderedPlayableNotes.findIndex((n) => n.id === focusedNoteId)
          : -1;
        // When no note is focused yet, pressing either arrow starts at the first note
        const prevIdx =
          currIdx === -1
            ? 0
            : (currIdx - 1 + orderedPlayableNotes.length) %
              orderedPlayableNotes.length;
        triggerPlayableNote(orderedPlayableNotes[prevIdx]);
        return;
      }

      if (e.code === 'Space' || e.key === 'Enter') {
        if (e.key === 'Enter' && e.target instanceof HTMLButtonElement) {
          return;
        }
        if (focusedNoteId) {
          const targetNote = orderedPlayableNotes.find(
            (n) => n.id === focusedNoteId
          );
          if (targetNote) {
            e.preventDefault();
            triggerPlayableNote(targetNote);
          }
        }
        return;
      }

      const qwertyIndex = QWERTY_CODE_TO_INDEX[e.code];
      if (
        qwertyIndex !== undefined &&
        !e.repeat &&
        qwertyIndex < orderedPlayableNotes.length
      ) {
        e.preventDefault();
        triggerPlayableNote(orderedPlayableNotes[qwertyIndex]);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    activeTab,
    isFretboardFocused,
    orderedPlayableNotes,
    focusedNoteId,
    triggerPlayableNote,
  ]);

  const blurActiveControl = () => {
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
  };

  const handleSelectTab = (tab: AppTab) => {
    setActiveTab(tab);
    setMobileMenuOpen(false);
  };

  const handleToneChange = (tone: GuitarTone) => {
    setGuitarTone(tone);
    guitarSynth.setTone(tone);
  };

  const handleActiveLoopChordChange = useCallback(
    (pitchClasses: number[] | null, rootPc: number | null, label: string | null) => {
      setLoopChordState((prev) => {
        if (prev.label === label && prev.rootPc === rootPc) return prev;
        return { pitchClasses, rootPc, label };
      });
    },
    []
  );

  const handlePlayScale = () => {
    if (isPlayingScale) {
      guitarSynth.clearScheduled();
      setIsPlayingScale(false);
      setActivePlaybackMidi(null);
      return;
    }

    const baseMidi = 40 + ((rootPitchClass - 4 + 12) % 12);
    const ascending = [
      ...scale.intervals.map((i) => baseMidi + i),
      baseMidi + 12,
    ];
    const sequence = [...ascending, ...[...ascending].reverse().slice(1)];

    setIsPlayingScale(true);
    guitarSynth.playScaleSequence(
      sequence,
      132,
      (stepIdx) => {
        setActivePlaybackMidi(stepIdx !== null ? sequence[stepIdx] : null);
      },
      () => {
        setIsPlayingScale(false);
        setActivePlaybackMidi(null);
      }
    );
  };

  const handleFocusPositionOnNeck = (positionId: number) => {
    setSelectedPositionId(positionId);
    setActiveTab('fretboard');
    setIsFretboardFocused(true);
    setFocusedNoteId(null);
  };

  const handleImproviseOverScale = (newRootPc: number, newScaleId: string) => {
    setRootPitchClass(newRootPc);
    setScaleId(newScaleId);
    setSelectedPositionId(null);
    setSelectedSoloChord(null);
    setActiveTab('fretboard');
    setIsFretboardFocused(true);
    setFocusedNoteId(null);
  };

  const scaleNotesFormatted = useMemo(
    () =>
      scale.intervals
        .map((i) => getNoteName((rootPitchClass + i) % 12, preferFlats, notation))
        .join(' – '),
    [scale.intervals, rootPitchClass, preferFlats, notation]
  );

  const scaleIntervalsFormatted = useMemo(
    () => scale.intervals.map((i) => INTERVAL_LABELS[i]).join(' · '),
    [scale.intervals]
  );

  const navItems: { id: AppTab; label: string }[] = [
    { id: 'fretboard', label: t.nav.fretboard },
    { id: 'scales', label: t.nav.scales },
    { id: 'chords', label: t.nav.chords },
    { id: 'tuner', label: t.nav.tuner },
  ];

  // Dynamically format inspected note so switching notation/locale updates immediately
  const inspectedNoteLabel = inspectedNote
    ? midiToNoteWithOctave(inspectedNote.midi, preferFlats, notation)
    : null;
  const inspectedIntervalFull = inspectedNote
    ? t.intervalsFull[inspectedNote.intervalSemitones] ?? inspectedNote.intervalFull
    : null;

  return (
    <div className="min-h-screen bg-[#111214] text-[#F3F4F6] flex flex-col">
      {/* Top Navigation Bar (Desktop 3-zone contract + Collapsible Mobile Menu) */}
      <header className="sticky top-0 z-30 bg-[#111214]/95 backdrop-blur-sm border-b border-[#22252D]">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3 md:gap-8">
          {/* Zone 1: Single text element Brand Wordmark */}
          <button
            type="button"
            onClick={() => handleSelectTab('fretboard')}
            className="font-display text-xl font-bold tracking-tight text-white hover:text-amber-400 transition-colors whitespace-nowrap shrink-0"
          >
            Fretcraft
          </button>

          {/* Zone 2: Desktop 4 concise single-line nav links */}
          <nav
            aria-label="Primary navigation"
            className="hidden md:flex items-center gap-7"
          >
            {navItems.map((item) => {
              const active = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleSelectTab(item.id)}
                  className={`relative py-5 text-sm font-medium transition-colors whitespace-nowrap shrink-0 ${
                    active ? 'text-white' : 'text-[#9CA3AF] hover:text-[#E5E7EB]'
                  }`}
                >
                  {item.label}
                  {active && (
                    <span className="absolute left-0 right-0 bottom-0 h-[2px] bg-amber-500" />
                  )}
                </button>
              );
            })}
          </nav>

          {/* Zone 3: Primary action + Mobile collapsible menu trigger */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handlePlayScale}
              className={`inline-flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                isPlayingScale
                  ? 'bg-rose-500 text-white hover:bg-rose-600'
                  : 'bg-amber-500 text-[#111214] hover:bg-amber-400'
              }`}
            >
              {isPlayingScale ? (
                <>
                  <Square className="w-3.5 h-3.5 fill-current" />
                  {t.nav.stopScale}
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-current" />
                  {t.nav.playScale}
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => setMobileMenuOpen((open) => !open)}
              aria-expanded={mobileMenuOpen}
              aria-controls="mobile-nav-menu"
              aria-label={mobileMenuOpen ? t.nav.closeMenu : t.nav.openMenu}
              className="md:hidden inline-flex items-center justify-center w-11 h-11 rounded-lg bg-[#181A1F] border border-[#272A32] text-[#E5E7EB] hover:text-white hover:border-[#3A3F4C] transition-colors shrink-0"
            >
              {mobileMenuOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>

        {/* Collapsible Mobile Navigation Panel */}
        {mobileMenuOpen && (
          <nav
            id="mobile-nav-menu"
            aria-label="Mobile navigation"
            className="md:hidden border-t border-[#22252D] bg-[#16181D] px-4 py-2 space-y-2"
          >
            <div className="flex flex-col divide-y divide-[#22252D]">
              {navItems.map((item) => {
                const active = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleSelectTab(item.id)}
                    className={`w-full min-h-[46px] px-2 py-3 flex items-center justify-between text-left text-sm font-medium transition-colors whitespace-nowrap ${
                      active
                        ? 'text-amber-400'
                        : 'text-[#D1D5DB] hover:text-white'
                    }`}
                  >
                    <span>{item.label}</span>
                    {active && (
                      <span className="text-xs font-mono text-amber-400/90">
                        {t.nav.active}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Mobile Language & Note Notation Switcher */}
            <div className="pt-2 pb-2 border-t border-[#22252D] flex flex-wrap items-center justify-between gap-2">
              <div className="inline-flex items-center gap-1 bg-[#111214] p-1 rounded-lg border border-[#272A32]">
                {LOCALE_OPTIONS.map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setLocale(opt.id)}
                    className={`min-h-[36px] px-2.5 rounded-md text-xs font-mono font-semibold transition-colors ${
                      locale === opt.id
                        ? 'bg-amber-500 text-[#111214]'
                        : 'text-[#9CA3AF] hover:text-white'
                    }`}
                  >
                    {opt.short}
                  </button>
                ))}
              </div>
              <div className="inline-flex items-center gap-1 bg-[#111214] p-1 rounded-lg border border-[#272A32]">
                <button
                  type="button"
                  onClick={() => setNotation('letters')}
                  className={`min-h-[36px] px-2.5 rounded-md text-xs font-medium transition-colors ${
                    notation === 'letters'
                      ? 'bg-[#2A2E38] text-white'
                      : 'text-[#9CA3AF] hover:text-white'
                  }`}
                >
                  C-D-E
                </button>
                <button
                  type="button"
                  onClick={() => setNotation('solfege')}
                  className={`min-h-[36px] px-2.5 rounded-md text-xs font-medium transition-colors ${
                    notation === 'solfege'
                      ? 'bg-[#2A2E38] text-white'
                      : 'text-[#9CA3AF] hover:text-white'
                  }`}
                >
                  Do-Re-Mi
                </button>
              </div>
            </div>
          </nav>
        )}
      </header>

      {/* Main Content Stage */}
      <main className="flex-1 max-w-[1440px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-5 space-y-5">
        {/* Quiet Desktop Utility Strip: Language & Musical Notation Switcher */}
        <div className="hidden md:flex items-center justify-end gap-4 text-xs text-[#9CA3AF]">
          <div className="inline-flex items-center gap-2">
            <span className="text-[11px] uppercase tracking-wider text-[#6B7280] font-semibold">
              {t.nav.language}
            </span>
            <div className="inline-flex items-center gap-0.5 bg-[#181A1F] p-0.5 rounded-lg border border-[#272A32]">
              {LOCALE_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  title={opt.label}
                  onClick={() => setLocale(opt.id)}
                  className={`px-2 py-1 rounded-md text-[11px] font-mono font-semibold transition-colors whitespace-nowrap ${
                    locale === opt.id
                      ? 'bg-amber-500 text-[#111214]'
                      : 'text-[#9CA3AF] hover:text-white'
                  }`}
                >
                  {opt.short}
                </button>
              ))}
            </div>
          </div>

          <div className="inline-flex items-center gap-2">
            <span className="text-[11px] uppercase tracking-wider text-[#6B7280] font-semibold">
              {t.nav.notation}
            </span>
            <div className="inline-flex items-center gap-0.5 bg-[#181A1F] p-0.5 rounded-lg border border-[#272A32]">
              <button
                type="button"
                onClick={() => setNotation('letters')}
                className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors whitespace-nowrap ${
                  notation === 'letters'
                    ? 'bg-[#2A2E38] text-white'
                    : 'text-[#9CA3AF] hover:text-white'
                }`}
              >
                C-D-E
              </button>
              <button
                type="button"
                onClick={() => setNotation('solfege')}
                className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors whitespace-nowrap ${
                  notation === 'solfege'
                    ? 'bg-[#2A2E38] text-white'
                    : 'text-[#9CA3AF] hover:text-white'
                }`}
              >
                Do-Re-Mi
              </button>
            </div>
          </div>
        </div>

        {activeTab === 'fretboard' && (
          <>
            {/* Compact Solo Header & Live Note Inspector */}
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div className="space-y-1">
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white font-display">
                  {rootName} {localizedScaleName}
                  {activeOverlayChordName
                    ? ` ${t.fretboard.overChord} ${activeOverlayChordName}`
                    : ''}
                </h1>
                <div className="flex flex-wrap items-center gap-2 text-xs text-[#9CA3AF]">
                  <span className="font-mono text-[#E5E7EB] font-medium">
                    {scaleNotesFormatted}
                  </span>
                  <span aria-hidden="true">·</span>
                  <span className="font-mono">{scaleIntervalsFormatted}</span>
                  <span aria-hidden="true">·</span>
                  <span>
                    {activePosition
                      ? `${t.scalesView.positionLabel(activePosition.id)} (${activePosition.cagedShape}, ${t.fretboard.fretsRange(activePosition.startFret, activePosition.endFret)})`
                      : t.fretboard.fullNeckRange(fretCount)}
                  </span>
                  <span aria-hidden="true">·</span>
                  <span>{tuning.shortLabel}</span>
                </div>
              </div>

              {/* Right: Guitar Voice Selector & Last Plucked Note Readout */}
              <div className="flex flex-wrap items-center gap-4">
                {inspectedNote && inspectedNoteLabel && (
                  <div className="text-xs font-mono tabular-nums text-[#D1D5DB] flex items-center gap-2">
                    <span className="text-amber-400 font-bold text-sm">
                      {inspectedNoteLabel}
                    </span>
                    <span aria-hidden="true" className="text-[#4B5563]">
                      ·
                    </span>
                    <span>{inspectedNote.frequency.toFixed(1)} Hz</span>
                    <span aria-hidden="true" className="text-[#4B5563]">
                      ·
                    </span>
                    <span>
                      {inspectedIntervalFull} ({inspectedNote.intervalShort})
                    </span>
                    <span aria-hidden="true" className="text-[#4B5563]">
                      ·
                    </span>
                    <span className="text-[#9CA3AF]">
                      {t.fretboard.stringShort} {inspectedNote.stringNumber},{' '}
                      {t.fretboard.fretShort} {inspectedNote.fret}
                    </span>
                  </div>
                )}

                <div className="inline-flex items-center gap-1 bg-[#181A1F] p-1 rounded-lg border border-[#272A32]">
                  {(
                    [
                      { id: 'electric', label: t.fretboard.electric },
                      { id: 'acoustic', label: t.fretboard.acoustic },
                      { id: 'nylon', label: t.fretboard.nylon },
                    ] as const
                  ).map((toneOpt) => (
                    <button
                      key={toneOpt.id}
                      type="button"
                      onClick={() => handleToneChange(toneOpt.id)}
                      className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${
                        guitarTone === toneOpt.id
                          ? 'bg-[#2A2E38] text-white'
                          : 'text-[#9CA3AF] hover:text-white'
                      }`}
                    >
                      {toneOpt.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Dominant Visual Anchor: Full-Neck Interactive Fretboard with Focus Border Indicator */}
            <section
              aria-label="Full neck guitar fretboard"
              onClick={() => {
                if (!isFretboardFocused) setIsFretboardFocused(true);
              }}
              className={`bg-[#181A1F] border rounded-xl px-3 sm:px-5 pt-3 pb-3 space-y-3 transition-all ${
                isFretboardFocused
                  ? 'border-amber-500/80 ring-2 ring-amber-500/30 shadow-[0_0_24px_rgba(245,158,11,0.12)]'
                  : 'border-[#272A32] hover:border-[#3A3F4C]'
              }`}
            >
              {/* Keyboard Focus Indicator Strip */}
              <div className="flex flex-wrap items-center justify-between gap-2 pb-1 text-[11px]">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    blurActiveControl();
                    setIsFretboardFocused(true);
                  }}
                  className="inline-flex items-center gap-2 text-left transition-colors"
                >
                  <Keyboard
                    className={`w-3.5 h-3.5 shrink-0 ${
                      isFretboardFocused ? 'text-amber-400' : 'text-[#6B7280]'
                    }`}
                  />
                  <span
                    className={`font-semibold ${
                      isFretboardFocused ? 'text-amber-300' : 'text-[#9CA3AF]'
                    }`}
                  >
                    {isFretboardFocused
                      ? t.fretboard.keyboardActive
                      : t.fretboard.keyboardPaused}
                  </span>
                  <span aria-hidden="true" className="text-[#4B5563] hidden sm:inline">
                    ·
                  </span>
                  <span className="text-[#9CA3AF] hidden sm:inline font-mono">
                    {t.fretboard.keyboardHint}
                  </span>
                </button>

                {focusedPlayableNote && (
                  <div className="font-mono text-[11px] text-[#D1D5DB] flex items-center gap-1.5">
                    <span className="text-[#9CA3AF]">
                      {t.fretboard.focusedNoteLabel}:
                    </span>
                    <span className="text-amber-400 font-semibold">
                      {midiToNoteWithOctave(
                        focusedPlayableNote.midi,
                        preferFlats,
                        notation
                      )}
                    </span>
                    {focusedPlayableNote.keyHint && (
                      <span className="text-[#9CA3AF]">
                        [{focusedPlayableNote.keyHint}]
                      </span>
                    )}
                    <span aria-hidden="true" className="text-[#4B5563]">
                      ·
                    </span>
                    <span className="text-[#9CA3AF]">
                      {t.fretboard.stringShort} {focusedPlayableNote.stringNumber},{' '}
                      {t.fretboard.fretShort} {focusedPlayableNote.fret}
                    </span>
                  </div>
                )}
              </div>

              <FretboardCanvas
                rootPitchClass={rootPitchClass}
                scale={scale}
                tuning={tuning}
                fretCount={fretCount}
                displayMode={displayMode}
                wood={wood}
                leftHanded={leftHanded}
                highlightChordTones={highlightChordTones}
                highlightCharacteristic={highlightCharacteristic}
                showOutOfScaleGhost={showOutOfScaleGhost}
                activePosition={activePosition}
                targetChordPitchClasses={effectiveTargetPcs}
                targetChordRootPc={effectiveTargetRoot}
                activeMidiHighlight={activePlaybackMidi}
                focusedNoteId={focusedNoteId}
                externalPluckPulse={externalPluckPulse}
                keyHintMap={keyHintMap}
                showKeyHints={showKeyHints}
                onFocusNote={(noteId) => {
                  setIsFretboardFocused(true);
                  setFocusedNoteId(noteId);
                }}
                onInspectNote={setInspectedNote}
              />

              {/* Clean Unboxed Legend & Tip Bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-[#242730] text-xs text-[#9CA3AF]">
                <div className="flex flex-wrap items-center gap-4">
                  <span className="inline-flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-amber-500 ring-2 ring-amber-500/40 inline-block" />
                    <span className="text-[#E5E7EB]">
                      {activeOverlayChordName
                        ? t.fretboard.chordRoot(activeOverlayChordName)
                        : t.fretboard.scaleRoot}
                    </span>
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-sky-400 inline-block" />
                    <span>
                      {activeOverlayChordName
                        ? t.fretboard.chordTones(activeOverlayChordName)
                        : t.fretboard.targetChordTones}
                    </span>
                  </span>
                  {scale.characterNoteLabel && (
                    <span className="inline-flex items-center gap-1.5">
                      <span className="w-3 h-3 rounded-full bg-rose-400 inline-block" />
                      <span>
                        {t.fretboard.colorTone} ({scale.characterNoteLabel})
                      </span>
                    </span>
                  )}
                  <span className="inline-flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-[#242832] border border-[#CBD5E1] inline-block" />
                    <span>{t.fretboard.availableScaleNotes}</span>
                  </span>
                </div>

                <div className="flex items-center gap-4">
                  <label className="inline-flex items-center gap-1.5 cursor-pointer select-none hover:text-[#E5E7EB]">
                    <input
                      type="checkbox"
                      checked={showOutOfScaleGhost}
                      onChange={(e) => setShowOutOfScaleGhost(e.target.checked)}
                      className="accent-amber-500 rounded cursor-pointer"
                    />
                    <span>{t.fretboard.showChromaticMarkers}</span>
                  </label>
                  <span className="hidden md:inline text-[#6B7280]">
                    {t.fretboard.clickAnyFret}
                  </span>
                </div>
              </div>
            </section>

            {/* Primary Solo Controls: Key, Scale, Tuning, Position Boxes, Display & Neck Setup */}
            <SoloToolbar
              rootPitchClass={rootPitchClass}
              onRootChange={(pc) => {
                setRootPitchClass(pc);
                blurActiveControl();
              }}
              scale={scale}
              onScaleChange={(id) => {
                setScaleId(id);
                setSelectedPositionId(null);
                blurActiveControl();
              }}
              tuning={tuning}
              onTuningChange={(id) => {
                setTuningId(id);
                blurActiveControl();
              }}
              fretCount={fretCount}
              onFretCountChange={setFretCount}
              displayMode={displayMode}
              onDisplayModeChange={setDisplayMode}
              wood={wood}
              onWoodChange={setWood}
              leftHanded={leftHanded}
              onLeftHandedToggle={() => setLeftHanded((v) => !v)}
              highlightChordTones={highlightChordTones}
              onHighlightChordTonesToggle={() => setHighlightChordTones((v) => !v)}
              highlightCharacteristic={highlightCharacteristic}
              onHighlightCharacteristicToggle={() =>
                setHighlightCharacteristic((v) => !v)
              }
              showKeyHints={showKeyHints}
              onShowKeyHintsToggle={() => setShowKeyHints((v) => !v)}
              positions={positions}
              selectedPositionId={selectedPositionId}
              onSelectPositionId={(id) => {
                setSelectedPositionId(id);
                blurActiveControl();
              }}
            />

            {/* Soloing Over Chord Tones + Live Jam Backing Groove */}
            <BackingTrackBar
              rootPitchClass={rootPitchClass}
              scale={scale}
              selectedSoloChord={selectedSoloChord}
              onSelectSoloChord={setSelectedSoloChord}
              onActiveLoopChordChange={handleActiveLoopChordChange}
            />

            {/* Concise Solo Phrasing Insight */}
            <div className="flex flex-wrap items-baseline justify-between gap-3 px-1 text-xs text-[#9CA3AF]">
              <p className="max-w-3xl leading-relaxed">
                <span className="text-[#E5E7EB] font-semibold">
                  {t.fretboard.phrasingGuide}{' '}
                </span>
                {localizedScaleTip}
              </p>
              <button
                type="button"
                onClick={() => setActiveTab('scales')}
                className="text-amber-400 hover:text-amber-300 font-medium whitespace-nowrap"
              >
                {t.fretboard.viewAllBoxDiagrams}
              </button>
            </div>
          </>
        )}

        {activeTab === 'scales' && (
          <ScaleDiagramsView
            rootPitchClass={rootPitchClass}
            onRootChange={setRootPitchClass}
            scale={scale}
            onScaleChange={setScaleId}
            tuning={tuning}
            displayMode={displayMode}
            onDisplayModeChange={setDisplayMode}
            onFocusPositionOnNeck={handleFocusPositionOnNeck}
          />
        )}

        {activeTab === 'chords' && (
          <ChordChartsView
            initialRootPc={rootPitchClass}
            wood={wood}
            leftHanded={leftHanded}
            onImproviseOverScale={handleImproviseOverScale}
          />
        )}

        {activeTab === 'tuner' && (
          <TunerView tuning={tuning} onTuningChange={setTuningId} />
        )}
      </main>
    </div>
  );
}
