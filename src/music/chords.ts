import { getNoteName } from './theory';
import type { NoteNotation } from '../i18n/translations';

export type ChordQualityId =
  | 'major'
  | 'minor'
  | '7'
  | 'maj7'
  | 'm7'
  | 'sus2'
  | 'sus4'
  | 'add9'
  | '5'
  | 'dim7'
  | 'm7b5'
  | '9';

export interface ChordQualitySpec {
  id: ChordQualityId;
  label: string;
  suffix: string;
  formula: string;
  intervals: number[];
  recommendedScaleIds: string[];
}

export const CHORD_QUALITIES: ChordQualitySpec[] = [
  {
    id: 'major',
    label: 'Major',
    suffix: '',
    formula: '1 – 3 – 5',
    intervals: [0, 4, 7],
    recommendedScaleIds: ['major_pentatonic', 'ionian', 'lydian'],
  },
  {
    id: 'minor',
    label: 'Minor',
    suffix: 'm',
    formula: '1 – b3 – 5',
    intervals: [0, 3, 7],
    recommendedScaleIds: ['minor_pentatonic', 'aeolian', 'dorian'],
  },
  {
    id: '7',
    label: 'Dominant 7',
    suffix: '7',
    formula: '1 – 3 – 5 – b7',
    intervals: [0, 4, 7, 10],
    recommendedScaleIds: ['mixolydian', 'blues', 'major_blues'],
  },
  {
    id: 'maj7',
    label: 'Major 7',
    suffix: 'maj7',
    formula: '1 – 3 – 5 – 7',
    intervals: [0, 4, 7, 11],
    recommendedScaleIds: ['ionian', 'lydian', 'major_pentatonic'],
  },
  {
    id: 'm7',
    label: 'Minor 7',
    suffix: 'm7',
    formula: '1 – b3 – 5 – b7',
    intervals: [0, 3, 7, 10],
    recommendedScaleIds: ['dorian', 'minor_pentatonic', 'aeolian'],
  },
  {
    id: 'sus2',
    label: 'Sus2',
    suffix: 'sus2',
    formula: '1 – 2 – 5',
    intervals: [0, 2, 7],
    recommendedScaleIds: ['major_pentatonic', 'ionian', 'dorian'],
  },
  {
    id: 'sus4',
    label: 'Sus4',
    suffix: 'sus4',
    formula: '1 – 4 – 5',
    intervals: [0, 5, 7],
    recommendedScaleIds: ['mixolydian', 'ionian', 'minor_pentatonic'],
  },
  {
    id: 'add9',
    label: 'Add9',
    suffix: 'add9',
    formula: '1 – 3 – 5 – 9',
    intervals: [0, 2, 4, 7],
    recommendedScaleIds: ['major_pentatonic', 'ionian', 'lydian'],
  },
  {
    id: '5',
    label: 'Power (5)',
    suffix: '5',
    formula: '1 – 5',
    intervals: [0, 7],
    recommendedScaleIds: ['minor_pentatonic', 'aeolian', 'phrygian'],
  },
  {
    id: 'dim7',
    label: 'Diminished 7',
    suffix: 'dim7',
    formula: '1 – b3 – b5 – bb7',
    intervals: [0, 3, 6, 9],
    recommendedScaleIds: ['harmonic_minor', 'locrian', 'blues'],
  },
  {
    id: 'm7b5',
    label: 'Half-Dim (m7b5)',
    suffix: 'm7b5',
    formula: '1 – b3 – b5 – b7',
    intervals: [0, 3, 6, 10],
    recommendedScaleIds: ['locrian', 'aeolian', 'melodic_minor'],
  },
  {
    id: '9',
    label: 'Dominant 9',
    suffix: '9',
    formula: '1 – 3 – 5 – b7 – 9',
    intervals: [0, 2, 4, 7, 10],
    recommendedScaleIds: ['mixolydian', 'blues', 'lydian_dominant'],
  },
];

