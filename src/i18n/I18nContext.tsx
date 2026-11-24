import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { Locale, NoteNotation, TRANSLATIONS, TranslationBundle } from './translations';

const I18N_STORAGE_KEY = 'fretcraft_i18n_v1';

interface SavedI18n {
  locale: Locale;
  notation: NoteNotation;
}

function loadSavedI18n(): SavedI18n {
  try {
    const raw = window.localStorage.getItem(I18N_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<SavedI18n>;
      const validLocale: Locale =
        parsed.locale && parsed.locale in TRANSLATIONS ? parsed.locale : 'en';
      const validNotation: NoteNotation =
        parsed.notation === 'solfege' ? 'solfege' : 'letters';
      return { locale: validLocale, notation: validNotation };
    }
  } catch {
    // ignore storage errors
  }
  return { locale: 'en', notation: 'letters' };
}

interface I18nContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  notation: NoteNotation;
  setNotation: (notation: NoteNotation) => void;
  t: TranslationBundle;
}

const I18nContext = createContext<I18nContextValue | null>(null);

export const I18nProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const initial = useMemo(() => loadSavedI18n(), []);
  const [locale, setLocale] = useState<Locale>(initial.locale);
  const [notation, setNotation] = useState<NoteNotation>(initial.notation);

  useEffect(() => {
    document.documentElement.lang = locale;
    try {
      window.localStorage.setItem(
        I18N_STORAGE_KEY,
        JSON.stringify({ locale, notation })
      );
    } catch {
      // ignore storage errors
    }
  }, [locale, notation]);

  const value = useMemo<I18nContextValue>(
    () => ({
      locale,
      setLocale,
      notation,
      setNotation,
      t: TRANSLATIONS[locale],
    }),
    [locale, notation]
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
};

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    throw new Error('useI18n must be used inside I18nProvider');
  }
  return ctx;
}
