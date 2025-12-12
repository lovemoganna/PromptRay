import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Sidebar } from './components/Sidebar';
import { PromptModal } from './components/PromptModal';
import { Toast } from './components/Toast';
import { Icons } from './components/Icons';
import { Prompt, PromptFormData, Theme } from './types';
import { getPrompts, savePrompts, getCustomCategories, saveCustomCategories, getUserTheme, saveUserTheme } from './services/storageService';

// Comprehensive Atmosphere Definitions
const THEMES: Theme[] = [
    { 
        id: 'theme-default', 
        label: 'Default', 
        colors: { brand: '#FF6363', bg: '#0c0c0e' },
        radius: '1rem',
        bgPattern: 'noise'
    },
    { 
        id: 'theme-midnight', 
        label: 'Midnight', 
        colors: { brand: '#38bdf8', bg: '#020617' },
        radius: '0.375rem', 
        bgPattern: 'none'
    },
    { 
        id: 'theme-aurora', 
        label: 'Aurora', 
        colors: { brand: '#d8b4fe', bg: '#140f19' },
        radius: '1.5rem', 
        bgPattern: 'dots'
    },
    { 
        id: 'theme-terminal', 
        label: 'Terminal', 
        colors: { brand: '#4ade80', bg: '#050505' },
        radius: '0px', 
        bgPattern: 'grid'
    }
];

const STANDARD_CATEGORIES = ['Code', 'Writing', 'Ideas', 'Analysis', 'Fun', 'Misc'];

const PromptContentPreview: React.FC<{ content: string }> = ({ content }) => {
    const parts = content.split(/(\{.*?\})/g);
    return (
        <code className="text-xs text-gray-400 font-mono break-words line-clamp-4 relative z-10">
            {parts.map((part, i) => {
                if (part.startsWith('{') && part.endsWith('}')) {
                    return <span key={i} className="text-brand-500 font-semibold bg-brand-500/10 rounded px-0.5">{part}</span>;
                }
                return part;
            })}
        </code>
    );
};

// Ambient Background Component
const AmbientBackground = ({ themeId }: { themeId: string }) => {
    if (themeId === 'theme-terminal') return null; // Clean black for terminal

    return (
        <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
             {/* Gradient Blobs */}
            <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-brand-500/20 rounded-full mix-blend-screen filter blur-[100px] opacity-30 animate-blob"></div>
            <div className="absolute top-[20%] right-[-10%] w-[400px] h-[400px] bg-purple-500/20 rounded-full mix-blend-screen filter blur-[100px] opacity-30 animate-blob animation-delay-2000"></div>
            <div className="absolute bottom-[-10%] left-[20%] w-[600px] h-[600px] bg-blue-500/10 rounded-full mix-blend-screen filter blur-[120px] opacity-30 animate-blob animation-delay-4000"></div>
        </div>
    );
};

