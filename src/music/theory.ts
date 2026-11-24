export interface NoteSpelling {
  pitchClass: number; // 0 = C, 1 = C#/Db, ..., 11 = B
  sharp: string;
  flat: string;
  label: string;
}

export const CHROMATIC_NOTES: NoteSpelling[] = [
  { pitchClass: 0, sharp: 'C', flat: 'C', label: 'C' },
  { pitchClass: 1, sharp: 'C#', flat: 'Db', label: 'C# / Db' },
  { pitchClass: 2, sharp: 'D', flat: 'D', label: 'D' },
  { pitchClass: 3, sharp: 'D#', flat: 'Eb', label: 'Eb' },
  { pitchClass: 4, sharp: 'E', flat: 'E', label: 'E' },
  { pitchClass: 5, sharp: 'F', flat: 'F', label: 'F' },
  { pitchClass: 6, sharp: 'F#', flat: 'Gb', label: 'F# / Gb' },
  { pitchClass: 7, sharp: 'G', flat: 'G', label: 'G' },
  { pitchClass: 8, sharp: 'G#', flat: 'Ab', label: 'Ab' },
  { pitchClass: 9, sharp: 'A', flat: 'A', label: 'A' },
  { pitchClass: 10, sharp: 'A#', flat: 'Bb', label: 'Bb' },
  { pitchClass: 11, sharp: 'B', flat: 'B', label: 'B' },
];

export const KEY_DISPLAY_NAMES = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'];

// Keys that conventionally prefer flat spelling
const FLAT_PREF_ROOTS = new Set([1, 3, 5, 8, 10]);

export function getNoteName(pitchClass: number, preferFlats = false): string {
  const pc = ((pitchClass % 12) + 12) % 12;
  return preferFlats ? CHROMATIC_NOTES[pc].flat : CHROMATIC_NOTES[pc].sharp;
}

export function shouldUseFlats(rootPitchClass: number, scaleId: string): boolean {
  const minorScales = new Set([
    'minor_pentatonic',
    'blues',
    'aeolian',
    'dorian',
    'phrygian',
    'locrian',
    'harmonic_minor',
    'melodic_minor',
    'hungarian_minor',
    'hirajoshi',
  ]);
  if (minorScales.has(rootPitchClass === 9 ? '' : scaleId)) {
    // Minor keys with flats: C(0), D(2), F(5), G(7), Bb(10), Eb(3), Ab(8), Db(1)
    return [0, 1, 2, 3, 5, 7, 8, 10].includes(rootPitchClass);
  }
  return FLAT_PREF_ROOTS.has(rootPitchClass);
}

export function midiToFrequency(midi: number, a4 = 440): number {
  return a4 * Math.pow(2, (midi - 69) / 12);
}

export function midiToNoteWithOctave(midi: number, preferFlats = false): string {
  const pc = ((midi % 12) + 12) % 12;
  const octave = Math.floor(midi / 12) - 1;
  return `${getNoteName(pc, preferFlats)}${octave}`;
}

export const INTERVAL_LABELS: Record<number, string> = {
  0: 'R',
  1: 'b2',
  2: '2',
  3: 'b3',
  4: '3',
  5: '4',
  6: 'b5',
  7: '5',
  8: 'b6',
  9: '6',
  10: 'b7',
  11: '7',
};

export const INTERVAL_FULL_NAMES: Record<number, string> = {
  0: 'Root',
  1: 'Minor 2nd',
  2: 'Major 2nd',
  3: 'Minor 3rd',
  4: 'Major 3rd',
  5: 'Perfect 4th',
  6: 'Tritone / b5',
  7: 'Perfect 5th',
  8: 'Minor 6th',
  9: 'Major 6th',
  10: 'Minor 7th',
  11: 'Major 7th',
};

export type ScaleCategory = 'Pentatonic & Blues' | 'Modes' | 'Minor & Jazz' | 'Exotic';

export interface ScaleDefinition {
  id: string;
  name: string;
  shortName: string;
  category: ScaleCategory;
  intervals: number[]; // Semitones from root (0..11)
  chordTones: number[]; // Core landing intervals inside the scale (e.g. R, b3, 5, b7)
  characteristicInterval?: number; // Signature color tone (e.g., 9 for Dorian, 6 for Lydian/Blues)
  characterNoteLabel?: string;
  mood: string;
  soloTip: string;
  defaultChordQuality: 'major' | 'minor' | 'dominant7' | 'minor7' | 'maj7' | 'dim';
}

