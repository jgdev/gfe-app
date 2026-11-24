import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Menu, Play, Square, X } from 'lucide-react';
import {
  DiatonicChord,
  INTERVAL_LABELS,
  getNoteName,
  getScaleById,
  getScalePositions,
  getTuningById,
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

export default function App() {
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
  const [guitarTone, setGuitarTone] = useState<GuitarTone>('electric');

  // Improvisation overlay toggles
  const [highlightChordTones, setHighlightChordTones] = useState<boolean>(true);
  const [highlightCharacteristic, setHighlightCharacteristic] = useState<boolean>(true);
  const [showOutOfScaleGhost, setShowOutOfScaleGhost] = useState<boolean>(false);
  const [selectedPositionId, setSelectedPositionId] = useState<number | null>(null);

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
  const rootName = getNoteName(rootPitchClass, preferFlats);

  const positions = useMemo(
    () => getScalePositions(rootPitchClass, scale, tuning),
    [rootPitchClass, scale, tuning]
  );

  const activePosition = useMemo(
    () => positions.find((p) => p.id === selectedPositionId) ?? null,
    [positions, selectedPositionId]
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
      };
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch {
      // ignore quota/storage errors
    }
  }, [rootPitchClass, scaleId, tuningId, wood, fretCount, leftHanded, displayMode]);

  // Reset single-chord override when key or scale changes
  useEffect(() => {
    setSelectedSoloChord(null);
  }, [rootPitchClass, scaleId]);

  // Close mobile menu on Escape key
  useEffect(() => {
    if (!mobileMenuOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMobileMenuOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mobileMenuOpen]);

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

    // Build a 1-octave + root ascending and descending run starting on the lowest root on string 6 or 5
    const baseMidi = 40 + ((rootPitchClass - 4 + 12) % 12); // E2..Eb3 range
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
  };

  const handleImproviseOverScale = (newRootPc: number, newScaleId: string) => {
    setRootPitchClass(newRootPc);
    setScaleId(newScaleId);
    setSelectedPositionId(null);
    setSelectedSoloChord(null);
    setActiveTab('fretboard');
  };

  // Determine effective target chord pitch classes for the fretboard
  const effectiveTargetPcs =
    loopChordState.pitchClasses ?? selectedSoloChord?.pitchClasses ?? null;
  const effectiveTargetRoot =
    loopChordState.rootPc ?? selectedSoloChord?.rootPitchClass ?? null;
  const activeOverlayChordName =
    loopChordState.label ?? selectedSoloChord?.name ?? null;

  const scaleNotesFormatted = useMemo(
    () =>
      scale.intervals
        .map((i) => getNoteName((rootPitchClass + i) % 12, preferFlats))
        .join(' – '),
    [scale.intervals, rootPitchClass, preferFlats]
  );

  const scaleIntervalsFormatted = useMemo(
    () => scale.intervals.map((i) => INTERVAL_LABELS[i]).join(' · '),
    [scale.intervals]
  );

  const navItems: { id: AppTab; label: string }[] = [
    { id: 'fretboard', label: 'Fretboard' },
    { id: 'scales', label: 'Scales' },
    { id: 'chords', label: 'Chords' },
    { id: 'tuner', label: 'Tuner' },
  ];

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
                  Stop Scale
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-current" />
                  Play Scale
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => setMobileMenuOpen((open) => !open)}
              aria-expanded={mobileMenuOpen}
              aria-controls="mobile-nav-menu"
              aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
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
            className="md:hidden border-t border-[#22252D] bg-[#16181D] px-4 py-2"
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
                        Active
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </nav>
        )}
      </header>

      {/* Main Content Stage */}
      <main className="flex-1 max-w-[1440px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-5">
        {activeTab === 'fretboard' && (
          <>
            {/* Compact Solo Header & Live Note Inspector */}
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div className="space-y-1">
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white font-display">
                  {rootName} {scale.name}
                  {activeOverlayChordName ? ` over ${activeOverlayChordName}` : ''}
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
                      ? `${activePosition.name} (${activePosition.cagedShape}, Frets ${activePosition.startFret}–${activePosition.endFret})`
                      : `Full Neck (0–${fretCount} Frets)`}
                  </span>
                  <span aria-hidden="true">·</span>
                  <span>{tuning.shortLabel}</span>
                </div>
              </div>

              {/* Right: Guitar Voice Selector & Last Plucked Note Readout */}
              <div className="flex flex-wrap items-center gap-4">
                {inspectedNote && (
                  <div className="text-xs font-mono tabular-nums text-[#D1D5DB] flex items-center gap-2">
                    <span className="text-amber-400 font-bold text-sm">
                      {inspectedNote.noteWithOctave}
                    </span>
                    <span aria-hidden="true" className="text-[#4B5563]">
                      ·
                    </span>
                    <span>{inspectedNote.frequency.toFixed(1)} Hz</span>
                    <span aria-hidden="true" className="text-[#4B5563]">
                      ·
                    </span>
                    <span>
                      {inspectedNote.intervalFull} ({inspectedNote.intervalShort})
                    </span>
                    <span aria-hidden="true" className="text-[#4B5563]">
                      ·
                    </span>
                    <span className="text-[#9CA3AF]">
                      Str {inspectedNote.stringNumber}, Fr {inspectedNote.fret}
                    </span>
                  </div>
                )}

                <div className="inline-flex items-center gap-1 bg-[#181A1F] p-1 rounded-lg border border-[#272A32]">
                  {(
                    [
                      { id: 'electric', label: 'Electric' },
                      { id: 'acoustic', label: 'Acoustic' },
                      { id: 'nylon', label: 'Nylon' },
                    ] as const
                  ).map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => handleToneChange(t.id)}
                      className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${
                        guitarTone === t.id
                          ? 'bg-[#2A2E38] text-white'
                          : 'text-[#9CA3AF] hover:text-white'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Dominant Visual Anchor: Full-Neck Interactive Fretboard */}
            <section
              aria-label="Full neck guitar fretboard"
              className="bg-[#181A1F] border border-[#272A32] rounded-xl px-3 sm:px-5 pt-4 pb-3 space-y-3"
            >
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
                onInspectNote={setInspectedNote}
              />

              {/* Clean Unboxed Legend & Tip Bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-[#242730] text-xs text-[#9CA3AF]">
                <div className="flex flex-wrap items-center gap-4">
                  <span className="inline-flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-amber-500 ring-2 ring-amber-500/40 inline-block" />
                    <span className="text-[#E5E7EB]">
                      {activeOverlayChordName ? `${activeOverlayChordName} Root` : 'Scale Root'}
                    </span>
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-sky-400 inline-block" />
                    <span>
                      {activeOverlayChordName ? `${activeOverlayChordName} Chord Tones` : 'Target Chord Tones'}
                    </span>
                  </span>
                  {scale.characterNoteLabel && (
                    <span className="inline-flex items-center gap-1.5">
                      <span className="w-3 h-3 rounded-full bg-rose-400 inline-block" />
                      <span>Color Tone ({scale.characterNoteLabel})</span>
                    </span>
                  )}
                  <span className="inline-flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-[#242832] border border-[#CBD5E1] inline-block" />
                    <span>Available Scale Notes</span>
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
                    <span>Show chromatic markers</span>
                  </label>
                  <span className="hidden md:inline text-[#6B7280]">
                    Click any fret to hear pitch
                  </span>
                </div>
              </div>
            </section>

            {/* Primary Solo Controls: Key, Scale, Tuning, Position Boxes, Display & Neck Setup */}
            <SoloToolbar
              rootPitchClass={rootPitchClass}
              onRootChange={setRootPitchClass}
              scale={scale}
              onScaleChange={(id) => {
                setScaleId(id);
                setSelectedPositionId(null);
              }}
              tuning={tuning}
              onTuningChange={setTuningId}
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
              onHighlightCharacteristicToggle={() => setHighlightCharacteristic((v) => !v)}
              positions={positions}
              selectedPositionId={selectedPositionId}
              onSelectPositionId={setSelectedPositionId}
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
                <span className="text-[#E5E7EB] font-semibold">Phrasing guide: </span>
                {scale.soloTip}
              </p>
              <button
                type="button"
                onClick={() => setActiveTab('scales')}
                className="text-amber-400 hover:text-amber-300 font-medium whitespace-nowrap"
              >
                View all 5 box diagrams →
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