const App: React.FC = () => {
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [customCategories, setCustomCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentThemeId, setCurrentThemeId] = useState<string>('theme-default');
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPrompt, setEditingPrompt] = useState<Prompt | null>(null);

  // Toast State
  const [toast, setToast] = useState<{ show: boolean; message: string; type?: 'success' | 'info' }>({ 
    show: false, 
    message: '' 
  });
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load initial data
  useEffect(() => {
    setPrompts(getPrompts());
    setCustomCategories(getCustomCategories());
    const savedTheme = getUserTheme();
    setCurrentThemeId(savedTheme);
  }, []);

  // Persist data
  useEffect(() => {
    savePrompts(prompts);
  }, [prompts]);
  
  useEffect(() => {
      saveCustomCategories(customCategories);
  }, [customCategories]);

  // Apply Theme & Atmosphere
  useEffect(() => {
      const root = document.documentElement;
      THEMES.forEach(t => root.classList.remove(t.id));
      root.classList.add(currentThemeId);
      saveUserTheme(currentThemeId);
  }, [currentThemeId]);

  const currentThemeObj = useMemo(() => 
      THEMES.find(t => t.id === currentThemeId) || THEMES[0], 
  [currentThemeId]);

  const showToast = (message: string, type: 'success' | 'info' = 'success') => {
    setToast({ show: true, message, type });
  };

  const filteredPrompts = useMemo(() => {
    return prompts.filter(p => {
      const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory;
      const matchesSearch = 
        p.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
        p.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesCategory && matchesSearch;
    });
  }, [prompts, selectedCategory, searchQuery]);

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    const all = [...STANDARD_CATEGORIES, ...customCategories];
    all.forEach(c => counts[c] = 0);
    counts['All'] = 0;

    prompts.forEach(p => {
      counts[p.category] = (counts[p.category] || 0) + 1;
      counts['All'] += 1;
    });
    return counts;
  }, [prompts, customCategories]);

  const handleCreatePrompt = (data: PromptFormData) => {
    const newPrompt: Prompt = {
      ...data,
      id: crypto.randomUUID(),
      createdAt: Date.now()
    };
    setPrompts(prev => [newPrompt, ...prev]);
    showToast('Prompt created successfully');
  };

  const handleUpdatePrompt = (data: PromptFormData) => {
    if (!editingPrompt) return;
    setPrompts(prev => prev.map(p => p.id === editingPrompt.id ? { ...p, ...data } : p));
    showToast('Prompt updated');
  };

  const handleDuplicatePrompt = (data: PromptFormData) => {
      const newPrompt: Prompt = {
          ...data,
          title: `${data.title} (Copy)`,
          id: crypto.randomUUID(),
          createdAt: Date.now()
      };
      setPrompts(prev => [newPrompt, ...prev]);
      showToast('Prompt duplicated successfully');
  };

  const handleDuplicateFromCard = (id: string, e: React.MouseEvent) => {
      e.stopPropagation();
      const promptToClone = prompts.find(p => p.id === id);
      if (promptToClone) {
          const { id: _, createdAt: __, ...rest } = promptToClone;
          handleDuplicatePrompt(rest);
      }
  };

  const handleDeletePrompt = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this prompt?')) {
        setPrompts(prev => prev.filter(p => p.id !== id));
        showToast('Prompt deleted');
    }
  };

  const toggleFavorite = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setPrompts(prev => prev.map(p => p.id === id ? { ...p, isFavorite: !p.isFavorite } : p));
  };

  const copyToClipboard = (text: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text);
    showToast('Copied to clipboard');
  };

  const handleExport = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(prompts, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "promptray_backup.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
    showToast('Library exported', 'info');
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleImportFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const importedData = JSON.parse(e.target?.result as string);
            if (Array.isArray(importedData)) {
                const existingIds = new Set(prompts.map(p => p.id));
                const newItems = importedData.filter((p: any) => !existingIds.has(p.id) && p.title && p.content);
                
                setPrompts(prev => [...newItems, ...prev]);
                showToast(`Imported ${newItems.length} prompts`, 'success');
            } else {
                alert('Invalid file format');
            }
        } catch (error) {
            console.error(error);
            alert('Failed to parse JSON file');
        }
    };
    reader.readAsText(file);
    event.target.value = '';
  };

  const handleAddCategory = (name: string) => {
      if (!STANDARD_CATEGORIES.includes(name) && !customCategories.includes(name)) {
          setCustomCategories(prev => [...prev, name]);
          showToast(`Category "${name}" added`);
      } else {
          showToast(`Category "${name}" already exists`, 'info');
      }
  };

  const openEditModal = (prompt: Prompt) => {
    setEditingPrompt(prompt);
    setIsModalOpen(true);
  };

  const openNewModal = () => {
    setEditingPrompt(null);
    setIsModalOpen(true);
  };

  return (
    <div className="flex h-screen w-full bg-gray-950 text-gray-200 overflow-hidden font-sans transition-colors duration-700 relative selection:bg-brand-500/30">
      
      {/* Background Layer */}
      <AmbientBackground themeId={currentThemeId} />
      
      {/* Noise Texture Overlay */}
      <div className="bg-noise z-[1]"></div>
      
      {/* Static Pattern Overlay */}
      <div className={`absolute inset-0 pointer-events-none z-[1] opacity-20 ${
          currentThemeObj.bgPattern === 'dots' ? 'bg-pattern-dots' : 
          currentThemeObj.bgPattern === 'grid' ? 'bg-pattern-grid' : ''
      }`}></div>

      <Sidebar 
        selectedCategory={selectedCategory} 
        onSelectCategory={setSelectedCategory} 
        counts={categoryCounts} 
        customCategories={customCategories}
        onAddCategory={handleAddCategory}
        themes={THEMES}
        currentTheme={currentThemeId}
        onSelectTheme={setCurrentThemeId}
      />

      <main className="flex-1 flex flex-col h-full overflow-hidden relative z-10 glass-panel border-l border-white/5 shadow-2xl rounded-l-[0px] md:rounded-l-3xl ml-0 md:-ml-4 transition-all duration-500">
        {/* Top Bar - Glassmorphic */}
        <header className="flex items-center justify-between px-8 py-6 border-b border-white/5 bg-gray-950/40 backdrop-blur-md z-10">
            <div className="relative w-96 group">
                <Icons.Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4 transition-colors group-focus-within:text-brand-500" />
                <input 
                    type="text"
                    placeholder="Search prompts..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-gray-900/50 border border-white/10 rounded-theme pl-10 pr-4 py-2 text-sm text-gray-200 focus:outline-none focus:border-brand-500/50 focus:bg-gray-900 focus:ring-1 focus:ring-brand-500/20 transition-all shadow-sm"
                />
            </div>
            
            <div className="flex items-center gap-4">
                <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleImportFile} 
                    className="hidden" 
                    accept=".json"
                />
                
                <div className="flex bg-gray-900/50 rounded-theme border border-white/10 p-0.5 shadow-sm">
                    <button 
                        onClick={handleImportClick}
                        className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-theme transition-all"
                        title="Import JSON"
                    >
                        <Icons.Upload size={16} />
                    </button>
                    <div className="w-[1px] bg-white/10 my-1 mx-0.5"></div>
                    <button 
                        onClick={handleExport}
                        className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-theme transition-all"
                        title="Export JSON"
                    >
                        <Icons.Download size={16} />
                    </button>
                </div>

                <button 
                    onClick={openNewModal}
                    className="flex items-center gap-2 bg-white text-black px-4 py-2 rounded-theme text-sm font-bold hover:bg-gray-200 transition-all shadow-[0_0_15px_rgba(255,255,255,0.15)] hover:shadow-[0_0_20px_rgba(255,255,255,0.3)] transform hover:-translate-y-0.5"
                >
                    <Icons.Plus size={16} />
                    Create Prompt
                </button>
            </div>
        </header>

        {/* Scrollable Content Grid */}
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar scroll-smooth">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-20">
                {filteredPrompts.length === 0 ? (
                    <div className="col-span-full flex flex-col items-center justify-center h-64 text-gray-500 animate-slide-up-fade">
                        <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
                            <Icons.Search size={24} className="opacity-40" />
                        </div>
                        <p className="text-lg font-medium text-gray-400">No prompts found</p>
                        {searchQuery && <button onClick={() => setSearchQuery('')} className="mt-2 text-brand-500 hover:underline text-sm">Clear search query</button>}
                    </div>
                ) : (
                    filteredPrompts.map((prompt, index) => (
                        <div 
                            key={prompt.id}
                            onClick={() => openEditModal(prompt)}
                            className="group relative flex flex-col justify-between bg-gray-900/40 backdrop-blur-sm border border-white/5 rounded-theme p-5 hover:border-brand-500/30 hover:shadow-[0_8px_30px_rgb(0,0,0,0.12)] transition-all duration-300 cursor-pointer h-[280px] overflow-hidden animate-slide-up-fade"
                            style={{ animationDelay: `${index * 50}ms` }}
                        >
                            {/* Hover Glow Effect */}
                            <div className="absolute inset-0 bg-gradient-to-tr from-brand-500/0 via-brand-500/0 to-brand-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>

                            {/* Card Content */}
                            <div className="relative z-10">
                                <div className="flex items-start justify-between mb-3">
                                    <div className="flex items-center gap-2">
                                        <span className={`text-[10px] font-bold tracking-wider uppercase px-1.5 py-0.5 rounded border ${
                                            prompt.category === 'Code' ? 'text-blue-400 border-blue-400/20 bg-blue-400/10' :
                                            prompt.category === 'Writing' ? 'text-purple-400 border-purple-400/20 bg-purple-400/10' :
                                            'text-gray-400 border-gray-500/20 bg-gray-500/10'
                                        }`}>
                                            {prompt.category}
                                        </span>
                                        {prompt.isFavorite && <Icons.Star size={12} className="text-yellow-500 fill-yellow-500 drop-shadow-[0_0_8px_rgba(234,179,8,0.5)]" />}
                                    </div>
                                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity transform translate-x-2 group-hover:translate-x-0 duration-200">
                                        <button 
                                            onClick={(e) => toggleFavorite(prompt.id, e)}
                                            className="p-1.5 hover:bg-white/10 rounded-md text-gray-400 hover:text-yellow-400 transition-colors"
                                            title="Favorite"
                                        >
                                            <Icons.Star size={14} className={prompt.isFavorite ? "fill-yellow-500 text-yellow-500" : ""} />
                                        </button>
                                        <button 
                                            onClick={(e) => handleDuplicateFromCard(prompt.id, e)}
                                            className="p-1.5 hover:bg-white/10 rounded-md text-gray-400 hover:text-blue-400 transition-colors"
                                            title="Duplicate"
                                        >
                                            <Icons.CopyPlus size={14} />
                                        </button>
                                        <button 
                                            onClick={(e) => handleDeletePrompt(prompt.id, e)}
                                            className="p-1.5 hover:bg-white/10 rounded-md text-gray-400 hover:text-red-400 transition-colors"
                                            title="Delete"
                                        >
                                            <Icons.Delete size={14} />
                                        </button>
                                    </div>
                                </div>
                                <h3 className="font-semibold text-gray-100 mb-1 line-clamp-1 group-hover:text-brand-500 transition-colors">{prompt.title}</h3>
                                <p className="text-sm text-gray-500 mb-4 line-clamp-2 leading-relaxed">{prompt.description}</p>
                            
                                <div className="bg-gray-950/50 rounded-theme p-3 mb-4 border border-white/5 h-[80px] overflow-hidden relative shadow-inner group-hover:border-white/10 transition-colors">
                                    <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-gray-950/90 pointer-events-none" />
                                    <PromptContentPreview content={prompt.content} />
                                </div>
                            </div>

                            {/* Card Footer */}
                            <div className="relative z-10 flex items-center justify-between mt-auto pt-2 border-t border-white/5 group-hover:border-white/10 transition-colors">
                                <div className="flex gap-2 overflow-hidden">
                                    {prompt.tags.slice(0, 2).map(tag => (
                                        <span key={tag} className="text-[10px] text-gray-400 px-2 py-0.5 rounded-full border border-white/5 bg-white/5 truncate max-w-[80px]">
                                            #{tag}
                                        </span>
                                    ))}
                                    {prompt.tags.length > 2 && <span className="text-[10px] text-gray-500 self-center">+{prompt.tags.length - 2}</span>}
                                </div>
                                
                                <button 
                                    onClick={(e) => copyToClipboard(prompt.content, e)}
                                    className="p-2 rounded-theme text-gray-400 hover:text-white transition-all transform active:scale-90 hover:shadow-[0_0_10px_rgba(255,255,255,0.2)]"
                                    title="Copy Prompt"
                                >
                                    <Icons.Copy size={14} />
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>

        <PromptModal 
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            onSave={editingPrompt ? handleUpdatePrompt : handleCreatePrompt}
            onDuplicate={handleDuplicatePrompt}
            initialData={editingPrompt}
            allCategories={[...STANDARD_CATEGORIES, ...customCategories]}
        />
        
        <Toast 
            message={toast.message} 
            isVisible={toast.show} 
            onClose={() => setToast(prev => ({ ...prev, show: false }))} 
            type={toast.type}
        />
      </main>
    </div>
  );
};

export default App;