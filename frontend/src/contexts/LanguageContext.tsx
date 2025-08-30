import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Language, translations, defaultLanguage } from '../i18n';

interface LanguageContextType {
  currentLanguage: Language;
  setLanguage: (language: Language) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

interface LanguageProviderProps {
  children: ReactNode;
}

export const LanguageProvider: React.FC<LanguageProviderProps> = ({ children }) => {
  const [currentLanguage, setCurrentLanguage] = useState<Language>(() => {
    const savedLanguage = localStorage.getItem('language') as Language;
    if (savedLanguage && savedLanguage in translations) {
      return savedLanguage;
    }
    
    // Check browser language
    const browserLanguage = navigator.language.split('-')[0] as Language;
    if (browserLanguage in translations) {
      return browserLanguage;
    }
    
    return defaultLanguage;
  });

  useEffect(() => {
    localStorage.setItem('language', currentLanguage);
  }, [currentLanguage]);

  const setLanguage = (language: Language) => {
    setCurrentLanguage(language);
  };

  const t = (key: string, params?: Record<string, string | number>): string => {
    try {
      const keys = key.split('.');
      let value: any = translations[currentLanguage];
      
      for (const k of keys) {
        if (value && typeof value === 'object' && k in value) {
          value = value[k];
        } else {
          value = translations.en;
          for (const fallbackKey of keys) {
            if (value && typeof value === 'object' && fallbackKey in value) {
              value = value[fallbackKey];
            } else {
              return key;
            }
          }
          break;
        }
      }

      if (typeof value !== 'string') {
        return key;
      }

      if (params) {
        return Object.entries(params).reduce((text, [param, replacement]) => {
          return text.replace(new RegExp(`{{${param}}}`, 'g'), String(replacement));
        }, value);
      }

      return value;
    } catch {
      return key;
    }
  };

  const value: LanguageContextType = {
    currentLanguage,
    setLanguage,
    t,
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

export const useTranslation = () => {
  const { t } = useLanguage();
  return { t };
};
