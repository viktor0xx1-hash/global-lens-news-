import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { translateText } from '../services/translationService';
import { UI_STRINGS } from '../lib/translations';

export type LanguageCode = 'en' | 'fa' | 'zh' | 'ru' | 'id' | 'de' | 'fi' | 'ka' | 'es' | 'fr' | 'ar' | 'tr' | 'pt';

export interface Language {
  code: LanguageCode;
  name: string;
  nativeName: string;
  dir?: 'ltr' | 'rtl';
}

export const languages: Language[] = [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'fa', name: 'Persian', nativeName: 'فارسی', dir: 'rtl' },
  { code: 'zh', name: 'Chinese', nativeName: '中文' },
  { code: 'ru', name: 'Russian', nativeName: 'Русский' },
  { code: 'id', name: 'Indonesian', nativeName: 'Bahasa Indonesia' },
  { code: 'de', name: 'German', nativeName: 'Deutsch' },
  { code: 'fi', name: 'Finnish', nativeName: 'Suomi' },
  { code: 'ka', name: 'Georgian', nativeName: 'ქართული' },
  { code: 'es', name: 'Spanish', nativeName: 'Español' },
  { code: 'fr', name: 'French', nativeName: 'Français' },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية', dir: 'rtl' },
  { code: 'tr', name: 'Turkish', nativeName: 'Türkçe' },
  { code: 'pt', name: 'Portuguese', nativeName: 'Português' },
];

interface LanguageContextType {
  currentLanguage: Language;
  setLanguage: (code: LanguageCode) => void;
  t: (text: string) => string;
  isTranslating: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [currentLanguage, setCurrentLanguage] = useState<Language>(languages[0]);
  const [translations, setTranslations] = useState<Record<string, string>>({});
  const [isTranslating, setIsTranslating] = useState(false);

  const setLanguage = (code: LanguageCode) => {
    const lang = languages.find(l => l.code === code);
    if (lang) {
      setCurrentLanguage(lang);
      document.documentElement.dir = lang.dir || 'ltr';
      document.documentElement.lang = lang.code;
    }
  };

  const t = useCallback((text: string) => {
    if (currentLanguage.code === 'en' || !text) return text;
    const translated = translations[text];
    return translated || text;
  }, [currentLanguage.code, translations]);

  // Combined effect for loading cache and background translation
  useEffect(() => {
    if (currentLanguage.code === 'en') {
      setTranslations({});
      setIsTranslating(false);
      return;
    }

    let isMounted = true;
    
    const startTranslation = async () => {
      // 1. Load from cache first
      const cacheKey = `translations_${currentLanguage.code}`;
      const cached = localStorage.getItem(cacheKey);
      let currentTranslations: Record<string, string> = {};
      
      if (cached) {
        currentTranslations = JSON.parse(cached);
        setTranslations(currentTranslations);
      } else {
        setTranslations({});
      }

      // 2. Identify what needs translation
      const stringsToTranslate = Object.keys(UI_STRINGS);
      setIsTranslating(true);
      
      const batchSize = 3; // Smaller batch size for better reliability
      let hasUpdates = false;

      for (let i = 0; i < stringsToTranslate.length; i += batchSize) {
        if (!isMounted) break;

        const batch = stringsToTranslate.slice(i, i + batchSize);
        const results = await Promise.all(batch.map(async (str) => {
          // Skip if already translated and valid
          if (currentTranslations[str] && currentTranslations[str] !== str) {
            return null;
          }

          try {
            const translated = await translateText(str, currentLanguage.name);
            if (translated && translated !== str) {
              return { str, translated };
            }
          } catch (e) {
            console.error(`[LanguageContext] Failed to translate "${str}":`, e);
          }
          return null;
        }));

        if (!isMounted) break;

        results.forEach(res => {
          if (res) {
            currentTranslations[res.str] = res.translated;
            hasUpdates = true;
          }
        });

        if (hasUpdates) {
          setTranslations({ ...currentTranslations });
          localStorage.setItem(cacheKey, JSON.stringify(currentTranslations));
          hasUpdates = false; // Reset for next batch
        }
      }
      
      if (isMounted) setIsTranslating(false);
    };

    startTranslation();
    
    return () => {
      isMounted = false;
    };
  }, [currentLanguage.code, currentLanguage.name]);

  return (
    <LanguageContext.Provider value={{ currentLanguage, setLanguage, t, isTranslating }}>
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
