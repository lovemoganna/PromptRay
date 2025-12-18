import { useEffect, useMemo, useState } from 'react';
import { Theme } from '../types';
import { getUserTheme, saveUserTheme } from '../services/storageService';

export const useThemeManager = (themes: Theme[]) => {
  const [currentThemeId, setCurrentThemeId] = useState<string>(() => getUserTheme());

  // Apply theme classes and persist selection
  useEffect(() => {
    const root = document.documentElement;
    themes.forEach(t => root.classList.remove(t.id));
    root.classList.add(currentThemeId);
    saveUserTheme(currentThemeId);
  }, [currentThemeId, themes]);

  const currentThemeObj = useMemo(
    () => themes.find(t => t.id === currentThemeId) || themes[0],
    [currentThemeId, themes]
  );

  return { currentThemeId, setCurrentThemeId, currentThemeObj };
};