export interface ChordVoicing {
  id: string;
  label: string;
  // Array of 6 elements from String 6 (Low E) to String 1 (High E). -1 = muted (X), 0 = open, >0 = fret number
  frets: [number, number, number, number, number, number];
  fingers: [number, number, number, number, number, number]; // 0 = open/muted, 1..4 = finger
  barre?: { fret: number; fromString: number; toString: number }; // 0-indexed string (0 = low E, 5 = high E)
  baseFret: number; // Starting display fret (1 for open chords)
}

interface MovableShapeTemplate {
  label: string;
  rootString: 0 | 1 | 2; // 0 = low E (pitchClass 4), 1 = A (pitchClass 9), 2 = D (pitchClass 2)
  // Offsets relative to the root fret on rootString; null = muted
  offsets: [number | null, number | null, number | null, number | null, number | null, number | null];
  fingers: [number, number, number, number, number, number];
  barreSpan?: { offset: number; fromString: number; toString: number };
  preferOpenAtZero?: boolean;
}

const STANDARD_OPEN_PCS = [4, 9, 2, 7, 11, 4]; // E A D G B E

const MOVABLE_SHAPES: Record<ChordQualityId, MovableShapeTemplate[]> = {
  major: [
    {
      label: 'E-Shape Barre',
      rootString: 0,
      offsets: [0, 2, 2, 1, 0, 0],
      fingers: [1, 3, 4, 2, 1, 1],
      barreSpan: { offset: 0, fromString: 0, toString: 5 },
      preferOpenAtZero: true,
    },
    {
      label: 'A-Shape Barre',
      rootString: 1,
      offsets: [null, 0, 2, 2, 2, 0],
      fingers: [0, 1, 3, 3, 3, 1],
      barreSpan: { offset: 0, fromString: 1, toString: 5 },
      preferOpenAtZero: true,
    },
    {
      label: 'C-Shape Voicing',
      rootString: 1,
      offsets: [null, 0, -1, -3, -2, -3],
      fingers: [0, 4, 3, 1, 2, 1],
      barreSpan: { offset: -3, fromString: 3, toString: 5 },
    },
    {
      label: 'D-Shape Triad',
      rootString: 2,
      offsets: [null, null, 0, 2, 3, 2],
      fingers: [0, 0, 1, 2, 4, 3],
      preferOpenAtZero: true,
    },
  ],
  minor: [
    {
      label: 'Em-Shape Barre',
      rootString: 0,
      offsets: [0, 2, 2, 0, 0, 0],
      fingers: [1, 3, 4, 1, 1, 1],
      barreSpan: { offset: 0, fromString: 0, toString: 5 },
      preferOpenAtZero: true,
    },
    {
      label: 'Am-Shape Barre',
      rootString: 1,
      offsets: [null, 0, 2, 2, 1, 0],
      fingers: [0, 1, 3, 4, 2, 1],
      barreSpan: { offset: 0, fromString: 1, toString: 5 },
      preferOpenAtZero: true,
    },
    {
      label: 'Dm-Shape Voicing',
      rootString: 2,
      offsets: [null, null, 0, 2, 3, 1],
      fingers: [0, 0, 1, 3, 4, 2],
      preferOpenAtZero: true,
    },
  ],
  '7': [
    {
      label: 'E7-Shape Barre',
      rootString: 0,
      offsets: [0, 2, 0, 1, 0, 0],
      fingers: [1, 3, 1, 2, 1, 1],
      barreSpan: { offset: 0, fromString: 0, toString: 5 },
      preferOpenAtZero: true,
    },
    {
      label: 'A7-Shape Barre',
      rootString: 1,
      offsets: [null, 0, 2, 0, 2, 0],
      fingers: [0, 1, 3, 1, 4, 1],
      barreSpan: { offset: 0, fromString: 1, toString: 5 },
      preferOpenAtZero: true,
    },
    {
      label: 'C7-Shape Voicing',
      rootString: 1,
      offsets: [null, 0, -1, 0, -2, null],
      fingers: [0, 3, 2, 4, 1, 0],
    },
    {
      label: 'Jazz Shell (6th Root)',
      rootString: 0,
      offsets: [0, null, 0, 1, 2, null],
      fingers: [1, 0, 2, 3, 4, 0],
    },
  ],
  maj7: [
    {
      label: 'E-Root Maj7',
      rootString: 0,
      offsets: [0, null, 1, 1, 0, null],
      fingers: [1, 0, 3, 4, 2, 0],
    },
    {
      label: 'A-Root Maj7 Barre',
      rootString: 1,
      offsets: [null, 0, 2, 1, 2, 0],
      fingers: [0, 1, 3, 2, 4, 1],
      barreSpan: { offset: 0, fromString: 1, toString: 5 },
      preferOpenAtZero: true,
    },
    {
      label: 'D-Root Maj7',
      rootString: 2,
      offsets: [null, null, 0, 2, 2, 2],
      fingers: [0, 0, 1, 3, 3, 3],
      preferOpenAtZero: true,
    },
  ],
  m7: [
    {
      label: 'Em7-Shape Barre',
      rootString: 0,
      offsets: [0, 2, 0, 0, 0, 0],
      fingers: [1, 3, 1, 1, 1, 1],
      barreSpan: { offset: 0, fromString: 0, toString: 5 },
      preferOpenAtZero: true,
    },
    {
      label: 'Am7-Shape Barre',
      rootString: 1,
      offsets: [null, 0, 2, 0, 1, 0],
      fingers: [0, 1, 3, 1, 2, 1],
      barreSpan: { offset: 0, fromString: 1, toString: 5 },
      preferOpenAtZero: true,
    },
    {
      label: 'Jazz 6th-Root m7',
      rootString: 0,
      offsets: [0, null, 0, 0, 0, null],
      fingers: [2, 0, 3, 3, 3, 0],
    },
    {
      label: 'Dm7-Shape Voicing',
      rootString: 2,
      offsets: [null, null, 0, 2, 1, 1],
      fingers: [0, 0, 1, 3, 2, 2],
      preferOpenAtZero: true,
    },
  ],
  sus2: [
    {
      label: 'Asus2-Shape Barre',
      rootString: 1,
      offsets: [null, 0, 2, 2, 0, 0],
      fingers: [0, 1, 3, 4, 1, 1],
      barreSpan: { offset: 0, fromString: 1, toString: 5 },
      preferOpenAtZero: true,
    },
    {
      label: 'Dsus2-Shape',
      rootString: 2,
      offsets: [null, null, 0, 2, 3, 0],
      fingers: [0, 0, 1, 2, 4, 1],
      preferOpenAtZero: true,
    },
  ],
  sus4: [
    {
      label: 'Esus4-Shape Barre',
      rootString: 0,
      offsets: [0, 2, 2, 2, 0, 0],
      fingers: [1, 2, 3, 4, 1, 1],
      barreSpan: { offset: 0, fromString: 0, toString: 5 },
      preferOpenAtZero: true,
    },
    {
      label: 'Asus4-Shape Barre',
      rootString: 1,
      offsets: [null, 0, 2, 2, 3, 0],
      fingers: [0, 1, 2, 3, 4, 1],
      barreSpan: { offset: 0, fromString: 1, toString: 5 },
      preferOpenAtZero: true,
    },
    {
      label: 'Dsus4-Shape',
      rootString: 2,
      offsets: [null, null, 0, 2, 3, 3],
      fingers: [0, 0, 1, 2, 3, 4],
      preferOpenAtZero: true,
    },
  ],
  add9: [
    {
      label: 'Cadd9-Shape',
      rootString: 1,
      offsets: [null, 0, -1, -3, 0, -3],
      fingers: [0, 3, 2, 1, 4, 1],
    },
    {
      label: 'E-Root Add9',
      rootString: 0,
      offsets: [0, 2, 4, 1, 0, 0],
      fingers: [1, 2, 4, 1, 1, 1],
      preferOpenAtZero: true,
    },
    {
      label: 'A-Root Add9',
      rootString: 1,
      offsets: [null, 0, 2, 4, 2, 0],
      fingers: [0, 1, 2, 4, 3, 1],
    },
  ],
  '5': [
    {
      label: '6th-String Power',
      rootString: 0,
      offsets: [0, 2, 2, null, null, null],
      fingers: [1, 3, 4, 0, 0, 0],
      preferOpenAtZero: true,
    },
    {
      label: '5th-String Power',
      rootString: 1,
      offsets: [null, 0, 2, 2, null, null],
      fingers: [0, 1, 3, 4, 0, 0],
      preferOpenAtZero: true,
    },
    {
      label: '4th-String Power',
      rootString: 2,
      offsets: [null, null, 0, 2, 3, null],
      fingers: [0, 0, 1, 3, 4, 0],
      preferOpenAtZero: true,
    },
  ],
  dim7: [
    {
      label: '6th-Root Dim7',
      rootString: 0,
      offsets: [0, null, -1, 0, -1, null],
      fingers: [2, 0, 1, 3, 1, 0],
    },
    {
      label: '5th-Root Dim7',
      rootString: 1,
      offsets: [null, 0, 1, -1, 1, null],
      fingers: [0, 2, 3, 1, 4, 0],
    },
    {
      label: '4th-Root Dim7',
      rootString: 2,
      offsets: [null, null, 0, 1, 0, 1],
      fingers: [0, 0, 1, 3, 2, 4],
    },
  ],
  m7b5: [
    {
      label: '6th-Root m7b5',
      rootString: 0,
      offsets: [0, null, 0, 0, -1, null],
      fingers: [2, 0, 3, 4, 1, 0],
    },
    {
      label: '5th-Root m7b5',
      rootString: 1,
      offsets: [null, 0, 1, 0, 1, null],
      fingers: [0, 1, 3, 2, 4, 0],
    },
    {
      label: '4th-Root m7b5',
      rootString: 2,
      offsets: [null, null, 0, 1, 1, 1],
      fingers: [0, 0, 1, 2, 3, 4],
    },
  ],
  '9': [
    {
      label: 'Funk 5th-Root 9',
      rootString: 1,
      offsets: [null, 0, -1, 0, 0, 0],
      fingers: [0, 2, 1, 3, 3, 3],
      barreSpan: { offset: 0, fromString: 3, toString: 5 },
    },
    {
      label: '6th-Root 9',
      rootString: 0,
      offsets: [0, -1, 0, -1, 0, null],
      fingers: [2, 1, 3, 1, 4, 0],
    },
  ],
};

