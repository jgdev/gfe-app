import React from 'react';
import {
  GuitarTuning,
  SCALES,
  ScaleCategory,
  ScaleDefinition,
  ScalePositionWindow,
  TUNINGS,
  getKeyDisplayNames,
} from '../music/theory';
import { FretboardWood, NoteDisplayMode } from './FretboardCanvas';
import { FlipHorizontal2, Keyboard } from 'lucide-react';
import { useI18n } from '../i18n/I18nContext';

interface SoloToolbarProps {
  rootPitchClass: number;
  onRootChange: (pc: number) => void;
  scale: ScaleDefinition;
  onScaleChange: (scaleId: string) => void;
  tuning: GuitarTuning;
  onTuningChange: (tuningId: string) => void;
  fretCount: 12 | 15 | 22;
  onFretCountChange: (count: 12 | 15 | 22) => void;
  displayMode: NoteDisplayMode;
  onDisplayModeChange: (mode: NoteDisplayMode) => void;
  wood: FretboardWood;
  onWoodChange: (wood: FretboardWood) => void;
  leftHanded: boolean;
  onLeftHandedToggle: () => void;
  highlightChordTones: boolean;
  onHighlightChordTonesToggle: () => void;
  highlightCharacteristic: boolean;
  onHighlightCharacteristicToggle: () => void;
  showKeyHints: boolean;
  onShowKeyHintsToggle: () => void;
  positions: ScalePositionWindow[];
  selectedPositionId: number | null; // null = Full Neck
  onSelectPositionId: (id: number | null) => void;
}

const SCALE_CATEGORIES: ScaleCategory[] = [
  'Pentatonic & Blues',
  'Modes',
  'Minor & Jazz',
  'Exotic',
];

