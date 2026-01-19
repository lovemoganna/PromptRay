import React, { useState, useEffect, useMemo } from 'react';
import { Prompt } from '../types';
import { Icons } from './Icons';

export type FilterOperator = 'equals' | 'contains' | 'startsWith' | 'endsWith' | 'greaterThan' | 'lessThan' | 'between' | 'in' | 'notIn';
export type FilterLogic = 'AND' | 'OR';

export interface FilterCondition {
  id: string;
  field: string;
  operator: FilterOperator;
  value: any;
  value2?: any; // For between operator
  logic: FilterLogic;
}

export interface FilterPreset {
  id: string;
  name: string;
  description: string;
  conditions: FilterCondition[];
  isDefault?: boolean;
}

interface AdvancedFiltersProps {
  isOpen: boolean;
  onClose: () => void;
  prompts: Prompt[];
  onApplyFilters: (filteredPrompts: Prompt[]) => void;
  currentFilters: FilterCondition[];
  onFiltersChange: (filters: FilterCondition[]) => void;
}

const FIELD_OPTIONS = [
  { value: 'title', label: '标题', type: 'string' },
  { value: 'description', label: '描述', type: 'string' },
  { value: 'content', label: '内容', type: 'string' },
  { value: 'category', label: '分类', type: 'select' },
  { value: 'tags', label: '标签', type: 'multiSelect' },
  { value: 'outputType', label: '输出类型', type: 'select' },
  { value: 'applicationScene', label: '应用场景', type: 'select' },
  { value: 'isFavorite', label: '收藏状态', type: 'boolean' },
  { value: 'createdAt', label: '创建时间', type: 'date' },
  { value: 'updatedAt', label: '更新时间', type: 'date' },
  { value: 'recommendedModels', label: '推荐模型', type: 'multiSelect' },
];

const OPERATOR_OPTIONS = {
  string: [
    { value: 'equals', label: '等于' },
    { value: 'contains', label: '包含' },
    { value: 'startsWith', label: '开头是' },
    { value: 'endsWith', label: '结尾是' },
  ],
  select: [
    { value: 'equals', label: '等于' },
    { value: 'in', label: '在列表中' },
    { value: 'notIn', label: '不在列表中' },
  ],
  multiSelect: [
    { value: 'contains', label: '包含' },
    { value: 'in', label: '在列表中' },
    { value: 'notIn', label: '不在列表中' },
  ],
  boolean: [
    { value: 'equals', label: '等于' },
  ],
  date: [
    { value: 'equals', label: '等于' },
    { value: 'greaterThan', label: '晚于' },
    { value: 'lessThan', label: '早于' },
    { value: 'between', label: '介于' },
  ],
};

