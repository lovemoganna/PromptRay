import React from 'react';
import { PromptFormData } from '../../types';
import { Icons } from '../Icons';

type TabKey = 'preview' | 'edit' | 'examples' | 'test' | 'history';

interface PromptPreviewTabProps {
  formData: PromptFormData;
  previewMode: 'raw' | 'interpolated';
  onPreviewModeChange: (mode: 'raw' | 'interpolated') => void;
  detectedVariables: string[];
  variableValues: Record<string, string>;
  isFilling: boolean;
  copiedPreview: boolean;
  onCopyRawPrompt: () => void;
  onCopyEnglishPrompt: () => void;
  onCopyChinesePrompt: () => void;
  onCopyBilingualPrompt: () => void;
  onMagicFill: () => void;
  onVariableChange: (name: string, value: string) => void;
  onSetActiveTab: (tab: TabKey) => void;
}

export const PromptPreviewTab: React.FC<PromptPreviewTabProps> = ({
  formData,
  previewMode,
  onPreviewModeChange,
  detectedVariables,
  variableValues,
  isFilling,
  copiedPreview,
  onCopyRawPrompt,
  onCopyEnglishPrompt,
  onCopyChinesePrompt,
  onCopyBilingualPrompt,
  onMagicFill,
  onVariableChange,
  onSetActiveTab,
}) => {
  return (
    <div className="space-y-8 w-full max-w-5xl mx-auto animate-slide-up-fade">
      {/* Quick Nav for long content */}
      <div className="flex flex-wrap gap-2 text-[11px] text-gray-300">
        {[
          { id: 'section-overview', label: '概览' },
          { id: 'section-bilingual', label: '双语摘要' },
          { id: 'section-description', label: '描述' },
          { id: 'section-examples', label: '示例' },
          { id: 'section-variables', label: '变量/模拟' },
        ].map(link => (
          <a
            key={link.id}
            href={`#${link.id}`}
            className="px-3 py-1.5 rounded-full border border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20 transition-colors"
          >
            {link.label}
          </a>
        ))}
      </div>

      {/* Bilingual Summary & Quick Copy */}
      <div
        id="section-bilingual"
        className="bg-gradient-to-br from-slate-950/90 via-slate-950/80 to-black/80 border border-white/10 rounded-theme p-4 md:p-5 backdrop-blur-xl flex flex-col gap-4 shadow-xl shadow-black/40"
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-col gap-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-semibold tracking-wider uppercase bg-brand-500/20 text-brand-300 px-2.5 py-1 rounded-full border border-brand-500/40">
                {formData.category}
              </span>
              {formData.outputType && (
                <span className="text-[11px] font-semibold tracking-wider uppercase bg-white/5 text-gray-200 px-2.5 py-1 rounded-full border border-white/10">
                  {formData.outputType.toUpperCase()}
                </span>
              )}
              {formData.applicationScene && (
                <span className="text-[11px] font-medium bg-white/5 text-gray-200 px-2.5 py-1 rounded-full border border-white/10">
                  {formData.applicationScene}
                </span>
              )}
              {formData.recommendedModels && formData.recommendedModels.length > 0 && (
                <span className="text-[11px] font-medium bg-white/5 text-gray-200 px-2.5 py-1 rounded-full border border-white/10">
                  {formData.recommendedModels[0]}
                </span>
              )}
            </div>
            <h2 className="text-base md:text-lg font-semibold text-white line-clamp-2">
              {formData.title || 'Untitled prompt'}
            </h2>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {formData.englishPrompt && (
              <button
                onClick={onCopyEnglishPrompt}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-white/15 bg-white/5 text-[11px] font-semibold text-gray-100 hover:bg-white/10 hover:border-white/25 transition-colors"
              >
                <Icons.Copy size={13} />
                <span>Copy EN</span>
              </button>
            )}
            {formData.chinesePrompt && (
              <button
                onClick={onCopyChinesePrompt}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-white/15 bg-white/5 text-[11px] font-semibold text-gray-100 hover:bg-white/10 hover:border-white/25 transition-colors"
              >
                <Icons.Copy size={13} />
                <span>复制中文</span>
              </button>
            )}
            {(formData.englishPrompt || formData.chinesePrompt) && (
              <button
                onClick={onCopyBilingualPrompt}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-brand-500/40 bg-brand-500/20 text-[11px] font-semibold text-brand-50 hover:bg-brand-500/30 hover:border-brand-500/60 transition-colors"
              >
                <Icons.ClipboardCheck size={13} />
                <span>EN+中</span>
              </button>
            )}
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <div className="text-[11px] uppercase tracking-wider text-blue-300/80 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400 shadow-[0_0_10px_rgba(56,189,248,0.8)]" />
              <span>English Preview</span>
            </div>
            <div className="text-[12px] md:text-sm text-slate-50 bg-slate-950/80 border border-white/10 rounded-lg p-3 font-mono whitespace-pre-wrap min-h-[60px] line-clamp-4 shadow-inner shadow-black/60">
              {formData.englishPrompt || 'No English prompt yet'}
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-[11px] uppercase tracking-wider text-emerald-300/80 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.8)]" />
              <span>中文预览</span>
            </div>
            <div className="text-[12px] md:text-sm text-slate-50 bg-slate-950/80 border border-white/10 rounded-lg p-3 whitespace-pre-wrap min-h-[60px] line-clamp-4 shadow-inner shadow-black/60">
              {formData.chinesePrompt || '尚未填写中文提示词'}
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Header Section */}
      <div id="section-overview" className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex flex-wrap gap-2">
          <span className="text-xs font-semibold tracking-wider uppercase bg-brand-500/15 text-brand-400 px-4 py-2 rounded-lg border border-brand-500/30 shadow-[0_0_15px_rgba(var(--c-brand),0.15)] backdrop-blur-sm">
            {formData.category}
          </span>
          {formData.tags.map(tag => (
            <span
              key={tag}
              className="text-xs font-medium bg-white/8 text-gray-300 px-3 py-1.5 rounded-lg border border-white/10 hover:bg-white/12 hover:border-white/15 transition-all duration-200"
            >
              #{tag}
            </span>
          ))}
        </div>
        <div className="flex gap-2 flex-wrap">
          {detectedVariables.length > 0 && (
            <div className="flex items-center gap-1 bg-gray-900/60 rounded-lg p-1 border border-white/10 backdrop-blur-sm">
              <button
                onClick={() => onPreviewModeChange('raw')}
                className={`px-3 py-1.5 text-xs uppercase font-semibold rounded-md transition-all duration-200 ${
                  previewMode === 'raw'
                    ? 'bg-gray-800 text-white shadow-inner'
                    : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'
                }`}
              >
                Raw
              </button>
              <button
                onClick={() => onPreviewModeChange('interpolated')}
                className={`px-3 py-1.5 text-xs uppercase font-semibold rounded-md transition-all duration-200 ${
                  previewMode === 'interpolated'
                    ? 'bg-brand-500 text-white shadow-[0_0_10px_rgba(var(--c-brand),0.3)]'
                    : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'
                }`}
              >
                Simulated
              </button>
            </div>
          )}
          <button
            onClick={onCopyRawPrompt}
            className="flex items-center gap-2 text-xs font-semibold text-gray-300 hover:text-white transition-all duration-200 bg-white/8 px-4 py-2 rounded-lg border border-white/10 hover:bg-white/12 hover:border-white/15 hover:shadow-lg transform hover:scale-105 active:scale-95"
          >
            {copiedPreview ? (
              <>
                <Icons.Check size={16} className="text-green-400" />
                <span>Copied</span>
              </>
            ) : (
              <>
                <Icons.Copy size={16} />
                <span>Copy</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Description Section */}
      <div
        id="section-description"
        className="bg-gray-900/50 rounded-theme p-6 md:p-7 border border-white/12 backdrop-blur-sm shadow-lg transition-all duration-300"
      >
        <h3 className="text-xs font-semibold text-gray-400 mb-4 uppercase tracking-widest flex items-center gap-2.5">
          <Icons.Edit size={18} className="text-gray-500" /> Description
        </h3>
        <p className="text-gray-200 text-base leading-relaxed max-w-4xl">
          {formData.description || <span className="text-gray-500 italic">No description provided.</span>}
        </p>
      </div>

      {/* Examples Section */}
      {formData.examples && formData.examples.length > 0 && (
        <div id="section-examples" className="relative group">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-widest flex items-center gap-2.5">
              <Icons.List size={18} className="text-brand-400" /> Few-Shot Examples ({formData.examples.length})
            </h3>
            <button
              onClick={() => onSetActiveTab('examples')}
              className="text-xs text-brand-400 hover:text-brand-300 flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-brand-500/10 transition-all border border-transparent hover:border-brand-500/20"
            >
              <Icons.Edit size={14} /> Edit
            </button>
          </div>
          <div className="space-y-5">
            {formData.examples.map((ex, i) => (
              <div
                key={i}
                className="group relative bg-gradient-to-br from-gray-900/70 to-gray-950/70 border border-white/15 rounded-theme p-6 md:p-7 grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-7 hover:border-brand-500/40 hover:bg-gray-900/80 transition-all duration-300 backdrop-blur-sm shadow-xl hover:shadow-2xl overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-brand-500/8 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-blue-500/5 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

                <div className="absolute top-5 left-5 w-8 h-8 bg-gradient-to-br from-brand-500/25 to-brand-500/15 border border-brand-500/40 rounded-full flex items-center justify-center shadow-lg shadow-brand-500/20 z-10">
                  <span className="text-[11px] font-bold text-brand-300">{i + 1}</span>
                </div>

                <div className="space-y-3.5 relative z-0 pt-2">
                  <div className="text-xs font-semibold text-gray-300 uppercase flex items-center gap-2.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-blue-400 shadow-[0_0_8px_rgba(96,165,250,0.6)] animate-pulse"></div>
                    <span>Input</span>
                  </div>
                  <div className="text-sm text-gray-200 font-mono whitespace-pre-wrap bg-gray-950/80 p-4 rounded-lg border border-blue-500/15 leading-relaxed shadow-inner hover:border-blue-500/25 transition-all">
                    {ex.input}
                  </div>
                </div>
                <div className="space-y-3.5 border-l border-white/15 md:pl-7 pl-0 md:border-l pt-6 md:pt-2 border-t md:border-t-0 relative z-0">
                  <div className="text-xs font-semibold text-gray-300 uppercase flex items-center gap-2.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-brand-400 shadow-[0_0_8px_rgba(var(--c-brand),0.6)] animate-pulse"></div>
                    <span>Output</span>
                  </div>
                  <div className="text-sm text-brand-300 font-mono whitespace-pre-wrap bg-gray-950/80 p-4 rounded-lg border border-brand-500/25 leading-relaxed shadow-inner hover:border-brand-500/35 transition-all">
                    {ex.output}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Variables Section */}
      {previewMode === 'interpolated' && detectedVariables.length > 0 && (
        <div id="section-variables" className="bg-gray-900/50 border border-white/10 rounded-theme p-6 animate-fade-in backdrop-blur-sm">
          <div className="flex justify-between items-center mb-5">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-widest flex items-center gap-2">
              <Icons.Code size={16} className="text-purple-400" />
              Simulation Inputs
            </h3>
            <button
              onClick={onMagicFill}
              disabled={isFilling}
              className="flex items-center gap-1.5 text-xs font-semibold bg-purple-500/15 text-purple-300 px-3 py-1.5 rounded-lg border border-purple-500/30 hover:bg-purple-500/25 hover:border-purple-500/40 disabled:opacity-50 transition-all duration-200 transform hover:scale-105 active:scale-95"
            >
              {isFilling ? <span className="animate-pulse">Generating...</span> : <><Icons.Magic size={12} /> Magic Fill</>}
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {detectedVariables.map(v => (
              <div key={v} className="flex flex-col gap-2.5">
                <label className="text-sm text-brand-400 font-mono font-bold flex items-center gap-2">
                  <span className="text-purple-400">{`{${v}}`}</span>
                </label>
                <textarea
                  value={variableValues[v] || ''}
                  onChange={e => onVariableChange(v, e.target.value)}
                  placeholder={`Enter value for ${v}...`}
                  className="bg-gray-950/80 border border-white/15 rounded-lg px-4 py-3 text-sm text-white font-mono focus:border-brand-500/50 focus:outline-none focus:ring-2 focus:ring-brand-500/20 transition-all shadow-inner min-h-[100px] resize-y hover:border-white/20"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* System Instruction Section */}
      {formData.systemInstruction && (
        <div className="relative group">
          <h3 className="text-xs font-semibold text-gray-400 mb-5 uppercase tracking-widest flex items-center gap-2.5">
            <Icons.System size={18} className="text-blue-400" /> System Context
          </h3>
          <div className="bg-gradient-to-br from-gray-900/70 to-gray-950/70 p-6 md:p-7 rounded-theme border border-blue-500/20 text-gray-300 font-mono text-sm whitespace-pre-wrap leading-relaxed shadow-xl backdrop-blur-sm hover:border-blue-500/30 hover:shadow-2xl transition-all duration-300">
            {formData.systemInstruction}
          </div>
        </div>
      )}
    </div>
  );
};