export const SCALES: ScaleDefinition[] = [
  {
    id: 'minor_pentatonic',
    name: 'Minor Pentatonic',
    shortName: 'Min Pent',
    category: 'Pentatonic & Blues',
    intervals: [0, 3, 5, 7, 10],
    chordTones: [0, 3, 7, 10],
    characteristicInterval: 3,
    characterNoteLabel: 'b3',
    mood: 'Rock, blues, soul, versatile lead foundation',
    soloTip: 'Bend the 4th up a whole step to the 5th, and resolve phrases cleanly to the Root or b3.',
    defaultChordQuality: 'minor7',
  },
  {
    id: 'major_pentatonic',
    name: 'Major Pentatonic',
    shortName: 'Maj Pent',
    category: 'Pentatonic & Blues',
    intervals: [0, 2, 4, 7, 9],
    chordTones: [0, 4, 7],
    characteristicInterval: 9,
    characterNoteLabel: '6',
    mood: 'Bright, country, classic rock, melodic anthem',
    soloTip: 'Slide from the 2nd into the Major 3rd for vocal phrasing; lean on the 6th for warm lift.',
    defaultChordQuality: 'major',
  },
  {
    id: 'blues',
    name: 'Minor Blues',
    shortName: 'Blues',
    category: 'Pentatonic & Blues',
    intervals: [0, 3, 5, 6, 7, 10],
    chordTones: [0, 3, 7, 10],
    characteristicInterval: 6,
    characterNoteLabel: 'b5 (Blue Note)',
    mood: 'Gritty, vocal, expressive blues & rock soloing',
    soloTip: 'Use the b5 as a chromatic passing bridge between the 4th and 5th rather than resting on it.',
    defaultChordQuality: 'dominant7',
  },
  {
    id: 'major_blues',
    name: 'Major Blues',
    shortName: 'Maj Blues',
    category: 'Pentatonic & Blues',
    intervals: [0, 2, 3, 4, 7, 9],
    chordTones: [0, 4, 7],
    characteristicInterval: 3,
    characterNoteLabel: 'b3 → 3',
    mood: 'Sweet BB King / Allman Brothers major phrasing',
    soloTip: 'Hammer quickly from the b3 into the Major 3rd over I7 and IV7 chords.',
    defaultChordQuality: 'dominant7',
  },
  {
    id: 'ionian',
    name: 'Major (Ionian)',
    shortName: 'Major',
    category: 'Modes',
    intervals: [0, 2, 4, 5, 7, 9, 11],
    chordTones: [0, 4, 7, 11],
    characteristicInterval: 11,
    characterNoteLabel: '7',
    mood: 'Open, resolved, pop, diatonic major',
    soloTip: 'Target the Major 3rd and 7th on strong beats; treat the 4th as a gentle passing tone over I.',
    defaultChordQuality: 'maj7',
  },
  {
    id: 'aeolian',
    name: 'Natural Minor (Aeolian)',
    shortName: 'Nat Minor',
    category: 'Modes',
    intervals: [0, 2, 3, 5, 7, 8, 10],
    chordTones: [0, 3, 7, 10],
    characteristicInterval: 8,
    characterNoteLabel: 'b6',
    mood: 'Expressive, dramatic, rock ballads & metal',
    soloTip: 'Emphasize the poignant half-step pull from the b6 down to the 5th.',
    defaultChordQuality: 'minor7',
  },
  {
    id: 'dorian',
    name: 'Dorian',
    shortName: 'Dorian',
    category: 'Modes',
    intervals: [0, 2, 3, 5, 7, 9, 10],
    chordTones: [0, 3, 7, 10],
    characteristicInterval: 9,
    characterNoteLabel: 'Nat 6',
    mood: 'Funk, Santana rock, fusion, soulful minor',
    soloTip: 'Highlight the natural 6th against the minor 3rd over a i7–IV7 vamp to bring out the Dorian sparkle.',
    defaultChordQuality: 'minor7',
  },
  {
    id: 'mixolydian',
    name: 'Mixolydian',
    shortName: 'Mixolydian',
    category: 'Modes',
    intervals: [0, 2, 4, 5, 7, 9, 10],
    chordTones: [0, 4, 7, 10],
    characteristicInterval: 10,
    characterNoteLabel: 'b7',
    mood: 'Classic rock, jam band, funk & dominant 7th grooves',
    soloTip: 'Combine the Major 3rd with the flat 7th for swaggering dominant 7th lines.',
    defaultChordQuality: 'dominant7',
  },
  {
    id: 'lydian',
    name: 'Lydian',
    shortName: 'Lydian',
    category: 'Modes',
    intervals: [0, 2, 4, 6, 7, 9, 11],
    chordTones: [0, 4, 7, 11],
    characteristicInterval: 6,
    characterNoteLabel: '#4',
    mood: 'Dreamy, cinematic, floating Satriani / Vai vibe',
    soloTip: 'Linger on the #4 (raised fourth) over a Maj7 chord—unlike Ionian, it never clashes.',
    defaultChordQuality: 'maj7',
  },
  {
    id: 'phrygian',
    name: 'Phrygian',
    shortName: 'Phrygian',
    category: 'Modes',
    intervals: [0, 1, 3, 5, 7, 8, 10],
    chordTones: [0, 3, 7, 10],
    characteristicInterval: 1,
    characterNoteLabel: 'b2',
    mood: 'Dark, flamenco, heavy metal tension',
    soloTip: 'Pivot repeatedly between the b2 and Root using fast pull-offs for instant Iberian drama.',
    defaultChordQuality: 'minor',
  },
  {
    id: 'locrian',
    name: 'Locrian',
    shortName: 'Locrian',
    category: 'Modes',
    intervals: [0, 1, 3, 5, 6, 8, 10],
    chordTones: [0, 3, 6, 10],
    characteristicInterval: 6,
    characterNoteLabel: 'b5',
    mood: 'Unstable, dark jazz m7b5 & progressive metal',
    soloTip: 'Outline the half-diminished arpeggio (R, b3, b5, b7) before resolving to the next key center.',
    defaultChordQuality: 'dim',
  },
  {
    id: 'harmonic_minor',
    name: 'Harmonic Minor',
    shortName: 'Harm Min',
    category: 'Minor & Jazz',
    intervals: [0, 2, 3, 5, 7, 8, 11],
    chordTones: [0, 3, 7, 11],
    characteristicInterval: 11,
    characterNoteLabel: 'Nat 7',
    mood: 'Neoclassical shred, gypsy jazz, dramatic minor',
    soloTip: 'Exploit the exotic 3-semitone leap between b6 and Major 7th over V7 → i turnarounds.',
    defaultChordQuality: 'minor',
  },
  {
    id: 'melodic_minor',
    name: 'Melodic Minor',
    shortName: 'Mel Min',
    category: 'Minor & Jazz',
    intervals: [0, 2, 3, 5, 7, 9, 11],
    chordTones: [0, 3, 7, 11],
    characteristicInterval: 11,
    characterNoteLabel: '6 & 7',
    mood: 'Modern jazz, fusion, sophisticated minor-major',
    soloTip: 'Pair the minor 3rd with the bright natural 6th and major 7th for smooth fusion runs.',
    defaultChordQuality: 'minor',
  },
  {
    id: 'phrygian_dominant',
    name: 'Phrygian Dominant',
    shortName: 'Phryg Dom',
    category: 'Minor & Jazz',
    intervals: [0, 1, 4, 5, 7, 8, 10],
    chordTones: [0, 4, 7, 10],
    characteristicInterval: 1,
    characterNoteLabel: 'b2 & 3',
    mood: 'Spanish flamenco, Middle Eastern, V7b9 metal',
    soloTip: 'Contrast the Major 3rd with the b2 and b6 over a static major or dominant 7th drone.',
    defaultChordQuality: 'dominant7',
  },
  {
    id: 'lydian_dominant',
    name: 'Lydian Dominant',
    shortName: 'Lyd Dom',
    category: 'Minor & Jazz',
    intervals: [0, 2, 4, 6, 7, 9, 10],
    chordTones: [0, 4, 7, 10],
    characteristicInterval: 6,
    characterNoteLabel: '#4 & b7',
    mood: 'Modern jazz, Simpsons theme, non-resolving 7#11',
    soloTip: 'Use over tritone-sub dominant chords and IV7 chords in blues-jazz solos.',
    defaultChordQuality: 'dominant7',
  },
  {
    id: 'altered',
    name: 'Altered (Super Locrian)',
    shortName: 'Altered',
    category: 'Minor & Jazz',
    intervals: [0, 1, 3, 4, 6, 8, 10],
    chordTones: [0, 4, 10],
    characteristicInterval: 3,
    characterNoteLabel: 'b9/#9/#11/b13',
    mood: 'Maximum jazz tension resolving to tonic',
    soloTip: 'Think melodic minor a half-step up from the V7 root, resolving smoothly into the I chord.',
    defaultChordQuality: 'dominant7',
  },
  {
    id: 'hungarian_minor',
    name: 'Hungarian Minor',
    shortName: 'Hungarian',
    category: 'Exotic',
    intervals: [0, 2, 3, 6, 7, 8, 11],
    chordTones: [0, 3, 7, 11],
    characteristicInterval: 6,
    characterNoteLabel: '#4 & 7',
    mood: 'Gothic, Eastern European, dramatic twin augmented 2nds',
    soloTip: 'Slide through both augmented 2nd gaps (b3–#4 and b6–7) for dramatic phrasing.',
    defaultChordQuality: 'minor',
  },
  {
    id: 'hirajoshi',
    name: 'Hirajoshi',
    shortName: 'Hirajoshi',
    category: 'Exotic',
    intervals: [0, 2, 3, 7, 8],
    chordTones: [0, 3, 7],
    characteristicInterval: 8,
    characterNoteLabel: 'b6',
    mood: 'Contemplative Japanese pentatonic, ambient rock',
    soloTip: 'Let wide 4-semitone intervals ring across adjacent strings with gentle vibrato.',
    defaultChordQuality: 'minor',
  },
];

