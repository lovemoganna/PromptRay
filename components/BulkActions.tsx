import React, { useState } from 'react';
import { Prompt } from '../types';
import { Icons } from './Icons';
import { ConfirmDialog } from './ConfirmDialog';

interface BulkActionsProps {
  selectedPrompts: Prompt[];
  onClearSelection: () => void;
  onToggleFavorite: (ids: string[], favorite: boolean) => void;
  onDelete: (ids: string[]) => void;
  onDuplicate: (ids: string[]) => void;
  onExport: (prompts: Prompt[], format: 'json' | 'csv' | 'markdown') => void;
  onAddTags: (ids: string[], tags: string[]) => void;
  onRemoveTags: (ids: string[], tags: string[]) => void;
  onMoveToCategory: (ids: string[], category: string) => void;
}

const BulkActions: React.FC<BulkActionsProps> = ({
  selectedPrompts,
  onClearSelection,
  onToggleFavorite,
  onDelete,
  onDuplicate,
  onExport,
  onAddTags,
  onRemoveTags,
  onMoveToCategory
}) => {
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [showTagManager, setShowTagManager] = useState(false);
  const [tagInput, setTagInput] = useState('');
  const [isAddingTags, setIsAddingTags] = useState(true);
  const [showCategoryManager, setShowCategoryManager] = useState(false);
  const [newCategory, setNewCategory] = useState('');

  if (selectedPrompts.length === 0) return null;

  const handleBulkDelete = () => {
    setShowConfirmDelete(true);
  };

  const confirmBulkDelete = () => {
    onDelete(selectedPrompts.map(p => p.id));
    setShowConfirmDelete(false);
    onClearSelection();
  };

  const handleBulkFavorite = (favorite: boolean) => {
    onToggleFavorite(selectedPrompts.map(p => p.id), favorite);
    onClearSelection();
  };

  const handleBulkDuplicate = () => {
    onDuplicate(selectedPrompts.map(p => p.id));
    onClearSelection();
  };

  const handleBulkExport = (format: 'json' | 'csv' | 'markdown') => {
    onExport(selectedPrompts, format);
    onClearSelection();
  };

  const handleTagOperation = () => {
    if (!tagInput.trim()) return;

    const tags = tagInput.split(',').map(tag => tag.trim()).filter(tag => tag);
    if (tags.length === 0) return;

    if (isAddingTags) {
      onAddTags(selectedPrompts.map(p => p.id), tags);
    } else {
      onRemoveTags(selectedPrompts.map(p => p.id), tags);
    }

    setTagInput('');
    setShowTagManager(false);
    onClearSelection();
  };

  const handleMoveToCategory = () => {
    if (!newCategory.trim()) return;

    onMoveToCategory(selectedPrompts.map(p => p.id), newCategory.trim());
    setNewCategory('');
    setShowCategoryManager(false);
    onClearSelection();
  };

  const favoriteCount = selectedPrompts.filter(p => p.isFavorite).length;
  const notFavoriteCount = selectedPrompts.length - favoriteCount;

  return (
    <>
      <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-40 bg-gray-900/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl p-4 min-w-96">
        <div className="flex items-center justify-between mb-3">
          <div className="text-white font-medium">
            已选择 {selectedPrompts.length} 个提示词
          </div>
          <button
            onClick={onClearSelection}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <Icons.Close size={20} />
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {/* Favorite Operations */}
          {favoriteCount > 0 && (
            <button
              onClick={() => handleBulkFavorite(false)}
              className="flex items-center gap-2 px-3 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-colors text-sm"
            >
              <Icons.Star size={14} />
              取消收藏 ({favoriteCount})
            </button>
          )}
          {notFavoriteCount > 0 && (
            <button
              onClick={() => handleBulkFavorite(true)}
              className="flex items-center gap-2 px-3 py-2 bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-400 rounded-lg transition-colors text-sm"
            >
              <Icons.Star size={14} />
              添加收藏 ({notFavoriteCount})
            </button>
          )}

          {/* Duplicate */}
          <button
            onClick={handleBulkDuplicate}
            className="flex items-center gap-2 px-3 py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded-lg transition-colors text-sm"
          >
            <Icons.Copy size={14} />
            批量复制
          </button>

          {/* Tag Management */}
          <button
            onClick={() => setShowTagManager(true)}
            className="flex items-center gap-2 px-3 py-2 bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 rounded-lg transition-colors text-sm"
          >
            <Icons.Tag size={14} />
            标签管理
          </button>

          {/* Category Management */}
          <button
            onClick={() => setShowCategoryManager(true)}
            className="flex items-center gap-2 px-3 py-2 bg-green-500/20 hover:bg-green-500/30 text-green-400 rounded-lg transition-colors text-sm"
          >
            <Icons.Folder size={14} />
            移动分类
          </button>

          {/* Export Options */}
          <button
            onClick={() => handleBulkExport('json')}
            className="flex items-center gap-2 px-3 py-2 bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-400 rounded-lg transition-colors text-sm"
          >
            <Icons.Download size={14} />
            导出JSON
          </button>

          <button
            onClick={() => handleBulkExport('csv')}
            className="flex items-center gap-2 px-3 py-2 bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-400 rounded-lg transition-colors text-sm"
          >
            <Icons.Download size={14} />
            导出CSV
          </button>

          <button
            onClick={() => handleBulkExport('markdown')}
            className="flex items-center gap-2 px-3 py-2 bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-400 rounded-lg transition-colors text-sm"
          >
            <Icons.Download size={14} />
            导出Markdown
          </button>

          {/* Delete */}
          <button
            onClick={handleBulkDelete}
            className="flex items-center gap-2 px-3 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-colors text-sm"
          >
            <Icons.Trash size={14} />
            批量删除
          </button>
        </div>

        {/* Keyboard Shortcuts Hint */}
        <div className="mt-3 text-xs text-gray-500 text-center">
          提示：按 Esc 取消选择 • 按 Delete 删除 • 按 Ctrl+A 全选
        </div>
      </div>

      {/* Tag Manager Modal */}
      {showTagManager && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-gray-900/95 backdrop-blur-xl border border-white/10 rounded-2xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-white mb-4">批量标签管理</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-300 mb-2">
                  操作类型
                </label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      checked={isAddingTags}
                      onChange={() => setIsAddingTags(true)}
                      className="text-blue-500"
                    />
                    <span className="text-white">添加标签</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      checked={!isAddingTags}
                      onChange={() => setIsAddingTags(false)}
                      className="text-blue-500"
                    />
                    <span className="text-white">移除标签</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-300 mb-2">
                  标签 (用逗号分隔)
                </label>
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  placeholder="例如：AI绘画, 艺术风格, 高质量"
                  className="w-full bg-white/10 border border-white/20 rounded px-3 py-2 text-white"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleTagOperation();
                    }
                  }}
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowTagManager(false)}
                className="flex-1 px-4 py-2 text-gray-400 hover:text-white transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleTagOperation}
                disabled={!tagInput.trim()}
                className="flex-1 px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
              >
                应用
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Category Manager Modal */}
      {showCategoryManager && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-gray-900/95 backdrop-blur-xl border border-white/10 rounded-2xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-white mb-4">移动到分类</h3>

            <div>
              <label className="block text-sm text-gray-300 mb-2">
                新分类名称
              </label>
              <input
                type="text"
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                placeholder="输入分类名称"
                className="w-full bg-white/10 border border-white/20 rounded px-3 py-2 text-white"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleMoveToCategory();
                  }
                }}
              />
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowCategoryManager(false)}
                className="flex-1 px-4 py-2 text-gray-400 hover:text-white transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleMoveToCategory}
                disabled={!newCategory.trim()}
                className="flex-1 px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
              >
                移动
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        isOpen={showConfirmDelete}
        title="确认批量删除"
        message={`确定要删除选中的 ${selectedPrompts.length} 个提示词吗？此操作无法撤销。`}
        type="danger"
        onConfirm={confirmBulkDelete}
        onCancel={() => setShowConfirmDelete(false)}
      />
    </>
  );
};

export default BulkActions;
