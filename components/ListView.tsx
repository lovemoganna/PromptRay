import React, { useState, useEffect, useRef } from 'react';
import { Prompt } from '../types';
import { Icons, getIconForCategory, getColorForCategory } from './Icons';

interface ListViewProps {
  prompts: Prompt[];
  onOpenPrompt: (prompt: Prompt) => void;
  onToggleFavorite: (id: string, e: React.MouseEvent) => void;
  onDelete: (id: string, e: React.MouseEvent) => void;
  onDuplicate: (id: string, e: React.MouseEvent) => void;
  onRestore?: (id: string, e: React.MouseEvent) => void;
  isTrashView?: boolean;
  // Bulk operations
  selectedPrompts?: string[];
  onSelectionChange?: (selectedIds: string[]) => void;
}

const ListViewComponent: React.FC<ListViewProps> = ({
    prompts,
    onOpenPrompt,
    onToggleFavorite,
    onDelete,
    onDuplicate,
    onRestore,
    isTrashView = false,
    selectedPrompts = [],
    onSelectionChange
}) => {
    const [selectedIndex, setSelectedIndex] = useState<number>(-1);
    const tableRef = useRef<HTMLTableElement>(null);

    // Handle selection changes
    const handleSelectPrompt = (promptId: string, selected: boolean) => {
        if (!onSelectionChange) return;

        if (selected) {
            onSelectionChange([...selectedPrompts, promptId]);
        } else {
            onSelectionChange(selectedPrompts.filter(id => id !== promptId));
        }
    };

    const handleSelectAll = () => {
        if (!onSelectionChange) return;

        if (selectedPrompts.length === prompts.length) {
            onSelectionChange([]);
        } else {
            onSelectionChange(prompts.map(p => p.id));
        }
    };

    // Keyboard Navigation and Selection
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (prompts.length === 0) return;

            // Only handle nav if not typing in an input
            const activeTag = document.activeElement?.tagName.toLowerCase();
            if (activeTag === 'input' || activeTag === 'textarea') return;

            // Selection shortcuts
            if (e.ctrlKey || e.metaKey) {
                if (e.key === 'a') {
                    e.preventDefault();
                    handleSelectAll();
                    return;
                }
            }

            // Delete selected items
            if (e.key === 'Delete' && selectedPrompts.length > 0 && !isTrashView) {
                e.preventDefault();
                // This will be handled by bulk actions
                return;
            }

            // Escape to clear selection
            if (e.key === 'Escape' && selectedPrompts.length > 0) {
                e.preventDefault();
                onSelectionChange?.([]);
                return;
            }

            // Navigation (only when no selection or single item selected)
            if (selectedPrompts.length <= 1) {
                if (e.key === 'ArrowDown') {
                    e.preventDefault();
                    setSelectedIndex(prev => (prev + 1) % prompts.length);
                } else if (e.key === 'ArrowUp') {
                    e.preventDefault();
                    setSelectedIndex(prev => (prev - 1 + prompts.length) % prompts.length);
                } else if (e.key === 'Enter') {
                    if (selectedIndex >= 0 && selectedIndex < prompts.length) {
                        e.preventDefault();
                        onOpenPrompt(prompts[selectedIndex]);
                    }
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [prompts, selectedIndex, onOpenPrompt, selectedPrompts, onSelectionChange, isTrashView]);

    // Reset selection when list changes
    useEffect(() => {
        setSelectedIndex(-1);
    }, [prompts.length]);

    if (prompts.length === 0) {
        return (
             <div className="flex flex-col items-center justify-center h-64 text-gray-500 animate-slide-up-fade">
                <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
                    {isTrashView ? <Icons.Trash size={24} className="opacity-40" /> : <Icons.List size={24} className="opacity-40" />}
                </div>
                <p className="text-lg font-medium text-gray-400">{isTrashView ? 'Trash is empty' : 'No prompts found'}</p>
            </div>
        );
    }

    return (
        <div className="w-full pb-20 animate-slide-up-fade">
            <div className="overflow-x-auto rounded-theme border border-white/5 bg-gray-900/40 backdrop-blur-sm">
                <table className="w-full text-left border-collapse" ref={tableRef}>
                    <thead>
                        <tr className="border-b border-white/5 bg-white/5 text-[10px] uppercase font-bold text-gray-500 tracking-wider">
                            {onSelectionChange && (
                                <th className="px-6 py-4 w-12 text-center">
                                    <input
                                        type="checkbox"
                                        checked={selectedPrompts.length === prompts.length && prompts.length > 0}
                                        onChange={handleSelectAll}
                                        className="rounded border-white/20 bg-white/10 text-blue-500 focus:ring-blue-500 focus:ring-2"
                                    />
                                </th>
                            )}
                            {!isTrashView && <th className="px-6 py-4 w-12 text-center hidden md:table-cell">Fav</th>}
                            <th className="px-6 py-4">Name / ID</th>
                            <th className="px-6 py-4 hidden md:table-cell">Category</th>
                            {!isTrashView && <th className="px-6 py-4 hidden md:table-cell">Tags</th>}
                            <th className="px-6 py-4 w-32 hidden md:table-cell">{isTrashView ? 'Deleted' : 'Model'}</th>
                            <th className="px-6 py-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {prompts.map((prompt, index) => {
                            const isSelected = index === selectedIndex;
                            const CategoryIcon = getIconForCategory(prompt.category);
                            const categoryColor = getColorForCategory(prompt.category);

                            return (
                                <tr
                                    key={prompt.id}
                                    onClick={() => onOpenPrompt(prompt)}
                                    className={`group transition-colors cursor-pointer ${
                                        isSelected
                                            ? 'bg-brand-500/10 border-l-2 border-brand-500'
                                            : 'hover:bg-white/5 border-l-2 border-transparent'
                                    }`}
                                    style={{ animationDelay: `${index * 30}ms` }}
                                >
                                    {onSelectionChange && (
                                        <td className="px-6 py-4 text-center" onClick={(e) => e.stopPropagation()}>
                                            <input
                                                type="checkbox"
                                                checked={selectedPrompts.includes(prompt.id)}
                                                onChange={(e) => handleSelectPrompt(prompt.id, e.target.checked)}
                                                className="rounded border-white/20 bg-white/10 text-blue-500 focus:ring-blue-500 focus:ring-2"
                                            />
                                        </td>
                                    )}
                                    {!isTrashView && (
                                        <td className="px-6 py-4 text-center hidden md:table-cell">
                                            <button 
                                                onClick={(e) => onToggleFavorite(prompt.id, e)}
                                                className="text-gray-600 hover:text-yellow-500 transition-colors focus:outline-none"
                                            >
                                                <Icons.Star 
                                                    size={16} 
                                                    className={prompt.isFavorite ? "fill-yellow-500 text-yellow-500" : ""} 
                                                />
                                            </button>
                                        </td>
                                    )}
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col gap-0.5">
                                            <div className="flex items-center gap-2">
                                                <span className={`font-medium transition-colors ${isSelected ? 'text-brand-500' : 'text-gray-200 group-hover:text-brand-500'}`}>
                                                    {prompt.title}
                                                </span>
                                                {prompt.status && !isTrashView && (
                                                    <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-semibold border border-white/10 text-gray-400 bg-white/5">
                                                        {prompt.status}
                                                    </span>
                                                )}
                                            </div>
                                            <span className="text-[10px] font-mono text-gray-600 truncate max-w-[150px]">
                                                {prompt.id}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 hidden md:table-cell">
                                        <div className="flex items-center gap-2">
                                            <CategoryIcon size={14} className={categoryColor} />
                                            <span className="text-xs text-gray-400 font-medium">{prompt.category}</span>
                                        </div>
                                    </td>
                                    {!isTrashView && (
                                        <td className="px-6 py-4 hidden md:table-cell">
                                            <div className="flex gap-1 flex-wrap max-w-[200px]">
                                                {prompt.tags.slice(0, 3).map(tag => (
                                                    <span key={tag} className="text-[10px] text-gray-500 px-1.5 py-0.5 rounded bg-white/5">
                                                        #{tag}
                                                    </span>
                                                ))}
                                                {prompt.tags.length > 3 && (
                                                    <span className="text-[10px] text-gray-600">+{prompt.tags.length - 3}</span>
                                                )}
                                            </div>
                                        </td>
                                    )}
                                    <td className="px-6 py-4 hidden md:table-cell">
                                        <div className="flex items-center gap-1.5 text-xs text-gray-500 font-mono">
                                            {isTrashView ? (
                                                <span>{prompt.deletedAt ? new Date(prompt.deletedAt).toLocaleDateString() : '-'}</span>
                                            ) : (
                                                <span>{prompt.config?.model?.includes('flash') ? 'Flash' : prompt.config?.model?.includes('pro') ? 'Pro' : 'Default'}</span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className={`flex items-center justify-end gap-2 transition-opacity ${isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                                            
                                            {isTrashView && onRestore && (
                                                <button 
                                                    onClick={(e) => onRestore(prompt.id, e)}
                                                    className="p-1.5 hover:bg-green-500/10 rounded text-gray-400 hover:text-green-400 transition-colors"
                                                    title="Restore"
                                                >
                                                    <Icons.Restore size={16} />
                                                </button>
                                            )}

                                            {!isTrashView && (
                                                <button 
                                                    onClick={(e) => onDuplicate(prompt.id, e)}
                                                    className="p-1.5 hover:bg-white/10 rounded text-gray-400 hover:text-blue-400 transition-colors"
                                                    title="Duplicate"
                                                >
                                                    <Icons.CopyPlus size={16} />
                                                </button>
                                            )}
                                            
                                            <button 
                                                onClick={(e) => onDelete(prompt.id, e)}
                                                className="p-1.5 hover:bg-red-500/10 rounded text-gray-400 hover:text-red-400 transition-colors"
                                                title={isTrashView ? "Delete Permanently" : "Delete"}
                                            >
                                                <Icons.Delete size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
            {prompts.length > 0 && (
                <div className="text-center mt-2 text-[10px] text-gray-600 font-mono">
                    Use <kbd className="bg-white/10 px-1 rounded">↑</kbd> <kbd className="bg-white/10 px-1 rounded">↓</kbd> to navigate, <kbd className="bg-white/10 px-1 rounded">Enter</kbd> to open
                </div>
            )}
        </div>
    );
};

export const ListView = React.memo(ListViewComponent);