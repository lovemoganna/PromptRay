import React from 'react';
import { Prompt, PromptFormData, Category } from '../../types';
import { Icons } from '../Icons';

interface PromptEditTabProps {
  formData: PromptFormData;
  initialData?: Prompt | null;
  allCategories: string[];
  tagInput: string;
  tagSuggestions: string[];
  isAutoMeta: boolean;
  isOptimizingSystem: boolean;
  isTranslating: boolean;
  isOptimizingPrompt: boolean;
  isTagging: boolean;
  onFormDataChange: (data: PromptFormData) => void;
  onAutoMetadata: () => void;
  onOptimizeSystem: () => void;
  onTranslateToEnglish: () => void;
  onOptimizePrompt: () => void;
  onAutoTag: () => void;
  onTagInputChange: (value: string) => void;
  onTagKeyDown: (e: React.KeyboardEvent) => void;
  onRemoveTag: (tag: string) => void;
  onAddTagFromSuggestion: (tag: string) => void;
  getTokenCount: (text: string) => number;
  onDuplicate?: () => void;
  onCancel: () => void;
  onSaveClick: () => void;
}

export const PromptEditTab: React.FC<PromptEditTabProps> = ({
  formData,
  initialData,
  allCategories,
  tagInput,
  tagSuggestions,
  isAutoMeta,
  isOptimizingSystem,
  isTranslating,
  isOptimizingPrompt,
  isTagging,
  onFormDataChange,
  onAutoMetadata,
  onOptimizeSystem,
  onTranslateToEnglish,
  onOptimizePrompt,
  onAutoTag,
  onTagInputChange,
  onTagKeyDown,
  onRemoveTag,
  onAddTagFromSuggestion,
  getTokenCount,
  onDuplicate,
  onCancel,
  onSaveClick,
}) => {
  return (
    <>
      {/* EDIT TAB - Reorganized with MECE Principle */}
      <div className="w-full flex flex-col animate-slide-up-fade space-y-4 md:space-y-6 px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16">
        {/* 1. Core Information Group - 核心信息汇总（可一键生成） */}
        <div className="space-y-4 order-1">
          <div className="flex items-center justify-between gap-2 mb-4">
            <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider flex items-center gap-2">
              <Icons.Edit size={16} className="text-brand-400" />
              元信息
            </h3>
            <button
              onClick={onAutoMetadata}
              disabled={isAutoMeta}
              className="flex items-center gap-1.5 text-xs font-medium bg-white/10 text-gray-200 px-2.5 py-1 rounded-lg border border-white/15 hover:bg-white/15 disabled:opacity-50 transition-all"
              title="根据提示词内容自动生成元信息"
            >
              {isAutoMeta ? (
                <span className="animate-pulse">生成中...</span>
              ) : (
                <>
                  <Icons.Magic size={12} />
                  自动生成
                </>
              )}
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="sm:col-span-2 lg:col-span-2 space-y-1.5">
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">标题</label>
              <input
                type="text"
                value={formData.title}
                onChange={e => onFormDataChange({ ...formData, title: e.target.value })}
                className="w-full bg-gray-950/70 border border-white/10 rounded-lg px-3 md:px-4 py-2 md:py-2.5 text-sm md:text-base text-white focus:outline-none focus:border-brand-500/50 focus:ring-1 focus:ring-brand-500/30 transition-all"
                placeholder="输入提示词标题..."
                autoFocus={!initialData}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">类别</label>
              <select
                value={formData.category}
                onChange={e => onFormDataChange({ ...formData, category: e.target.value as Category })}
                className="w-full bg-gray-950/70 border border-white/10 rounded-lg px-3 md:px-4 py-2 md:py-2.5 text-sm md:text-base text-white focus:outline-none focus:border-brand-500/50 focus:ring-1 focus:ring-brand-500/30 transition-all appearance-none cursor-pointer"
              >
                {allCategories.map(c => (
                  <option key={c} value={c} className="bg-gray-900">
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">状态</label>
              <select
                value={formData.status || 'active'}
                onChange={e => onFormDataChange({ ...formData, status: e.target.value as any })}
                className="w-full bg-gray-950/70 border border-white/10 rounded-lg px-3 md:px-4 py-2 md:py-2.5 text-sm md:text-base text-white focus:outline-none focus:border-brand-500/50 focus:ring-1 focus:ring-brand-500/30 transition-all appearance-none cursor-pointer"
              >
                <option value="active" className="bg-gray-900">
                  Active
                </option>
                <option value="draft" className="bg-gray-900">
                  Draft
                </option>
                <option value="archived" className="bg-gray-900">
                  Archived
                </option>
              </select>
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">描述</label>
            <input
              type="text"
              value={formData.description}
              onChange={e => onFormDataChange({ ...formData, description: e.target.value })}
              className="w-full bg-gray-950/70 border border-white/10 rounded-lg px-3 md:px-4 py-2 md:py-2.5 text-sm md:text-base text-white focus:outline-none focus:border-brand-500/50 focus:ring-1 focus:ring-brand-500/30 transition-all"
              placeholder="简要描述这个提示词的用途..."
            />
          </div>
        </div>

        {/* 2. Prompt Content Group - 提示词内容组（始终放在最下方） */}
        <div className="space-y-4 order-last">
          <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider flex items-center gap-2">
            <Icons.Code size={16} className="text-blue-400" />
            提示词内容
          </h3>
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
            {/* System Instruction */}
            <div className="lg:col-span-1 bg-gray-900/70 border border-white/10 rounded-lg p-4 space-y-3">
              <div className="flex justify-between items-center">
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                  <Icons.System size={14} /> 系统角色
                </label>
                <button
                  onClick={onOptimizeSystem}
                  disabled={isOptimizingSystem || !formData.systemInstruction}
                  className="flex items-center gap-1.5 text-xs font-medium bg-blue-500/15 text-blue-300 px-2 py-1 rounded-lg border border-blue-500/30 hover:bg-blue-500/25 disabled:opacity-50 transition-all"
                >
                  {isOptimizingSystem ? (
                    <span className="animate-pulse">优化中...</span>
                  ) : (
                    <>
                      <Icons.Sparkles size={12} /> 优化
                    </>
                  )}
                </button>
              </div>
              <textarea
                value={formData.systemInstruction}
                onChange={e => onFormDataChange({ ...formData, systemInstruction: e.target.value })}
                className="w-full h-32 md:h-40 bg-gray-950/70 border border-white/10 rounded-lg px-3 md:px-4 py-2 md:py-3 text-sm font-mono text-gray-200 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/30 transition-all resize-y"
                placeholder="定义AI的角色..."
              />
            </div>

            {/* Bilingual Prompts */}
            <div className="lg:col-span-3 grid grid-cols-1 xl:grid-cols-2 gap-4">
              {/* Chinese Prompt */}
              <div className="bg-gray-900/70 border border-white/10 rounded-lg p-4 space-y-3">
                <div className="flex justify-between items-center flex-wrap gap-2">
                  <label className="text-xs font-semibold text-brand-300 uppercase tracking-wider flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-brand-400"></span>
                    中文提示词
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={onTranslateToEnglish}
                      disabled={isTranslating || !formData.content}
                      className="flex items-center gap-1.5 text-xs font-medium bg-green-500/15 text-green-300 px-2 py-1 rounded-lg border border-green-500/30 hover:bg-green-500/25 disabled:opacity-50 transition-all"
                      title="将中文提示词翻译为英文"
                    >
                      {isTranslating ? (
                        <span className="animate-pulse">翻译中...</span>
                      ) : (
                        <>
                          <Icons.Edit size={12} /> 翻译
                        </>
                      )}
                    </button>
                    <button
                      onClick={onOptimizePrompt}
                      disabled={isOptimizingPrompt || !formData.content}
                      className="flex items-center gap-1.5 text-xs font-medium bg-brand-500/15 text-brand-300 px-2 py-1 rounded-lg border border-brand-500/30 hover:bg-brand-500/25 disabled:opacity-50 transition-all"
                      title="优化提示词内容"
                    >
                      {isOptimizingPrompt ? (
                        <span className="animate-pulse">优化中...</span>
                      ) : (
                        <>
                          <Icons.Sparkles size={12} /> 优化
                        </>
                      )}
                    </button>
                  </div>
                </div>
                <textarea
                  value={formData.content}
                  onChange={e => onFormDataChange({ ...formData, content: e.target.value })}
                  className="w-full h-56 md:h-64 xl:h-72 bg-gray-950/80 border border-white/15 rounded-lg px-3 md:px-4 py-2 md:py-3 text-xs md:text-sm font-mono text-gray-100 focus:outline-none focus:border-brand-500/60 focus:ring-1 focus:ring-brand-500/40 transition-all resize-y leading-relaxed"
                  placeholder="在这里输入你的中文提示词...&#10;使用 {变量名} 创建动态输入"
                />
                <div className="flex justify-between items-center text-xs text-gray-500 flex-wrap gap-2">
                  <span className="text-gray-600">
                    提示：使用{' '}
                    <span className="text-brand-400 font-mono bg-brand-500/15 px-1.5 py-0.5 rounded border border-brand-500/30">
                      {'{变量名}'}
                    </span>{' '}
                    创建动态输入
                  </span>
                  <span className="font-mono">~{getTokenCount(formData.content)} tokens</span>
                </div>
              </div>

              {/* English Prompt */}
              <div className="bg-gray-900/70 border border-white/10 rounded-lg p-4 space-y-3">
                <div className="flex justify-between items-center flex-wrap gap-2">
                  <label className="text-xs font-semibold text-green-300 uppercase tracking-wider flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-400"></span>
                    英文提示词
                    {formData.englishPrompt && (
                      <span className="text-[10px] text-green-400/70 font-normal normal-case ml-1">(自动翻译)</span>
                    )}
                  </label>
                  {formData.englishPrompt ? (
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(formData.englishPrompt || '');
                      }}
                      className="text-xs text-gray-400 hover:text-green-400 transition-colors flex items-center gap-1"
                      title="复制英文提示词"
                    >
                      <Icons.Copy size={14} />
                    </button>
                  ) : (
                    <span className="text-[10px] text-gray-500">点击"翻译"生成</span>
                  )}
                </div>
                {formData.englishPrompt ? (
                  <div className="w-full h-56 md:h-64 xl:h-72 bg-gray-950/80 border border-white/15 rounded-lg px-3 md:px-4 py-2 md:py-3 text-xs md:text-sm font-mono text-gray-300 leading-relaxed whitespace-pre-wrap overflow-y-auto custom-scrollbar">
                    {formData.englishPrompt}
                  </div>
                ) : (
                  <div className="w-full h-56 md:h-64 xl:h-72 bg-gray-950/60 border border-white/8 rounded-lg px-3 md:px-4 py-2 md:py-3 flex items-center justify-center">
                    <div className="text-center space-y-2">
                      <div className="w-10 h-10 md:w-12 md:h-12 mx-auto bg-gray-900/50 rounded-full flex items-center justify-center border border-white/10">
                        <Icons.Edit size={18} className="md:w-5 md:h-5 text-gray-600" />
                      </div>
                      <p className="text-xs text-gray-600">点击"翻译"按钮生成英文提示词</p>
                    </div>
                  </div>
                )}
                {formData.englishPrompt && (
                  <div className="text-xs text-gray-500 flex items-center gap-1.5">
                    <span className="text-gray-600">自动翻译自中文提示词</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* 3. Metadata Group - 元数据组 */}
        <div className="space-y-4 order-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">输出类型</label>
              <select
                value={formData.outputType || ''}
                onChange={e =>
                  onFormDataChange({
                    ...formData,
                    outputType: (e.target.value as any) || undefined,
                  })
                }
                className="w-full bg-gray-950/70 border border-white/10 rounded-lg px-3 md:px-4 py-2 md:py-2.5 text-sm text-white focus:outline-none focus:border-brand-500/50 focus:ring-1 focus:ring-brand-500/30 transition-all appearance-none cursor-pointer"
              >
                <option value="">未指定</option>
                <option value="image">图片</option>
                <option value="video">视频</option>
                <option value="audio">音频</option>
                <option value="text">文本</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">应用场景</label>
              <select
                value={formData.applicationScene || ''}
                onChange={e =>
                  onFormDataChange({
                    ...formData,
                    applicationScene: (e.target.value as any) || undefined,
                  })
                }
                className="w-full bg-gray-950/70 border border-white/10 rounded-lg px-3 md:px-4 py-2 md:py-2.5 text-sm text-white focus:outline-none focus:border-brand-500/50 focus:ring-1 focus:ring-brand-500/30 transition-all appearance-none cursor-pointer"
              >
                <option value="">未指定</option>
                <option value="角色设计">角色设计</option>
                <option value="场景生成">场景生成</option>
                <option value="风格转换">风格转换</option>
                <option value="故事创作">故事创作</option>
                <option value="工具使用">工具使用</option>
                <option value="其他">其他</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">适用模型</label>
              <input
                type="text"
                value={(formData.recommendedModels || []).join(', ')}
                onChange={e =>
                  onFormDataChange({
                    ...formData,
                    recommendedModels: e.target.value
                      .split(',')
                      .map(v => v.trim())
                      .filter(Boolean),
                  })
                }
                className="w-full bg-gray-950/70 border border-white/10 rounded-lg px-3 md:px-4 py-2 md:py-2.5 text-sm text-white focus:outline-none focus:border-brand-500/50 focus:ring-1 focus:ring-brand-500/30 transition-all"
                placeholder="Midjourney, DALL-E..."
              />
            </div>
          </div>
        </div>

        {/* 4. Tags Group - 标签组 */}
        <div className="space-y-4 order-5">
          <div className="flex justify-between items-center flex-wrap gap-2">
            <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider flex items-center gap-2">
              <Icons.Tag size={16} className="text-yellow-400" />
              标签
            </h3>
            <button
              onClick={onAutoTag}
              disabled={isTagging || !formData.content}
              className="flex items-center gap-1.5 text-xs font-medium bg-white/10 text-gray-300 px-2.5 py-1 rounded-lg border border-white/15 hover:bg-white/15 disabled:opacity-50 transition-all"
            >
              {isTagging ? (
                <span className="animate-pulse">标记中...</span>
              ) : (
                <>
                  <Icons.Tag size={12} /> 自动标记
                </>
              )}
            </button>
          </div>
          <div className="space-y-4">
            {/* Main Tags */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">主要标签</label>
              <div className="relative">
                <div className="flex flex-wrap gap-2 p-3 bg-gray-950/70 border border-white/10 rounded-lg min-h-[60px]">
                  {formData.tags.map(tag => (
                    <span
                      key={tag}
                      className="flex items-center gap-1.5 text-sm font-medium bg-white/10 text-gray-200 px-2.5 py-1 rounded-lg border border-white/10"
                    >
                      {tag}
                      <button onClick={() => onRemoveTag(tag)} className="hover:text-red-400 transition-colors">
                        <Icons.Close size={12} />
                      </button>
                    </span>
                  ))}
                  <input
                    type="text"
                    value={tagInput}
                    onChange={e => onTagInputChange(e.target.value)}
                    onKeyDown={onTagKeyDown}
                    className="bg-transparent border-none outline-none text-sm text-white flex-1 min-w-[100px] py-1 placeholder:text-gray-600"
                    placeholder={formData.tags.length === 0 ? '输入标签并按 Enter...' : ''}
                  />
                </div>
                {tagSuggestions.length > 0 && (
                  <div className="absolute top-full left-0 mt-2 w-full bg-gray-900/95 border border-white/15 rounded-lg shadow-xl z-20 overflow-hidden backdrop-blur-md">
                    <div className="px-3 py-2 text-[10px] font-bold text-gray-400 uppercase tracking-wider border-b border-white/10 bg-gray-950/50">
                      建议
                    </div>
                    {tagSuggestions.map(suggestion => (
                      <button
                        key={suggestion}
                        onClick={() => onAddTagFromSuggestion(suggestion)}
                        className="w-full text-left px-3 py-2 text-sm text-gray-300 hover:bg-white/10 hover:text-white transition-all flex items-center gap-2"
                      >
                        <Icons.Tag size={14} className="opacity-50" />
                        {suggestion}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Additional Tags */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">技术标签</label>
                <input
                  type="text"
                  value={(formData.technicalTags || []).join(', ')}
                  onChange={e =>
                    onFormDataChange({
                      ...formData,
                      technicalTags: e.target.value
                        .split(',')
                        .map(v => v.trim())
                        .filter(Boolean),
                    })
                  }
                  className="w-full bg-gray-950/70 border border-white/10 rounded-lg px-3 md:px-4 py-2 md:py-2.5 text-sm text-white focus:outline-none focus:border-brand-500/50 focus:ring-1 focus:ring-brand-500/30 transition-all"
                  placeholder="角色一致性, 多图输入..."
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">风格标签</label>
                <input
                  type="text"
                  value={(formData.styleTags || []).join(', ')}
                  onChange={e =>
                    onFormDataChange({
                      ...formData,
                      styleTags: e.target.value
                        .split(',')
                        .map(v => v.trim())
                        .filter(Boolean),
                    })
                  }
                  className="w-full bg-gray-950/70 border border-white/10 rounded-lg px-3 md:px-4 py-2 md:py-2.5 text-sm text-white focus:outline-none focus:border-brand-500/50 focus:ring-1 focus:ring-brand-500/30 transition-all"
                  placeholder="卡通, 写实, 赛博朋克..."
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">自定义标签</label>
                <input
                  type="text"
                  value={(formData.customLabels || []).join(', ')}
                  onChange={e =>
                    onFormDataChange({
                      ...formData,
                      customLabels: e.target.value
                        .split(',')
                        .map(v => v.trim())
                        .filter(Boolean),
                    })
                  }
                  className="w-full bg-gray-950/70 border border-white/10 rounded-lg px-3 md:px-4 py-2 md:py-2.5 text-sm text-white focus:outline-none focus:border-brand-500/50 focus:ring-1 focus:ring-brand-500/30 transition-all"
                  placeholder="任意补充标签..."
                />
              </div>
            </div>
          </div>
        </div>

        {/* 5. Additional Information Group - 补充信息组 */}
        <div className="space-y-4 order-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">使用说明</label>
              <textarea
                value={formData.usageNotes || ''}
                onChange={e => onFormDataChange({ ...formData, usageNotes: e.target.value })}
                className="w-full h-24 md:h-32 bg-gray-950/70 border border-white/10 rounded-lg px-3 md:px-4 py-2 md:py-3 text-sm text-gray-200 focus:outline-none focus:border-brand-500/50 focus:ring-1 focus:ring-brand-500/30 transition-all resize-y"
                placeholder="这个提示词怎么用、有什么技巧？"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">注意事项</label>
              <textarea
                value={formData.cautions || ''}
                onChange={e => onFormDataChange({ ...formData, cautions: e.target.value })}
                className="w-full h-24 md:h-32 bg-gray-950/70 border border-white/10 rounded-lg px-3 md:px-4 py-2 md:py-3 text-sm text-gray-200 focus:outline-none focus:border-brand-500/50 focus:ring-1 focus:ring-brand-500/30 transition-all resize-y"
                placeholder="常见错误、边界条件、避坑提示"
              />
            </div>
          </div>
        </div>

        {/* 6. Source Information Group - 来源信息组 */}
        <div className="space-y-4 order-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">预览媒体 URL</label>
              <input
                type="text"
                value={formData.previewMediaUrl || ''}
                onChange={e => onFormDataChange({ ...formData, previewMediaUrl: e.target.value })}
                className="w-full bg-gray-950/70 border border-white/10 rounded-lg px-3 md:px-4 py-2 md:py-2.5 text-sm text-white focus:outline-none focus:border-brand-500/50 focus:ring-1 focus:ring-brand-500/30 transition-all"
                placeholder="示例图片/视频/音频链接"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">来源</label>
              <input
                type="text"
                value={formData.source || ''}
                onChange={e => onFormDataChange({ ...formData, source: e.target.value })}
                className="w-full bg-gray-950/70 border border-white/10 rounded-lg px-3 md:px-4 py-2 md:py-2.5 text-sm text-white focus:outline-none focus:border-brand-500/50 focus:ring-1 focus:ring-brand-500/30 transition-all"
                placeholder="站点名称 / 平台"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">来源作者</label>
              <input
                type="text"
                value={formData.sourceAuthor || ''}
                onChange={e => onFormDataChange({ ...formData, sourceAuthor: e.target.value })}
                className="w-full bg-gray-950/70 border border-white/10 rounded-lg px-3 md:px-4 py-2 md:py-2.5 text-sm text-white focus:outline-none focus:border-brand-500/50 focus:ring-1 focus:ring-brand-500/30 transition-all"
                placeholder="作者（可选）"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">来源链接</label>
              <input
                type="text"
                value={formData.sourceUrl || ''}
                onChange={e => onFormDataChange({ ...formData, sourceUrl: e.target.value })}
                className="w-full bg-gray-950/70 border border-white/10 rounded-lg px-3 md:px-4 py-2 md:py-2.5 text-sm text-white focus:outline-none focus:border-brand-500/50 focus:ring-1 focus:ring-brand-500/30 transition-all"
                placeholder="原始链接 URL"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Footer for Edit tab */}
      <div className="p-6 border-t border-white/10 flex justify-between gap-4 shrink-0 bg-gray-900/60 backdrop-blur-md">
        <div>
          {initialData && onDuplicate && (
            <button
              onClick={onDuplicate}
              className="px-4 py-2.5 text-sm font-semibold text-gray-300 hover:text-white transition-all duration-200 flex items-center gap-2 hover:bg-white/10 rounded-lg border border-white/10 hover:border-white/15 transform hover:scale-105 active:scale-95"
              title="Duplicate Prompt"
            >
              <Icons.CopyPlus size={16} /> <span className="hidden sm:inline">Duplicate</span>
            </button>
          )}
        </div>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="px-6 py-2.5 text-sm font-semibold text-gray-300 hover:text-white transition-all duration-200 hover:bg-white/10 rounded-lg border border-white/10 hover:border-white/15 transform hover:scale-105 active:scale-95"
          >
            Cancel
          </button>
          <button
            onClick={onSaveClick}
            className="btn-primary px-8 py-2.5 text-sm font-bold relative overflow-hidden group"
          >
            <span className="relative z-10">Save Changes</span>
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
          </button>
        </div>
      </div>
    </>
  );
};


