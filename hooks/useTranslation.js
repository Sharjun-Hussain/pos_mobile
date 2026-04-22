"use client";

import { useMemo } from 'react';
import { useSettingsStore } from '@/store/useSettingsStore';
import en from '@/messages/en.json';
import si from '@/messages/si.json';
import ta from '@/messages/ta.json';

const dictionaries = { en, si, ta };

export const useTranslation = () => {
  const { language } = useSettingsStore();

  const t = useMemo(() => {
    const dictionary = dictionaries[language] || dictionaries.en;

    return (keyPath) => {
      const keys = keyPath.split('.');
      let result = dictionary;

      for (const key of keys) {
        if (result[key] === undefined) {
          // Fallback to English if key missing in current language
          let englishFallback = dictionaries.en;
          for (const k of keys) {
            englishFallback = englishFallback ? englishFallback[k] : undefined;
          }
          return englishFallback || keyPath;
        }
        result = result[key];
      }

      return result;
    };
  }, [language]);

  return { t, language };
};
