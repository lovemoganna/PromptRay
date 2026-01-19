import { useEffect } from 'react';
import { Theme } from '../types';

interface UseGlobalShortcutsOptions {
  isModalOpen: boolean;
  isPaletteOpen: boolean;
  isSearchOpen: boolean;
  currentThemeId: string;
  themes: Theme[];
  setCurrentThemeId: (id: string) => void;
  setIsPaletteOpen: (value: boolean | ((prev: boolean) => boolean)) => void;
  setIsSearchOpen: (value: boolean | ((prev: boolean) => boolean)) => void;
  openNewModal: () => void;
  showToast: (message: string, type?: 'success' | 'info' | 'error') => void;
}

export const useGlobalShortcuts = ({
  isModalOpen,
  isPaletteOpen,
  isSearchOpen,
  currentThemeId,
  themes,
  setCurrentThemeId,
  setIsPaletteOpen,
  setIsSearchOpen,
  openNewModal,
  showToast
}: UseGlobalShortcutsOptions) => {
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      // Open Global Search: Cmd+K or Ctrl+K (when not in modal)
      if ((e.metaKey || e.ctrlKey) && e.key === 'k' && !isModalOpen) {
        e.preventDefault();
        setIsSearchOpen(prev => !prev);
      }
      // Open Command Palette: Cmd+P or Ctrl+P
      if ((e.metaKey || e.ctrlKey) && e.key === 'p' && !isModalOpen && !isSearchOpen) {
        e.preventDefault();
        setIsPaletteOpen(prev => !prev);
      }
      // Create New Prompt: Cmd+J or Ctrl+J
      if ((e.metaKey || e.ctrlKey) && e.key === 'j' && !isModalOpen && !isPaletteOpen && !isSearchOpen) {
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

        if (!isInput && !isModalOpen && !isPaletteOpen && !isSearchOpen) {
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
  }, [isModalOpen, isPaletteOpen, isSearchOpen, currentThemeId, themes, setCurrentThemeId, setIsPaletteOpen, setIsSearchOpen, openNewModal, showToast]);
};
