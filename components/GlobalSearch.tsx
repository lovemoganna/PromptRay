import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Prompt } from '../types';
import { Icons, getIconForCategory } from './Icons';

interface GlobalSearchProps {
  isOpen: boolean;
  onClose: () => void;
  prompts: Prompt[];
  onSelectPrompt: (prompt: Prompt) => void;
  onNavigateToCategory: (category: string) => void;
  onNavigateToTag: (tag: string) => void;
  allCategories: string[];
}

type SearchResultType = 'prompt' | 'category' | 'tag' | 'action';

interface SearchResult {
  id: string;
  type: SearchResultType;
  title: string;
  subtitle?: string;
  icon: React.ReactNode;
  action: () => void;
  score: number; // For sorting results
}

const GlobalSearch: React.FC<GlobalSearchProps> = ({
  isOpen,
  onClose,
  prompts,
  onSelectPrompt,
  onNavigateToCategory,
  onNavigateToTag,
  allCategories
}) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  // Reset state when opened
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      // Focus input after a brief delay to ensure modal is rendered
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      switch (e.key) {
        case 'Escape':
          e.preventDefault();
          onClose();
          break;
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex(prev => Math.min(prev + 1, searchResults.length - 1));
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex(prev => Math.max(prev - 1, 0));
          break;
        case 'Enter':
          e.preventDefault();
          if (searchResults[selectedIndex]) {
            searchResults[selectedIndex].action();
          }
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, selectedIndex, onClose]);

  // Scroll selected result into view
  useEffect(() => {
    if (resultsRef.current && selectedIndex >= 0) {
      const selectedElement = resultsRef.current.children[selectedIndex] as HTMLElement;
      if (selectedElement) {
        selectedElement.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest'
        });
      }
    }
  }, [selectedIndex]);

  // Generate search results
  const searchResults = useMemo((): SearchResult[] => {
    if (!query.trim()) {
      // Default results when no query
      return [
        {
          id: 'action-create',
          type: 'action',
          title: '创建新提示词',
          subtitle: 'Create a new prompt',
          icon: <Icons.Plus size={16} className="text-green-400" />,
          action: () => {
            onClose();
            // This will be handled by parent component
            document.dispatchEvent(new CustomEvent('create-prompt'));
          },
          score: 100
        },
        {
          id: 'action-dashboard',
          type: 'action',
          title: '前往仪表板',
          subtitle: 'Go to dashboard',
          icon: <Icons.Dashboard size={16} className="text-blue-400" />,
          action: () => {
            onClose();
            document.dispatchEvent(new CustomEvent('navigate-dashboard'));
          },
          score: 90
        }
      ];
    }

    const results: SearchResult[] = [];
    const searchTerm = query.toLowerCase().trim();

    // Search prompts
    prompts.forEach(prompt => {
      if (prompt.deletedAt) return; // Skip deleted prompts

      const titleMatch = prompt.title.toLowerCase().includes(searchTerm);
      const descMatch = prompt.description.toLowerCase().includes(searchTerm);
      const contentMatch = prompt.content.toLowerCase().includes(searchTerm);
      const tagsMatch = prompt.tags.some(tag => tag.toLowerCase().includes(searchTerm));
      const categoryMatch = prompt.category.toLowerCase().includes(searchTerm);

      let score = 0;
      if (titleMatch) score += 10;
      if (descMatch) score += 5;
      if (contentMatch) score += 3;
      if (tagsMatch) score += 2;
      if (categoryMatch) score += 1;

      if (score > 0) {
        results.push({
          id: `prompt-${prompt.id}`,
          type: 'prompt',
          title: prompt.title,
          subtitle: `${prompt.category} • ${prompt.description.substring(0, 60)}${prompt.description.length > 60 ? '...' : ''}`,
          icon: React.createElement(getIconForCategory(prompt.category), { size: 16 }),
          action: () => {
            onSelectPrompt(prompt);
            onClose();
          },
          score
        });
      }
    });

    // Search categories
    allCategories.forEach(category => {
      if (category.toLowerCase().includes(searchTerm)) {
        const promptCount = prompts.filter(p => p.category === category && !p.deletedAt).length;
        results.push({
          id: `category-${category}`,
          type: 'category',
          title: category,
          subtitle: `${promptCount} 个提示词`,
          icon: React.createElement(getIconForCategory(category), { size: 16 }),
          action: () => {
            onNavigateToCategory(category);
            onClose();
          },
          score: 8
        });
      }
    });

    // Collect all unique tags
    const allTags = new Set<string>();
    prompts.forEach(prompt => {
      if (!prompt.deletedAt) {
        prompt.tags.forEach(tag => allTags.add(tag));
      }
    });

    // Search tags
    Array.from(allTags).forEach(tag => {
      if (tag.toLowerCase().includes(searchTerm)) {
        const promptCount = prompts.filter(p =>
          !p.deletedAt && p.tags.includes(tag)
        ).length;
        results.push({
          id: `tag-${tag}`,
          type: 'tag',
          title: tag,
          subtitle: `${promptCount} 个提示词`,
          icon: <Icons.Tag size={16} className="text-purple-400" />,
          action: () => {
            onNavigateToTag(tag);
            onClose();
          },
          score: 6
        });
      }
    });

    // Add actions
    if ('create'.includes(searchTerm) || 'new'.includes(searchTerm) || '新建'.includes(searchTerm)) {
      results.push({
        id: 'action-create',
        type: 'action',
        title: '创建新提示词',
        subtitle: 'Create a new prompt',
        icon: <Icons.Plus size={16} className="text-green-400" />,
        action: () => {
          onClose();
          document.dispatchEvent(new CustomEvent('create-prompt'));
        },
        score: 15
      });
    }

    // Sort by score (highest first)
    return results.sort((a, b) => b.score - a.score).slice(0, 20); // Limit to 20 results
  }, [query, prompts, allCategories, onSelectPrompt, onNavigateToCategory, onNavigateToTag, onClose]);

  const handleQueryChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
    setSelectedIndex(0); // Reset selection when query changes
  }, []);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-start justify-center pt-[20vh]">
      <div className="w-full max-w-2xl mx-4 bg-gray-900/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
        {/* Search Input */}
        <div className="p-4 border-b border-white/5">
          <div className="relative">
            <Icons.Search size={20} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={handleQueryChange}
              placeholder="搜索提示词、标签、分类..."
              className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-200"
            />
            <button
              onClick={onClose}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors duration-200"
            >
              <Icons.Close size={20} />
            </button>
          </div>
        </div>

        {/* Results */}
        <div
          ref={resultsRef}
          className="max-h-96 overflow-y-auto custom-scrollbar"
        >
          {searchResults.length === 0 ? (
            <div className="p-8 text-center text-gray-400">
              <Icons.Search size={48} className="mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">未找到结果</p>
              <p className="text-sm">尝试调整搜索词或创建新内容</p>
            </div>
          ) : (
            <div className="py-2">
              {searchResults.map((result, index) => (
                <button
                  key={result.id}
                  onClick={result.action}
                  className={`w-full px-4 py-3 flex items-center gap-4 hover:bg-white/5 transition-colors duration-150 ${
                    index === selectedIndex ? 'bg-white/10' : ''
                  }`}
                >
                  <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center">
                    {result.icon}
                  </div>
                  <div className="flex-1 text-left min-w-0">
                    <div className="text-white font-medium truncate">
                      {result.title}
                    </div>
                    {result.subtitle && (
                      <div className="text-gray-400 text-sm truncate">
                        {result.subtitle}
                      </div>
                    )}
                  </div>
                  <div className="flex-shrink-0 text-gray-500 text-xs">
                    {result.type === 'prompt' && '提示词'}
                    {result.type === 'category' && '分类'}
                    {result.type === 'tag' && '标签'}
                    {result.type === 'action' && '操作'}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-white/5 bg-white/5">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <div className="flex items-center gap-4">
              <span>↑↓ 选择</span>
              <span>↵ 确认</span>
              <span>⎋ 关闭</span>
            </div>
            <div>
              {searchResults.length > 0 && `${searchResults.length} 个结果`}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GlobalSearch;
