import React, { useState } from 'react';
import { Icons, getIconForCategory } from './Icons';
import { Category, Theme } from '../types';

interface SidebarProps {
  selectedCategory: Category;
  onSelectCategory: (category: Category) => void;
  counts: Record<string, number>;
  customCategories: string[];
  onAddCategory: (name: string) => void;
  themes: Theme[];
  currentTheme: string;
  onSelectTheme: (themeId: string) => void;
}

const STANDARD_CATEGORIES = ['All', 'Code', 'Writing', 'Ideas', 'Analysis', 'Fun', 'Misc'];

export const Sidebar: React.FC<SidebarProps> = ({ 
    selectedCategory, 
    onSelectCategory, 
    counts,
    customCategories,
    onAddCategory,
    themes,
    currentTheme,
    onSelectTheme
}) => {
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

  const handleCreateCategory = (e: React.FormEvent) => {
      e.preventDefault();
      if (newCategoryName.trim()) {
          onAddCategory(newCategoryName.trim());
          setNewCategoryName('');
          setIsAddingCategory(false);
      }
  };

  const allCategories = [...STANDARD_CATEGORIES.filter(c => c !== 'All'), ...customCategories];

  return (
    <aside className="w-64 flex-shrink-0 bg-transparent h-screen flex flex-col pt-8 pb-4 z-20 relative">
      <div className="px-6 mb-10">
        <h1 className="text-xl font-black tracking-tight flex items-center gap-3">
           <div className="bg-gradient-to-br from-brand-500 to-purple-600 p-1.5 rounded-lg shadow-[0_0_15px_rgba(var(--c-brand),0.4)]">
                <Icons.Run className="w-5 h-5 text-white" />
           </div>
           <span className="bg-clip-text text-transparent bg-gradient-to-r from-gray-100 via-gray-300 to-gray-100 animate-shimmer bg-[length:200%_auto]">
             PromptRay
           </span>
        </h1>
      </div>

      <div className="px-3 flex-1 overflow-y-auto space-y-1 custom-scrollbar">
        {/* All Prompts Link */}
        <button
            onClick={() => onSelectCategory('All')}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-theme text-sm font-medium transition-all duration-300 group relative overflow-hidden
            ${selectedCategory === 'All'
                ? 'text-white shadow-[0_0_20px_rgba(var(--c-brand),0.15)] border border-brand-500/20' 
                : 'text-gray-400 hover:text-gray-100 hover:bg-white/5 border border-transparent'
            }`}
        >
            {selectedCategory === 'All' && (
                <div className="absolute inset-0 bg-gradient-to-r from-brand-500/10 to-transparent opacity-100"></div>
            )}
            <div className="flex items-center gap-3 relative z-10">
            <Icons.All size={18} className={`transition-colors duration-300 ${selectedCategory === 'All' ? 'text-brand-500 drop-shadow-[0_0_8px_rgba(var(--c-brand),0.5)]' : 'text-gray-500 group-hover:text-gray-300'}`} />
            <span>All Prompts</span>
            </div>
            {(counts['All'] || 0) > 0 && (
            <span className={`text-xs px-2 py-0.5 rounded-full relative z-10 transition-all ${selectedCategory === 'All' ? 'bg-brand-500 text-white shadow-sm' : 'bg-white/5 text-gray-500'}`}>
                {counts['All'] || 0}
            </span>
            )}
        </button>

        <div className="text-[11px] font-bold text-gray-600 uppercase tracking-widest px-3 mt-8 mb-3 flex items-center justify-between">
            <span>Library</span>
            <button 
                onClick={() => setIsAddingCategory(true)}
                className="hover:text-brand-500 transition-colors p-1 hover:bg-white/5 rounded"
                title="Add Category"
            >
                <Icons.Plus size={12} />
            </button>
        </div>
        
        {isAddingCategory && (
            <form onSubmit={handleCreateCategory} className="px-3 mb-2 animate-fade-in">
                <input 
                    autoFocus
                    type="text" 
                    value={newCategoryName}
                    onChange={e => setNewCategoryName(e.target.value)}
                    onBlur={() => !newCategoryName && setIsAddingCategory(false)}
                    placeholder="Name..."
                    className="w-full bg-gray-900/50 border border-brand-500/50 rounded-theme px-3 py-1.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-brand-500/50 shadow-inner"
                />
            </form>
        )}

        {allCategories.map((cat) => {
            const Icon = getIconForCategory(cat);
            const isSelected = selectedCategory === cat;
            const count = counts[cat] || 0;

            return (
            <button
                key={cat}
                onClick={() => onSelectCategory(cat)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-theme text-sm font-medium transition-all duration-300 group relative overflow-hidden
                ${isSelected 
                    ? 'text-white shadow-[0_0_20px_rgba(var(--c-brand),0.15)] border border-brand-500/20' 
                    : 'text-gray-400 hover:text-gray-100 hover:bg-white/5 border border-transparent'
                }`}
            >
                {isSelected && (
                    <div className="absolute inset-0 bg-gradient-to-r from-brand-500/10 to-transparent opacity-100"></div>
                )}
                <div className="flex items-center gap-3 relative z-10">
                <Icon size={18} className={`transition-colors duration-300 ${isSelected ? 'text-brand-500 drop-shadow-[0_0_8px_rgba(var(--c-brand),0.5)]' : 'text-gray-500 group-hover:text-gray-300'}`} />
                <span className="truncate max-w-[120px]">{cat}</span>
                </div>
                {count > 0 && (
                <span className={`text-xs px-2 py-0.5 rounded-full relative z-10 transition-all ${isSelected ? 'bg-brand-500 text-white shadow-sm' : 'bg-white/5 text-gray-500'}`}>
                    {count}
                </span>
                )}
            </button>
            );
        })}
      </div>

      {/* Theme Switcher Footer */}
      <div className="mt-auto px-6 pt-6 pb-6">
          <div className="flex items-center gap-2 text-[10px] font-bold text-gray-600 uppercase tracking-widest mb-4">
              <Icons.Palette size={12} /> Atmosphere
          </div>
          <div className="flex gap-3 justify-start">
              {themes.map(t => (
                  <button
                    key={t.id}
                    onClick={() => onSelectTheme(t.id)}
                    className={`relative w-8 h-8 flex items-center justify-center transition-all duration-300 group`}
                    title={t.label}
                  >
                      <div 
                        className={`absolute inset-0 transition-all duration-300 opacity-0 group-hover:opacity-100 blur-sm`}
                        style={{ backgroundColor: t.colors.brand }}
                      ></div>
                      <div 
                         className={`w-full h-full border relative z-10 flex items-center justify-center transition-transform duration-300 ${currentTheme === t.id ? 'scale-110 border-white shadow-lg' : 'border-transparent group-hover:scale-105'}`}
                         style={{ 
                            backgroundColor: t.colors.bg, 
                            borderColor: currentTheme === t.id ? t.colors.brand : 'rgba(255,255,255,0.1)',
                            borderRadius: t.radius
                         }}
                      >
                         <div 
                            className="w-2.5 h-2.5 shadow-sm" 
                            style={{ backgroundColor: t.colors.brand, borderRadius: t.radius === '0px' ? '0px' : '50%' }} 
                         />
                      </div>
                  </button>
              ))}
          </div>
      </div>
    </aside>
  );
};