import { useEffect } from 'react';
import { Theme } from '../types';

interface UseGlobalShortcutsOptions {
  isModalOpen: boolean;
  isPaletteOpen: boolean;
  currentThemeId: string;
  themes: Theme[];
  setCurrentThemeId: (id: string) => void;
  setIsPaletteOpen: (value: boolean | ((prev: boolean) => boolean)) => void;
  openNewModal: () => void;
  showToast: (message: string, type?: 'success' | 'info' | 'error') => void;
}

export const useGlobalShortcuts = ({
  isModalOpen,
  isPaletteOpen,
  currentThemeId,
  themes,
  setCurrentThemeId,
  setIsPaletteOpen,
  openNewModal,
  showToast
}: UseGlobalShortcutsOptions) => {
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      // Open Command Palette: Cmd+K or Ctrl+K
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsPaletteOpen(prev => !prev);
      }
      // Create New Prompt: Cmd+J or Ctrl+J
      if ((e.metaKey || e.ctrlKey) && e.key === 'j' && !isModalOpen && !isPaletteOpen) {
        e.preventDefault();
        openNewModal();
      }
      // Cycle Themes: Press D (when not in input/textarea)
      if (e.key && e.key.toLowerCase() === 'd') {
        const target = e.target as HTMLElement;
        const tagName = target.tagName;
        const isInput =
          tagName === 'INPUT' ||
          tagName === 'TEXTAREA' ||
          tagName === 'SELECT' ||
          target.isContentEditable;

        if (!isInput && !isModalOpen && !isPaletteOpen) {
          e.preventDefault();
          const currentIndex = themes.findIndex(t => t.id === currentThemeId);
          const nextIndex = (currentIndex + 1) % themes.length;
          setCurrentThemeId(themes[nextIndex].id);
          showToast(`Theme: ${themes[nextIndex].label}`, 'info');
        }
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [isModalOpen, isPaletteOpen, currentThemeId, themes, setCurrentThemeId, setIsPaletteOpen, openNewModal, showToast]);
};
