import React from 'react';
import { Example } from '../../types';
import { Icons } from '../Icons';

interface PromptExamplesTabProps {
  examples: Example[];
  isGeneratingExamples: boolean;
  autoFillingIndex: number | null;
  onGenerateExamples: () => void;
  onAddExample: () => void;
  onClearExamples: () => void;
  onRemoveExample: (index: number) => void;
  onUpdateExample: (index: number, field: 'input' | 'output', value: string) => void;
  onAutoFillOutput: (index: number) => void;
}

export const PromptExamplesTab: React.FC<PromptExamplesTabProps> = ({
  examples,
  isGeneratingExamples,
  autoFillingIndex,
  onGenerateExamples,
  onAddExample,
  onClearExamples,
  onRemoveExample,
  onUpdateExample,
  onAutoFillOutput,
}) => {
  const hasExamples = examples && examples.length > 0;

  return (
    <div className="space-y-6 w-full animate-slide-up-fade">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: 示例系统说明 + AI 工具区 */}
        <div className="lg:col-span-1 bg-gradient-to-br from-slate-950/90 via-slate-950/80 to-black/80 border border-white/10 rounded-theme p-5 backdrop-blur-xl shadow-xl shadow-black/40 space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-brand-500/15 rounded-lg border border-brand-500/30 shadow-lg shadow-brand-500/20">
              <Icons.List size={18} className="text-brand-400" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white flex items-center gap-2">
                示例系统（Few-shot）
              </h3>
              <p className="text-xs text-gray-400 mt-1">
                用一组高质量示例，教会模型「应该如何回答」，而不是每次从零开始描述规则。
              </p>
            </div>
          </div>

          <div className="space-y-3 text-xs text-gray-400">
            <div className="flex items-start gap-2">
              <span className="mt-0.5 text-brand-300">
                <Icons.Sparkles size={14} />
              </span>
              <p>
                <span className="text-gray-200 font-semibold">模型自动填充示例：</span>
                基于当前 Prompt，一键生成 3-5 组输入/输出示例，作为起点再微调。
              </p>
            </div>
            <div className="flex items-start gap-2">
              <span className="mt-0.5 text-blue-300">
                <Icons.Ideas size={14} />
              </span>
              <p>
                <span className="text-gray-200 font-semibold">多轮调用场景：</span>
                为不同场景（简单/复杂/异常输入）各设计一组示例，帮助模型学会更稳健的行为。
              </p>
            </div>
            <div className="flex items-start gap-2">
              <span className="mt-0.5 text-emerald-300">
                <Icons.Run size={14} />
              </span>
              <p>
                <span className="text-gray-200 font-semibold">基础 CRUD 能力：</span>
                随时新增、编辑、删除示例；用 AI 辅助生成，再保留你认为「最像真实数据」的版本。
              </p>
            </div>
          </div>

          <div className="space-y-2 pt-2 border-t border-white/10 mt-3">
            <button
              onClick={onGenerateExamples}
              disabled={isGeneratingExamples}
              className="w-full flex items-center justify-center gap-2 px-3 py-2.5 text-xs font-semibold rounded-lg bg-brand-500/80 hover:bg-brand-500 text-white border border-brand-400/80 hover:border-brand-300 shadow-[0_0_18px_rgba(var(--c-brand),0.45)] transition-all disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isGeneratingExamples ? (
                <>
                  <span className="animate-spin">
                    <Icons.Activity size={14} />
                  </span>
                  正在让模型生成示例...
                </>
              ) : (
                <>
                  <Icons.Magic size={14} />
                  一键由模型生成示例
                </>
              )}
            </button>
            <button
              onClick={onAddExample}
              className="w-full flex items-center justify-center gap-2 px-3 py-2.5 text-xs font-semibold rounded-lg bg-white/5 hover:bg-white/10 text-gray-100 border border-white/15 hover:border-white/25 transition-all"
            >
              <Icons.Plus size={14} />
              手动添加一条示例
            </button>
            <button
              onClick={onClearExamples}
              disabled={!hasExamples}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 text-[11px] font-medium rounded-lg bg-transparent text-gray-500 hover:text-red-300 border border-white/10 hover:border-red-400/60 hover:bg-red-500/10 transition-all disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:border-white/10 disabled:hover:text-gray-500"
            >
              <Icons.Trash size={13} />
              清空当前所有示例
            </button>
          </div>
        </div>

        {/* Right: 示例列表 + 编辑区 */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <Icons.List size={16} className="text-brand-400" />
              <span className="font-semibold text-gray-200">示例集合</span>
              <span className="text-[11px] text-gray-500">
                ({examples.length || 0} 条，建议 3–5 条覆盖不同场景)
              </span>
            </div>
            <div className="flex items-center gap-2 text-[11px] text-gray-500">
              <span className="hidden md:inline">
                小提示：可以先让 AI 帮你起草，再用真实业务语境润色。
              </span>
            </div>
          </div>

          {!hasExamples && (
            <div className="text-center py-12 border-2 border-dashed border-white/10 rounded-theme bg-gradient-to-br from-slate-950/80 via-slate-950/70 to-black/80 backdrop-blur-xl">
              <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4 border border-white/10 shadow-lg shadow-black/40">
                <Icons.Sparkles size={22} className="text-brand-300" />
              </div>
              <p className="text-sm font-medium text-gray-200 mb-2">还没有任何示例</p>
              <p className="text-xs text-gray-500 mb-5">
                先让模型生成一批示例，再挑选和修改为更贴近你真实业务的版本。
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <button
                  onClick={onGenerateExamples}
                  disabled={isGeneratingExamples}
                  className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-lg bg-brand-500/80 hover:bg-brand-500 text-white border border-brand-400/80 hover:border-brand-300 shadow-[0_0_18px_rgba(var(--c-brand),0.4)] transition-all disabled:opacity-60"
                >
                  {isGeneratingExamples ? (
                    <>
                      <span className="animate-spin">
                        <Icons.Activity size={14} />
                      </span>
                      正在生成...
                    </>
                  ) : (
                    <>
                      <Icons.Magic size={14} />
                      让模型生成 3–5 个示例
                    </>
                  )}
                </button>
                <button
                  onClick={onAddExample}
                  className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-lg bg-white/5 hover:bg-white/10 text-gray-100 border border-white/15 hover:border-white/25 transition-all"
                >
                  <Icons.Edit size={14} />
                  我想从空白开始写
                </button>
              </div>
            </div>
          )}

          {examples.map((ex, index) => (
            <div
              key={index}
              className="group relative bg-gradient-to-br from-slate-950/90 via-slate-950/80 to-black/80 border border-white/12 rounded-theme p-5 md:p-6 shadow-lg hover:shadow-2xl hover:border-brand-500/40 transition-all duration-300 backdrop-blur-xl overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-brand-500/0 via-brand-500/0 to-brand-500/8 opacity-0 group-hover:opacity-100 transition-opacity duration-400" />
              <div className="absolute top-0 right-0 w-32 h-32 bg-brand-500/8 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

              {/* Header: index + actions */}
              <div className="relative z-10 flex items-start justify-between mb-4 gap-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-gradient-to-br from-brand-500/30 to-brand-500/10 border border-brand-500/40 rounded-full flex items-center justify-center shadow-lg shadow-brand-500/30">
                    <span className="text-[11px] font-bold text-brand-50">
                      {index + 1}
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs font-semibold text-gray-200">
                      示例 #{index + 1}
                    </span>
                    <span className="text-[11px] text-gray-500">
                      建议描述一种「典型场景」：如正常输入、边界输入、异常输入等。
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => onRemoveExample(index)}
                    className="p-1.5 rounded-lg text-gray-500 hover:text-red-300 hover:bg-red-500/10 border border-transparent hover:border-red-500/40 transition-all"
                    title="删除该示例"
                  >
                    <Icons.Trash size={15} />
                  </button>
                </div>
              </div>

              {/* Content grid */}
              <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                <div className="space-y-2.5">
                  <label className="text-xs font-semibold text-gray-300 uppercase flex items-center gap-2.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-400 shadow-[0_0_12px_rgba(59,130,246,0.9)]" />
                    <span>用户输入示例</span>
                  </label>
                  <textarea
                    value={ex.input}
                    onChange={(e) => onUpdateExample(index, 'input', e.target.value)}
                    className="w-full h-36 bg-slate-950/90 border border-blue-500/30 rounded-lg p-4 text-sm font-mono text-slate-100 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 resize-y transition-all hover:border-blue-400/70 shadow-inner shadow-black/80"
                    placeholder="例如：用户贴上了一段低质量代码，请你帮他重构并解释修改原因..."
                  />
                  <p className="text-[11px] text-gray-500">
                    尽量用真实、完整的输入，而不是一句话概述，这样模型才能学到足够多信息。
                  </p>
                </div>

                <div className="space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <label className="text-xs font-semibold text-gray-300 uppercase flex items-center gap-2.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-brand-400 shadow-[0_0_12px_rgba(var(--c-brand),0.9)]" />
                      <span>期望模型输出</span>
                    </label>
                    <button
                      onClick={() => onAutoFillOutput(index)}
                      disabled={autoFillingIndex === index}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] font-semibold rounded-lg bg-brand-500/15 hover:bg-brand-500/25 text-brand-100 border border-brand-500/40 hover:border-brand-400 transition-all disabled:opacity-60"
                    >
                      {autoFillingIndex === index ? (
                        <>
                          <span className="animate-spin">
                            <Icons.Activity size={12} />
                          </span>
                          由模型补全中...
                        </>
                      ) : (
                        <>
                          <Icons.Magic size={12} />
                          让模型补全输出
                        </>
                      )}
                    </button>
                  </div>
                  <textarea
                    value={ex.output}
                    onChange={(e) => onUpdateExample(index, 'output', e.target.value)}
                    className="w-full h-36 bg-slate-950/90 border border-brand-500/30 rounded-lg p-4 text-sm font-mono text-slate-100 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-500/40 resize-y transition-all hover:border-brand-400/70 shadow-inner shadow-black/80"
                    placeholder="例如：按步骤解释重构思路，先给出改写后的代码，再用项目团队习惯的风格总结注意事项..."
                  />
                  <p className="text-[11px] text-gray-500">
                    把这里当作「示范答案」。未来真实调用时，模型会尽量模仿这些输出的结构、语气和细节密度。
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};


