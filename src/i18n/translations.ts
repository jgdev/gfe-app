export type Locale = 'en' | 'es' | 'pt' | 'fr';
export type NoteNotation = 'letters' | 'solfege';

export const LOCALE_OPTIONS: { id: Locale; short: string; label: string }[] = [
  { id: 'en', short: 'EN', label: 'English' },
  { id: 'es', short: 'ES', label: 'Español' },
  { id: 'pt', short: 'PT', label: 'Português' },
  { id: 'fr', short: 'FR', label: 'Français' },
];

export interface TranslationBundle {
  nav: {
    fretboard: string;
    scales: string;
    chords: string;
    tuner: string;
    playScale: string;
    stopScale: string;
    active: string;
    openMenu: string;
    closeMenu: string;
    language: string;
    notation: string;
  };
  fretboard: {
    overChord: string;
    fullNeckRange: (frets: number) => string;
    fretsRange: (start: number, end: number) => string;
    electric: string;
    acoustic: string;
    nylon: string;
    scaleRoot: string;
    chordRoot: (chord: string) => string;
    chordTones: (chord: string) => string;
    targetChordTones: string;
    colorTone: string;
    availableScaleNotes: string;
    showChromaticMarkers: string;
    clickAnyFret: string;
    phrasingGuide: string;
    viewAllBoxDiagrams: string;
    keyboardActive: string;
    keyboardPaused: string;
    keyboardHint: string;
    focusedNoteLabel: string;
    stringShort: string;
    fretShort: string;
  };
  toolbar: {
    keyCenter: string;
    scaleMode: string;
    tuning: string;
    neckZone: string;
    fullNeck: string;
    posShort: (id: number) => string;
    notes: string;
    intervals: string;
    degrees: string;
    targetChordTones: string;
    colorToneBtn: (label: string) => string;
    keyHints: string;
    rosewood: string;
    ebony: string;
    maple: string;
    leftHanded: string;
  };
  backing: {
    soloOverChordTones: string;
    clickChordHint: string;
    allScaleNotes: string;
    jamBackingLoop: string;
    tempo: string;
    playGroove: string;
    stopLoop: string;
  };
  scalesView: {
    diagramsTitle: (root: string, scaleName: string) => string;
    notesCount: (count: number) => string;
    scaleNotesIntervals: string;
    improvisationNote: string;
    character: string;
    fivePositionsTitle: string;
    fivePositionsHint: string;
    play: string;
    stop: string;
    openOnFullNeck: string;
    harmonizedChordsTitle: (root: string, scaleName: string) => string;
    clickAuditionHint: string;
    positionLabel: (id: number) => string;
    roles: Record<'Tonic' | 'Subdominant' | 'Dominant' | 'Color', string>;
  };
  chordsView: {
    chordChartsTitle: (chordName: string) => string;
    playableVoicings: (count: number) => string;
    strumDown: string;
    strumUp: string;
    arpeggiate: string;
    open: string;
    onTheNeckTitle: (chordName: string, voicingLabel: string) => string;
    onTheNeckHint: (rootName: string, scaleName: string) => string;
    soloInScale: (rootName: string, scaleShort: string) => string;
    addToGroup: string;
    addedFeedback: string;
    groupsTitle: string;
    groupsSubtitle: string;
    newGroupPlaceholder: string;
    createGroup: string;
    renameGroup: string;
    deleteGroup: string;
    loadStarterGroup: string;
    emptyGroupsHint: string;
    emptyStepsHint: string;
    playGroup: string;
    stopGroup: string;
    patternGroove: string;
    patternDown: string;
    patternArpeggio: string;
    barsShort: (n: number) => string;
    moveLeft: string;
    moveRight: string;
    removeStep: string;
    defaultGroupName: string;
    starterGroupName: string;
  };
  tuner: {
    title: string;
    autoStringDetect: string;
    lockedToString: (num: number, note: string) => string;
    enableMic: string;
    stopMic: string;
    listening: string;
    micOff: string;
    inTune: string;
    flatTuneUp: string;
    sharpTuneDown: string;
    cents: string;
    referencePitch: string;
    reset440: string;
    noiseGate: string;
    tuningPresetTitle: string;
    lockOrPlayHint: string;
    autoDetect: string;
    targetLocked: string;
    activeDetected: string;
    clickToLock: string;
    pluck: string;
    tone: string;
    mute: string;
    micUnavailable: string;
    micDenied: string;
    micOpenError: string;
  };
  scaleCategories: Record<string, string>;
  scaleNames: Record<string, string>;
  scaleMoods: Record<string, string>;
  scaleTips: Record<string, string>;
  chordQualities: Record<string, string>;
  intervalsFull: Record<number, string>;
}