export function getScaleById(id: string): ScaleDefinition {
  return SCALES.find((s) => s.id === id) ?? SCALES[0];
}

export interface GuitarTuning {
  id: string;
  name: string;
  shortLabel: string;
  // Ordered from String 6 (Low / Thickest) to String 1 (High / Thinnest)
  midiNotes: [number, number, number, number, number, number];
}

export const TUNINGS: GuitarTuning[] = [
  {
    id: 'standard',
    name: 'Standard (E A D G B E)',
    shortLabel: 'E Standard',
    midiNotes: [40, 45, 50, 55, 59, 64],
  },
  {
    id: 'drop_d',
    name: 'Drop D (D A D G B E)',
    shortLabel: 'Drop D',
    midiNotes: [38, 45, 50, 55, 59, 64],
  },
  {
    id: 'eb_standard',
    name: 'Half-Step Down (Eb Ab Db Gb Bb Eb)',
    shortLabel: 'Eb Standard',
    midiNotes: [39, 44, 49, 54, 58, 63],
  },
  {
    id: 'd_standard',
    name: 'D Standard (D G C F A D)',
    shortLabel: 'D Standard',
    midiNotes: [38, 43, 48, 53, 57, 62],
  },
  {
    id: 'dadgad',
    name: 'DADGAD (D A D G A D)',
    shortLabel: 'DADGAD',
    midiNotes: [38, 45, 50, 55, 57, 62],
  },
  {
    id: 'open_g',
    name: 'Open G (D G D G B D)',
    shortLabel: 'Open G',
    midiNotes: [38, 43, 50, 55, 59, 62],
  },
  {
    id: 'open_d',
    name: 'Open D (D A D F# A D)',
    shortLabel: 'Open D',
    midiNotes: [38, 45, 50, 54, 57, 62],
  },
];