const AdvancedFilters: React.FC<AdvancedFiltersProps> = ({
  isOpen,
  onClose,
  prompts,
  onApplyFilters,
  currentFilters,
  onFiltersChange
}) => {
  const [conditions, setConditions] = useState<FilterCondition[]>(currentFilters);
  const [presets, setPresets] = useState<FilterPreset[]>([]);
  const [showPresets, setShowPresets] = useState(false);
  const [presetName, setPresetName] = useState('');

  // Load presets from localStorage
  useEffect(() => {
    const savedPresets = localStorage.getItem('filter-presets');
    if (savedPresets) {
      try {
        setPresets(JSON.parse(savedPresets));
      } catch (error) {
        console.warn('Failed to load filter presets:', error);
      }
    }
  }, []);

  // Save presets to localStorage
  const savePresets = (newPresets: FilterPreset[]) => {
    setPresets(newPresets);
    localStorage.setItem('filter-presets', JSON.stringify(newPresets));
  };

  // Get unique values for select fields
  const fieldValues = useMemo(() => {
    const values: Record<string, any[]> = {};

    prompts.forEach(prompt => {
      // Category
      if (!values.category) values.category = [];
      if (!values.category.includes(prompt.category)) {
        values.category.push(prompt.category);
      }

      // Tags
      if (!values.tags) values.tags = [];
      prompt.tags.forEach(tag => {
        if (!values.tags.includes(tag)) {
          values.tags.push(tag);
        }
      });

      // Output Type
      if (!values.outputType) values.outputType = [];
      if (prompt.outputType && !values.outputType.includes(prompt.outputType)) {
        values.outputType.push(prompt.outputType);
      }

      // Application Scene
      if (!values.applicationScene) values.applicationScene = [];
      if (prompt.applicationScene && !values.applicationScene.includes(prompt.applicationScene)) {
        values.applicationScene.push(prompt.applicationScene);
      }

      // Recommended Models
      if (!values.recommendedModels) values.recommendedModels = [];
      if (prompt.recommendedModels) {
        prompt.recommendedModels.forEach(model => {
          if (!values.recommendedModels.includes(model)) {
            values.recommendedModels.push(model);
          }
        });
      }
    });

    return values;
  }, [prompts]);

  // Apply filters and get filtered results
  const filteredPrompts = useMemo(() => {
    if (conditions.length === 0) return prompts;

    return prompts.filter(prompt => {
      return conditions.every((condition, index) => {
        const result = evaluateCondition(prompt, condition);
        const nextCondition = conditions[index + 1];

        if (!nextCondition) return result;

        if (nextCondition.logic === 'OR') {
          return result || evaluateCondition(prompt, nextCondition);
        }

        return result;
      });
    });
  }, [prompts, conditions]);

  const evaluateCondition = (prompt: Prompt, condition: FilterCondition): boolean => {
    const { field, operator, value, value2 } = condition;
    const fieldValue = (prompt as any)[field];

    switch (operator) {
      case 'equals':
        return fieldValue === value;
      case 'contains':
        if (Array.isArray(fieldValue)) {
          return fieldValue.some(item =>
            item.toLowerCase().includes(value.toLowerCase())
          );
        }
        return String(fieldValue || '').toLowerCase().includes(value.toLowerCase());
      case 'startsWith':
        return String(fieldValue || '').toLowerCase().startsWith(value.toLowerCase());
      case 'endsWith':
        return String(fieldValue || '').toLowerCase().endsWith(value.toLowerCase());
      case 'greaterThan':
        return new Date(fieldValue) > new Date(value);
      case 'lessThan':
        return new Date(fieldValue) < new Date(value);
      case 'between':
        return new Date(fieldValue) >= new Date(value) && new Date(fieldValue) <= new Date(value2);
      case 'in':
        if (Array.isArray(value)) {
          if (Array.isArray(fieldValue)) {
            return value.some(v => fieldValue.includes(v));
          }
          return value.includes(fieldValue);
        }
        return false;
      case 'notIn':
        if (Array.isArray(value)) {
          if (Array.isArray(fieldValue)) {
            return !value.some(v => fieldValue.includes(v));
          }
          return !value.includes(fieldValue);
        }
        return true;
      default:
        return true;
    }
  };

  const addCondition = () => {
    const newCondition: FilterCondition = {
      id: `condition-${Date.now()}`,
      field: 'title',
      operator: 'contains',
      value: '',
      logic: 'AND'
    };
    setConditions([...conditions, newCondition]);
  };

  const updateCondition = (id: string, updates: Partial<FilterCondition>) => {
    setConditions(conditions.map(cond =>
      cond.id === id ? { ...cond, ...updates } : cond
    ));
  };

  const removeCondition = (id: string) => {
    setConditions(conditions.filter(cond => cond.id !== id));
  };

  const savePreset = () => {
    if (!presetName.trim() || conditions.length === 0) return;

    const newPreset: FilterPreset = {
      id: `preset-${Date.now()}`,
      name: presetName.trim(),
      description: `${conditions.length} 个筛选条件`,
      conditions: [...conditions]
    };

    savePresets([...presets, newPreset]);
    setPresetName('');
  };

  const loadPreset = (preset: FilterPreset) => {
    setConditions(preset.conditions);
    setShowPresets(false);
  };

  const deletePreset = (presetId: string) => {
    savePresets(presets.filter(p => p.id !== presetId));
  };

  const applyFilters = () => {
    onFiltersChange(conditions);
    onApplyFilters(filteredPrompts);
    onClose();
  };

  const clearFilters = () => {
    setConditions([]);
    onFiltersChange([]);
    onApplyFilters(prompts);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-4xl bg-gray-900/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-white/5">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-white">高级筛选</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <Icons.Close size={24} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-hidden flex">
          {/* Main Content */}
          <div className="flex-1 flex flex-col">
            {/* Filter Conditions */}
            <div className="p-6 border-b border-white/5 flex-1 overflow-y-auto">
              <div className="space-y-4">
                {conditions.length === 0 ? (
                  <div className="text-center py-12 text-gray-400">
                    <Icons.Filter size={48} className="mx-auto mb-4 opacity-50" />
                    <p className="text-lg font-medium">暂无筛选条件</p>
                    <p className="text-sm">点击下方按钮添加筛选条件</p>
                  </div>
                ) : (
                  conditions.map((condition, index) => (
                    <div key={condition.id} className="bg-white/5 rounded-lg p-4">
                      <div className="flex items-center gap-4">
                        <select
                          value={condition.field}
                          onChange={(e) => updateCondition(condition.id, { field: e.target.value, operator: 'contains', value: '' })}
                          className="bg-white/10 border border-white/20 rounded px-3 py-2 text-white text-sm min-w-32"
                        >
                          {FIELD_OPTIONS.map(field => (
                            <option key={field.value} value={field.value}>
                              {field.label}
                            </option>
                          ))}
                        </select>

                        <select
                          value={condition.operator}
                          onChange={(e) => updateCondition(condition.id, { operator: e.target.value as FilterOperator })}
                          className="bg-white/10 border border-white/20 rounded px-3 py-2 text-white text-sm min-w-28"
                        >
                          {OPERATOR_OPTIONS[(FIELD_OPTIONS.find(f => f.value === condition.field)?.type as keyof typeof OPERATOR_OPTIONS) || 'string'].map((op: any) => (
                            <option key={op.value} value={op.value}>
                              {op.label}
                            </option>
                          ))}
                        </select>

                        {/* Value Input */}
                        <div className="flex-1 flex gap-2">
                          {condition.field === 'category' && (
                            <select
                              value={condition.value || ''}
                              onChange={(e) => updateCondition(condition.id, { value: e.target.value })}
                              className="flex-1 bg-white/10 border border-white/20 rounded px-3 py-2 text-white text-sm"
                            >
                              <option value="">选择分类</option>
                              {fieldValues.category?.map(cat => (
                                <option key={cat} value={cat}>{cat}</option>
                              ))}
                            </select>
                          )}

                          {condition.field === 'outputType' && (
                            <select
                              value={condition.value || ''}
                              onChange={(e) => updateCondition(condition.id, { value: e.target.value })}
                              className="flex-1 bg-white/10 border border-white/20 rounded px-3 py-2 text-white text-sm"
                            >
                              <option value="">选择输出类型</option>
                              {fieldValues.outputType?.map(type => (
                                <option key={type} value={type}>{type}</option>
                              ))}
                            </select>
                          )}

                          {condition.field === 'applicationScene' && (
                            <select
                              value={condition.value || ''}
                              onChange={(e) => updateCondition(condition.id, { value: e.target.value })}
                              className="flex-1 bg-white/10 border border-white/20 rounded px-3 py-2 text-white text-sm"
                            >
                              <option value="">选择应用场景</option>
                              {fieldValues.applicationScene?.map(scene => (
                                <option key={scene} value={scene}>{scene}</option>
                              ))}
                            </select>
                          )}

                          {condition.field === 'isFavorite' && (
                            <select
                              value={condition.value || ''}
                              onChange={(e) => updateCondition(condition.id, { value: e.target.value === 'true' })}
                              className="flex-1 bg-white/10 border border-white/20 rounded px-3 py-2 text-white text-sm"
                            >
                              <option value="">选择状态</option>
                              <option value="true">已收藏</option>
                              <option value="false">未收藏</option>
                            </select>
                          )}

                          {condition.field === 'tags' && (
                            <select
                              value={condition.value || ''}
                              onChange={(e) => updateCondition(condition.id, { value: e.target.value })}
                              className="flex-1 bg-white/10 border border-white/20 rounded px-3 py-2 text-white text-sm"
                            >
                              <option value="">选择标签</option>
                              {fieldValues.tags?.map(tag => (
                                <option key={tag} value={tag}>{tag}</option>
                              ))}
                            </select>
                          )}

                          {condition.field === 'recommendedModels' && (
                            <select
                              value={condition.value || ''}
                              onChange={(e) => updateCondition(condition.id, { value: e.target.value })}
                              className="flex-1 bg-white/10 border border-white/20 rounded px-3 py-2 text-white text-sm"
                            >
                              <option value="">选择模型</option>
                              {fieldValues.recommendedModels?.map(model => (
                                <option key={model} value={model}>{model}</option>
                              ))}
                            </select>
                          )}

                          {(condition.field === 'createdAt' || condition.field === 'updatedAt') && (
                            <input
                              type="date"
                              value={condition.value || ''}
                              onChange={(e) => updateCondition(condition.id, { value: e.target.value })}
                              className="flex-1 bg-white/10 border border-white/20 rounded px-3 py-2 text-white text-sm"
                            />
                          )}

                          {!['category', 'outputType', 'applicationScene', 'isFavorite', 'tags', 'recommendedModels', 'createdAt', 'updatedAt'].includes(condition.field) && (
                            <input
                              type="text"
                              value={condition.value || ''}
                              onChange={(e) => updateCondition(condition.id, { value: e.target.value })}
                              placeholder="输入值..."
                              className="flex-1 bg-white/10 border border-white/20 rounded px-3 py-2 text-white text-sm"
                            />
                          )}

                          {condition.operator === 'between' && (
                            <input
                              type="date"
                              value={condition.value2 || ''}
                              onChange={(e) => updateCondition(condition.id, { value2: e.target.value })}
                              className="flex-1 bg-white/10 border border-white/20 rounded px-3 py-2 text-white text-sm"
                            />
                          )}
                        </div>

                        {/* Logic and Actions */}
                        <div className="flex items-center gap-2">
                          {index < conditions.length - 1 && (
                            <select
                              value={condition.logic}
                              onChange={(e) => updateCondition(condition.id, { logic: e.target.value as FilterLogic })}
                              className="bg-white/10 border border-white/20 rounded px-2 py-1 text-white text-xs"
                            >
                              <option value="AND">AND</option>
                              <option value="OR">OR</option>
                            </select>
                          )}

                          <button
                            onClick={() => removeCondition(condition.id)}
                            className="text-red-400 hover:text-red-300 transition-colors"
                          >
                            <Icons.Trash size={16} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}

                <button
                  onClick={addCondition}
                  className="w-full py-3 border-2 border-dashed border-white/20 rounded-lg text-gray-400 hover:text-white hover:border-white/40 transition-colors flex items-center justify-center gap-2"
                >
                  <Icons.Plus size={20} />
                  添加筛选条件
                </button>
              </div>
            </div>

            {/* Results Preview */}
            <div className="p-4 border-t border-white/5">
              <div className="flex items-center justify-between text-sm text-gray-400">
                <span>筛选结果：{filteredPrompts.length} / {prompts.length} 个提示词</span>
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowPresets(!showPresets)}
                    className="px-3 py-1 bg-white/10 hover:bg-white/20 rounded text-xs transition-colors"
                  >
                    筛选方案
                  </button>
                  <button
                    onClick={clearFilters}
                    className="px-3 py-1 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded text-xs transition-colors"
                  >
                    清空筛选
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Presets Sidebar */}
          {showPresets && (
            <div className="w-80 border-l border-white/5 bg-white/5">
              <div className="p-4">
                <h3 className="text-lg font-medium text-white mb-4">筛选方案</h3>

                {/* Save Preset */}
                <div className="mb-4">
                  <input
                    type="text"
                    value={presetName}
                    onChange={(e) => setPresetName(e.target.value)}
                    placeholder="方案名称"
                    className="w-full bg-white/10 border border-white/20 rounded px-3 py-2 text-white text-sm mb-2"
                  />
                  <button
                    onClick={savePreset}
                    disabled={!presetName.trim() || conditions.length === 0}
                    className="w-full py-2 bg-blue-500/20 hover:bg-blue-500/30 disabled:opacity-50 disabled:cursor-not-allowed text-blue-400 rounded text-sm transition-colors"
                  >
                    保存当前筛选
                  </button>
                </div>

                {/* Preset List */}
                <div className="space-y-2">
                  {presets.map(preset => (
                    <div key={preset.id} className="bg-white/5 rounded p-3">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-white font-medium text-sm">{preset.name}</h4>
                        <button
                          onClick={() => deletePreset(preset.id)}
                          className="text-red-400 hover:text-red-300 transition-colors"
                        >
                          <Icons.Trash size={14} />
                        </button>
                      </div>
                      <p className="text-gray-400 text-xs mb-2">{preset.description}</p>
                      <button
                        onClick={() => loadPreset(preset)}
                        className="w-full py-1 bg-white/10 hover:bg-white/20 rounded text-xs text-white transition-colors"
                      >
                        应用此方案
                      </button>
                    </div>
                  ))}

                  {presets.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <Icons.Bookmark size={32} className="mx-auto mb-2 opacity-50" />
                      <p className="text-sm">暂无保存的筛选方案</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/5 flex justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
          >
            取消
          </button>
          <button
            onClick={applyFilters}
            className="px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
          >
            应用筛选
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdvancedFilters;