// Classic open chord overrides for immediate, idiomatic cowboy-chord voicings
const OPEN_CHORD_OVERRIDES: Record<string, ChordVoicing> = {
  '0_major': {
    id: 'open_C',
    label: 'Open Position',
    frets: [-1, 3, 2, 0, 1, 0],
    fingers: [0, 3, 2, 0, 1, 0],
    baseFret: 1,
  },
  '7_major': {
    id: 'open_G',
    label: 'Open Position',
    frets: [3, 2, 0, 0, 0, 3],
    fingers: [2, 1, 0, 0, 0, 3],
    baseFret: 1,
  },
  '2_major': {
    id: 'open_D',
    label: 'Open Position',
    frets: [-1, -1, 0, 2, 3, 2],
    fingers: [0, 0, 0, 1, 3, 2],
    baseFret: 1,
  },
  '4_major': {
    id: 'open_E',
    label: 'Open Position',
    frets: [0, 2, 2, 1, 0, 0],
    fingers: [0, 2, 3, 1, 0, 0],
    baseFret: 1,
  },
  '9_major': {
    id: 'open_A',
    label: 'Open Position',
    frets: [-1, 0, 2, 2, 2, 0],
    fingers: [0, 0, 1, 2, 3, 0],
    baseFret: 1,
  },
  '9_minor': {
    id: 'open_Am',
    label: 'Open Position',
    frets: [-1, 0, 2, 2, 1, 0],
    fingers: [0, 0, 2, 3, 1, 0],
    baseFret: 1,
  },
  '4_minor': {
    id: 'open_Em',
    label: 'Open Position',
    frets: [0, 2, 2, 0, 0, 0],
    fingers: [0, 2, 3, 0, 0, 0],
    baseFret: 1,
  },
  '2_minor': {
    id: 'open_Dm',
    label: 'Open Position',
    frets: [-1, -1, 0, 2, 3, 1],
    fingers: [0, 0, 0, 2, 3, 1],
    baseFret: 1,
  },
  '0_maj7': {
    id: 'open_Cmaj7',
    label: 'Open Position',
    frets: [-1, 3, 2, 0, 0, 0],
    fingers: [0, 3, 2, 0, 0, 0],
    baseFret: 1,
  },
  '5_maj7': {
    id: 'open_Fmaj7',
    label: 'Open Position',
    frets: [-1, -1, 3, 2, 1, 0],
    fingers: [0, 0, 3, 2, 1, 0],
    baseFret: 1,
  },
  '7_7': {
    id: 'open_G7',
    label: 'Open Position',
    frets: [3, 2, 0, 0, 0, 1],
    fingers: [3, 2, 0, 0, 0, 1],
    baseFret: 1,
  },
  '0_7': {
    id: 'open_C7',
    label: 'Open Position',
    frets: [-1, 3, 2, 3, 1, 0],
    fingers: [0, 3, 2, 4, 1, 0],
    baseFret: 1,
  },
  '2_7': {
    id: 'open_D7',
    label: 'Open Position',
    frets: [-1, -1, 0, 2, 1, 2],
    fingers: [0, 0, 0, 2, 1, 3],
    baseFret: 1,
  },
  '0_add9': {
    id: 'open_Cadd9',
    label: 'Open Position',
    frets: [-1, 3, 2, 0, 3, 0],
    fingers: [0, 2, 1, 0, 3, 0],
    baseFret: 1,
  },
};

