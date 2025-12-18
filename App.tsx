import React, { useState, useMemo, useRef, useCallback } from 'react';
import { Sidebar } from './components/Sidebar';
import { PromptModal } from './components/PromptModal';
import { Toast } from './components/Toast';
import { ConfirmDialog } from './components/ConfirmDialog';
import { Icons } from './components/Icons';
import { Dashboard } from './components/Dashboard';
import { ListView } from './components/ListView';
import { KnowledgeTable } from './components/KnowledgeTable';
import { CommandPalette } from './components/CommandPalette';
import { PromptCard } from './components/PromptCard';
import { Prompt, PromptFormData, Theme, PromptVersion } from './types';
import {
  STANDARD_CATEGORIES,
  SPECIAL_CATEGORY_TRASH,
  PromptView
} from './constants';
import { usePromptData } from './hooks/usePromptData';
import { useFilterState } from './hooks/useFilterState';
import { useThemeManager } from './hooks/useThemeManager';
import { useGlobalShortcuts } from './hooks/useGlobalShortcuts';

// Refined Themes - Professional & Aesthetic
const THEMES: Theme[] = [
    { 
        id: 'theme-default', 
        label: 'Obsidian', 
        colors: { brand: '#ff5252', bg: '#0a0a0b' },
        radius: '1rem',
        bgPattern: 'noise'
    },
    { 
        id: 'theme-midnight', 
        label: 'Ocean', 
        colors: { brand: '#0ea5e9', bg: '#020617' },
        radius: '0.5rem', 
        bgPattern: 'none'
    },
    { 
        id: 'theme-aurora', 
        label: 'Cosmic', 
        colors: { brand: '#d8b4fe', bg: '#0f0519' },
        radius: '1.5rem', 
        bgPattern: 'dots'
    },
    { 
        id: 'theme-terminal', 
        label: 'Matrix', 
        colors: { brand: '#22c55e', bg: '#000000' },
        radius: '0px', 
        bgPattern: 'grid'
    },
    { 
        id: 'theme-light', 
        label: 'Light', 
        colors: { brand: '#3b82f6', bg: '#ffffff' },
        radius: '0.75rem', 
        bgPattern: 'none'
    }
];

// Enhanced Ambient Background Component
const AmbientBackground = ({ themeId }: { themeId: string }) => {
    if (themeId === 'theme-terminal') return null; // Clean black for terminal

    return (
        <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
             {/* Enhanced Gradient Blobs with Better Movement */}
            <div className="absolute top-[-10%] left-[-10%] w-[600px] h-[600px] bg-brand-500/20 rounded-full mix-blend-screen filter blur-[140px] opacity-25 animate-blob"></div>
            <div className="absolute top-[20%] right-[-10%] w-[500px] h-[500px] bg-purple-500/18 rounded-full mix-blend-screen filter blur-[120px] opacity-25 animate-blob animation-delay-2000"></div>
            <div className="absolute bottom-[-10%] left-[20%] w-[700px] h-[700px] bg-blue-500/15 rounded-full mix-blend-screen filter blur-[160px] opacity-25 animate-blob animation-delay-4000"></div>
            <div className="absolute top-[50%] left-[50%] w-[400px] h-[400px] bg-cyan-500/12 rounded-full mix-blend-screen filter blur-[100px] opacity-20 animate-blob animation-delay-6000"></div>
            
            {/* Subtle Grid Overlay for Depth */}
            <div className="absolute inset-0 opacity-[0.02]" style={{
                backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
                                  linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
                backgroundSize: '50px 50px'
            }}></div>
        </div>
    );
};