export function getTuningById(id: string): GuitarTuning {
  return TUNINGS.find((t) => t.id === id) ?? TUNINGS[0];
}

export function getScaleStepFormula(intervals: number[]): string {
  const extended = [...intervals, 12];
  const steps: string[] = [];
  for (let i = 0; i < intervals.length; i++) {
    const diff = extended[i + 1] - extended[i];
    if (diff === 1) steps.push('H');
    else if (diff === 2) steps.push('W');
    else if (diff === 3) steps.push('W+H');
    else steps.push(`${diff}st`);
  }
  return steps.join(' – ');
}

export interface DiatonicChord {
  degreeNumeral: string;
  rootPitchClass: number;
  name: string;
  quality: string;
  pitchClasses: number[]; // Triad or 7th pitch classes
  role: 'Tonic' | 'Subdominant' | 'Dominant' | 'Color';
}

export function getDiatonicChordsForScale(
  rootPitchClass: number,
  scale: ScaleDefinition
): DiatonicChord[] {
  const preferFlats = shouldUseFlats(rootPitchClass, scale.id);
  const intervals = scale.intervals;

  // For 7-note scales, harmonize triads & 7ths directly from scale degrees
  if (intervals.length === 7) {
    const romans = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII'];
    return intervals.map((rootInt, idx) => {
      const thirdInt = intervals[(idx + 2) % 7];
      const fifthInt = intervals[(idx + 4) % 7];
      const seventhInt = intervals[(idx + 6) % 7];

      const d3 = (thirdInt - rootInt + 12) % 12;
      const d5 = (fifthInt - rootInt + 12) % 12;
      const d7 = (seventhInt - rootInt + 12) % 12;

      let quality = '';
      let numeral = romans[idx];

      if (d3 === 4 && d5 === 7) {
        quality = d7 === 11 ? 'maj7' : d7 === 10 ? '7' : '';
      } else if (d3 === 3 && d5 === 7) {
        numeral = numeral.toLowerCase();
        quality = d7 === 10 ? 'm7' : d7 === 11 ? 'mMaj7' : 'm';
      } else if (d3 === 3 && d5 === 6) {
        numeral = `${numeral.toLowerCase()}°`;
        quality = d7 === 10 ? 'm7b5' : 'dim7';
      } else if (d3 === 4 && d5 === 8) {
        numeral = `${numeral}+`;
        quality = 'aug';
      } else {
        quality = d3 === 3 ? 'm' : '';
        if (d3 === 3) numeral = numeral.toLowerCase();
      }

      const chordRootPc = (rootPitchClass + rootInt) % 12;
      const noteName = getNoteName(chordRootPc, preferFlats);
      const role: DiatonicChord['role'] =
        idx === 0 ? 'Tonic' : idx === 3 || idx === 1 ? 'Subdominant' : idx === 4 || idx === 6 ? 'Dominant' : 'Color';

      return {
        degreeNumeral: numeral,
        rootPitchClass: chordRootPc,
        name: `${noteName}${quality}`,
        quality,
        pitchClasses: [
          chordRootPc,
          (rootPitchClass + thirdInt) % 12,
          (rootPitchClass + fifthInt) % 12,
          (rootPitchClass + seventhInt) % 12,
        ],
        role,
      };
    });
  }

  // For pentatonic / blues / 5-6 note scales, build practical soloing accompaniment chords
  const isMajorFeel = scale.intervals.includes(4);
  const templates = isMajorFeel
    ? [
        { numeral: 'I', offset: 0, quality: '', pcs: [0, 4, 7], role: 'Tonic' as const },
        { numeral: 'IV', offset: 5, quality: '', pcs: [5, 9, 0], role: 'Subdominant' as const },
        { numeral: 'V7', offset: 7, quality: '7', pcs: [7, 11, 2, 5], role: 'Dominant' as const },
        { numeral: 'vi', offset: 9, quality: 'm7', pcs: [9, 0, 4, 7], role: 'Color' as const },
        { numeral: 'ii', offset: 2, quality: 'm7', pcs: [2, 5, 9, 0], role: 'Subdominant' as const },
      ]
    : [
        { numeral: 'i', offset: 0, quality: 'm7', pcs: [0, 3, 7, 10], role: 'Tonic' as const },
        { numeral: 'iv', offset: 5, quality: 'm7', pcs: [5, 8, 0, 3], role: 'Subdominant' as const },
        { numeral: 'v', offset: 7, quality: 'm7', pcs: [7, 10, 2, 5], role: 'Dominant' as const },
        { numeral: 'bVI', offset: 8, quality: 'maj7', pcs: [8, 0, 3, 7], role: 'Color' as const },
        { numeral: 'bVII', offset: 10, quality: '7', pcs: [10, 2, 5, 8], role: 'Dominant' as const },
        { numeral: 'I7', offset: 0, quality: '7', pcs: [0, 4, 7, 10], role: 'Tonic' as const },
      ];

  return templates.map((t) => {
    const chordRootPc = (rootPitchClass + t.offset) % 12;
    return {
      degreeNumeral: t.numeral,
      rootPitchClass: chordRootPc,
      name: `${getNoteName(chordRootPc, preferFlats)}${t.quality}`,
      quality: t.quality,
      pitchClasses: t.pcs.map((p) => (rootPitchClass + p) % 12),
      role: t.role,
    };
  });
}