export function getChordVoicings(rootPitchClass: number, qualityId: ChordQualityId): ChordVoicing[] {
  const results: ChordVoicing[] = [];
  const openKey = `${rootPitchClass}_${qualityId}`;
  const openOverride = OPEN_CHORD_OVERRIDES[openKey];
  if (openOverride) {
    results.push(openOverride);
  }

  const shapes = MOVABLE_SHAPES[qualityId] ?? [];
  for (let i = 0; i < shapes.length; i++) {
    const shape = shapes[i];
    const openStringPc = STANDARD_OPEN_PCS[shape.rootString];
    let rootFret = (rootPitchClass - openStringPc + 12) % 12;

    const minOffset = Math.min(
      ...shape.offsets.filter((o): o is number => o !== null)
    );

    if (rootFret + minOffset < 0) {
      rootFret += 12;
    }

    // Avoid duplicating exact open voicing if rootFret === 0 and override exists
    if (rootFret === 0 && openOverride && shape.preferOpenAtZero) {
      rootFret = 12;
    }

    if (rootFret > 15) continue;

    const frets = shape.offsets.map((o) => (o === null ? -1 : rootFret + o)) as [
      number,
      number,
      number,
      number,
      number,
      number
    ];

    const frettedNotes = frets.filter((f) => f > 0);
    const minFret = frettedNotes.length > 0 ? Math.min(...frettedNotes) : 1;
    const maxFret = frettedNotes.length > 0 ? Math.max(...frettedNotes) : 1;
    const baseFret = maxFret <= 4 ? 1 : minFret;

    const isAllOpenBarre = shape.barreSpan && rootFret + shape.barreSpan.offset === 0;
    const fingers = shape.fingers.map((f, idx) => (frets[idx] <= 0 ? 0 : f)) as [
      number,
      number,
      number,
      number,
      number,
      number
    ];

    // Deduplicate identical fret arrays
    const signature = frets.join(',');
    if (results.some((r) => r.frets.join(',') === signature)) {
      continue;
    }

    results.push({
      id: `${qualityId}_${i}_${rootFret}`,
      label: rootFret === 0 ? `Open ${shape.label.replace(' Barre', '')}` : shape.label,
      frets,
      fingers,
      barre:
        shape.barreSpan && !isAllOpenBarre
          ? {
              fret: rootFret + shape.barreSpan.offset,
              fromString: shape.barreSpan.fromString,
              toString: shape.barreSpan.toString,
            }
          : undefined,
      baseFret,
    });
  }

  return results;
}

export function getChordDisplayName(
  rootPitchClass: number,
  qualityId: ChordQualityId,
  preferFlats = false,
  notation: NoteNotation = 'letters'
): string {
  const spec = CHORD_QUALITIES.find((q) => q.id === qualityId) ?? CHORD_QUALITIES[0];
  return `${getNoteName(rootPitchClass, preferFlats, notation)}${spec.suffix}`;
}