export const SoloToolbar: React.FC<SoloToolbarProps> = ({
  rootPitchClass,
  onRootChange,
  scale,
  onScaleChange,
  tuning,
  onTuningChange,
  fretCount,
  onFretCountChange,
  displayMode,
  onDisplayModeChange,
  wood,
  onWoodChange,
  leftHanded,
  onLeftHandedToggle,
  highlightChordTones,
  onHighlightChordTonesToggle,
  highlightCharacteristic,
  onHighlightCharacteristicToggle,
  showKeyHints,
  onShowKeyHintsToggle,
  positions,
  selectedPositionId,
  onSelectPositionId,
}) => {
  const { t, notation } = useI18n();
  const keyNames = getKeyDisplayNames(notation);

  return (
    <div className="bg-[#181A1F] border border-[#272A32] rounded-xl p-4 sm:p-5 space-y-4">
      {/* Row 1: Root Key Strip + Scale Selector + Tuning Selector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-end">
        {/* Root Key Selector (12 chromatic keys) */}
        <div className="lg:col-span-5">
          <label className="block text-xs font-medium text-[#9CA3AF] mb-2">
            {t.toolbar.keyCenter}
          </label>
          <div className="grid grid-cols-6 sm:grid-cols-12 gap-1 bg-[#111214] p-1 rounded-lg border border-[#252830]">
            {keyNames.map((keyName, idx) => {
              const active = idx === rootPitchClass;
              return (
                <button
                  key={`${idx}-${keyName}`}
                  type="button"
                  onClick={() => onRootChange(idx)}
                  className={`h-9 rounded-md font-mono font-semibold transition-colors whitespace-nowrap ${
                    notation === 'solfege' ? 'text-[11px]' : 'text-xs'
                  } ${
                    active
                      ? 'bg-amber-500 text-[#111214]'
                      : 'text-[#D1D5DB] hover:bg-[#22252C] hover:text-white'
                  }`}
                >
                  {keyName}
                </button>
              );
            })}
          </div>
        </div>

        {/* Scale Selector */}
        <div className="lg:col-span-4">
          <label
            htmlFor="scale-select"
            className="block text-xs font-medium text-[#9CA3AF] mb-2"
          >
            {t.toolbar.scaleMode}
          </label>
          <select
            id="scale-select"
            value={scale.id}
            onChange={(e) => onScaleChange(e.target.value)}
            className="w-full h-[46px] px-3.5 rounded-lg bg-[#111214] border border-[#2A2D36] text-sm font-medium text-[#F3F4F6] focus:outline-none focus:border-amber-500 transition-colors"
          >
            {SCALE_CATEGORIES.map((cat) => (
              <optgroup
                key={cat}
                label={t.scaleCategories[cat] ?? cat}
                className="bg-[#181A1F] text-[#9CA3AF]"
              >
                {SCALES.filter((s) => s.category === cat).map((s) => (
                  <option key={s.id} value={s.id} className="bg-[#181A1F] text-[#F3F4F6]">
                    {t.scaleNames[s.id] ?? s.name}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>

        {/* Guitar Tuning Selector */}
        <div className="lg:col-span-3">
          <label
            htmlFor="tuning-select"
            className="block text-xs font-medium text-[#9CA3AF] mb-2"
          >
            {t.toolbar.tuning}
          </label>
          <select
            id="tuning-select"
            value={tuning.id}
            onChange={(e) => onTuningChange(e.target.value)}
            className="w-full h-[46px] px-3.5 rounded-lg bg-[#111214] border border-[#2A2D36] text-sm font-medium text-[#F3F4F6] focus:outline-none focus:border-amber-500 transition-colors"
          >
            {TUNINGS.map((tun) => (
              <option key={tun.id} value={tun.id} className="bg-[#181A1F] text-[#F3F4F6]">
                {tun.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-[#242730]" />

      {/* Row 2: Neck Position Filter + Note Labels + Improvisation Target Toggles + Neck Appearance */}
      <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
        {/* Neck Coverage / 5 Positions */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium text-[#9CA3AF] whitespace-nowrap">
            {t.toolbar.neckZone}
          </span>
          <div className="inline-flex items-center gap-1 bg-[#111214] p-1 rounded-lg border border-[#252830]">
            <button
              type="button"
              onClick={() => onSelectPositionId(null)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                selectedPositionId === null
                  ? 'bg-[#2A2E38] text-white'
                  : 'text-[#9CA3AF] hover:text-white'
              }`}
            >
              {t.toolbar.fullNeck}
            </button>
            {positions.map((pos) => (
              <button
                key={pos.id}
                type="button"
                onClick={() => onSelectPositionId(pos.id)}
                title={`${t.scalesView.positionLabel(pos.id)} (${pos.cagedShape}, ${t.fretboard.fretsRange(pos.startFret, pos.endFret)})`}
                className={`px-2.5 py-1.5 rounded-md font-mono text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                  selectedPositionId === pos.id
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                    : 'text-[#9CA3AF] hover:text-white'
                }`}
              >
                {t.toolbar.posShort(pos.id)}
              </button>
            ))}
          </div>
        </div>

        {/* Display Labels + Improvisation Overlays */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Note / Interval / Degree Toggle */}
          <div className="inline-flex items-center gap-1 bg-[#111214] p-1 rounded-lg border border-[#252830]">
            {(
              [
                { id: 'notes', label: t.toolbar.notes },
                { id: 'intervals', label: t.toolbar.intervals },
                { id: 'degrees', label: t.toolbar.degrees },
              ] as const
            ).map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => onDisplayModeChange(opt.id)}
                className={`px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                  displayMode === opt.id
                    ? 'bg-[#2A2E38] text-white'
                    : 'text-[#9CA3AF] hover:text-white'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {/* Target Chord Tones Toggle */}
          <button
            type="button"
            onClick={onHighlightChordTonesToggle}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors whitespace-nowrap shrink-0 ${
              highlightChordTones
                ? 'bg-sky-500/15 border-sky-400/50 text-sky-300'
                : 'bg-[#111214] border-[#252830] text-[#9CA3AF] hover:text-white'
            }`}
          >
            {t.toolbar.targetChordTones}
          </button>

          {/* Characteristic Color Tone Toggle */}
          {scale.characterNoteLabel && (
            <button
              type="button"
              onClick={onHighlightCharacteristicToggle}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors whitespace-nowrap shrink-0 ${
                highlightCharacteristic
                  ? 'bg-rose-500/15 border-rose-400/50 text-rose-300'
                  : 'bg-[#111214] border-[#252830] text-[#9CA3AF] hover:text-white'
              }`}
            >
              {t.toolbar.colorToneBtn(scale.characterNoteLabel)}
            </button>
          )}

          {/* Keyboard Hints (Q–M) Toggle */}
          <button
            type="button"
            onClick={onShowKeyHintsToggle}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors whitespace-nowrap shrink-0 ${
              showKeyHints
                ? 'bg-amber-500/15 border-amber-500/45 text-amber-300'
                : 'bg-[#111214] border-[#252830] text-[#9CA3AF] hover:text-white'
            }`}
          >
            <Keyboard className="w-3.5 h-3.5" />
            {t.toolbar.keyHints}
          </button>

          {/* Fret Span Selector */}
          <div className="inline-flex items-center gap-1 bg-[#111214] p-1 rounded-lg border border-[#252830]">
            {([12, 15, 22] as const).map((cnt) => (
              <button
                key={cnt}
                type="button"
                onClick={() => onFretCountChange(cnt)}
                className={`px-2 py-1.5 rounded-md font-mono text-xs transition-colors whitespace-nowrap shrink-0 ${
                  fretCount === cnt
                    ? 'bg-[#2A2E38] text-white'
                    : 'text-[#9CA3AF] hover:text-white'
                }`}
              >
                {cnt}f
              </button>
            ))}
          </div>

          {/* Wood Material Selector */}
          <div className="inline-flex items-center gap-1 bg-[#111214] p-1 rounded-lg border border-[#252830]">
            {(
              [
                { id: 'rosewood', label: t.toolbar.rosewood },
                { id: 'ebony', label: t.toolbar.ebony },
                { id: 'maple', label: t.toolbar.maple },
              ] as const
            ).map((w) => (
              <button
                key={w.id}
                type="button"
                onClick={() => onWoodChange(w.id)}
                className={`px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                  wood === w.id
                    ? 'bg-[#2A2E38] text-white'
                    : 'text-[#9CA3AF] hover:text-white'
                }`}
              >
                {w.label}
              </button>
            ))}
          </div>

          {/* Left-Handed Flip */}
          <button
            type="button"
            onClick={onLeftHandedToggle}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors whitespace-nowrap shrink-0 ${
              leftHanded
                ? 'bg-amber-500/15 border-amber-500/40 text-amber-300'
                : 'bg-[#111214] border-[#252830] text-[#9CA3AF] hover:text-white'
            }`}
          >
            <FlipHorizontal2 className="w-3.5 h-3.5" />
            {t.toolbar.leftHanded}
          </button>
        </div>
      </div>
    </div>
  );
};
