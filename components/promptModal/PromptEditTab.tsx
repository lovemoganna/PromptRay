import React, { useState, useRef, useEffect } from 'react';
import { Prompt, PromptFormData, PromptStatus, OutputType, ApplicationScene } from '../../types';
import { Icons } from '../Icons';
import PromptMetaPanel from './PromptMetaPanel';
// PromptMetaPanel: right-side metadata column
import Tags from '../ui/Tags';
import {
  editorClass,
  // 新增的区域统一样式系统
  SECTION_STYLES,
  // 新增的色彩和字体系统
  THEME_COLORS,
  TYPOGRAPHY
} from '../ui/styleTokens';

// =============================================================================
// 组件常量配置
// =============================================================================
const COMPONENT_CONFIG = {
  // 高度和行数配置
  editor: {
    minLineHeight: 20,
    minLines: 3,
    maxCollapsedLines: 20,
  },
  // 响应式配置
  responsive: {
    emptyStateHeight: 'h-64 md:h-72 xl:h-80',
    iconSize: 'w-10 h-10 md:w-12 md:h-12',
    padding: 'px-3 md:px-4 py-2 md:py-3',
    textSize: 'text-sm md:text-sm',
  },
  // 占位符文本
  placeholders: {
    chinesePrompt: '在这里输入你的中文提示词...\n使用 {变量名} 创建动态输入',
    englishPrompt: '点击"翻译"按钮生成英文提示词',
    title: '输入提示词标题...',
    description: '简要描述这个提示词的用途...',
  },
  // 状态选项
  statusOptions: [
    { value: 'active', label: 'Active' },
    { value: 'draft', label: 'Draft' },
    { value: 'archived', label: 'Archived' }
  ],
  // 输出类型选项
  outputTypeOptions: [
    { value: '', label: '未指定' },
    { value: 'image', label: '图片' },
    { value: 'video', label: '视频' },
    { value: 'audio', label: '音频' },
    { value: 'text', label: '文本' }
  ],
  // 应用场景选项
  applicationSceneOptions: [
    { value: '', label: '未指定' },
    { value: '角色设计', label: '角色设计' },
    { value: '场景生成', label: '场景生成' },
    { value: '风格转换', label: '风格转换' },
    { value: '故事创作', label: '故事创作' },
    { value: '工具使用', label: '工具使用' },
    { value: '其他', label: '其他' }
  ],
  // 自动元数据目标选项
  autoMetaTargets: [
    { value: '', label: '选择字段' },
    { value: 'all', label: '全部' },
    { value: 'intent', label: '意图' },
    { value: 'role', label: '角色' },
    { value: 'audience', label: '受众' },
    { value: 'action', label: '作用' },
    { value: 'quality', label: '质量目标' },
    { value: 'constraints', label: '边界' },
    { value: 'examples', label: '示例' },
    { value: 'format', label: '格式' },
    { value: 'version', label: '版本' },
    { value: 'evaluation', label: '评估' }
  ]
};

// =============================================================================
// 共享组件和工具函数
// =============================================================================




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
  onAutoMetadata: (options?: { target?: string; provider?: string }) => Promise<any> | any;
  onOptimizeSystem: () => void;
  onTranslateToEnglish: () => void;
  onOptimizePrompt: () => void;
  onAutoTag: () => void;
  onTagInputChange: (value: string) => void;
  onTagKeyDown: (e: React.KeyboardEvent) => void;
  onAddTagFromSuggestion: (tag: string) => void;
  getTokenCount: (text: string) => number;
  onDuplicate?: () => void;
  onCancel: () => void;
  onSaveClick: () => void;
  isAutoSaving?: boolean;
  isAutoSaveEnabled?: boolean;
  onToggleAutoSave?: () => void;
}

