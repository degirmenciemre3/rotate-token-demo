import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { availableLanguages } from '../i18n';

const LanguageSwitcher: React.FC = () => {
  const { currentLanguage, setLanguage, t } = useLanguage();

  return (
    <div className="relative">
      <select
        value={currentLanguage}
        onChange={(e) => setLanguage(e.target.value as any)}
        className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md px-3 py-1 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        aria-label={t('common.language')}
      >
        {availableLanguages.map((lang) => (
          <option key={lang.code} value={lang.code}>
            {lang.nativeName}
          </option>
        ))}
      </select>
    </div>
  );
};

export default LanguageSwitcher;