const App: React.FC = () => {
  const {
    prompts,
    setPrompts,
    customCategories,
    setCustomCategories,
    activePrompts,
    allTags,
    topTags,
    categoryCounts
  } = usePromptData();

  const {
    selectedCategory,
    setSelectedCategory,
    selectedTag,
    setSelectedTag,
    searchQuery,
    setSearchQuery,
    currentView,
    setCurrentView,
    sortBy,
    setSortBy,
    sortOrder,
    setSortOrder,
    setGridPage,
    setListPage,
    filteredPrompts,
    pagedGridPrompts,
    pagedListPrompts,
    favoritesOnly,
    setFavoritesOnly,
    recentOnly,
    setRecentOnly
  } = useFilterState(prompts);

  const { currentThemeId, setCurrentThemeId, currentThemeObj } = useThemeManager(THEMES);

  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // Mobile sidebar state
  const [isDesktopSidebarOpen, setIsDesktopSidebarOpen] = useState(true); // Desktop sidebar state
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPrompt, setEditingPrompt] = useState<Prompt | null>(null);

  // Command Palette State
  const [isPaletteOpen, setIsPaletteOpen] = useState(false);

  // Import Loading State
  const [isImporting, setIsImporting] = useState(false);

  // Toast State
  const [toast, setToast] = useState<{ show: boolean; message: string; type?: 'success' | 'info' | 'error' }>({ 
    show: false, 
    message: '' 
  });
  
  // Confirm Dialog State
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    type?: 'danger' | 'warning' | 'info';
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
    type: 'warning'
  });
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const showToast = useCallback(
    (message: string, type: 'success' | 'info' | 'error' = 'success') => {
      setToast({ show: true, message, type });
    },
    []
  );

  // Determine prev/next prompts for the modal navigation
  const { prevPrompt, nextPrompt } = useMemo(() => {
      if (!editingPrompt) return { prevPrompt: null, nextPrompt: null };
      const currentIndex = filteredPrompts.findIndex(p => p.id === editingPrompt.id);
      if (currentIndex === -1) return { prevPrompt: null, nextPrompt: null };
      
      const prev = currentIndex > 0 ? filteredPrompts[currentIndex - 1] : null;
      const next = currentIndex < filteredPrompts.length - 1 ? filteredPrompts[currentIndex + 1] : null;
      return { prevPrompt: prev, nextPrompt: next };
  }, [filteredPrompts, editingPrompt]);

  const handleCreatePrompt = useCallback((data: PromptFormData) => {
    const newPrompt: Prompt = {
      ...data,
      id: crypto.randomUUID(),
      status: data.status || 'active',
      collectedAt: Date.now(),
      createdAt: Date.now(),
      updatedAt: Date.now(),
      history: []
    };
    setPrompts(prev => [newPrompt, ...prev]);
    showToast('Prompt created successfully');
  }, [showToast]);

  const handleUpdatePrompt = useCallback((data: PromptFormData) => {
    if (!editingPrompt) return;
    
    setPrompts(prev => prev.map(p => {
        if (p.id === editingPrompt.id) {
            // Smart Version Control Logic
            const contentChanged = p.content !== data.content;
            const systemChanged = p.systemInstruction !== data.systemInstruction;
            const configChanged = JSON.stringify(p.config) !== JSON.stringify(data.config);
            const examplesChanged = JSON.stringify(p.examples) !== JSON.stringify(data.examples);

            const shouldSnapshot = contentChanged || systemChanged || configChanged || examplesChanged;
            
            let newHistory = p.history || [];
            
            if (shouldSnapshot) {
                const snapshot: PromptVersion = {
                    timestamp: Date.now(),
                    content: p.content,
                    systemInstruction: p.systemInstruction,
                    examples: p.examples,
                    config: p.config,
                    title: p.title
                };
                 // Prepend new snapshot, keep last 10 versions
                newHistory = [snapshot, ...newHistory].slice(0, 10);
            }

            return { 
                ...p, 
                ...data, 
                history: newHistory,
                updatedAt: Date.now()
            };
        }
        return p;
    }));
    
    showToast('Prompt updated successfully');
  }, [editingPrompt, showToast]);

  const handleDuplicatePrompt = useCallback((data: PromptFormData) => {
      const newPrompt: Prompt = {
          ...data,
          title: `${data.title} (Copy)`,
          id: crypto.randomUUID(),
          status: data.status || 'active',
          createdAt: Date.now(),
          updatedAt: Date.now(),
          history: [] // Reset history on duplicate
      };
      setPrompts(prev => [newPrompt, ...prev]);
      showToast('Prompt duplicated successfully');
  }, [showToast]);

  const handleDuplicateFromCard = useCallback((id: string, e: React.MouseEvent) => {
      e.stopPropagation();
      const promptToClone = prompts.find(p => p.id === id);
      if (promptToClone) {
          const { id: _, createdAt: __, history: ___, deletedAt: ____, ...rest } = promptToClone;
          handleDuplicatePrompt(rest);
      }
  }, [prompts, handleDuplicatePrompt]);

  const handleDeletePrompt = useCallback((id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const prompt = prompts.find(p => p.id === id);
    if (!prompt) return;

    if (prompt.deletedAt) {
        // Permanent Delete
        setConfirmDialog({
            isOpen: true,
            title: 'Permanently Delete Prompt',
            message: 'This action cannot be undone. Are you sure you want to permanently delete this prompt?',
            type: 'danger',
            onConfirm: () => {
                setPrompts(prev => prev.filter(p => p.id !== id));
                showToast('Prompt permanently deleted', 'info');
                setConfirmDialog(prev => ({ ...prev, isOpen: false }));
            }
        });
    } else {
        // Soft Delete
        setPrompts(prev => prev.map(p => p.id === id ? { ...p, deletedAt: Date.now() } : p));
        showToast('Moved to Trash');
    }
  }, [prompts, showToast]);

  const handleRestorePrompt = useCallback((id: string, e: React.MouseEvent) => {
      e.stopPropagation();
      setPrompts(prev => prev.map(p => p.id === id ? { ...p, deletedAt: undefined } : p));
      showToast('Prompt restored');
  }, [showToast]);

  const toggleFavorite = useCallback((id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setPrompts(prev => prev.map(p => p.id === id ? { ...p, isFavorite: !p.isFavorite } : p));
  }, []);

  const copyToClipboard = useCallback((text: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text);
    showToast('Copied to clipboard');
  }, [showToast]);

  const handleExport = useCallback(() => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(prompts, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "promptray_backup.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
    showToast('Library exported', 'info');
  }, [prompts, showToast]);

  const handleImportClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleImportFile = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Check file size (10MB limit)
    const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
    if (file.size > MAX_FILE_SIZE) {
        showToast(`File too large. Maximum size is ${MAX_FILE_SIZE / (1024 * 1024)}MB`, 'error');
        event.target.value = '';
        return;
    }

    setIsImporting(true);
    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const importedData = JSON.parse(e.target?.result as string);
            if (Array.isArray(importedData)) {
                const existingIds = new Set(prompts.map(p => p.id));
                // Validate imported items
                const newItems = importedData.filter((p: any) => {
                    return (
                        !existingIds.has(p.id) && 
                        p.title && 
                        p.content &&
                        typeof p.title === 'string' &&
                        typeof p.content === 'string'
                    );
                });
                
                if (newItems.length === 0) {
                    showToast('No valid prompts found in file', 'info');
                } else {
                    setPrompts(prev => [...newItems, ...prev]);
                    showToast(`Imported ${newItems.length} prompt${newItems.length > 1 ? 's' : ''}`, 'success');
                }
            } else {
                showToast('Invalid file format: Expected an array of prompts', 'error');
            }
        } catch (error) {
            console.error('Import error:', error);
            const errorMsg = error instanceof Error ? error.message : 'Unknown error';
            showToast(`Failed to import: ${errorMsg}`, 'error');
        } finally {
            setIsImporting(false);
        }
    };
    reader.onerror = () => {
        showToast('Failed to read file', 'error');
        setIsImporting(false);
    };
    reader.readAsText(file);
    event.target.value = '';
  }, [prompts, showToast]);

  const handleAddCategory = useCallback((name: string) => {
      if (!(STANDARD_CATEGORIES as readonly string[]).includes(name) && !customCategories.includes(name)) {
          setCustomCategories(prev => [...prev, name]);
          showToast(`Category "${name}" added`);
      } else {
          showToast(`Category "${name}" already exists`, 'info');
      }
  }, [customCategories, showToast]);

  const handleDeleteCategory = useCallback((name: string) => {
      setConfirmDialog({
          isOpen: true,
          title: `Delete Category "${name}"`,
          message: `Prompts in this category will be moved to 'Misc'. Are you sure you want to delete this category?`,
          type: 'warning',
          onConfirm: () => {
              // Update prompts first
              setPrompts(prev => {
                  const updated = prev.map(p => p.category === name ? { ...p, category: 'Misc' } : p);
                  return updated;
              });
              // Then update categories
              setCustomCategories(prev => prev.filter(c => c !== name));
              // Update selected category if needed
              if (selectedCategory === name) {
                  setSelectedCategory('All');
              }
              // Clear tag selection if it was related to this category
              if (selectedTag) {
                  setSelectedTag(undefined);
              }
              showToast(`Category "${name}" deleted`);
              setConfirmDialog(prev => ({ ...prev, isOpen: false }));
          }
      });
  }, [selectedCategory, selectedTag, showToast]);

  const openEditModal = useCallback((prompt: Prompt) => {
    setEditingPrompt(prompt);
    setIsModalOpen(true);
  }, []);

  const openNewModal = useCallback(() => {
    setEditingPrompt(null);
    setIsModalOpen(true);
  }, []);

  // Global keyboard shortcuts
  useGlobalShortcuts({
    isModalOpen,
    isPaletteOpen,
    currentThemeId,
    themes: THEMES,
    setCurrentThemeId,
    setIsPaletteOpen,
    openNewModal,
    showToast
  });

  const navigatePrompt = useCallback((direction: 'next' | 'prev') => {
      if (direction === 'next' && nextPrompt) {
          setEditingPrompt(nextPrompt);
      } else if (direction === 'prev' && prevPrompt) {
          setEditingPrompt(prevPrompt);
      }
  }, [nextPrompt, prevPrompt]);

  const handleViewChange = useCallback((view: PromptView) => {
      setCurrentView(view);
      // Reset filters so the view always shows full coverage (user feedback)
      setSelectedCategory('All');
      setSelectedTag(undefined);
      setSearchQuery('');
      if (view === 'grid') setGridPage(1);
      if (view === 'list') setListPage(1);
  }, []);

    return (
    <div className={`flex h-screen w-full surface-shell ${currentThemeId === 'theme-light' ? 'text-slate-900' : 'text-slate-100'} overflow-hidden text-base transition-all duration-700 relative selection:bg-brand-500/30 animate-theme-transition`} style={{ fontFamily: 'var(--font-ui)' }}>
      
      {/* Enhanced Background Layer */}
      <AmbientBackground themeId={currentThemeId} />
      
      {/* Noise Texture Overlay with Better Blending */}
      <div className="bg-noise z-[1] opacity-50"></div>
      
      {/* Simplified texture overlay */}
      <div className={`absolute inset-0 pointer-events-none z-[1] opacity-10 transition-opacity duration-700 ${
          currentThemeObj.bgPattern === 'dots' ? 'bg-pattern-dots' : 
          currentThemeObj.bgPattern === 'grid' ? 'bg-pattern-grid' : ''
      }`}></div>
      
      <div className="absolute inset-0 pointer-events-none z-[1] bg-gradient-to-br from-brand-500/5 via-transparent to-purple-500/5"></div>

      <Sidebar 
        selectedCategory={selectedCategory} 
        selectedTag={selectedTag}
        onSelectCategory={useCallback((cat: string) => {
            setSelectedCategory(cat);
            if (currentView === 'dashboard') setCurrentView('grid');
        }, [currentView])}
        onSelectTag={setSelectedTag}
        counts={categoryCounts} 
        topTags={topTags}
        customCategories={customCategories}
        onAddCategory={handleAddCategory}
        onDeleteCategory={handleDeleteCategory}
        currentView={currentView}
        onViewChange={handleViewChange}
        isMobileOpen={isSidebarOpen}
        onCloseMobile={useCallback(() => setIsSidebarOpen(false), [])}
        isDesktopOpen={isDesktopSidebarOpen}
        onToggleDesktop={useCallback(() => setIsDesktopSidebarOpen(prev => !prev), [])}
      />

      <main className={`flex-1 relative z-10 flex flex-col transition-all duration-300 ${!isDesktopSidebarOpen ? 'w-full' : ''}`}>
        <div
          className={`w-full h-full flex flex-col overflow-hidden transition-all duration-700 ${
            !isDesktopSidebarOpen
              ? 'rounded-none border-0 mt-0 mb-0 shadow-none'
              : 'glass-panel border border-white/10 shadow-2xl rounded-3xl mt-4 md:mt-6 mb-4 md:mb-6 mx-4 md:mx-6 lg:mx-8'
          }`}
        >
        {/* Enhanced Top Bar - Glassmorphic with Better Depth */}
        <header className={`flex flex-col gap-4 md:flex-row md:items-center md:justify-between bg-gray-900/60 backdrop-blur-xl z-10 ${
          !isDesktopSidebarOpen 
            ? 'px-6 md:px-12 lg:px-16 py-4 md:py-5 border-b border-white/10 shadow-lg' 
            : 'px-5 md:px-8 py-4 md:py-5 border-b border-white/10 shadow-lg'
        }`}>
            <div className="flex items-center gap-3">
                <button onClick={() => setIsSidebarOpen(true)} className="md:hidden p-2 text-gray-400 hover:text-white rounded-lg border border-white/5 bg-white/5">
                    <Icons.Menu size={18} />
                </button>
                <div className={`relative w-full group ${!isDesktopSidebarOpen ? 'max-w-2xl' : 'max-w-xl'}`}>
                    <Icons.Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4 transition-colors group-focus-within:text-brand-500" />
                    <input 
                        type="text"
                    placeholder={selectedCategory === SPECIAL_CATEGORY_TRASH ? "Search deleted items..." : "Search prompts..."}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        disabled={currentView === 'dashboard'}
                        className="w-full bg-gray-900/70 border border-white/10 rounded-theme pl-10 pr-28 py-2.5 text-sm text-gray-200 focus:outline-none focus:border-brand-500/60 focus:bg-gray-900/90 focus:ring-2 focus:ring-brand-500/30 transition-all duration-300 shadow-md hover:shadow-lg hover:border-white/20 disabled:opacity-50 disabled:cursor-not-allowed placeholder:text-gray-500 backdrop-blur-sm"
                    />
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 hidden md:flex items-center gap-2 pointer-events-none">
                         <kbd className="bg-white/5 border border-white/10 rounded px-1.5 py-0.5 text-xs text-gray-500 font-mono">⌘K</kbd>
                         <span className="text-[10px] text-gray-600">Jump</span>
                    </div>
                </div>
                <button onClick={() => setIsPaletteOpen(true)} className="hidden md:flex p-2 text-gray-400 hover:text-white bg-white/5 rounded-theme border border-white/10">
                    <Icons.Command size={18} />
                </button>
            </div>
            
            <div className="flex items-center gap-2 md:gap-3">
                {/* Sort Controls - Only show in grid/list view */}
                {currentView !== 'dashboard' && (
                    <div className="hidden md:flex items-center gap-2 bg-white/5 rounded-theme border border-white/10 p-1 shadow-sm">
                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value as 'createdAt' | 'title' | 'category')}
                            className="bg-transparent text-xs text-gray-300 border-none outline-none cursor-pointer px-2 py-1"
                        >
                            <option value="createdAt">Date</option>
                            <option value="title">Title</option>
                            <option value="category">Category</option>
                        </select>
                        <button
                            onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
                            className="p-1.5 text-gray-400 hover:text-white transition-colors rounded-md hover:bg-white/5"
                            title={`Sort ${sortOrder === 'asc' ? 'Ascending' : 'Descending'}`}
                        >
                            {sortOrder === 'asc' ? <Icons.ArrowUp size={14} /> : <Icons.ArrowDown size={14} />}
                        </button>
                    </div>
                )}

                {/* Quick filters */}
                {currentView !== 'dashboard' && (
                  <div className="hidden md:flex items-center gap-2 bg-white/5 rounded-theme border border-white/10 p-1 shadow-sm">
                    <button
                      onClick={() => setFavoritesOnly(prev => !prev)}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-md border transition-all ${
                        favoritesOnly
                          ? 'bg-amber-500/20 text-amber-100 border-amber-400/40 shadow-sm'
                          : 'text-gray-300 hover:text-white hover:bg-white/5 border-transparent'
                      }`}
                    >
                      Favorites
                    </button>
                    <button
                      onClick={() => setRecentOnly(prev => !prev)}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-md border transition-all ${
                        recentOnly
                          ? 'bg-emerald-500/20 text-emerald-100 border-emerald-400/40 shadow-sm'
                          : 'text-gray-300 hover:text-white hover:bg-white/5 border-transparent'
                      }`}
                      title="Only show items updated in last 30 days"
                    >
                      Recent
                    </button>
                  </div>
                )}

                <input type="file" ref={fileInputRef} onChange={handleImportFile} className="hidden" accept=".json" />
                <div className="hidden md:flex bg-white/5 rounded-theme border border-white/10 p-0.5 shadow-sm">
                    <button 
                        onClick={handleImportClick} 
                        disabled={isImporting}
                        className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-theme transition-all disabled:opacity-50 disabled:cursor-not-allowed relative" 
                        title="Import JSON"
                    >
                        {isImporting ? (
                            <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                            <Icons.Upload size={16} />
                        )}
                    </button>
                    <div className="w-[1px] bg-white/10 my-1 mx-0.5"></div>
                    <button onClick={handleExport} className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-theme transition-all" title="Export JSON"><Icons.Download size={16} /></button>
                </div>
                <button 
                    onClick={openNewModal} 
                    className="btn-primary flex items-center gap-2 px-3 md:px-4 py-2 text-sm font-semibold relative overflow-hidden group shadow-lg shadow-brand-500/30"
                >
                    <span className="relative z-10 flex items-center gap-2">
                        <Icons.Plus size={16} className="transition-transform duration-300 group-hover:rotate-90" />
                        <span className="hidden sm:inline">Create</span>
                    </span>
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
                </button>
            </div>
        </header>

        {/* Content Area */}
        {currentView === 'dashboard' ? (
            <Dashboard 
                prompts={activePrompts}
                onOpenPrompt={openEditModal}
                onNavigateToCategory={(cat) => {
                    setSelectedCategory(cat);
                    setSelectedTag(undefined);
                    setCurrentView('grid');
                }}
                onNavigateToTag={(tag) => {
                    setSelectedTag(tag);
                    setSelectedCategory('All');
                    setCurrentView('grid');
                }}
            />
        ) : currentView === 'list' ? (
            <div className={`flex-1 overflow-y-auto custom-scrollbar scroll-smooth ${
                isDesktopSidebarOpen ? 'bg-gray-900/40 p-5 md:p-8' : 'bg-transparent p-0'
            }`}>
                <div className={`${isDesktopSidebarOpen ? 'max-w-[1500px] mx-auto px-4 md:px-6 lg:px-8' : 'w-full px-4 md:px-6 lg:px-8 xl:px-12'} w-full space-y-4`}>
                {/* Filter chips */}
                {(selectedTag || selectedCategory === SPECIAL_CATEGORY_TRASH || favoritesOnly || recentOnly) && (
                    <div className="flex items-center gap-2 animate-fade-in">
                        {selectedCategory === SPECIAL_CATEGORY_TRASH && (
                            <span className="flex items-center gap-1 bg-red-500/15 text-red-300 border border-red-500/25 px-3 py-1 rounded-full text-sm font-semibold">
                                <Icons.Trash size={14} /> Trash Bin
                            </span>
                        )}
                        {favoritesOnly && (
                          <span className="flex items-center gap-1 bg-amber-500/20 text-amber-100 border border-amber-400/40 px-3 py-1 rounded-full text-sm font-semibold">
                            <Icons.Star size={14} /> Favorites
                            <button onClick={() => setFavoritesOnly(false)} className="hover:text-amber-200/80"><Icons.Close size={12}/></button>
                          </span>
                        )}
                        {recentOnly && (
                          <span className="flex items-center gap-1 bg-emerald-500/15 text-emerald-100 border border-emerald-400/30 px-3 py-1 rounded-full text-sm font-semibold">
                            <Icons.Activity size={14} /> Recent 30d
                            <button onClick={() => setRecentOnly(false)} className="hover:text-emerald-200/80"><Icons.Close size={12}/></button>
                          </span>
                        )}
                        {selectedTag && (
                            <span className="flex items-center gap-1 bg-brand-500 text-white px-2 py-1 rounded-full text-sm font-semibold shadow-sm shadow-brand-500/40">
                                #{selectedTag} 
                                <button onClick={() => setSelectedTag(undefined)} className="hover:text-white/80"><Icons.Close size={14}/></button>
                            </span>
                        )}
                    </div>
                )}
                <ListView 
                    prompts={pagedListPrompts}
                    onOpenPrompt={openEditModal}
                    onToggleFavorite={toggleFavorite}
                    onDelete={handleDeletePrompt}
                    onDuplicate={handleDuplicateFromCard}
                    onRestore={selectedCategory === SPECIAL_CATEGORY_TRASH ? handleRestorePrompt : undefined}
                    isTrashView={selectedCategory === SPECIAL_CATEGORY_TRASH}
                />
                {pagedListPrompts.length < filteredPrompts.length && (
                  <div className="flex justify-center pt-4 pb-6">
                    <button
                      onClick={() => setListPage(prev => prev + 1)}
                      className="px-4 py-2 text-sm font-semibold rounded-theme bg-white/5 hover:bg-white/10 border border-white/10 text-gray-200 shadow-sm transition-all"
                    >
                      Load more ({pagedListPrompts.length}/{filteredPrompts.length})
                    </button>
                  </div>
                )}
                </div>
            </div>
        ) : currentView === 'table' ? (
            <div className={`flex-1 overflow-y-auto custom-scrollbar scroll-smooth ${
                isDesktopSidebarOpen ? 'bg-gray-900/40 p-5 md:p-8' : 'bg-transparent p-0'
            }`}>
                <div className={`${isDesktopSidebarOpen ? 'max-w-[1500px] mx-auto px-4 md:px-6 lg:px-8' : 'w-full px-4 md:px-6 lg:px-8 xl:px-12'} w-full space-y-4`}>
                    {(selectedTag || selectedCategory === SPECIAL_CATEGORY_TRASH || favoritesOnly || recentOnly) && (
                        <div className="flex items-center gap-2 animate-fade-in">
                            {selectedCategory === SPECIAL_CATEGORY_TRASH && (
                                <span className="flex items-center gap-1 bg-red-500/15 text-red-300 border border-red-500/25 px-3 py-1 rounded-full text-sm font-semibold">
                                    <Icons.Trash size={14} /> Trash Bin
                                </span>
                            )}
                            {favoritesOnly && (
                              <span className="flex items-center gap-1 bg-amber-500/20 text-amber-100 border border-amber-400/40 px-3 py-1 rounded-full text-sm font-semibold">
                                <Icons.Star size={14} /> Favorites
                                <button onClick={() => setFavoritesOnly(false)} className="hover:text-amber-200/80"><Icons.Close size={12}/></button>
                              </span>
                            )}
                            {recentOnly && (
                              <span className="flex items-center gap-1 bg-emerald-500/15 text-emerald-100 border border-emerald-400/30 px-3 py-1 rounded-full text-sm font-semibold">
                                <Icons.Activity size={14} /> Recent 30d
                                <button onClick={() => setRecentOnly(false)} className="hover:text-emerald-200/80"><Icons.Close size={12}/></button>
                              </span>
                            )}
                            {selectedTag && (
                                <span className="flex items-center gap-1 bg-brand-500 text-white px-2 py-1 rounded-full text-sm font-semibold shadow-sm shadow-brand-500/40">
                                    #{selectedTag}
                                    <button onClick={() => setSelectedTag(undefined)} className="hover:text-white/80">
                                        <Icons.Close size={14} />
                                    </button>
                                </span>
                            )}
                        </div>
                    )}
                    <KnowledgeTable
                        prompts={filteredPrompts}
                        onOpenPrompt={openEditModal}
                    />
                </div>
            </div>
        ) : (
            <div className={`flex-1 overflow-y-auto custom-scrollbar scroll-smooth ${
                isDesktopSidebarOpen ? 'bg-gray-900/40 p-5 md:p-8' : 'bg-transparent p-0'
            }`}>
                <div
                  className={`${
                    isDesktopSidebarOpen
                      ? 'max-w-[1800px] mx-auto pl-3 pr-5 md:pl-4 md:pr-7 lg:pl-6 lg:pr-10 xl:pl-8 xl:pr-12'
                      : 'w-full px-4 md:px-6 lg:px-8 xl:px-14 2xl:px-20'
                  } w-full`}
                >
                {/* Grid View - Default，强调可扫描性与规则网格 */}
                {(selectedTag || selectedCategory === SPECIAL_CATEGORY_TRASH || favoritesOnly || recentOnly) && (
                    <div className="mb-3 flex items-center gap-2 animate-fade-in">
                        {selectedCategory === SPECIAL_CATEGORY_TRASH && (
                            <span className="flex items-center gap-1 bg-red-500/15 text-red-300 border border-red-500/25 px-3 py-1 rounded-full text-sm font-semibold">
                                <Icons.Trash size={14} /> Trash Bin
                            </span>
                        )}
                        {favoritesOnly && (
                          <span className="flex items-center gap-1 bg-amber-500/20 text-amber-100 border border-amber-400/40 px-3 py-1 rounded-full text-sm font-semibold">
                            <Icons.Star size={14} /> Favorites
                            <button onClick={() => setFavoritesOnly(false)} className="hover:text-amber-200/80"><Icons.Close size={12}/></button>
                          </span>
                        )}
                        {recentOnly && (
                          <span className="flex items-center gap-1 bg-emerald-500/15 text-emerald-100 border border-emerald-400/30 px-3 py-1 rounded-full text-sm font-semibold">
                            <Icons.Activity size={14} /> Recent 30d
                            <button onClick={() => setRecentOnly(false)} className="hover:text-emerald-200/80"><Icons.Close size={12}/></button>
                          </span>
                        )}
                        {selectedTag && (
                            <span className="flex items-center gap-1 bg-brand-500 text-white px-2 py-1 rounded-full text-sm font-semibold shadow-sm shadow-brand-500/40">
                                #{selectedTag} 
                                <button onClick={() => setSelectedTag(undefined)} className="hover:text-white/80"><Icons.Close size={14}/></button>
                            </span>
                        )}
                    </div>
                )}
                <div
                  className={`grid pb-16 auto-rows-[minmax(260px,_auto)] ${
                    isDesktopSidebarOpen
                      ? 'grid-cols-[repeat(auto-fit,minmax(320px,_1fr))] gap-6 md:gap-6'
                      : 'grid-cols-[repeat(auto-fit,minmax(320px,_1fr))] gap-5 md:gap-6'
                  }`}
                >
                    {filteredPrompts.length === 0 ? (
                        <div className="col-span-full flex flex-col items-center justify-center h-80 text-gray-500 animate-slide-up-fade">
                            <div className="w-20 h-20 rounded-full bg-white/8 backdrop-blur-sm border border-white/10 flex items-center justify-center mb-6 shadow-lg transform hover:scale-110 transition-transform duration-300">
                                {selectedCategory === 'Trash' ? <Icons.Trash size={28} className="opacity-50" /> : <Icons.Search size={28} className="opacity-50" />}
                            </div>
                            <p className="text-lg font-semibold text-gray-300 mb-2">{selectedCategory === 'Trash' ? 'Trash is empty' : 'No prompts found'}</p>
                            <p className="text-sm text-gray-500 mb-4">Try adjusting your filters or create a new prompt</p>
                            {(searchQuery || selectedTag) && (
                                <button 
                                    onClick={() => { setSearchQuery(''); setSelectedTag(undefined); }} 
                                    className="mt-2 px-4 py-2 bg-brand-500/20 hover:bg-brand-500/30 text-brand-100 rounded-theme border border-brand-500/30 hover:border-brand-500/50 transition-all duration-300 text-sm font-semibold transform hover:scale-105"
                                >
                                    Clear filters
                                </button>
                            )}
                        </div>
                    ) : (
                        pagedGridPrompts.map((prompt, index) => {
                            const isTrash = selectedCategory === SPECIAL_CATEGORY_TRASH;
                            const cardVariant = currentThemeId === 'theme-light' ? 'light' : currentThemeId === 'theme-aurora' ? 'accent' : 'dark';
                            return (
                                <PromptCard
                                    key={prompt.id}
                                    prompt={prompt}
                                    index={index}
                                    isTrash={isTrash}
                                    onOpen={openEditModal}
                                    onToggleFavorite={toggleFavorite}
                                    onDuplicate={handleDuplicateFromCard}
                                    onDelete={handleDeletePrompt}
                                    onRestore={selectedCategory === SPECIAL_CATEGORY_TRASH ? handleRestorePrompt : undefined}
                                    onCopy={copyToClipboard}
                                    themeVariant={cardVariant}
                                />
                            );
                        })
                    )}
                </div>
                {pagedGridPrompts.length < filteredPrompts.length && (
                  <div className="flex justify-center pt-2 pb-6">
                    <button
                      onClick={() => setGridPage(prev => prev + 1)}
                      className="px-4 py-2 text-sm font-semibold rounded-theme bg-white/5 hover:bg-white/10 border border-white/10 text-gray-200 shadow-sm transition-all"
                    >
                      Load more ({pagedGridPrompts.length}/{filteredPrompts.length})
                    </button>
                  </div>
                )}
                </div>
            </div>
        )}

        <PromptModal 
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            onSave={editingPrompt ? handleUpdatePrompt : handleCreatePrompt}
            onDuplicate={handleDuplicatePrompt}
            onNotify={showToast}
            initialData={editingPrompt}
            allCategories={[...STANDARD_CATEGORIES, ...customCategories]}
            allAvailableTags={allTags}
            onNext={() => navigatePrompt('next')}
            onPrev={() => navigatePrompt('prev')}
            hasNext={!!nextPrompt}
            hasPrev={!!prevPrompt}
        />
        
        <CommandPalette 
            isOpen={isPaletteOpen}
            onClose={() => setIsPaletteOpen(false)}
            themes={THEMES}
            onSelectTheme={setCurrentThemeId}
            onNavigate={(view, cat) => {
                if (cat) {
                    setSelectedCategory(cat);
                    setSelectedTag(undefined);
                    setSearchQuery('');
                    setCurrentView(view);
                } else {
                    handleViewChange(view);
                }
            }}
            onAction={(action) => {
                if (action === 'create') openNewModal();
                if (action === 'import') handleImportClick();
                if (action === 'export') handleExport();
            }}
        />

        <Toast 
            message={toast.message} 
            isVisible={toast.show} 
            onClose={() => setToast(prev => ({ ...prev, show: false }))} 
            type={toast.type}
        />
        
        <ConfirmDialog
            isOpen={confirmDialog.isOpen}
            title={confirmDialog.title}
            message={confirmDialog.message}
            type={confirmDialog.type}
            onConfirm={confirmDialog.onConfirm}
            onCancel={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
        />
        </div>
      </main>
    </div>
  );
};

export default App;