export const TRANSLATIONS: Record<Locale, TranslationBundle> = {
  en: {
    nav: {
      fretboard: 'Fretboard',
      scales: 'Scales',
      chords: 'Chords',
      tuner: 'Tuner',
      playScale: 'Play Scale',
      stopScale: 'Stop Scale',
      active: 'Active',
      openMenu: 'Open navigation menu',
      closeMenu: 'Close navigation menu',
      language: 'Language',
      notation: 'Notation',
    },
    fretboard: {
      overChord: 'over',
      fullNeckRange: (f) => `Full Neck (0–${f} Frets)`,
      fretsRange: (s, e) => `Frets ${s}–${e}`,
      electric: 'Electric',
      acoustic: 'Acoustic',
      nylon: 'Nylon',
      scaleRoot: 'Scale Root',
      chordRoot: (c) => `${c} Root`,
      chordTones: (c) => `${c} Chord Tones`,
      targetChordTones: 'Target Chord Tones',
      colorTone: 'Color Tone',
      availableScaleNotes: 'Available Scale Notes',
      showChromaticMarkers: 'Show chromatic markers',
      clickAnyFret: 'Click any fret to hear pitch',
      phrasingGuide: 'Phrasing guide:',
      viewAllBoxDiagrams: 'View all 5 box diagrams →',
      keyboardActive: 'Fretboard Focused',
      keyboardPaused: 'Click fretboard to focus',
      keyboardHint: '← / → step & play · Q–M direct play · Space repeat',
      focusedNoteLabel: 'Focused',
      stringShort: 'Str',
      fretShort: 'Fr',
    },
    toolbar: {
      keyCenter: 'Key Center',
      scaleMode: 'Scale / Mode',
      tuning: 'Tuning',
      neckZone: 'Neck Zone',
      fullNeck: 'Full Neck',
      posShort: (id) => `Pos ${id}`,
      notes: 'Notes',
      intervals: 'Intervals',
      degrees: 'Degrees',
      targetChordTones: 'Target Chord Tones',
      colorToneBtn: (label) => `Color Tone (${label})`,
      keyHints: 'Key Hints (Q–M)',
      rosewood: 'Rosewood',
      ebony: 'Ebony',
      maple: 'Maple',
      leftHanded: 'Left-Handed',
    },
    backing: {
      soloOverChordTones: 'Solo Over Chord Tones',
      clickChordHint: 'Click a chord to highlight its landing notes across the neck',
      allScaleNotes: 'All Scale Notes',
      jamBackingLoop: 'Jam Backing Loop',
      tempo: 'Tempo',
      playGroove: 'Play Groove',
      stopLoop: 'Stop Loop',
    },
    scalesView: {
      diagramsTitle: (root, scaleName) => `${root} ${scaleName} Diagrams`,
      notesCount: (c) => `${c} notes`,
      scaleNotesIntervals: 'Scale Notes & Intervals',
      improvisationNote: 'Improvisation Phrasing Note',
      character: 'Character:',
      fivePositionsTitle: 'Five Connected Neck Positions',
      fivePositionsHint: 'Click any dot inside a diagram to hear its pitch, or open a box directly on the full neck.',
      play: 'Play',
      stop: 'Stop',
      openOnFullNeck: 'Open on Full Neck',
      harmonizedChordsTitle: (root, scaleName) => `Harmonized Chords in ${root} ${scaleName}`,
      clickAuditionHint: 'Click any chord to audition its voicing',
      positionLabel: (id) => `Position ${id}`,
      roles: {
        Tonic: 'Tonic',
        Subdominant: 'Subdominant',
        Dominant: 'Dominant',
        Color: 'Color',
      },
    },
    chordsView: {
      chordChartsTitle: (name) => `${name} Chord Charts`,
      playableVoicings: (c) => `${c} playable voicings`,
      strumDown: 'Strum Down',
      strumUp: 'Strum Up',
      arpeggiate: 'Arpeggiate',
      open: 'Open',
      onTheNeckTitle: (name, voicing) => `${name} (${voicing}) on the Neck`,
      onTheNeckHint: (root, scale) =>
        `Highlighted notes show your chord fingering; background notes map the compatible ${root} ${scale} scale for soloing.`,
      soloInScale: (root, scale) => `Solo in ${root} ${scale}`,
      addToGroup: 'Add to Group',
      addedFeedback: 'Added',
      groupsTitle: 'Saved Chord Groups',
      groupsSubtitle: 'Record chord voicings into custom progressions and loop-play them like a groove.',
      newGroupPlaceholder: 'New group name (e.g. Verse Idea)',
      createGroup: 'New Group',
      renameGroup: 'Rename',
      deleteGroup: 'Delete',
      loadStarterGroup: 'Load Starter Progression',
      emptyGroupsHint: 'Create a group or load a starter progression to record and play your chord sequences.',
      emptyStepsHint: 'No chords recorded in this group yet. Pick any voicing above and click "Add to Group".',
      playGroup: 'Play Group',
      stopGroup: 'Stop Group',
      patternGroove: 'Groove Comp',
      patternDown: 'Down Strum',
      patternArpeggio: 'Arpeggio',
      barsShort: (n) => `${n}b`,
      moveLeft: 'Move earlier',
      moveRight: 'Move later',
      removeStep: 'Remove chord',
      defaultGroupName: 'My Progression',
      starterGroupName: 'Classic Rock (Am – F – C – G)',
    },
    tuner: {
      title: 'Chromatic Guitar Tuner',
      autoStringDetect: 'Auto String Detect',
      lockedToString: (num, note) => `Locked to String ${num} (${note})`,
      enableMic: 'Enable Microphone',
      stopMic: 'Stop Microphone',
      listening: 'Listening — Pluck a String',
      micOff: 'Microphone Off',
      inTune: 'In Tune',
      flatTuneUp: 'Flat — Tune Up',
      sharpTuneDown: 'Sharp — Tune Down',
      cents: 'cents',
      referencePitch: 'Reference Pitch (A4)',
      reset440: 'Reset 440',
      noiseGate: 'Input Noise Gate',
      tuningPresetTitle: 'Tuning Preset & Reference Pitches',
      lockOrPlayHint: 'Click a string to lock target, or play its reference tone',
      autoDetect: 'Auto Detect',
      targetLocked: 'Target locked',
      activeDetected: 'Active detected string',
      clickToLock: 'Click to lock target',
      pluck: 'Pluck',
      tone: 'Tone',
      mute: 'Mute',
      micUnavailable:
        'Microphone access is not available in this browser context. Use the Reference Tone pegs below to tune by ear.',
      micDenied:
        'Microphone permission was denied. Allow microphone access in your browser, or use the Reference Tone pegs below to tune by ear.',
      micOpenError:
        'Could not open microphone input. Use the Reference Tone pegs below to tune by ear.',
    },
    scaleCategories: {
      'Pentatonic & Blues': 'Pentatonic & Blues',
      Modes: 'Modes',
      'Minor & Jazz': 'Minor & Jazz',
      Exotic: 'Exotic',
    },
    scaleNames: {
      minor_pentatonic: 'Minor Pentatonic',
      major_pentatonic: 'Major Pentatonic',
      blues: 'Minor Blues',
      major_blues: 'Major Blues',
      ionian: 'Major (Ionian)',
      aeolian: 'Natural Minor (Aeolian)',
      dorian: 'Dorian',
      mixolydian: 'Mixolydian',
      lydian: 'Lydian',
      phrygian: 'Phrygian',
      locrian: 'Locrian',
      harmonic_minor: 'Harmonic Minor',
      melodic_minor: 'Melodic Minor',
      phrygian_dominant: 'Phrygian Dominant',
      lydian_dominant: 'Lydian Dominant',
      altered: 'Altered (Super Locrian)',
      hungarian_minor: 'Hungarian Minor',
      hirajoshi: 'Hirajoshi',
    },
    scaleMoods: {
      minor_pentatonic: 'Rock, blues, soul, versatile lead foundation',
      major_pentatonic: 'Bright, country, classic rock, melodic anthem',
      blues: 'Gritty, vocal, expressive blues & rock soloing',
      major_blues: 'Sweet BB King / Allman Brothers major phrasing',
      ionian: 'Open, resolved, pop, diatonic major',
      aeolian: 'Expressive, dramatic, rock ballads & metal',
      dorian: 'Funk, Santana rock, fusion, soulful minor',
      mixolydian: 'Classic rock, jam band, funk & dominant 7th grooves',
      lydian: 'Dreamy, cinematic, floating Satriani / Vai vibe',
      phrygian: 'Dark, flamenco, heavy metal tension',
      locrian: 'Unstable, dark jazz m7b5 & progressive metal',
      harmonic_minor: 'Neoclassical shred, gypsy jazz, dramatic minor',
      melodic_minor: 'Modern jazz, fusion, sophisticated minor-major',
      phrygian_dominant: 'Spanish flamenco, Middle Eastern, V7b9 metal',
      lydian_dominant: 'Modern jazz, non-resolving 7#11 color',
      altered: 'Maximum jazz tension resolving to tonic',
      hungarian_minor: 'Gothic, Eastern European, dramatic twin augmented 2nds',
      hirajoshi: 'Contemplative Japanese pentatonic, ambient rock',
    },
    scaleTips: {
      minor_pentatonic: 'Bend the 4th up a whole step to the 5th, and resolve phrases cleanly to the Root or b3.',
      major_pentatonic: 'Slide from the 2nd into the Major 3rd for vocal phrasing; lean on the 6th for warm lift.',
      blues: 'Use the b5 as a chromatic passing bridge between the 4th and 5th rather than resting on it.',
      major_blues: 'Hammer quickly from the b3 into the Major 3rd over I7 and IV7 chords.',
      ionian: 'Target the Major 3rd and 7th on strong beats; treat the 4th as a gentle passing tone over I.',
      aeolian: 'Emphasize the poignant half-step pull from the b6 down to the 5th.',
      dorian: 'Highlight the natural 6th against the minor 3rd over a i7–IV7 vamp to bring out the Dorian sparkle.',
      mixolydian: 'Combine the Major 3rd with the flat 7th for swaggering dominant 7th lines.',
      lydian: 'Linger on the #4 (raised fourth) over a Maj7 chord—unlike Ionian, it never clashes.',
      phrygian: 'Pivot repeatedly between the b2 and Root using fast pull-offs for instant Iberian drama.',
      locrian: 'Outline the half-diminished arpeggio (R, b3, b5, b7) before resolving to the next key center.',
      harmonic_minor: 'Exploit the exotic 3-semitone leap between b6 and Major 7th over V7 → i turnarounds.',
      melodic_minor: 'Pair the minor 3rd with the bright natural 6th and major 7th for smooth fusion runs.',
      phrygian_dominant: 'Contrast the Major 3rd with the b2 and b6 over a static major or dominant 7th drone.',
      lydian_dominant: 'Use over tritone-sub dominant chords and IV7 chords in blues-jazz solos.',
      altered: 'Think melodic minor a half-step up from the V7 root, resolving smoothly into the I chord.',
      hungarian_minor: 'Slide through both augmented 2nd gaps (b3–#4 and b6–7) for dramatic phrasing.',
      hirajoshi: 'Let wide 4-semitone intervals ring across adjacent strings with gentle vibrato.',
    },
    chordQualities: {
      major: 'Major',
      minor: 'Minor',
      '7': 'Dominant 7',
      maj7: 'Major 7',
      m7: 'Minor 7',
      sus2: 'Sus2',
      sus4: 'Sus4',
      add9: 'Add9',
      '5': 'Power (5)',
      dim7: 'Diminished 7',
      m7b5: 'Half-Dim (m7b5)',
      '9': 'Dominant 9',
    },
    intervalsFull: {
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
    },
  },

  es: {
    nav: {
      fretboard: 'Mástil',
      scales: 'Escalas',
      chords: 'Acordes',
      tuner: 'Afinador',
      playScale: 'Tocar Escala',
      stopScale: 'Detener',
      active: 'Activo',
      openMenu: 'Abrir menú de navegación',
      closeMenu: 'Cerrar menú de navegación',
      language: 'Idioma',
      notation: 'Notación',
    },
    fretboard: {
      overChord: 'sobre',
      fullNeckRange: (f) => `Mástil Completo (0–${f} Trastes)`,
      fretsRange: (s, e) => `Trastes ${s}–${e}`,
      electric: 'Eléctrica',
      acoustic: 'Acústica',
      nylon: 'Clásica',
      scaleRoot: 'Tónica de Escala',
      chordRoot: (c) => `Tónica de ${c}`,
      chordTones: (c) => `Notas de ${c}`,
      targetChordTones: 'Notas Objetivo del Acorde',
      colorTone: 'Nota Característica',
      availableScaleNotes: 'Notas Disponibles',
      showChromaticMarkers: 'Mostrar guías cromáticas',
      clickAnyFret: 'Haz clic en cualquier traste para escuchar',
      phrasingGuide: 'Consejo de fraseo:',
      viewAllBoxDiagrams: 'Ver los 5 diagramas de posición →',
      keyboardActive: 'Mástil Enfocado',
      keyboardPaused: 'Haz clic en el mástil para enfocar',
      keyboardHint: '← / → avanzar y tocar · Q–M toque directo · Espacio repetir',
      focusedNoteLabel: 'Enfocada',
      stringShort: 'Cda',
      fretShort: 'Tr',
    },
    toolbar: {
      keyCenter: 'Tonalidad',
      scaleMode: 'Escala / Modo',
      tuning: 'Afinación',
      neckZone: 'Posición',
      fullNeck: 'Todo el Mástil',
      posShort: (id) => `Pos ${id}`,
      notes: 'Notas',
      intervals: 'Intervalos',
      degrees: 'Grados',
      targetChordTones: 'Notas del Acorde',
      colorToneBtn: (label) => `Nota Color (${label})`,
      keyHints: 'Teclas (Q–M)',
      rosewood: 'Palisandro',
      ebony: 'Ébano',
      maple: 'Arce',
      leftHanded: 'Zurdo',
    },
    backing: {
      soloOverChordTones: 'Improvisar sobre Acordes',
      clickChordHint: 'Elige un acorde para resaltar sus notas de reposo en todo el mástil',
      allScaleNotes: 'Toda la Escala',
      jamBackingLoop: 'Base de Acompañamiento',
      tempo: 'Tempo',
      playGroove: 'Tocar Base',
      stopLoop: 'Detener Base',
    },
    scalesView: {
      diagramsTitle: (root, scaleName) => `Diagramas de ${root} ${scaleName}`,
      notesCount: (c) => `${c} notas`,
      scaleNotesIntervals: 'Notas e Intervalos de la Escala',
      improvisationNote: 'Nota de Fraseo e Improvisación',
      character: 'Carácter:',
      fivePositionsTitle: 'Cinco Posiciones Conectadas en el Mástil',
      fivePositionsHint: 'Haz clic en cualquier nota para escucharla o ábrela directamente en el mástil completo.',
      play: 'Tocar',
      stop: 'Detener',
      openOnFullNeck: 'Abrir en el Mástil',
      harmonizedChordsTitle: (root, scaleName) => `Acordes Armonizados en ${root} ${scaleName}`,
      clickAuditionHint: 'Haz clic en un acorde para escuchar su sonoridad',
      positionLabel: (id) => `Posición ${id}`,
      roles: {
        Tonic: 'Tónica',
        Subdominant: 'Subdominante',
        Dominant: 'Dominante',
        Color: 'Color',
      },
    },
    chordsView: {
      chordChartsTitle: (name) => `Gráficos de Acorde ${name}`,
      playableVoicings: (c) => `${c} posiciones disponibles`,
      strumDown: 'Rasgueo Abajo',
      strumUp: 'Rasgueo Arriba',
      arpeggiate: 'Arpegiar',
      open: 'Abierto',
      onTheNeckTitle: (name, voicing) => `${name} (${voicing}) en el Mástil`,
      onTheNeckHint: (root, scale) =>
        `Las notas destacadas muestran la digitación del acorde; el fondo muestra la escala compatible ${root} ${scale}.`,
      soloInScale: (root, scale) => `Improvisar en ${root} ${scale}`,
      addToGroup: 'Agregar al Grupo',
      addedFeedback: 'Agregado',
      groupsTitle: 'Grupos de Acordes Guardados',
      groupsSubtitle: 'Guarda digitaciones en progresiones propias y reprodúcelas en bucle como una base.',
      newGroupPlaceholder: 'Nombre del grupo (ej. Estrofa)',
      createGroup: 'Nuevo Grupo',
      renameGroup: 'Renombrar',
      deleteGroup: 'Eliminar',
      loadStarterGroup: 'Cargar Progresión Inicial',
      emptyGroupsHint: 'Crea un grupo o carga una progresión inicial para grabar y reproducir tus acordes.',
      emptyStepsHint: 'Aún no hay acordes en este grupo. Elige una posición arriba y pulsa "Agregar al Grupo".',
      playGroup: 'Tocar Grupo',
      stopGroup: 'Detener Grupo',
      patternGroove: 'Base Rítmica',
      patternDown: 'Rasgueo',
      patternArpeggio: 'Arpegio',
      barsShort: (n) => `${n}c`,
      moveLeft: 'Mover antes',
      moveRight: 'Mover después',
      removeStep: 'Quitar acorde',
      defaultGroupName: 'Mi Progresión',
      starterGroupName: 'Rock Clásico (Am – F – C – G)',
    },
    tuner: {
      title: 'Afinador Cromático de Guitarra',
      autoStringDetect: 'Detección Automática',
      lockedToString: (num, note) => `Fijado en Cuerda ${num} (${note})`,
      enableMic: 'Activar Micrófono',
      stopMic: 'Detener Micrófono',
      listening: 'Escuchando — Toca una Cuerda',
      micOff: 'Micrófono Apagado',
      inTune: 'Afinada',
      flatTuneUp: 'Baja — Sube Tensión',
      sharpTuneDown: 'Alta — Baja Tensión',
      cents: 'cents',
      referencePitch: 'Frecuencia de Referencia (La4)',
      reset440: 'Restaurar 440',
      noiseGate: 'Puerta de Ruido',
      tuningPresetTitle: 'Afinación y Tonos de Referencia',
      lockOrPlayHint: 'Haz clic en una cuerda para fijarla o reproduce su tono guía',
      autoDetect: 'Automático',
      targetLocked: 'Objetivo fijado',
      activeDetected: 'Cuerda detectada',
      clickToLock: 'Clic para fijar',
      pluck: 'Pulsar',
      tone: 'Tono',
      mute: 'Silenciar',
      micUnavailable:
        'El acceso al micrófono no está disponible en este navegador. Usa los tonos de referencia para afinar de oído.',
      micDenied:
        'Se denegó el permiso del micrófono. Habilítalo en el navegador o usa los tonos de referencia.',
      micOpenError:
        'No se pudo abrir el micrófono. Usa los tonos de referencia para afinar de oído.',
    },
    scaleCategories: {
      'Pentatonic & Blues': 'Pentatónicas y Blues',
      Modes: 'Modos',
      'Minor & Jazz': 'Menores y Jazz',
      Exotic: 'Exóticas',
    },
    scaleNames: {
      minor_pentatonic: 'Pentatónica Menor',
      major_pentatonic: 'Pentatónica Mayor',
      blues: 'Blues Menor',
      major_blues: 'Blues Mayor',
      ionian: 'Mayor (Jónico)',
      aeolian: 'Menor Natural (Eólico)',
      dorian: 'Dórico',
      mixolydian: 'Mixolidio',
      lydian: 'Lidio',
      phrygian: 'Frigio',
      locrian: 'Locrio',
      harmonic_minor: 'Menor Armónica',
      melodic_minor: 'Menor Melódica',
      phrygian_dominant: 'Frigio Dominante',
      lydian_dominant: 'Lidio Dominante',
      altered: 'Alterada (Super Locrio)',
      hungarian_minor: 'Menor Húngara',
      hirajoshi: 'Hirajoshi',
    },
    scaleMoods: {
      minor_pentatonic: 'Rock, blues, soul, base versátil para solos',
      major_pentatonic: 'Brillante, country, rock clásico y melódico',
      blues: 'Expresiva, vocal y rasposa para blues y rock',
      major_blues: 'Fraseo mayor dulce estilo BB King / Allman Brothers',
      ionian: 'Abierta, resuelta, pop y mayor diatónica',
      aeolian: 'Expresiva, dramática, baladas rock y metal',
      dorian: 'Funk, rock latino, fusión y menor con brillo',
      mixolydian: 'Rock clásico, jam, funk y acordes dominantes 7',
      lydian: 'Etérea, cinematográfica, ambiente estilo Satriani',
      phrygian: 'Oscura, flamenca y tensión metal',
      locrian: 'Inestable, jazz m7b5 y metal progresivo',
      harmonic_minor: 'Neoclásica, gypsy jazz y menor dramática',
      melodic_minor: 'Jazz moderno, fusión y color menor-mayor',
      phrygian_dominant: 'Flamenco español, Oriente Medio y metal V7b9',
      lydian_dominant: 'Jazz moderno y color 7#11',
      altered: 'Máxima tensión jazz resolviendo a tónica',
      hungarian_minor: 'Gótica, Europa del Este, dos segundas aumentadas',
      hirajoshi: 'Pentatónica japonesa contemplativa y rock ambiental',
    },
    scaleTips: {
      minor_pentatonic: 'Estira la 4ª un tono completo hacia la 5ª y resuelve las frases en la Tónica o b3.',
      major_pentatonic: 'Desliza de la 2ª a la 3ª Mayor para un fraseo vocal; apóyate en la 6ª.',
      blues: 'Usa la b5 como nota de paso cromática entre la 4ª y la 5ª sin reposar demasiado en ella.',
      major_blues: 'Haz un ligado rápido de b3 a 3ª Mayor sobre acordes I7 y IV7.',
      ionian: 'Apunta a la 3ª Mayor y 7ª en tiempos fuertes; usa la 4ª como paso suave sobre I.',
      aeolian: 'Destaca la tensión emotiva del semitono descendente de b6 hacia la 5ª.',
      dorian: 'Resalta la 6ª natural junto a la 3ª menor sobre una base i7–IV7 para el sonido Dórico.',
      mixolydian: 'Combina la 3ª Mayor con la 7ª menor para líneas dominantes con groove.',
      lydian: 'Sostén la #4 sobre un acorde Maj7: flota sin chocar.',
      phrygian: 'Alterna rápidamente entre la b2 y la Tónica con pull-offs para drama ibérico.',
      locrian: 'Delinea el arpegio semidisminuido (R, b3, b5, b7) antes de resolver.',
      harmonic_minor: 'Aprovecha el salto de 3 semitonos entre b6 y 7ª Mayor en giros V7 → i.',
      melodic_minor: 'Combina la 3ª menor con la 6ª y 7ª mayores para frases fluidas de fusión.',
      phrygian_dominant: 'Contrasta la 3ª Mayor con la b2 y b6 sobre un bordón mayor o dominante.',
      lydian_dominant: 'Úsala sobre acordes dominantes sustitutos tritonales y acordes IV7.',
      altered: 'Piensa en menor melódica un semitono arriba de la tónica V7 resolviendo al I.',
      hungarian_minor: 'Desliza por ambos saltos aumentados (b3–#4 y b6–7) para máximo dramatismo.',
      hirajoshi: 'Deja sonar los intervalos amplios entre cuerdas adyacentes con vibrato suave.',
    },
    chordQualities: {
      major: 'Mayor',
      minor: 'Menor',
      '7': 'Dominante 7',
      maj7: 'Mayor 7',
      m7: 'Menor 7',
      sus2: 'Sus2',
      sus4: 'Sus4',
      add9: 'Add9',
      '5': 'Quinta (5)',
      dim7: 'Disminuido 7',
      m7b5: 'Semidism (m7b5)',
      '9': 'Dominante 9',
    },
    intervalsFull: {
      0: 'Tónica',
      1: '2ª Menor',
      2: '2ª Mayor',
      3: '3ª Menor',
      4: '3ª Mayor',
      5: '4ª Justa',
      6: 'Tritono / b5',
      7: '5ª Justa',
      8: '6ª Menor',
      9: '6ª Mayor',
      10: '7ª Menor',
      11: '7ª Mayor',
    },
  },

  pt: {
    nav: {
      fretboard: 'Braço',
      scales: 'Escalas',
      chords: 'Acordes',
      tuner: 'Afinador',
      playScale: 'Tocar Escala',
      stopScale: 'Parar',
      active: 'Ativo',
      openMenu: 'Abrir menu de navegação',
      closeMenu: 'Fechar menu de navegação',
      language: 'Idioma',
      notation: 'Notação',
    },
    fretboard: {
      overChord: 'sobre',
      fullNeckRange: (f) => `Braço Completo (0–${f} Casas)`,
      fretsRange: (s, e) => `Casas ${s}–${e}`,
      electric: 'Elétrica',
      acoustic: 'Violão Aço',
      nylon: 'Nylon',
      scaleRoot: 'Tônica da Escala',
      chordRoot: (c) => `Tônica de ${c}`,
      chordTones: (c) => `Notas de ${c}`,
      targetChordTones: 'Notas-Alvo do Acorde',
      colorTone: 'Nota Característica',
      availableScaleNotes: 'Notas Disponíveis',
      showChromaticMarkers: 'Mostrar guias cromáticas',
      clickAnyFret: 'Clique em qualquer casa para ouvir',
      phrasingGuide: 'Dica de fraseado:',
      viewAllBoxDiagrams: 'Ver os 5 diagramas de posição →',
      keyboardActive: 'Braço Focado',
      keyboardPaused: 'Clique no braço para focar',
      keyboardHint: '← / → navegar e tocar · Q–M toque direto · Espaço repetir',
      focusedNoteLabel: 'Focada',
      stringShort: 'Cda',
      fretShort: 'Cs',
    },
    toolbar: {
      keyCenter: 'Tonalidade',
      scaleMode: 'Escala / Modo',
      tuning: 'Afinação',
      neckZone: 'Região',
      fullNeck: 'Braço Todo',
      posShort: (id) => `Pos ${id}`,
      notes: 'Notas',
      intervals: 'Intervalos',
      degrees: 'Graus',
      targetChordTones: 'Notas do Acorde',
      colorToneBtn: (label) => `Nota Cor (${label})`,
      keyHints: 'Teclas (Q–M)',
      rosewood: 'Jacarandá',
      ebony: 'Ébano',
      maple: 'Maple',
      leftHanded: 'Canhoto',
    },
    backing: {
      soloOverChordTones: 'Improvisar sobre Acordes',
      clickChordHint: 'Clique em um acorde para destacar suas notas-alvo no braço',
      allScaleNotes: 'Escala Completa',
      jamBackingLoop: 'Base de Acompanhamento',
      tempo: 'Andamento',
      playGroove: 'Tocar Base',
      stopLoop: 'Parar Base',
    },
    scalesView: {
      diagramsTitle: (root, scaleName) => `Diagramas de ${root} ${scaleName}`,
      notesCount: (c) => `${c} notas`,
      scaleNotesIntervals: 'Notas e Intervalos da Escala',
      improvisationNote: 'Dica de Improvisação',
      character: 'Caráter:',
      fivePositionsTitle: 'Cinco Posições Conectadas no Braço',
      fivePositionsHint: 'Clique em qualquer nota para ouvir ou abra o desenho direto no braço completo.',
      play: 'Tocar',
      stop: 'Parar',
      openOnFullNeck: 'Abrir no Braço',
      harmonizedChordsTitle: (root, scaleName) => `Campo Harmônico em ${root} ${scaleName}`,
      clickAuditionHint: 'Clique em um acorde para ouvir a sonoridade',
      positionLabel: (id) => `Posição ${id}`,
      roles: {
        Tonic: 'Tônica',
        Subdominant: 'Subdominante',
        Dominant: 'Dominante',
        Color: 'Cor',
      },
    },
    chordsView: {
      chordChartsTitle: (name) => `Acordes de ${name}`,
      playableVoicings: (c) => `${c} aberturas disponíveis`,
      strumDown: 'Batida Baixo',
      strumUp: 'Batida Cima',
      arpeggiate: 'Arpejar',
      open: 'Aberto',
      onTheNeckTitle: (name, voicing) => `${name} (${voicing}) no Braço`,
      onTheNeckHint: (root, scale) =>
        `As notas destacadas mostram o desenho do acorde; o fundo indica a escala compatível ${root} ${scale}.`,
      soloInScale: (root, scale) => `Solar em ${root} ${scale}`,
      addToGroup: 'Adicionar ao Grupo',
      addedFeedback: 'Adicionado',
      groupsTitle: 'Grupos de Acordes Salvos',
      groupsSubtitle: 'Grave aberturas de acordes em sequências próprias e toque em loop como uma base.',
      newGroupPlaceholder: 'Nome do grupo (ex. Refrão)',
      createGroup: 'Novo Grupo',
      renameGroup: 'Renomear',
      deleteGroup: 'Excluir',
      loadStarterGroup: 'Carregar Sequência Inicial',
      emptyGroupsHint: 'Crie um grupo ou carregue uma sequência inicial para gravar e tocar seus acordes.',
      emptyStepsHint: 'Nenhum acorde salvo neste grupo. Escolha uma abertura acima e clique em "Adicionar ao Grupo".',
      playGroup: 'Tocar Grupo',
      stopGroup: 'Parar Grupo',
      patternGroove: 'Levada Groove',
      patternDown: 'Batida',
      patternArpeggio: 'Arpejo',
      barsShort: (n) => `${n}c`,
      moveLeft: 'Mover antes',
      moveRight: 'Mover depois',
      removeStep: 'Remover acorde',
      defaultGroupName: 'Minha Sequência',
      starterGroupName: 'Rock Clássico (Am – F – C – G)',
    },
    tuner: {
      title: 'Afinador Cromático de Guitarra',
      autoStringDetect: 'Detecção Automática',
      lockedToString: (num, note) => `Travado na Corda ${num} (${note})`,
      enableMic: 'Ativar Microfone',
      stopMic: 'Parar Microfone',
      listening: 'Ouvindo — Toque uma Corda',
      micOff: 'Microfone Desligado',
      inTune: 'Afinado',
      flatTuneUp: 'Baixo — Aperte',
      sharpTuneDown: 'Alto — Afrouxe',
      cents: 'cents',
      referencePitch: 'Afinação de Referência (Lá4)',
      reset440: 'Resetar 440',
      noiseGate: 'Filtro de Ruído',
      tuningPresetTitle: 'Afinações e Notas de Referência',
      lockOrPlayHint: 'Clique na corda para travar o alvo ou toque a nota de referência',
      autoDetect: 'Automático',
      targetLocked: 'Alvo travado',
      activeDetected: 'Corda detectada',
      clickToLock: 'Clique para travar',
      pluck: 'Tocar',
      tone: 'Tom',
      mute: 'Silenciar',
      micUnavailable:
        'O acesso ao microfone não está disponível neste navegador. Use os tons de referência abaixo para afinar de ouvido.',
      micDenied:
        'Permissão do microfone negada. Libere no navegador ou use os tons de referência abaixo.',
      micOpenError:
        'Não foi possível abrir o microfone. Use os tons de referência abaixo para afinar de ouvido.',
    },
    scaleCategories: {
      'Pentatonic & Blues': 'Pentatônicas e Blues',
      Modes: 'Modos',
      'Minor & Jazz': 'Menores e Jazz',
      Exotic: 'Exóticas',
    },
    scaleNames: {
      minor_pentatonic: 'Pentatônica Menor',
      major_pentatonic: 'Pentatônica Maior',
      blues: 'Blues Menor',
      major_blues: 'Blues Maior',
      ionian: 'Maior (Jônio)',
      aeolian: 'Menor Natural (Eólio)',
      dorian: 'Dórico',
      mixolydian: 'Mixolídio',
      lydian: 'Lídio',
      phrygian: 'Frígio',
      locrian: 'Lócrio',
      harmonic_minor: 'Menor Harmônica',
      melodic_minor: 'Menor Melódica',
      phrygian_dominant: 'Frígio Dominante',
      lydian_dominant: 'Lídio Dominante',
      altered: 'Alterada (Super Lócrio)',
      hungarian_minor: 'Menor Húngara',
      hirajoshi: 'Hirajoshi',
    },
    scaleMoods: {
      minor_pentatonic: 'Rock, blues, soul, base versátil para solos',
      major_pentatonic: 'Brilhante, country, rock clássico e melódico',
      blues: 'Expressiva e rasgada para blues e rock',
      major_blues: 'Fraseado maior doce estilo BB King / Allman Brothers',
      ionian: 'Aberta, resolvida, pop e maior diatônica',
      aeolian: 'Expressiva, dramática, baladas rock e metal',
      dorian: 'Funk, rock latino, fusion e menor vibrante',
      mixolydian: 'Rock clássico, jam, funk e grooves dominantes 7',
      lydian: 'Sonhadora, cinematográfica, clima Satriani / Vai',
      phrygian: 'Sombria, flamenca e tensão metal',
      locrian: 'Instável, jazz m7b5 e metal progressivo',
      harmonic_minor: 'Neoclássica, gypsy jazz e menor dramática',
      melodic_minor: 'Jazz moderno, fusion e sonoridade menor-maior',
      phrygian_dominant: 'Flamenco, Oriente Médio e metal V7b9',
      lydian_dominant: 'Jazz moderno e cor 7#11',
      altered: 'Máxima tensão jazz resolvendo na tônica',
      hungarian_minor: 'Gótica, Leste Europeu, duas segundas aumentadas',
      hirajoshi: 'Pentatônica japonesa contemplativa e rock ambiente',
    },
    scaleTips: {
      minor_pentatonic: 'Faça bend da 4ª até a 5ª e resolva as frases com firmeza na Tônica ou b3.',
      major_pentatonic: 'Faça slide da 2ª para a 3ª Maior para um fraseado cantado; valorize a 6ª.',
      blues: 'Use a b5 como passagem cromática entre a 4ª e a 5ª sem repousar nela.',
      major_blues: 'Faça hammer-on rápido da b3 para a 3ª Maior sobre acordes I7 e IV7.',
      ionian: 'Mire na 3ª Maior e na 7ª nos tempos fortes; use a 4ª como nota de passagem.',
      aeolian: 'Valorize a queda emotiva de meio tom da b6 para a 5ª.',
      dorian: 'Destaque a 6ª maior contra a 3ª menor em bases i7–IV7 para o brilho dórico.',
      mixolydian: 'Misture a 3ª Maior com a 7ª menor para frases dominantes cheias de groove.',
      lydian: 'Sustente a #4 sobre acordes Maj7 para um efeito flutuante.',
      phrygian: 'Alterne entre b2 e Tônica com ligados rápidos para clima ibérico.',
      locrian: 'Contorne o arpejo meio-diminuto (R, b3, b5, b7) antes de resolver.',
      harmonic_minor: 'Explore o salto de 3 semitons entre b6 e 7ª Maior em cadências V7 → i.',
      melodic_minor: 'Combine a 3ª menor com a 6ª e 7ª maiores em linhas fluidas de fusion.',
      phrygian_dominant: 'Contraste a 3ª Maior com b2 e b6 sobre um pedal maior ou dominante.',
      lydian_dominant: 'Excelente sobre dominantes substitutos e acordes IV7 no jazz-blues.',
      altered: 'Pense na menor melódica meio tom acima da tônica V7 resolvendo no I.',
      hungarian_minor: 'Deslize pelos dois saltos aumentados (b3–#4 e b6–7) para máximo drama.',
      hirajoshi: 'Deixe os intervalos amplos soarem entre cordas vizinhas com vibrato suave.',
    },
    chordQualities: {
      major: 'Maior',
      minor: 'Menor',
      '7': 'Dominante 7',
      maj7: 'Maior 7',
      m7: 'Menor 7',
      sus2: 'Sus2',
      sus4: 'Sus4',
      add9: 'Add9',
      '5': 'Power (5)',
      dim7: 'Diminuto 7',
      m7b5: 'Meio-Dim (m7b5)',
      '9': 'Dominante 9',
    },
    intervalsFull: {
      0: 'Tônica',
      1: '2ª Menor',
      2: '2ª Maior',
      3: '3ª Menor',
      4: '3ª Maior',
      5: '4ª Justa',
      6: 'Trítono / b5',
      7: '5ª Justa',
      8: '6ª Menor',
      9: '6ª Maior',
      10: '7ª Menor',
      11: '7ª Maior',
    },
  },

  fr: {
    nav: {
      fretboard: 'Manche',
      scales: 'Gammes',
      chords: 'Accords',
      tuner: 'Accordeur',
      playScale: 'Jouer Gamme',
      stopScale: 'Arrêter',
      active: 'Actif',
      openMenu: 'Ouvrir le menu de navigation',
      closeMenu: 'Fermer le menu de navigation',
      language: 'Langue',
      notation: 'Notation',
    },
    fretboard: {
      overChord: 'sur',
      fullNeckRange: (f) => `Manche Complet (0–${f} Frettes)`,
      fretsRange: (s, e) => `Frettes ${s}–${e}`,
      electric: 'Électrique',
      acoustic: 'Acoustique',
      nylon: 'Classique',
      scaleRoot: 'Tonique de Gamme',
      chordRoot: (c) => `Tonique de ${c}`,
      chordTones: (c) => `Notes de ${c}`,
      targetChordTones: "Notes Cibles d'Accord",
      colorTone: 'Note Caractéristique',
      availableScaleNotes: 'Notes Disponibles',
      showChromaticMarkers: 'Afficher repères chromatiques',
      clickAnyFret: 'Cliquez sur une frette pour écouter',
      phrasingGuide: 'Conseil de phrasé :',
      viewAllBoxDiagrams: 'Voir les 5 positions →',
      keyboardActive: 'Manche Actif',
      keyboardPaused: 'Cliquez sur le manche pour activer',
      keyboardHint: '← / → pas à pas · Q–M jeu direct · Espace répéter',
      focusedNoteLabel: 'Sélection',
      stringShort: 'Cde',
      fretShort: 'Fr',
    },
    toolbar: {
      keyCenter: 'Tonalité',
      scaleMode: 'Gamme / Mode',
      tuning: 'Accordage',
      neckZone: 'Position',
      fullNeck: 'Manche Entier',
      posShort: (id) => `Pos ${id}`,
      notes: 'Notes',
      intervals: 'Intervalles',
      degrees: 'Degrés',
      targetChordTones: "Notes d'Accord",
      colorToneBtn: (label) => `Note Couleur (${label})`,
      keyHints: 'Touches (Q–M)',
      rosewood: 'Palissandre',
      ebony: 'Ébène',
      maple: 'Érable',
      leftHanded: 'Gaucher',
    },
    backing: {
      soloOverChordTones: 'Improviser sur les Accords',
      clickChordHint: 'Cliquez sur un accord pour illuminer ses notes cibles sur le manche',
      allScaleNotes: 'Toute la Gamme',
      jamBackingLoop: 'Boucle d’Accompagnement',
      tempo: 'Tempo',
      playGroove: 'Lancer la Boucle',
      stopLoop: 'Arrêter',
    },
    scalesView: {
      diagramsTitle: (root, scaleName) => `Diagrammes ${root} ${scaleName}`,
      notesCount: (c) => `${c} notes`,
      scaleNotesIntervals: 'Notes et Intervalles de la Gamme',
      improvisationNote: "Conseil d'Improvisation",
      character: 'Caractère :',
      fivePositionsTitle: 'Cinq Positions Connectées sur le Manche',
      fivePositionsHint: 'Cliquez sur une note pour l’entendre ou ouvrez la position sur le manche complet.',
      play: 'Jouer',
      stop: 'Arrêter',
      openOnFullNeck: 'Ouvrir sur le Manche',
      harmonizedChordsTitle: (root, scaleName) => `Accords Harmonisés en ${root} ${scaleName}`,
      clickAuditionHint: 'Cliquez sur un accord pour écouter sa couleur',
      positionLabel: (id) => `Position ${id}`,
      roles: {
        Tonic: 'Tonique',
        Subdominant: 'Sous-dom.',
        Dominant: 'Dominante',
        Color: 'Couleur',
      },
    },
    chordsView: {
      chordChartsTitle: (name) => `Grilles d'Accord ${name}`,
      playableVoicings: (c) => `${c} positions jouables`,
      strumDown: 'Gratter Bas',
      strumUp: 'Gratter Haut',
      arpeggiate: 'Arpéger',
      open: 'Ouvert',
      onTheNeckTitle: (name, voicing) => `${name} (${voicing}) sur le Manche`,
      onTheNeckHint: (root, scale) =>
        `Les notes mises en avant indiquent le doigté ; le fond trace la gamme compatible ${root} ${scale}.`,
      soloInScale: (root, scale) => `Improviser en ${root} ${scale}`,
      addToGroup: 'Ajouter au Groupe',
      addedFeedback: 'Ajouté',
      groupsTitle: 'Groupes d’Accords Enregistrés',
      groupsSubtitle: 'Enregistrez vos accords en grilles personnalisées et jouez-les en boucle comme un groove.',
      newGroupPlaceholder: 'Nom du groupe (ex. Couplet)',
      createGroup: 'Nouveau Groupe',
      renameGroup: 'Renommer',
      deleteGroup: 'Supprimer',
      loadStarterGroup: 'Charger une Grille Exemple',
      emptyGroupsHint: 'Créez un groupe ou chargez une grille exemple pour enregistrer et lire vos suites d’accords.',
      emptyStepsHint: 'Aucun accord dans ce groupe. Choisissez une position ci-dessus puis cliquez sur "Ajouter au Groupe".',
      playGroup: 'Jouer le Groupe',
      stopGroup: 'Arrêter',
      patternGroove: 'Groove Rythmique',
      patternDown: 'Aller Simple',
      patternArpeggio: 'Arpège',
      barsShort: (n) => `${n}m`,
      moveLeft: 'Déplacer avant',
      moveRight: 'Déplacer après',
      removeStep: 'Retirer l’accord',
      defaultGroupName: 'Ma Grille',
      starterGroupName: 'Rock Classique (Am – F – C – G)',
    },
    tuner: {
      title: 'Accordeur Chromatique Guitare',
      autoStringDetect: 'Détection Auto',
      lockedToString: (num, note) => `Verrouillé sur Corde ${num} (${note})`,
      enableMic: 'Activer le Micro',
      stopMic: 'Couper le Micro',
      listening: 'À l’écoute — Jouez une Corde',
      micOff: 'Microphone Désactivé',
      inTune: 'Accordé',
      flatTuneUp: 'Trop Bas — Tendez',
      sharpTuneDown: 'Trop Haut — Détendez',
      cents: 'cents',
      referencePitch: 'Diapason de Référence (La4)',
      reset440: 'Réinitialiser 440',
      noiseGate: 'Seuil de Bruit',
      tuningPresetTitle: 'Accordages et Sons de Référence',
      lockOrPlayHint: 'Cliquez sur une corde pour la cibler ou écoutez la note de référence',
      autoDetect: 'Auto',
      targetLocked: 'Cible verrouillée',
      activeDetected: 'Corde détectée',
      clickToLock: 'Cliquer pour cibler',
      pluck: 'Pincer',
      tone: 'Son',
      mute: 'Couper',
      micUnavailable:
        'Le microphone n’est pas disponible dans ce navigateur. Utilisez les notes de référence ci-dessous pour accorder à l’oreille.',
      micDenied:
        'Accès au microphone refusé. Autorisez-le dans votre navigateur ou utilisez les notes de référence.',
      micOpenError:
        'Impossible d’ouvrir le microphone. Utilisez les notes de référence ci-dessous.',
    },
    scaleCategories: {
      'Pentatonic & Blues': 'Pentatoniques et Blues',
      Modes: 'Modes',
      'Minor & Jazz': 'Mineures et Jazz',
      Exotic: 'Exotiques',
    },
    scaleNames: {
      minor_pentatonic: 'Pentatonique Mineure',
      major_pentatonic: 'Pentatonique Majeure',
      blues: 'Blues Mineure',
      major_blues: 'Blues Majeure',
      ionian: 'Majeure (Ionien)',
      aeolian: 'Mineure Naturelle (Éolien)',
      dorian: 'Dorien',
      mixolydian: 'Mixolydien',
      lydian: 'Lydien',
      phrygian: 'Phrygien',
      locrian: 'Locrien',
      harmonic_minor: 'Mineure Harmonique',
      melodic_minor: 'Mineure Mélodique',
      phrygian_dominant: 'Phrygien Dominant',
      lydian_dominant: 'Lydien Dominant',
      altered: 'Altérée (Super Locrien)',
      hungarian_minor: 'Mineure Hongroise',
      hirajoshi: 'Hirajoshi',
    },
    scaleMoods: {
      minor_pentatonic: 'Rock, blues, soul, fondation polyvalente',
      major_pentatonic: 'Lumineuse, country, rock classique et mélodique',
      blues: 'Expressive et chantante pour le blues et le rock',
      major_blues: 'Phrasé majeur chaleureux façon BB King',
      ionian: 'Ouverte, résolue, pop et majeure diatonique',
      aeolian: 'Dramatique, ballades rock et metal',
      dorian: 'Funk, rock latin, fusion et mineur lumineux',
      mixolydian: 'Rock classique, jam, funk et accords 7e',
      lydian: 'Aérienne, cinématographique, ambiance Satriani',
      phrygian: 'Sombre, flamenco et tension metal',
      locrian: 'Instable, jazz m7b5 et metal progressif',
      harmonic_minor: 'Néoclassique, jazz manouche et mineur dramatique',
      melodic_minor: 'Jazz moderne, fusion et couleur mineur-majeur',
      phrygian_dominant: 'Flamenco, Moyen-Orient et metal V7b9',
      lydian_dominant: 'Jazz moderne et couleur 7#11',
      altered: 'Tension jazz maximale résolvant sur la tonique',
      hungarian_minor: 'Gothique, Europe de l’Est, deux secondes augmentées',
      hirajoshi: 'Pentatonique japonaise contemplative et rock ambiant',
    },
    scaleTips: {
      minor_pentatonic: 'Tirez la quarte d’un ton vers la quinte et résolvez vos phrases sur la Tonique ou la b3.',
      major_pentatonic: 'Glissez de la seconde vers la tierce majeure pour un jeu vocal ; appuyez-vous sur la sixte.',
      blues: 'Utilisez la b5 comme note de passage chromatique entre la quarte et la quinte.',
      major_blues: 'Faites un hammer-on rapide de la b3 vers la tierce majeure sur I7 et IV7.',
      ionian: 'Visez la tierce majeure et la septième sur les temps forts ; traitez la quarte comme note de passage.',
      aeolian: 'Mettez en valeur l’attraction expressive du demi-ton descendant de b6 vers la quinte.',
      dorian: 'Faites ressortir la sixte majeure face à la tierce mineure sur un vamp i7–IV7.',
      mixolydian: 'Associez tierce majeure et septième mineure pour des lignes dominantes pleines de groove.',
      lydian: 'Laissez chanter la #4 sur un accord Maj7 pour une couleur suspendue.',
      phrygian: 'Alternez vivement b2 et Tonique en pull-off pour une couleur ibérique immédiate.',
      locrian: 'Dessinez l’arpège demi-diminué (R, b3, b5, b7) avant de résoudre.',
      harmonic_minor: 'Exploitez l’intervalle de 3 demi-tons entre b6 et 7e majeure sur V7 → i.',
      melodic_minor: 'Marie tierce mineure, sixte majeure et septième majeure pour des lignes fusion fluides.',
      phrygian_dominant: 'Opposez la tierce majeure à la b2 et la b6 sur un bourdon majeur ou dominant.',
      lydian_dominant: 'Idéale sur les dominantes de substitution tritonique et les accords IV7.',
      altered: 'Pensez mineure mélodique un demi-ton au-dessus de la tonique V7 vers le I.',
      hungarian_minor: 'Glissez à travers les deux secondes augmentées (b3–#4 et b6–7) pour un jeu dramatique.',
      hirajoshi: 'Laissez résonner les grands intervalles sur cordes voisines avec un léger vibrato.',
    },
    chordQualities: {
      major: 'Majeur',
      minor: 'Mineur',
      '7': 'Dominante 7',
      maj7: 'Majeur 7',
      m7: 'Mineur 7',
      sus2: 'Sus2',
      sus4: 'Sus4',
      add9: 'Add9',
      '5': 'Quinte (5)',
      dim7: 'Diminué 7',
      m7b5: 'Demi-dim (m7b5)',
      '9': 'Dominante 9',
    },
    intervalsFull: {
      0: 'Tonique',
      1: '2de Mineure',
      2: '2de Majeure',
      3: '3ce Mineure',
      4: '3ce Majeure',
      5: '4te Juste',
      6: 'Triton / b5',
      7: '5te Juste',
      8: '6te Mineure',
      9: '6te Majeure',
      10: '7e Mineure',
      11: '7e Majeure',
    },
  },
};