export const PromptEditTab: React.FC<PromptEditTabProps> = ({
  formData,
  initialData,
  allCategories,
  tagInput,
  tagSuggestions,
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
  onAddTagFromSuggestion,
  getTokenCount,
  onDuplicate,
  onCancel,
  onSaveClick,
  isAutoSaving,
  isAutoSaveEnabled,
  onToggleAutoSave,
}) => {
  // 默认隐藏次要区块，减少初始认知负担；用户可展开
  const [showSystem, setShowSystem] = useState(true);
  const [titleTouched, setTitleTouched] = useState(false);
  const [chinesePromptExpanded, setChinesePromptExpanded] = useState(false);
  const [englishPromptExpanded, setEnglishPromptExpanded] = useState(false);
  const [isEditingChinesePrompt, setIsEditingChinesePrompt] = useState(false);

  // Compact select for tighter alignment in the right column (shared token)
  // Derived metadata for display (use getTokenCount directly where needed)
  const titleTrimmed = (formData.title || '').trim();
  const titleValid = titleTrimmed.length > 0 && titleTrimmed.length <= 200;

  // 内容验证
  const contentValid = (formData.content || '').trim().length > 0;
  const contentTokenCount = getTokenCount(formData.content);
  const contentTooLong = contentTokenCount > 4000; // 假设最大token限制

  // 示例验证
  const examplesValid = (formData.examples || []).every(ex =>
    ex.input.trim().length > 0 && ex.output.trim().length > 0
  );

  // 整体表单验证
  const isFormValid = titleValid && contentValid && !contentTooLong && examplesValid;

  // 获取验证消息
  const getValidationMessage = (): string => {
    if (!titleValid) return '请填写标题（1-200个字符）';
    if (!contentValid) return '请填写中文提示词内容';
    if (contentTooLong) return `提示词过长（${contentTokenCount}/4000 tokens），请精简内容`;
    if (!examplesValid) return '请完善所有示例的输入和输出内容';
    return '准备保存';
  };
  const systemRef = useRef<HTMLTextAreaElement | null>(null);
  const chinesePromptRef = useRef<HTMLElement | null>(null);

  const adjustSystemHeight = () => {
    const el = systemRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = el.scrollHeight + 'px';
  };

  const adjustChinesePromptHeight = () => {
    const el = chinesePromptRef.current;
    if (!el) return;
    // 只有当内容不超过20行时才自动调整高度
    if (getLineCount(formData.content) <= 20) {
      el.style.height = 'auto';
      el.style.height = Math.max(el.scrollHeight, parseInt(getMinHeight())) + 'px';
    }
  };

  // 处理div placeholder效果
  const updatePlaceholder = () => {
    const el = chinesePromptRef.current;
    if (!el) return;
    const isEmpty = !el.textContent?.trim();
    if (isEmpty && !el.classList.contains('empty-placeholder')) {
      el.classList.add('empty-placeholder');
    } else if (!isEmpty && el.classList.contains('empty-placeholder')) {
      el.classList.remove('empty-placeholder');
    }
  };

  useEffect(() => {
    adjustSystemHeight();
    // adjust when content changes
  }, [formData.systemInstruction]);

  useEffect(() => {
    adjustChinesePromptHeight();
    updatePlaceholder();
    // adjust when content changes
  }, [formData.content]);

  const getLineCount = (text: string): number => {
    if (!text) return 0;
    return text.split('\n').length;
  };

  const getCollapsedHeight = (lineHeight: number = COMPONENT_CONFIG.editor.minLineHeight): string => {
    return `${lineHeight * COMPONENT_CONFIG.editor.maxCollapsedLines}px`;
  };

  const getMinHeight = (lineHeight: number = COMPONENT_CONFIG.editor.minLineHeight): string => {
    return `${lineHeight * COMPONENT_CONFIG.editor.minLines}px`;
  };

  // Reset expansion state when content changes significantly
  useEffect(() => {
    if (getLineCount(formData.content) <= 20) {
      setChinesePromptExpanded(false);
    }
  }, [formData.content]);

  useEffect(() => {
    if (getLineCount(formData.englishPrompt || '') <= 20) {
      setEnglishPromptExpanded(false);
    }
  }, [formData.englishPrompt]);

  // Example management functions
  const addExample = () => {
    const existing = formData.examples || [];
    onFormDataChange({
      ...formData,
      examples: [...existing, { input: '', output: '' }]
    });
  };

  const updateExample = (index: number, field: 'input' | 'output', value: string) => {
    const examples = [...(formData.examples || [])];
    examples[index] = { ...(examples[index] || { input: '', output: '' }), [field]: value };
    onFormDataChange({
      ...formData,
      examples
    });
  };

  const removeExample = (index: number) => {
    const examples = [...(formData.examples || [])];
    examples.splice(index, 1);
    onFormDataChange({
      ...formData,
      examples
    });
  };


  // Adjust height when expansion state changes
  useEffect(() => {
    adjustChinesePromptHeight();
  }, [chinesePromptExpanded]);

  return (
    <div>
      {/* Edit controls: placed inside Edit tab (top-right) */}
      {/* 优化按钮组 - 移动端友好 */}
      <div className="flex justify-end mb-4">
        {/* 桌面端：优化布局，更好的视觉层次 */}
        <div className="hidden sm:flex items-center gap-3">
          {/* 主操作按钮组 - 统一的玻璃态设计 */}
          <div className="flex items-center bg-white/5 border border-white/10 rounded-xl p-1 backdrop-blur-md shadow-lg">
            {initialData && onDuplicate && (
              <button
                onClick={onDuplicate}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] rounded-lg hover:bg-[var(--color-bg-tertiary)] transition-all duration-200 transform hover:scale-105 active:scale-95"
                title="复制提示词"
              >
                <Icons.Copy size={SECTION_STYLES.icons.action.size} />
                <span className="hidden lg:inline">复制</span>
              </button>
            )}
            <div className="w-[1px] h-4 bg-white/20 mx-1"></div>
            <button
              onClick={onCancel}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] rounded-lg hover:bg-[var(--color-bg-tertiary)] transition-all duration-200 transform hover:scale-105 active:scale-95"
              title="取消编辑"
            >
              <Icons.Close size={SECTION_STYLES.icons.action.size} />
              <span className="hidden lg:inline">取消</span>
            </button>
            <div className="w-[1px] h-4 bg-white/20 mx-1"></div>
            {/* 保存按钮 - 移入玻璃态容器，统一样式 */}
            <button
              onClick={() => {
                if (!isFormValid) {
                  setTitleTouched(true);
                  // Scroll to first error field
                  const titleInput = document.querySelector('input[type="text"][placeholder*="标题"]') as HTMLInputElement;
                  if (titleInput && !titleValid) {
                    titleInput.focus();
                    titleInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
                  }
                  return;
                }
                onSaveClick && onSaveClick();
              }}
              disabled={!isFormValid}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all duration-200 transform hover:scale-105 active:scale-95 flex items-center gap-1.5 relative overflow-hidden group ${isFormValid
                  ? 'bg-gradient-to-r from-[var(--color-brand-primary)]/80 to-[var(--color-brand-secondary)]/80 hover:from-[var(--color-brand-primary)]/90 hover:to-[var(--color-brand-secondary)]/90 text-white'
                  : 'bg-red-500/15 text-red-300 disabled:opacity-50'
                }`}
              title={!isFormValid ? getValidationMessage() : "保存更改"}
            >
              <span className="relative z-10 flex items-center gap-1.5">
                {!isFormValid && <Icons.Error size={SECTION_STYLES.icons.status.size} />}
                {isFormValid && <Icons.Check size={SECTION_STYLES.icons.status.size} />}
                保存
              </span>
            </button>
            <div className="w-[1px] h-4 bg-white/20 mx-1"></div>
            {/* 自动保存开关组件 - 在玻璃态容器内部 */}
            <div className="flex items-center gap-2 px-2">
              <span className={`text-xs font-medium text-[var(--color-text-secondary)]`}>自动保存</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onToggleAutoSave && onToggleAutoSave()}
                  disabled={isAutoSaving}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-primary)]/50 focus:ring-offset-1 focus:ring-offset-[var(--color-bg-primary)] disabled:opacity-50 ${isAutoSaveEnabled
                      ? 'bg-[var(--color-brand-primary)] shadow-lg'
                      : 'bg-[var(--color-bg-tertiary)] hover:bg-[var(--color-bg-secondary)]'
                    } ${isAutoSaving ? 'animate-pulse' : ''}`}
                  title={isAutoSaveEnabled ? '关闭自动保存' : '开启自动保存'}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-md transition-transform duration-200 ${isAutoSaveEnabled ? 'translate-x-6' : 'translate-x-1'
                      }`}
                  />
                  {/* 加载状态指示器 */}
                  {isAutoSaving && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-2.5 h-2.5 border border-white/40 border-t-white rounded-full animate-spin"></div>
                    </div>
                  )}
                </button>
                {/* 仅保留颜色指示器，移除文字 */}
                <div className={`w-2 h-2 rounded-full ${isAutoSaving ? 'bg-[var(--color-brand-primary)] animate-pulse' :
                    isAutoSaveEnabled ? 'bg-green-400' : 'bg-gray-400'
                  }`}></div>
              </div>
            </div>
          </div>

          {/* 移动端：垂直排列，全宽按钮 */}
          <div className="flex flex-col gap-1.5 sm:hidden w-full max-w-xs mx-auto">
            {/* 保存按钮 - 移动端置顶，主要操作 */}
            <button
              onClick={() => {
                if (!isFormValid) {
                  setTitleTouched(true);
                  // Scroll to first error field
                  const titleInput = document.querySelector('input[type="text"][placeholder*="标题"]') as HTMLInputElement;
                  if (titleInput && !titleValid) {
                    titleInput.focus();
                    titleInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
                  }
                  return;
                }
                onSaveClick && onSaveClick();
                // 添加保存成功的视觉反馈
                setTimeout(() => {
                  const button = document.activeElement as HTMLButtonElement;
                  if (button && button.textContent?.includes('保存')) {
                    button.classList.add('animate-pulse', 'bg-green-500/20', 'border-green-500/40');
                    setTimeout(() => {
                      button.classList.remove('animate-pulse', 'bg-green-500/20', 'border-green-500/40');
                    }, 1000);
                  }
                }, 100);
              }}
              disabled={!isFormValid}
              className={`${isFormValid
                  ? 'bg-gradient-to-r from-blue-500/80 to-blue-600/80 hover:from-blue-400/90 hover:to-blue-500/90 text-white border-blue-400/50 hover:border-blue-300/70 shadow-lg hover:shadow-xl hover:shadow-blue-500/25'
                  : 'bg-red-500/15 text-red-300 border-red-500/30 hover:bg-red-500/25'
                } w-full py-2.5 text-sm font-semibold border rounded-lg transition-all duration-200 transform active:scale-95 disabled:opacity-50 disabled:transform-none relative overflow-hidden group`}
              title={!isFormValid ? getValidationMessage() : "保存更改"}
            >
              <span className="relative z-10 flex items-center justify-center gap-2">
                {!isFormValid && <Icons.Error size={16} />}
                {isFormValid && <Icons.Check size={16} />}
                保存
              </span>
            </button>

            {/* 次级操作按钮组 */}
            <div className="flex gap-2">
              {initialData && onDuplicate && (
                <button
                  onClick={onDuplicate}
                  className="flex-1 py-2 text-sm font-medium text-gray-300 hover:text-white bg-gray-800/30 hover:bg-gray-700/40 border border-gray-700/20 hover:border-gray-600/40 rounded-lg transition-all duration-200 transform active:scale-95 flex items-center justify-center gap-1.5"
                  title="复制提示词"
                >
                  <Icons.Copy size={14} />
                  <span>复制</span>
                </button>
              )}
              {/* 取消按钮 */}
              <button
                onClick={onCancel}
                className="flex-1 py-2 text-sm font-medium text-gray-300 hover:text-gray-100 bg-gray-800/50 hover:bg-gray-700/50 border border-gray-600/30 hover:border-gray-500/50 rounded-lg transition-all duration-200 transform active:scale-95"
                title="取消编辑"
              >
                取消
              </button>
            </div>
          </div>
        </div>
      </div>
      {/* 主内容区域 - 改进的响应式布局 */}
      <div className="w-full animate-slide-up-fade">
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 xl:gap-8">
          {/* Left: PromptMetaPanel (moved left) */}
          <div className="xl:col-span-1 space-y-5">
            {/* Core Information (基础信息) - 重新设计的布局 */}
            <div className={`${SECTION_STYLES.container.base} ${SECTION_STYLES.container.accent.basic} p-5 space-y-5`}>
              <div className="flex items-center justify-between min-h-[56px]">
                <h3 className={`${SECTION_STYLES.content.sectionTitle} ${SECTION_STYLES.content.sectionTitleColor} flex items-center gap-3 mb-0`}>
                  <div className={`w-2.5 h-2.5 rounded-full ${SECTION_STYLES.icons.indicator.variants.purple} shadow-sm`}></div>
                  <span className={TYPOGRAPHY.letterSpacing.uppercase}>基础信息</span>
                </h3>
              </div>

              {/* 主要信息区域 - 垂直排列，更清晰的视觉层次 */}
              <div className="space-y-5">
                {/* 标题区域 - 突出显示 */}
                <div className="space-y-2">
                  <label className={`${SECTION_STYLES.content.fieldLabel} ${SECTION_STYLES.content.fieldLabelColor} text-sm font-semibold`}>
                    标题 <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={e => onFormDataChange({ ...formData, title: e.target.value })}
                    onBlur={() => setTitleTouched(true)}
                    maxLength={200}
                    className={SECTION_STYLES.content.titleInput}
                    placeholder={COMPONENT_CONFIG.placeholders.title}
                    autoFocus={!initialData}
                    aria-invalid={!titleValid && titleTouched}
                  />
                  <div className="flex items-center justify-between min-h-[16px]">
                    <div className="flex items-center gap-4">
                      {!titleValid && titleTouched && (
                        <p className={`${SECTION_STYLES.content.fieldDescription} ${SECTION_STYLES.status.textVariants.error} flex items-center gap-1 text-xs`}>
                          <Icons.Error size={SECTION_STYLES.icons.status.size} />
                          标题为必填，最多 200 字
                        </p>
                      )}
                      {titleValid && titleTouched && (
                        <p className={`${SECTION_STYLES.content.fieldDescription} ${SECTION_STYLES.status.textVariants.success} flex items-center gap-1 text-xs`}>
                          <Icons.Check size={SECTION_STYLES.icons.status.size} />
                          标题格式正确
                        </p>
                      )}
                    </div>
                    {formData.title && (
                      <span className="text-xs text-[var(--color-text-muted)] font-mono">
                        {formData.title.length}/200
                      </span>
                    )}
                  </div>
                </div>

                {/* 描述区域 */}
                <div className="space-y-2">
                  <label className={`${SECTION_STYLES.content.fieldLabel} ${SECTION_STYLES.content.fieldLabelColor}`}>描述</label>
                  <input
                    type="text"
                    value={formData.description}
                    onChange={e => onFormDataChange({ ...formData, description: e.target.value })}
                    className={SECTION_STYLES.content.input}
                    placeholder={COMPONENT_CONFIG.placeholders.description}
                  />
                </div>

                {/* 标签区域 - 更突出的位置和样式 */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className={`${SECTION_STYLES.content.fieldLabel} ${SECTION_STYLES.content.fieldLabelColor} font-semibold`}>
                      标签
                    </label>
                    <div className="flex items-center gap-2">
                      {isTagging && (
                        <div className="flex items-center gap-1 text-xs text-blue-400">
                          <div className="w-3 h-3 border border-blue-400/50 border-t-transparent rounded-full animate-spin"></div>
                          智能标记中...
                        </div>
                      )}
                      <button
                        onClick={onAutoTag}
                        disabled={isTagging}
                        className="px-2 py-1 text-xs font-medium text-blue-300 hover:text-blue-200 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 hover:border-blue-500/50 rounded-md transition-all duration-200 disabled:opacity-50"
                        title="智能生成标签"
                      >
                        <Icons.Sparkles size={12} className="inline mr-1" />
                        自动标记
                      </button>
                    </div>
                  </div>
                  <div className={`${THEME_COLORS.bg.tertiary} ${THEME_COLORS.border.primary} rounded-lg p-4 shadow-sm`}>
                    <Tags
                      tags={formData.tags || []}
                      tagInput={tagInput || ''}
                      suggestions={tagSuggestions || []}
                      onAddTag={(tag) => {
                        if (!tag) return;
                        onFormDataChange({ ...formData, tags: Array.from(new Set([...(formData.tags || []), tag])) });
                      }}
                      onRemoveTag={(tag) => onFormDataChange({ ...formData, tags: (formData.tags || []).filter(t => t !== tag) })}
                      onInputChange={(v) => onTagInputChange && onTagInputChange(v)}
                      onInputKeyDown={(e) => onTagKeyDown && onTagKeyDown(e)}
                      onSuggestionClick={(tag) => onAddTagFromSuggestion && onAddTagFromSuggestion(tag)}
                      compact={false}
                      onAutoTag={onAutoTag}
                      isTagging={isTagging}
                    />
                  </div>
                </div>

                {/* 属性设置区域 - 重新分组设计 */}
                <div className="space-y-4">
                  <h4 className={`${TYPOGRAPHY.fontSize['label-md']} ${TYPOGRAPHY.fontWeight.semibold} ${THEME_COLORS.text.secondary} ${TYPOGRAPHY.letterSpacing.uppercase} border-b ${THEME_COLORS.border.primary} pb-3 mb-4`}>
                    属性设置
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* 类别 */}
                    <div className="space-y-2">
                      <label className={`${SECTION_STYLES.content.fieldLabel} ${SECTION_STYLES.content.fieldLabelColor} text-xs font-medium`}>
                        类别
                      </label>
                      <select
                        value={formData.category || ''}
                        onChange={e => onFormDataChange({ ...formData, category: e.target.value })}
                        className={SECTION_STYLES.content.select}
                      >
                        {(allCategories || []).map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>

                    {/* 状态 */}
                    <div className="space-y-2">
                      <label className={`${SECTION_STYLES.content.fieldLabel} ${SECTION_STYLES.content.fieldLabelColor} text-xs font-medium`}>
                        状态
                      </label>
                      <select
                        value={formData.status || 'active'}
                        onChange={e => onFormDataChange({ ...formData, status: e.target.value as PromptStatus })}
                        className={SECTION_STYLES.content.select}
                      >
                        <option value="active">Active</option>
                        <option value="draft">Draft</option>
                        <option value="archived">Archived</option>
                      </select>
                    </div>

                    {/* 输出类型 */}
                    <div className="space-y-2">
                      <label className={`${SECTION_STYLES.content.fieldLabel} ${SECTION_STYLES.content.fieldLabelColor} text-xs font-medium`}>
                        输出类型
                      </label>
                      <select
                        value={formData.outputType || ''}
                        onChange={e => onFormDataChange({ ...formData, outputType: (e.target.value as OutputType) || undefined })}
                        className={SECTION_STYLES.content.select}
                      >
                        {COMPONENT_CONFIG.outputTypeOptions.map(option => (
                          <option key={option.value} value={option.value}>{option.label}</option>
                        ))}
                      </select>
                    </div>

                    {/* 应用场景 */}
                    <div className="space-y-2">
                      <label className={`${SECTION_STYLES.content.fieldLabel} ${SECTION_STYLES.content.fieldLabelColor} text-xs font-medium`}>
                        应用场景
                      </label>
                      <select
                        value={formData.applicationScene || ''}
                        onChange={e => onFormDataChange({ ...formData, applicationScene: (e.target.value as ApplicationScene) || undefined })}
                        className={SECTION_STYLES.content.select}
                      >
                        {COMPONENT_CONFIG.applicationSceneOptions.map(option => (
                          <option key={option.value} value={option.value}>{option.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Meta panel below 基础信息 */}
            <PromptMetaPanel
              formData={formData}
              onFormDataChange={onFormDataChange}
              getTokenCount={getTokenCount}
              onAutoMetadata={onAutoMetadata}
              onAutoTag={onAutoTag}
              isTagging={isTagging}
              tagSuggestions={tagSuggestions}
              tagInput={tagInput}
              onTagInputChange={onTagInputChange}
              onTagKeyDown={onTagKeyDown}
              onAddTagFromSuggestion={onAddTagFromSuggestion}
              allCategories={allCategories}
            />
          </div>

          {/* Right: Main editor (Prompt content, bilingual) - 重新设计的提示词编辑区域 */}
          <div className="xl:col-span-1 space-y-6">
            {/* Prompt Section Header */}
            <div className={`${SECTION_STYLES.container.base} ${SECTION_STYLES.container.accent.prompt} p-5`}>
              <div className="flex items-center justify-between min-h-[56px]">
                <h3 className={`${SECTION_STYLES.content.sectionTitle} ${SECTION_STYLES.content.sectionTitleColor} flex items-center gap-3 mb-0`}>
                  <div className={`w-2.5 h-2.5 rounded-full ${SECTION_STYLES.icons.indicator.variants.blue} shadow-sm`}></div>
                  <span className={TYPOGRAPHY.letterSpacing.uppercase}>提示词编辑</span>
                </h3>
              </div>
            </div>

            {/* System Role - 改进的折叠设计 */}
            <div className={`${SECTION_STYLES.container.base} ${SECTION_STYLES.container.accent.basic} p-5`}>
              <div className={`transition-all duration-300 ${showSystem ? '' : 'max-h-[72px] overflow-hidden'}`}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-2.5 h-2.5 rounded-full ${SECTION_STYLES.icons.indicator.variants.blue} shadow-sm`}></div>
                    <h4 className={`${SECTION_STYLES.content.subsectionTitle} ${THEME_COLORS.region.system} mb-0 ${TYPOGRAPHY.letterSpacing.uppercase}`}>
                      系统角色
                    </h4>
                    {formData.systemInstruction && (
                      <span className="text-xs text-blue-400/70 bg-blue-500/10 px-2 py-0.5 rounded-full border border-blue-500/20">
                        已配置
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onOptimizeSystem && onOptimizeSystem()}
                      disabled={isOptimizingSystem || !formData.systemInstruction}
                      className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-all duration-200 transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:transform-none ${isOptimizingSystem
                          ? 'bg-blue-500/30 text-blue-200 border-blue-400/40 animate-pulse'
                          : 'bg-blue-500/20 text-blue-200 border-blue-500/30 hover:bg-blue-500/30'
                        }`}
                      title="优化系统角色"
                    >
                      {isOptimizingSystem ? (
                        <>优化中...</>
                      ) : (
                        <><Icons.Sparkles size={12} className="inline mr-1" /> 优化</>
                      )}
                    </button>
                    <button
                      onClick={() => setShowSystem(s => !s)}
                      className="px-3 py-1.5 text-xs font-medium text-gray-300 hover:text-white bg-gray-800/50 hover:bg-gray-700/50 border border-gray-600/30 hover:border-gray-500/50 rounded-lg transition-all duration-200 transform hover:scale-105 active:scale-95"
                      title={showSystem ? '收起系统角色' : '展开系统角色'}
                    >
                      <Icons.ChevronDown
                        size={14}
                        className={`inline transition-transform duration-200 ${showSystem ? 'rotate-180' : ''}`}
                      />
                    </button>
                  </div>
                </div>

                {/* System Role Content */}
                <div className={`transition-all duration-300 ${showSystem ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                  <div className="bg-gray-950/50 border border-blue-500/20 rounded-lg p-4">
                    <textarea
                      ref={(el) => {
                        if (el) systemRef.current = el;
                      }}
                      value={formData.systemInstruction}
                      onChange={e => onFormDataChange({ ...formData, systemInstruction: e.target.value })}
                      className={`${editorClass} resize-y overflow-hidden min-h-[100px]`}
                      placeholder="在这里定义AI的角色、行为准则和专业领域..."
                      onInput={() => adjustSystemHeight()}
                    />
                    {formData.systemInstruction && (
                      <div className="flex items-center justify-between mt-3 pt-3 border-t border-blue-500/20">
                        <span className="text-xs text-blue-400/70">
                          系统角色已配置 ({getTokenCount(formData.systemInstruction)} tokens)
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Chinese Prompt - 重新设计的中文提示词区域 */}
            <div className={`${SECTION_STYLES.container.base} ${SECTION_STYLES.container.accent.basic} p-5`}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`w-2.5 h-2.5 rounded-full ${SECTION_STYLES.icons.indicator.variants.blue} shadow-sm`}></div>
                  <h4 className={`${SECTION_STYLES.content.subsectionTitle} ${THEME_COLORS.region.prompt} mb-0 ${TYPOGRAPHY.letterSpacing.uppercase}`}>
                    中文提示词 <span className={`${THEME_COLORS.state.error} text-sm`}>*</span>
                  </h4>
                  {formData.content && (
                    <span className="text-xs text-blue-400/70 bg-blue-500/10 px-2 py-0.5 rounded-full border border-blue-500/20">
                      {getTokenCount(formData.content)} tokens
                    </span>
                  )}
                </div>

                {/* 操作按钮组 */}
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    onClick={() => setIsEditingChinesePrompt(!isEditingChinesePrompt)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-all duration-200 transform hover:scale-105 active:scale-95 ${isEditingChinesePrompt
                        ? 'bg-blue-500/30 text-blue-200 border-blue-400/40'
                        : 'text-gray-300 hover:text-white bg-gray-800/50 hover:bg-gray-700/50 border-gray-600/30 hover:border-gray-500/50'
                      }`}
                    title={isEditingChinesePrompt ? "完成编辑" : "编辑中文提示词"}
                  >
                    <Icons.Edit size={12} className="inline mr-1" />
                    {isEditingChinesePrompt ? "完成" : "编辑"}
                  </button>

                  <button
                    onClick={() => onTranslateToEnglish && onTranslateToEnglish()}
                    disabled={isTranslating || !formData.content}
                    className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-all duration-200 transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:transform-none ${isTranslating
                        ? 'bg-green-500/30 text-green-200 border-green-400/40 animate-pulse'
                        : 'bg-green-500/20 text-green-200 border-green-500/30 hover:bg-green-500/30'
                      }`}
                    title="将中文提示词翻译为英文"
                  >
                    {isTranslating ? (
                      <>翻译中...</>
                    ) : (
                      <><Icons.Edit size={12} className="inline mr-1" /> 翻译</>
                    )}
                  </button>

                  <button
                    onClick={() => onOptimizePrompt && onOptimizePrompt()}
                    disabled={isOptimizingPrompt || !formData.content}
                    className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-all duration-200 transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:transform-none ${isOptimizingPrompt
                        ? 'bg-blue-500/30 text-blue-200 border-blue-400/40 animate-pulse'
                        : 'bg-blue-500/20 text-blue-200 border-blue-500/30 hover:bg-blue-500/30'
                      }`}
                    title="优化提示词内容"
                  >
                    {isOptimizingPrompt ? (
                      <>优化中...</>
                    ) : (
                      <><Icons.Sparkles size={12} className="inline mr-1" /> 优化</>
                    )}
                  </button>
                </div>
              </div>

              {/* 中文提示词内容区域 */}
              <div className="bg-gray-950/50 border border-blue-500/20 rounded-lg overflow-hidden">
                {isEditingChinesePrompt ? (
                  <div className="p-4">
                    <div
                      ref={(el) => {
                        if (el) chinesePromptRef.current = el as unknown as HTMLTextAreaElement;
                      }}
                      contentEditable
                      suppressContentEditableWarning
                      onInput={(e) => {
                        const target = e.target as HTMLDivElement;
                        let newContent = target.textContent || '';

                        if (newContent === COMPONENT_CONFIG.placeholders.chinesePrompt) {
                          newContent = '';
                        }

                        onFormDataChange({ ...formData, content: newContent });
                        adjustChinesePromptHeight();
                      }}
                      onFocus={(e) => {
                        const target = e.target as HTMLDivElement;
                        if (target.textContent === COMPONENT_CONFIG.placeholders.chinesePrompt) {
                          target.textContent = '';
                        }
                      }}
                      onBlur={(e) => {
                        const target = e.target as HTMLDivElement;
                        if (!target.textContent?.trim()) {
                          target.textContent = COMPONENT_CONFIG.placeholders.chinesePrompt;
                        }
                      }}
                      className={`${editorClass} leading-relaxed overflow-y-auto min-h-[120px] ${!formData.content ? 'empty-placeholder' : ''
                        }`}
                      style={{
                        minHeight: getMinHeight()
                      }}
                      data-placeholder={COMPONENT_CONFIG.placeholders.chinesePrompt.replace('\n', '&#10;')}
                      autoFocus
                    >
                      {formData.content || COMPONENT_CONFIG.placeholders.chinesePrompt}
                    </div>
                  </div>
                ) : (
                  <div className="relative">
                    <div
                      className={`${editorClass} p-4 leading-relaxed whitespace-pre-wrap custom-scrollbar transition-all ${getLineCount(formData.content) > 20 && !chinesePromptExpanded
                          ? 'overflow-hidden'
                          : 'overflow-y-auto'
                        }`}
                      style={{
                        height: getLineCount(formData.content) > 20 && !chinesePromptExpanded
                          ? getCollapsedHeight()
                          : 'auto',
                        minHeight: getMinHeight()
                      }}
                    >
                      {formData.content || "点击编辑按钮开始输入中文提示词..."}
                    </div>

                    {getLineCount(formData.content) > COMPONENT_CONFIG.editor.maxCollapsedLines && (
                      <div className="absolute bottom-3 right-3 z-10">
                        <button
                          onClick={() => setChinesePromptExpanded(!chinesePromptExpanded)}
                          className="px-3 py-1.5 text-xs font-medium text-gray-400 hover:text-gray-200 bg-gray-900/80 hover:bg-gray-800/90 border border-gray-700/30 hover:border-gray-600/50 rounded-lg transition-all duration-200 transform hover:scale-105 active:scale-95 backdrop-blur-sm"
                          title={chinesePromptExpanded ? '收起内容' : '展开完整内容'}
                        >
                          {chinesePromptExpanded ? '收起' : `展开 (${getLineCount(formData.content)} 行)`}
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* English Prompt - 重新设计的英文提示词区域 */}
            <div className={`${SECTION_STYLES.container.base} ${SECTION_STYLES.container.accent.basic} p-5`}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`w-2.5 h-2.5 rounded-full ${SECTION_STYLES.icons.indicator.variants.green} shadow-sm`}></div>
                  <h4 className={`${SECTION_STYLES.content.subsectionTitle} ${THEME_COLORS.state.success} mb-0 ${TYPOGRAPHY.letterSpacing.uppercase}`}>
                    英文提示词
                  </h4>
                  {formData.englishPrompt && (
                    <>
                      <span className="text-xs text-green-400/70 bg-green-500/10 px-2 py-0.5 rounded-full border border-green-500/20">
                        {getTokenCount(formData.englishPrompt)} tokens
                      </span>
                      <span className="text-xs text-green-400/70 font-normal">(自动翻译)</span>
                    </>
                  )}
                </div>

                {formData.englishPrompt ? (
                  <button
                    onClick={() => navigator.clipboard.writeText(formData.englishPrompt || '')}
                    className="px-3 py-1.5 text-xs font-medium text-green-200 hover:text-green-100 bg-green-500/20 hover:bg-green-500/30 border border-green-500/30 hover:border-green-500/50 rounded-lg transition-all duration-200 transform hover:scale-105 active:scale-95"
                    title="复制英文提示词"
                  >
                    <Icons.Copy size={12} className="inline mr-1" />
                    复制
                  </button>
                ) : (
                  <span className="text-xs text-gray-400 bg-gray-800/50 px-2 py-1 rounded-md border border-gray-700/30">
                    点击"翻译"生成
                  </span>
                )}
              </div>

              {formData.englishPrompt ? (
                <div className="bg-gray-950/50 border border-green-500/20 rounded-lg overflow-hidden">
                  <div className="relative">
                    <div
                      className={`${editorClass} p-4 leading-relaxed whitespace-pre-wrap custom-scrollbar transition-all ${getLineCount(formData.englishPrompt) > 20 && !englishPromptExpanded
                          ? 'overflow-hidden'
                          : 'overflow-y-auto'
                        }`}
                      style={{
                        height: getLineCount(formData.englishPrompt) > 20 && !englishPromptExpanded
                          ? getCollapsedHeight()
                          : 'auto',
                        minHeight: getMinHeight()
                      }}
                    >
                      {formData.englishPrompt}
                    </div>

                    {getLineCount(formData.englishPrompt) > COMPONENT_CONFIG.editor.maxCollapsedLines && (
                      <div className="absolute bottom-3 right-3 z-10">
                        <button
                          onClick={() => setEnglishPromptExpanded(!englishPromptExpanded)}
                          className="px-3 py-1.5 text-xs font-medium text-gray-400 hover:text-gray-200 bg-gray-900/80 hover:bg-gray-800/90 border border-gray-700/30 hover:border-gray-600/50 rounded-lg transition-all duration-200 transform hover:scale-105 active:scale-95 backdrop-blur-sm"
                          title={englishPromptExpanded ? '收起内容' : '展开完整内容'}
                        >
                          {englishPromptExpanded ? '收起' : `展开 (${getLineCount(formData.englishPrompt)} 行)`}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="bg-gray-950/30 border border-dashed border-gray-600/30 rounded-lg p-8">
                  <div className="text-center space-y-3">
                    <div className="w-12 h-12 mx-auto rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center">
                      <Icons.Edit size={20} className="text-green-400/70" />
                    </div>
                    <div className="space-y-1">
                      <h5 className="text-sm font-medium text-gray-300">尚未生成英文提示词</h5>
                      <p className="text-xs text-gray-400 leading-relaxed">
                        点击上方中文提示词区域的"翻译"按钮，将中文提示词自动翻译为英文版本
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Examples - 重新设计的参照示例区域 */}
            <div className={`${SECTION_STYLES.container.base} ${SECTION_STYLES.container.accent.examples} p-5`}>
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className={`w-2.5 h-2.5 rounded-full ${SECTION_STYLES.icons.indicator.variants.purple} shadow-sm`}></div>
                  <h4 className={`${SECTION_STYLES.content.sectionTitle} ${SECTION_STYLES.content.sectionTitleColor} mb-0 ${TYPOGRAPHY.letterSpacing.uppercase}`}>
                    参照示例
                  </h4>
                  {(formData.examples || []).length > 0 && (
                    <span className="text-xs text-purple-400/70 bg-purple-500/10 px-2 py-0.5 rounded-full border border-purple-500/20">
                      {(formData.examples || []).length} 个示例
                    </span>
                  )}
                </div>

                <button
                  onClick={addExample}
                  className="px-4 py-2 text-sm font-medium text-purple-200 hover:text-purple-100 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/30 hover:border-purple-500/50 rounded-lg transition-all duration-200 transform hover:scale-105 active:scale-95 flex items-center gap-2"
                  title="添加新的输入输出示例"
                >
                  <Icons.Plus size={16} />
                  添加示例
                </button>
              </div>

              {/* 示例内容区域 */}
              <div className="space-y-4">
                {(formData.examples || []).length === 0 ? (
                  <div className="bg-gray-950/30 border border-dashed border-purple-500/20 rounded-lg p-8">
                    <div className="text-center space-y-4">
                      <div className="w-16 h-16 mx-auto rounded-full bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
                        <Icons.List size={28} className="text-purple-400/70" />
                      </div>
                      <div className="space-y-2">
                        <h5 className="text-base font-medium text-gray-300">暂无参照示例</h5>
                        <p className="text-sm text-gray-400 leading-relaxed max-w-md mx-auto">
                          示例可以帮助AI更好地理解您的提示词意图，让AI生成更符合期望的输出结果。
                          <br />
                          点击上方"添加示例"按钮创建第一个示例。
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  (formData.examples || []).map((ex, idx) => (
                    <div key={idx} className="bg-gray-950/50 border border-purple-500/20 rounded-lg p-4 space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-purple-300">示例 {idx + 1}</span>
                          {(!ex.input?.trim() || !ex.output?.trim()) && (
                            <span className="text-xs text-orange-400 bg-orange-500/10 px-2 py-0.5 rounded-full border border-orange-500/20">
                              未完成
                            </span>
                          )}
                          {ex.input?.trim() && ex.output?.trim() && (
                            <span className="text-xs text-green-400 bg-green-500/10 px-2 py-0.5 rounded-full border border-green-500/20">
                              ✓ 完整
                            </span>
                          )}
                        </div>
                        <button
                          onClick={() => removeExample(idx)}
                          className="px-2 py-1 text-xs font-medium text-red-300 hover:text-red-200 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 hover:border-red-500/30 rounded-md transition-all duration-200 transform hover:scale-105 active:scale-95"
                          title={`删除示例 ${idx + 1}`}
                        >
                          删除
                        </button>
                      </div>

                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="flex items-center gap-2 text-xs font-semibold text-blue-400/70 uppercase tracking-wider">
                            <div className="w-1.5 h-1.5 rounded-full bg-blue-400/50"></div>
                            输入
                            {!ex.input?.trim() && <span className="text-red-400">*</span>}
                            {ex.input?.trim() && <Icons.Check size={12} className="text-green-400" />}
                          </label>
                          <input
                            value={ex.input || ''}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateExample(idx, 'input', e.target.value)}
                            placeholder="例如：请写一篇关于人工智能的文章"
                            className={`w-full px-3 py-2 bg-gray-900/50 border rounded-md text-sm font-mono transition-all duration-200 ${!ex.input?.trim()
                                ? 'border-red-500/30 focus:border-red-400/50'
                                : 'border-blue-500/20 focus:border-blue-400/50'
                              } text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500/30`}
                          />
                        </div>

                        <div className="space-y-2">
                          <label className="flex items-center gap-2 text-xs font-semibold text-green-400/70 uppercase tracking-wider">
                            <div className="w-1.5 h-1.5 rounded-full bg-green-400/50"></div>
                            输出
                            {!ex.output?.trim() && <span className="text-red-400">*</span>}
                            {ex.output?.trim() && <Icons.Check size={12} className="text-green-400" />}
                          </label>
                          <input
                            value={ex.output || ''}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateExample(idx, 'output', e.target.value)}
                            placeholder="例如：人工智能是...[期望的输出格式]"
                            className={`w-full px-3 py-2 bg-gray-900/50 border rounded-md text-sm font-mono transition-all duration-200 ${!ex.output?.trim()
                                ? 'border-red-500/30 focus:border-red-400/50'
                                : 'border-green-500/20 focus:border-green-400/50'
                              } text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-green-500/30`}
                          />
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Examples and other full-width sections can follow here if needed */}

          {/* Right column now contains the prompt editor (moved from left) */}
        </div>
      </div>
    </div>
  );
};