export interface ScalePositionWindow {
  id: number; // 1..5
  name: string;
  cagedShape: string;
  startFret: number;
  endFret: number;
  // Also include the +12 octave twin so positions work across the full 22-fret neck
  octaveStartFret?: number;
  octaveEndFret?: number;
}

/**
 * Computes 5 ergonomic neck box positions (covering the full 12-fret octave)
 * anchored to the root pitch class on the 6th string.
 */
export function getScalePositions(
  rootPitchClass: number,
  scale: ScaleDefinition,
  tuning: GuitarTuning
): ScalePositionWindow[] {
  const lowStringPc = tuning.midiNotes[0] % 12;
  const baseRootFret = (rootPitchClass - lowStringPc + 12) % 12;

  const isMinor = scale.intervals.includes(3) && !scale.intervals.includes(4);
  // 5 box offsets across one octave along the 6th string
  const boxSpecs = isMinor
    ? [
        { id: 1, caged: 'Em Shape', offset: 0, span: 4 },
        { id: 2, caged: 'Dm Shape', offset: 2, span: 4 },
        { id: 3, caged: 'Cm Shape', offset: 5, span: 4 },
        { id: 4, caged: 'Am Shape', offset: 7, span: 4 },
        { id: 5, caged: 'Gm Shape', offset: 9, span: 4 },
      ]
    : [
        { id: 1, caged: 'E Shape', offset: -1, span: 4 },
        { id: 2, caged: 'D Shape', offset: 1, span: 4 },
        { id: 3, caged: 'C Shape', offset: 4, span: 4 },
        { id: 4, caged: 'A Shape', offset: 6, span: 4 },
        { id: 5, caged: 'G Shape', offset: 9, span: 4 },
      ];

  return boxSpecs.map((spec) => {
    let start = (baseRootFret + spec.offset + 12) % 12;
    // Keep position 1 comfortably playable without cutting off negative frets
    if (start === 11 && spec.span >= 4) {
      start = 11;
    }
    const end = start + spec.span;
    const octaveStart = start + 12 <= 22 ? start + 12 : undefined;
    const octaveEnd = octaveStart !== undefined ? Math.min(24, octaveStart + spec.span) : undefined;

    return {
      id: spec.id,
      name: `Position ${spec.id}`,
      cagedShape: spec.caged,
      startFret: start,
      endFret: end,
      octaveStartFret: octaveStart,
      octaveEndFret: octaveEnd,
    };
  });
}

