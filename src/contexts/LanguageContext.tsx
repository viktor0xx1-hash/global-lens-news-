import React, { createContext, useContext, useState, useCallback } from 'react';

export type LanguageCode = 'en';

export interface Language {
  code: LanguageCode;
  name: string;
  nativeName: string;
  dir?: 'ltr' | 'rtl';
}

export const languages: Language[] = [
  { code: 'en', name: 'English', nativeName: 'English' },
];

interface LanguageContextType {
  currentLanguage: Language;
  setLanguage: (code: LanguageCode) => void;
  t: (text: string) => string;
  isTranslating: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [currentLanguage] = useState<Language>(languages[0]);

  const setLanguage = () => {
    // No-op as only English is supported
  };

  const t = useCallback((text: string) => {
    return text;
  }, []);

  return (
    <LanguageContext.Provider value={{ currentLanguage, setLanguage, t, isTranslating: false }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
