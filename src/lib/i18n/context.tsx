'use client';

import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { translations, LanguageCode, SUPPORTED_LANGUAGES, LanguageOption } from './translations';

interface LanguageContextType {
  language: LanguageCode;
  setLanguage: (lang: LanguageCode) => void;
  t: typeof translations.en;
  supportedLanguages: LanguageOption[];
  formatCurrency: (amount: number) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<LanguageCode>('en');

  // Load language from localStorage on client mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('vyaparos_language') as LanguageCode;
      if (saved && (saved === 'en' || saved === 'hi' || saved === 'mr' || saved === 'hinglish')) {
        setLanguageState(saved);
      }
    } catch {
      // Ignore localStorage access issues
    }

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'vyaparos_language' && e.newValue) {
        const newLang = e.newValue as LanguageCode;
        if (newLang === 'en' || newLang === 'hi' || newLang === 'mr' || newLang === 'hinglish') {
          setLanguageState(newLang);
        }
      }
    };

    const handleCustomChange = () => {
      try {
        const saved = localStorage.getItem('vyaparos_language') as LanguageCode;
        if (saved && (saved === 'en' || saved === 'hi' || saved === 'mr' || saved === 'hinglish')) {
          setLanguageState(saved);
        }
      } catch {}
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('vyaparos_language_changed', handleCustomChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('vyaparos_language_changed', handleCustomChange);
    };
  }, []);

  const setLanguage = useCallback((lang: LanguageCode) => {
    setLanguageState(lang);
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem('vyaparos_language', lang);
        document.cookie = `vyaparos_language=${lang}; path=/; max-age=31536000; SameSite=Lax`;
        window.dispatchEvent(new Event('vyaparos_language_changed'));
      }
    } catch (e) {
      console.error('Failed to persist language:', e);
    }
  }, []);

  const currentTranslations = useMemo(() => {
    return translations[language] || translations.en;
  }, [language]);

  const formatCurrency = useCallback(
    (amount: number) => {
      const locale = language === 'hi' ? 'hi-IN' : language === 'mr' ? 'mr-IN' : 'en-IN';
      return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 2,
      }).format(amount);
    },
    [language]
  );

  const value = useMemo(
    () => ({
      language,
      setLanguage,
      t: currentTranslations,
      supportedLanguages: SUPPORTED_LANGUAGES,
      formatCurrency,
    }),
    [language, setLanguage, currentTranslations, formatCurrency]
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    return {
      language: 'en' as LanguageCode,
      setLanguage: () => {},
      t: translations.en,
      supportedLanguages: SUPPORTED_LANGUAGES,
      formatCurrency: (amount: number) => `₹${amount.toFixed(2)}`,
    };
  }
  return context;
}