export interface BackingProgression {
  id: string;
  name: string;
  feel: string;
  chords: {
    label: string;
    offset: number; // semitones from scale root
    intervals: number[]; // chord intervals from chord root
    qualitySuffix: string;
    bars: number;
  }[];
}

export function getBackingProgressionsForScale(scale: ScaleDefinition): BackingProgression[] {
  const isMinor = scale.intervals.includes(3) && !scale.intervals.includes(4);
  const isDominant = scale.id === 'mixolydian' || scale.id === 'blues' || scale.id === 'lydian_dominant';

  if (isDominant && scale.id === 'blues') {
    return [
      {
        id: '12bar_blues',
        name: '12-Bar Blues',
        feel: 'Shuffle',
        chords: [
          { label: 'I7', offset: 0, intervals: [0, 4, 7, 10], qualitySuffix: '7', bars: 4 },
          { label: 'IV7', offset: 5, intervals: [0, 4, 7, 10], qualitySuffix: '7', bars: 2 },
          { label: 'I7', offset: 0, intervals: [0, 4, 7, 10], qualitySuffix: '7', bars: 2 },
          { label: 'V7', offset: 7, intervals: [0, 4, 7, 10], qualitySuffix: '7', bars: 1 },
          { label: 'IV7', offset: 5, intervals: [0, 4, 7, 10], qualitySuffix: '7', bars: 1 },
          { label: 'I7', offset: 0, intervals: [0, 4, 7, 10], qualitySuffix: '7', bars: 2 },
        ],
      },
      {
        id: 'minor_blues_vamp',
        name: 'Minor Blues Vamp',
        feel: 'Slow Groove',
        chords: [
          { label: 'i7', offset: 0, intervals: [0, 3, 7, 10], qualitySuffix: 'm7', bars: 2 },
          { label: 'iv7', offset: 5, intervals: [0, 3, 7, 10], qualitySuffix: 'm7', bars: 1 },
          { label: 'v7', offset: 7, intervals: [0, 3, 7, 10], qualitySuffix: 'm7', bars: 1 },
        ],
      },
    ];
  }

  if (scale.id === 'dorian') {
    return [
      {
        id: 'dorian_vamp',
        name: 'Dorian Groove (i7 – IV7)',
        feel: 'Funk / Santana',
        chords: [
          { label: 'i7', offset: 0, intervals: [0, 3, 7, 10], qualitySuffix: 'm7', bars: 2 },
          { label: 'IV7', offset: 5, intervals: [0, 4, 7, 10], qualitySuffix: '7', bars: 2 },
        ],
      },
      {
        id: 'dorian_4bar',
        name: 'Modal Cycle (i7 – ii7 – IV – i7)',
        feel: 'Fusion',
        chords: [
          { label: 'i7', offset: 0, intervals: [0, 3, 7, 10], qualitySuffix: 'm7', bars: 1 },
          { label: 'ii7', offset: 2, intervals: [0, 3, 7, 10], qualitySuffix: 'm7', bars: 1 },
          { label: 'IV', offset: 5, intervals: [0, 4, 7], qualitySuffix: '', bars: 1 },
          { label: 'i7', offset: 0, intervals: [0, 3, 7, 10], qualitySuffix: 'm7', bars: 1 },
        ],
      },
    ];
  }

  if (isMinor) {
    return [
      {
        id: 'rock_minor',
        name: 'Rock Ballad (i – bVI – bIII – bVII)',
        feel: 'Driving 4/4',
        chords: [
          { label: 'i', offset: 0, intervals: [0, 3, 7], qualitySuffix: 'm', bars: 1 },
          { label: 'bVI', offset: 8, intervals: [0, 4, 7], qualitySuffix: '', bars: 1 },
          { label: 'bIII', offset: 3, intervals: [0, 4, 7], qualitySuffix: '', bars: 1 },
          { label: 'bVII', offset: 10, intervals: [0, 4, 7], qualitySuffix: '', bars: 1 },
        ],
      },
      {
        id: 'minor_soul',
        name: 'Soul Minor (i7 – iv7 – bVII7 – bVI)',
        feel: 'Neo-Soul',
        chords: [
          { label: 'i7', offset: 0, intervals: [0, 3, 7, 10], qualitySuffix: 'm7', bars: 1 },
          { label: 'iv7', offset: 5, intervals: [0, 3, 7, 10], qualitySuffix: 'm7', bars: 1 },
          { label: 'bVII7', offset: 10, intervals: [0, 4, 7, 10], qualitySuffix: '7', bars: 1 },
          { label: 'bVImaj7', offset: 8, intervals: [0, 4, 7, 11], qualitySuffix: 'maj7', bars: 1 },
        ],
      },
    ];
  }

  if (scale.id === 'lydian') {
    return [
      {
        id: 'lydian_float',
        name: 'Lydian Lift (Imaj7 – II)',
        feel: 'Ambient Rock',
        chords: [
          { label: 'Imaj7', offset: 0, intervals: [0, 4, 7, 11], qualitySuffix: 'maj7', bars: 2 },
          { label: 'II', offset: 2, intervals: [0, 4, 7], qualitySuffix: '', bars: 2 },
        ],
      },
    ];
  }

  return [
    {
      id: 'pop_major',
      name: 'Classic Major (I – V – vi – IV)',
      feel: 'Pop / Rock',
      chords: [
        { label: 'I', offset: 0, intervals: [0, 4, 7], qualitySuffix: '', bars: 1 },
        { label: 'V', offset: 7, intervals: [0, 4, 7], qualitySuffix: '', bars: 1 },
        { label: 'vi', offset: 9, intervals: [0, 3, 7], qualitySuffix: 'm', bars: 1 },
        { label: 'IV', offset: 5, intervals: [0, 4, 7], qualitySuffix: '', bars: 1 },
      ],
    },
    {
      id: 'mixo_jam',
      name: 'Jam Groove (I7 – bVII – IV – I7)',
      feel: 'Classic Jam',
      chords: [
        { label: 'I7', offset: 0, intervals: [0, 4, 7, 10], qualitySuffix: '7', bars: 1 },
        { label: 'bVII', offset: 10, intervals: [0, 4, 7], qualitySuffix: '', bars: 1 },
        { label: 'IV', offset: 5, intervals: [0, 4, 7], qualitySuffix: '', bars: 1 },
        { label: 'I7', offset: 0, intervals: [0, 4, 7, 10], qualitySuffix: '7', bars: 1 },
      ],
    },
  ];
}
