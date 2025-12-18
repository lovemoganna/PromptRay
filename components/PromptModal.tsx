import React, { useState, useEffect, useMemo, useRef } from 'react';
import Markdown from 'react-markdown';
import { Highlight, themes } from 'prism-react-renderer';
import {
  Prompt,
  Category,
  PromptFormData,
  PromptConfig,
  PromptVersion,
  Example,
  SavedRun,
  OutputType,
  ApplicationScene
} from '../types';
import { Icons } from './Icons';
import { ConfirmDialog } from './ConfirmDialog';
import { runGeminiPromptStream, optimizePromptContent, generateSampleVariables, generateTags, translatePromptToEnglish, generatePromptMetadata } from '../services/geminiService';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface PromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: PromptFormData & { savedRuns?: SavedRun[]; lastVariableValues?: Record<string, string> }) => void;
  initialData?: Prompt | null;
  onDuplicate?: (data: PromptFormData) => void;
  onNotify?: (message: string, type: 'success' | 'info' | 'error') => void;
  allCategories: string[];
  allAvailableTags: string[]; // For autocomplete
  onNext?: () => void;
  onPrev?: () => void;
  hasNext?: boolean;
  hasPrev?: boolean;
}

// Custom Code Block Component for Markdown
const CodeBlock = ({ language, code }: { language: string, code: string }) => {
    const [isCopied, setIsCopied] = useState(false);
    
    const copyToClipboard = () => {
        navigator.clipboard.writeText(code);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
    };
    
    return (
        <div className="code-block-wrapper rounded-theme overflow-hidden my-4 border border-white/10 bg-gray-950/80 group shadow-lg">
            <div className="flex items-center justify-between px-3 py-2 bg-gray-900/50 border-b border-white/5 backdrop-blur-sm">
                <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-500/20 border border-red-500/50"></span>
                    <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/20 border border-yellow-500/50"></span>
                    <span className="w-2.5 h-2.5 rounded-full bg-green-500/20 border border-green-500/50"></span>
                    <span className="ml-2 text-xs font-mono text-gray-400 uppercase tracking-wider">{language || 'text'}</span>
                </div>
                <button 
                    onClick={copyToClipboard}
                    className="flex items-center gap-1.5 text-xs font-medium text-gray-400 hover:text-white transition-colors bg-white/5 hover:bg-white/10 px-2 py-1 rounded"
                    title="Copy code"
                >
                                {isCopied ? <Icons.Check size={14} className="text-green-500"/> : <Icons.Copy size={14} />}
                    {isCopied ? 'Copied' : 'Copy'}
                </button>
            </div>
            <div className="overflow-x-auto">
                <Highlight theme={themes.vsDark} code={code} language={language || 'text'}>
                    {({ style, tokens, getLineProps, getTokenProps }) => (
                        <pre style={{...style, backgroundColor: 'transparent', margin: 0}} className="p-4 text-sm font-mono leading-relaxed">
                            {tokens.map((line, i) => (
                                <div key={i} {...getLineProps({ line })}>
                                    {line.map((token, key) => (
                                        <span key={key} {...getTokenProps({ token })} />
                                    ))}
                                </div>
                            ))}
                        </pre>
                    )}
                </Highlight>
            </div>
        </div>
    );
};

// --- Snippet Generator Modal Component ---
const CodeSnippetsModal: React.FC<{ 
    isOpen: boolean; 
    onClose: () => void; 
    rawPrompt: string; 
    systemInstruction?: string;
    examples?: Example[];
    config: PromptConfig;
    detectedVariables: string[];
    variableValues: Record<string, string>;
}> = ({ isOpen, onClose, rawPrompt, systemInstruction, examples, config, detectedVariables, variableValues }) => {
    const [activeLang, setActiveLang] = useState<'curl' | 'js' | 'python' | 'json'>('curl');
    const [injectData, setInjectData] = useState(false);

    const getProcessedText = (text: string) => {
        if (!injectData) return text;
        let result = text;
        detectedVariables.forEach(v => {
            if (variableValues[v]) {
                result = result.split(`{${v}}`).join(variableValues[v]);
            }
        });
        return result;
    };

    const promptText = getProcessedText(rawPrompt);
    const processedExamples = examples?.map(ex => ({
        input: getProcessedText(ex.input),
        output: ex.output
    }));

    const safePrompt = promptText.replace(/"/g, '\\"').replace(/\n/g, '\\n');
    const safeSystem = systemInstruction ? getProcessedText(systemInstruction).replace(/"/g, '\\"').replace(/\n/g, '\\n') : undefined;
    
    const constructContentsJson = () => {
        let parts = [];
        if (processedExamples) {
            processedExamples.forEach(ex => {
                if (ex.input) parts.push(`{"role": "user", "parts": [{"text": "${ex.input.replace(/"/g, '\\"').replace(/\n/g, '\\n')}"}]}`);
                if (ex.output) parts.push(`{"role": "model", "parts": [{"text": "${ex.output.replace(/"/g, '\\"').replace(/\n/g, '\\n')}"}]}`);
            });
        }
        parts.push(`{"role": "user", "parts": [{"text": "${safePrompt}"}]}`);
        return parts.join(',\n    ');
    };

    const snippets = {
        curl: `curl "https://generativelanguage.googleapis.com/v1beta/models/${config.model}:generateContent?key=$API_KEY" \\
-H 'Content-Type: application/json' \\
-d '{
  "contents": [
    ${constructContentsJson()}
  ],
  "generationConfig": {
    "temperature": ${config.temperature},
    "maxOutputTokens": ${config.maxOutputTokens},
    "topP": ${config.topP || 0.95},
    "topK": ${config.topK || 64}
  }${safeSystem ? `,\n  "systemInstruction": {
    "parts": [{"text": "${safeSystem}"}]
  }` : ''}
}'`,
        js: `import { GoogleGenerativeAI } from "@google/generative-ai";

const ai = new GoogleGenerativeAI(process.env.API_KEY);

const contents = [
${processedExamples?.map(ex => `  { role: 'user', parts: [{ text: \`${ex.input.replace(/`/g, '\\`')}\` }] },
  { role: 'model', parts: [{ text: \`${ex.output.replace(/`/g, '\\`')}\` }] },`).join('\n') || ''}
  { role: 'user', parts: [{ text: \`${promptText.replace(/`/g, '\\`')}\` }] }
];

const response = await ai.models.generateContent({
  model: '${config.model}',
  contents: contents,
  config: {
    temperature: ${config.temperature},
    maxOutputTokens: ${config.maxOutputTokens},
    topP: ${config.topP || 0.95},
    topK: ${config.topK || 64},${safeSystem ? `\n    systemInstruction: \`${safeSystem}\`,` : ''}
  },
});

console.log(response.text);`,
        python: `import os
from google import genai
from google.genai import types

client = genai.Client(api_key=os.environ["API_KEY"])

contents = [
${processedExamples?.map(ex => `    types.Content(role="user", parts=[types.Part.from_text("""${ex.input}""")]),
    types.Content(role="model", parts=[types.Part.from_text("""${ex.output}""")]),`).join('\n') || ''}
    types.Content(role="user", parts=[types.Part.from_text("""${promptText}""")])
]

response = client.models.generate_content(
    model="${config.model}",
    contents=contents,
    config=types.GenerateContentConfig(
        temperature=${config.temperature},
        max_output_tokens=${config.maxOutputTokens},
        top_p=${config.topP || 0.95},
        top_k=${config.topK || 64},${safeSystem ? `\n        system_instruction="""${safeSystem}""","` : ''}
    )
)

print(response.text)`,
        json: `{
  "model": "${config.model}",
  "contents": [
    ${constructContentsJson()}
  ],
  "generationConfig": {
    "temperature": ${config.temperature},
    "maxOutputTokens": ${config.maxOutputTokens},
    "topP": ${config.topP || 0.95},
    "topK": ${config.topK || 64}
  }${safeSystem ? `,\n  "systemInstruction": {
    "parts": [{"text": "${safeSystem}"}]
  }` : ''}
}`
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-6 sm:p-8 animate-fade-in">
            <div className="relative bg-gradient-to-br from-gray-900 to-gray-950 w-full max-w-3xl rounded-3xl border border-white/10 shadow-2xl flex flex-col overflow-hidden animate-slide-up-fade">
                <div className="flex items-center justify-between px-5 py-4 border-b border-white/5 bg-gray-900/60">
                    <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                        <Icons.Code size={16} className="text-brand-500"/> Developer Snippets
                    </h3>
                    <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors"><Icons.Close size={16}/></button>
                </div>
                <div className="flex items-center justify-between border-b border-white/5 bg-gray-900/40">
                    <div className="flex">
                        {(['curl', 'js', 'python', 'json'] as const).map(lang => (
                            <button
                                key={lang}
                                onClick={() => setActiveLang(lang)}
                                className={`px-4 py-2 text-xs font-mono uppercase tracking-wider transition-colors border-b-2 ${
                                    activeLang === lang 
                                    ? 'border-brand-500 text-white bg-white/5' 
                                    : 'border-transparent text-gray-500 hover:text-gray-300'
                                }`}
                            >
                                {lang === 'js' ? 'Node.js' : lang.toUpperCase()}
                            </button>
                        ))}
                    </div>
                    {detectedVariables.length > 0 && (
                        <label className="flex items-center gap-2 px-4 py-2 cursor-pointer group">
                            <input 
                                type="checkbox" 
                                checked={injectData}
                                onChange={e => setInjectData(e.target.checked)}
                                className="w-3.5 h-3.5 rounded border-gray-600 bg-gray-800 text-brand-500 focus:ring-offset-gray-900 focus:ring-brand-500"
                            />
                            <span className={`text-xs uppercase font-semibold tracking-wider transition-colors ${injectData ? 'text-brand-500' : 'text-gray-500 group-hover:text-gray-400'}`}>
                                Inject Test Data
                            </span>
                        </label>
                    )}
                </div>
                <div className="p-0 overflow-hidden bg-[#050608]">
                    <CodeBlock 
                        language={activeLang === 'curl' ? 'bash' : activeLang === 'js' ? 'javascript' : activeLang === 'python' ? 'python' : 'json'} 
                        code={snippets[activeLang]} 
                    />
                </div>
            </div>
        </div>
    );
};

// --- Aesthetic Preview Card Component ---
const AestheticCard: React.FC<{ 
    data: PromptFormData, 
    onClose?: () => void,
    onDownload?: () => void,
    onCopy?: () => void,
    isModal?: boolean,
    previewMode?: 'raw' | 'interpolated',
    getCompiledPrompt?: () => string
}> = ({ data, onClose, onDownload, onCopy, isModal, previewMode = 'raw', getCompiledPrompt }) => {
    const [copied, setCopied] = useState(false);
    
    const handleCopy = () => {
        onCopy?.();
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const displayText = previewMode === 'interpolated' && getCompiledPrompt ? getCompiledPrompt() : data.content;

    // Generative Gradient based on category
    const getGradient = () => {
        switch(data.category) {
            case 'Code': return 'from-blue-900/40 via-gray-900 to-gray-950';
            case 'Writing': return 'from-purple-900/40 via-gray-900 to-gray-950';
            case 'Ideas': return 'from-yellow-900/40 via-gray-900 to-gray-950';
            case 'Analysis': return 'from-green-900/40 via-gray-900 to-gray-950';
            default: return 'from-brand-500/20 via-gray-900 to-gray-950';
        }
    };

    const renderContent = (
        <div className={`relative overflow-hidden ${isModal ? 'rounded-3xl max-w-4xl w-full' : 'rounded-2xl aspect-[1.85/1] group/card'} bg-gray-950 border border-white/10 shadow-2xl transition-all duration-500`}>
             {/* 1. Dynamic Backgrounds */}
             {data.previewMediaUrl ? (
                <div className="absolute inset-0">
                    <img 
                        src={data.previewMediaUrl} 
                        alt={data.title} 
                        className="w-full h-full object-cover transition-transform duration-700 hover:scale-105" 
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-gray-950/90 via-gray-950/60 to-gray-950/30" />
                </div>
            ) : (
                <div className={`absolute inset-0 bg-gradient-to-br ${getGradient()}`}>
                    <div className="absolute inset-0 bg-noise opacity-[0.07] mix-blend-overlay" />
                    <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-brand-500/10 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/3 mix-blend-screen animate-pulse-slow" />
                    <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-purple-500/10 rounded-full blur-[80px] translate-y-1/3 -translate-x-1/4 mix-blend-screen" />
                    {/* Decorative Grid */}
                    <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_80%_80%_at_50%_50%,black,transparent)] opacity-40" />
                </div>
            )}

            {/* 2. Controls (Top Right) - Reveal on Hover */}
            <div className={`absolute top-6 right-6 flex items-center gap-2 z-20 transition-all duration-300 ${isModal ? 'opacity-100' : 'opacity-0 group-hover/card:opacity-100 translate-y-2 group-hover/card:translate-y-0'}`}>
                {onDownload && data.previewMediaUrl && (
                    <button 
                        onClick={(e) => { e.stopPropagation(); onDownload(); }}
                        className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 text-white backdrop-blur-md shadow-lg transition-all active:scale-95"
                        title="Download Image"
                    >
                        <Icons.Download size={18} />
                    </button>
                )}
                {onCopy && (
                    <button 
                        onClick={(e) => { e.stopPropagation(); handleCopy(); }}
                        className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 text-white backdrop-blur-md shadow-lg transition-all active:scale-95 flex items-center gap-2"
                        title="Copy Prompt Content"
                    >
                        {copied ? <Icons.Check size={18} className="text-green-400" /> : <Icons.Copy size={18} />}
                        {isModal && <span className="text-xs font-semibold pr-1">Copy</span>}
                    </button>
                )}
                {onClose && (
                    <button 
                        onClick={(e) => { e.stopPropagation(); onClose(); }}
                        className="p-2.5 rounded-xl bg-white/10 hover:bg-red-500/20 hover:text-red-400 border border-white/10 text-white/70 backdrop-blur-md shadow-lg transition-all active:scale-95 ml-2"
                        title="Close View"
                    >
                        <Icons.Close size={18} />
                    </button>
                )}
            </div>

             {/* 3. Content Layout */}
             <div className={`absolute inset-0 p-8 md:p-12 flex flex-col justify-between z-10 pointer-events-none`}>
                {/* Top Left: Badge & Brand */}
                <div className="flex items-start justify-between pointer-events-auto">
                    <div className="flex items-center gap-3">
                        <div className="px-3 py-1 rounded-full bg-white/10 border border-white/10 text-xs font-bold text-white uppercase tracking-wider backdrop-blur-md shadow-lg flex items-center gap-2">
                             <div className="w-2 h-2 rounded-full bg-brand-500 shadow-[0_0_10px_rgba(var(--c-brand),0.8)] animate-pulse" />
                             {data.category}
                        </div>
                    </div>
                </div>

                {/* Center: Title */}
                <div className="flex-1 flex flex-col items-center justify-center text-center px-4 pointer-events-auto">
                    <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-white/60 tracking-tighter drop-shadow-2xl mb-4 leading-tight">
                        {data.title || "Untitled Prompt"}
                    </h1>
                    <p className="text-sm md:text-base text-gray-300/80 max-w-2xl line-clamp-2 leading-relaxed font-light backdrop-blur-sm px-4 py-1 rounded-full bg-black/10">
                        {data.description}
                    </p>
                </div>

                {/* Bottom: Prompt Snippet */}
                <div className="pointer-events-auto">
                    <div className="relative overflow-hidden rounded-xl border border-white/10 bg-black/40 p-5 backdrop-blur-md shadow-lg group/preview hover:bg-black/50 transition-colors">
                         <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0 group-hover/preview:opacity-100 transition-opacity duration-700 pointer-events-none" />
                         <div className="flex items-center gap-2 mb-2 text-[10px] text-brand-300 font-mono uppercase tracking-wider font-bold opacity-80">
                             <Icons.Code size={12} />
                             <span>Prompt Preview</span>
                         </div>
                         <p className="text-xs md:text-sm text-gray-200 font-mono line-clamp-3 leading-relaxed opacity-90 break-words whitespace-pre-wrap">
                            {displayText}
                         </p>
                    </div>
                </div>
             </div>
        </div>
    );

    if (isModal) {
        return (
             <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-xl p-6 animate-fade-in" onClick={onClose}>
                 <div onClick={e => e.stopPropagation()} className="w-full max-w-5xl">
                    {renderContent}
                    <div className="text-center mt-6 text-gray-500 text-xs font-mono tracking-widest uppercase opacity-70">
                        Press ESC to close • Rendered by PromptRay
                    </div>
                 </div>
             </div>
        );
    }

    return renderContent;
};

const PromptModalComponent: React.FC<PromptModalProps> = ({ 
    isOpen, onClose, onSave, initialData, onDuplicate, onNotify, allCategories, allAvailableTags,
    onNext, onPrev, hasNext, hasPrev
}) => {
  const [formData, setFormData] = useState<PromptFormData>({
    title: '',
    description: '',
    content: '',
    englishPrompt: '',
    chinesePrompt: '',
    systemInstruction: '',
    examples: [],
    category: 'Misc',
    tags: [],
    outputType: undefined,
    applicationScene: undefined,
    technicalTags: [],
    styleTags: [],
    customLabels: [],
    previewMediaUrl: '',
    source: '',
    sourceAuthor: '',
    sourceUrl: '',
    recommendedModels: [],
    usageNotes: '',
    cautions: '',
    isFavorite: false,
    status: 'active',
    config: {
        model: 'gemini-2.5-flash',
        temperature: 0.7,
        maxOutputTokens: 2000,
        topP: 0.95,
        topK: 64
    }
  });

  const [savedRuns, setSavedRuns] = useState<SavedRun[]>([]);

  const [tagInput, setTagInput] = useState('');
  const [tagSuggestions, setTagSuggestions] = useState<string[]>([]);
  
  const [testResult, setTestResult] = useState<string | null>(null);
  const [isTesting, setIsTesting] = useState(false);
  const [isOptimizingPrompt, setIsOptimizingPrompt] = useState(false);
  const [isOptimizingSystem, setIsOptimizingSystem] = useState(false);
  const [isFilling, setIsFilling] = useState(false);
  const [isTagging, setIsTagging] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);
  const [isAutoMeta, setIsAutoMeta] = useState(false);
  
  type TabKey = 'preview' | 'edit' | 'examples' | 'test' | 'history';
  const [activeTab, setActiveTab] = useState<TabKey>('preview');
  const [previewMode, setPreviewMode] = useState<'raw' | 'interpolated'>('raw');
  const [shareMode, setShareMode] = useState(false); // Zen mode for screenshots
  
  const [copiedPreview, setCopiedPreview] = useState(false);
  
  const [showSnippets, setShowSnippets] = useState(false);
  
  const [detectedVariables, setDetectedVariables] = useState<string[]>([]);
  const [variableValues, setVariableValues] = useState<Record<string, string>>({});


  const tabSequence = useMemo<TabKey[]>(
    () => (initialData ? ['preview', 'edit', 'examples', 'test', 'history'] : ['preview', 'edit', 'examples', 'test']),
    [initialData]
  );
  
  // AbortController for canceling API requests
  const abortControllerRef = useRef<AbortController | null>(null);
  
  // Confirm Dialog State
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    type?: 'danger' | 'warning' | 'info';
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
    type: 'warning'
  });
  
  const getTokenCount = (text: string) => Math.ceil(text.length / 4);

  // Auto-generate high-level metadata from existing content using the model (with heuristic fallback)
  const handleAutoMetadata = async () => {
    if (!formData.content && !formData.title && !formData.description) {
      onNotify?.('请先完善提示词内容或标题，再自动生成元信息。', 'info');
      return;
    }

    setIsAutoMeta(true);
    try {
      const baseText = `${formData.title}\n${formData.description}\n${formData.content}`.trim();

      // 1. Try model-based metadata generation first (JSON mode in service layer)
      try {
        const parsed = await generatePromptMetadata(
          formData.title,
          formData.description,
          formData.content
        );

        setFormData(prev => ({
          ...prev,
          category: (parsed.category as Category) || prev.category,
          // Ensure parsed.outputType and applicationScene are treated as strongly-typed values
          outputType: (parsed.outputType as OutputType) || prev.outputType,
          applicationScene: (parsed.applicationScene as ApplicationScene) || prev.applicationScene,
          usageNotes: parsed.usageNotes || prev.usageNotes,
          cautions: parsed.cautions || prev.cautions,
          recommendedModels:
            parsed.recommendedModels && parsed.recommendedModels.length > 0
              ? parsed.recommendedModels
              : prev.recommendedModels && prev.recommendedModels.length > 0
              ? prev.recommendedModels
              : ['gemini-2.5-flash']
        }));

        onNotify?.('已使用模型根据提示词内容自动生成元信息，你可以继续微调。', 'success');
        return; // 成功则直接返回，不走本地启发式逻辑
      } catch (modelError) {
        console.warn('Auto metadata via model failed, falling back to heuristic.', modelError);
        // 对用户用信息化提示，而不是报错，让其知晓已自动降级。
        onNotify?.('元信息服务暂时繁忙，已自动使用本地规则生成元信息。', 'info');
        // 继续走下面的启发式逻辑
      }

      // 2. Fallback: 轻量启发式推断（保持兼容）
      const text = baseText.toLowerCase();

      // 推断类别（非常轻量的关键词映射，用户后续可以自己微调）
      let inferredCategory: Category = formData.category;
      if (!formData.category || formData.category === 'Misc') {
        if (text.includes('code') || text.includes('代码') || text.includes('bug') || text.includes('重构')) {
          inferredCategory = 'Code';
        } else if (text.includes('写作') || text.includes('文案') || text.includes('copy') || text.includes('社交媒体')) {
          inferredCategory = 'Writing';
        } else if (text.includes('idea') || text.includes('创意') || text.includes('点子')) {
          inferredCategory = 'Ideas';
        } else if (text.includes('分析') || text.includes('report') || text.includes('summary')) {
          inferredCategory = 'Analysis';
        } else if (text.includes('有趣') || text.includes('搞笑') || text.includes('fun')) {
          inferredCategory = 'Fun';
        } else {
          inferredCategory = 'Misc';
        }
      }

      // 推断输出类型
      let inferredOutputType = formData.outputType;
      if (!inferredOutputType) {
        if (text.includes('图片') || text.includes('image') || text.includes('banner')) inferredOutputType = 'image' as any;
        else if (text.includes('视频') || text.includes('video')) inferredOutputType = 'video' as any;
        else if (text.includes('音频') || text.includes('audio') || text.includes('播客')) inferredOutputType = 'audio' as any;
        else inferredOutputType = 'text' as any;
      }

      // 推断应用场景
      let inferredScene = formData.applicationScene;
      if (!inferredScene) {
        if (text.includes('角色') || text.includes('persona')) inferredScene = '角色设计' as any;
        else if (text.includes('场景') || text.includes('scene')) inferredScene = '场景生成' as any;
        else if (text.includes('风格') || text.includes('style')) inferredScene = '风格转换' as any;
        else if (text.includes('故事') || text.includes('story')) inferredScene = '故事创作' as any;
        else if (text.includes('工具') || text.includes('tool') || text.includes('工作流')) inferredScene = '工具使用' as any;
        else inferredScene = '其他' as any;
      }

      // 使用说明 / 注意事项 默认模板（仅在为空时填充）
      const usageNotes =
        formData.usageNotes ||
        '按照上方「提示词内容」直接粘贴到模型输入中使用，可结合标签与场景根据需要微调。';
      const cautions =
        formData.cautions ||
        '使用前请根据你的具体业务场景检查示例和变量是否合理，避免泄露敏感信息。';

      // 推荐模型：如果为空，则给一个合理默认
      const recommendedModels =
        formData.recommendedModels && formData.recommendedModels.length > 0
          ? formData.recommendedModels
          : ['gemini-2.5-flash'];

      setFormData(prev => ({
        ...prev,
        category: inferredCategory,
        outputType: inferredOutputType,
        applicationScene: inferredScene,
        usageNotes,
        cautions,
        recommendedModels
      }));

      onNotify?.('已根据提示词内容自动生成元信息，你可以继续微调。', 'success');
    } catch (error) {
      console.error('handleAutoMetadata error:', error);
      onNotify?.('自动生成元信息时出错，请稍后重试。', 'error');
    } finally {
      setIsAutoMeta(false);
    }
  };

  // Sorted runs by rating (good first) then timestamp
  const sortedRuns = useMemo(() => {
      return [...savedRuns].sort((a, b) => {
          if (a.rating === 'good' && b.rating !== 'good') return -1;
          if (a.rating !== 'good' && b.rating === 'good') return 1;
          return b.timestamp - a.timestamp;
      });
  }, [savedRuns]);

  useEffect(() => {
    if (initialData) {
      setFormData({
        title: initialData.title,
        description: initialData.description,
        content: initialData.content,
        englishPrompt: initialData.englishPrompt || initialData.content,
        chinesePrompt: initialData.chinesePrompt || '',
        systemInstruction: initialData.systemInstruction || '',
        examples: initialData.examples || [],
        category: initialData.category,
        tags: initialData.tags,
        outputType: initialData.outputType,
        applicationScene: initialData.applicationScene,
        technicalTags: initialData.technicalTags || [],
        styleTags: initialData.styleTags || [],
        customLabels: initialData.customLabels || [],
        previewMediaUrl: initialData.previewMediaUrl || '',
        source: initialData.source || '',
        sourceAuthor: initialData.sourceAuthor || '',
        sourceUrl: initialData.sourceUrl || '',
        recommendedModels: initialData.recommendedModels || [],
        usageNotes: initialData.usageNotes || '',
        cautions: initialData.cautions || '',
        isFavorite: initialData.isFavorite,
        status: initialData.status || 'active',
        config: initialData.config || {
            model: 'gemini-2.5-flash',
            temperature: 0.7,
            maxOutputTokens: 2000,
            topP: 0.95,
            topK: 64
        }
      });
      setSavedRuns(initialData.savedRuns || []);
      setVariableValues(initialData.lastVariableValues || {});
      setActiveTab('preview'); 
    } else {
        setFormData({
            title: '',
            description: '',
            content: '',
            englishPrompt: '',
            chinesePrompt: '',
            systemInstruction: '',
            examples: [],
            category: 'Code',
            tags: [],
            outputType: undefined,
            applicationScene: undefined,
            technicalTags: [],
            styleTags: [],
            customLabels: [],
            previewMediaUrl: '',
            source: '',
            sourceAuthor: '',
            sourceUrl: '',
            recommendedModels: [],
            usageNotes: '',
            cautions: '',
            isFavorite: false,
            config: {
                model: 'gemini-2.5-flash',
                temperature: 0.7,
                maxOutputTokens: 2000,
                topP: 0.95,
                topK: 64
            }
        });
        setSavedRuns([]);
        setVariableValues({});
        setActiveTab('edit');
    }
    setTestResult(null);
    setPreviewMode('raw');
    setShareMode(false);
  }, [initialData, isOpen]);

  // Cleanup: Cancel any ongoing requests when modal closes
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
    };
  }, [isOpen]);

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
        if (!isOpen) return;
        const target = e.target as HTMLElement | null;
        const isFormField = target && (
            target.isContentEditable ||
            ['INPUT', 'TEXTAREA', 'SELECT', 'OPTION'].includes(target.tagName)
        );
        if ((e.metaKey || e.ctrlKey) && e.key === 's') {
            e.preventDefault();
            onSave({ ...formData, savedRuns, lastVariableValues: variableValues });
            onClose();
        }
        if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
            if (activeTab === 'test') {
                e.preventDefault();
                handleRunGeminiStream();
            }
        }
        if (e.key === 'Escape') {
            if (showSnippets) setShowSnippets(false);
            else if (shareMode) setShareMode(false);
            else onClose();
        }
        // Navigation shortcuts
        if ((e.metaKey || e.ctrlKey) && e.key === 'ArrowRight' && hasNext) {
            e.preventDefault();
            onNext?.();
        }
        if ((e.metaKey || e.ctrlKey) && e.key === 'ArrowLeft' && hasPrev) {
            e.preventDefault();
            onPrev?.();
        }
        if (e.key === 'Tab' && !isFormField) {
            e.preventDefault();
            const currentIndex = tabSequence.indexOf(activeTab as typeof tabSequence[number]);
            if (currentIndex !== -1) {
                const direction = e.shiftKey ? -1 : 1;
                const nextIndex = (currentIndex + direction + tabSequence.length) % tabSequence.length;
                setActiveTab(tabSequence[nextIndex]);
            }
        }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, formData, activeTab, showSnippets, savedRuns, variableValues, hasNext, hasPrev, onNext, onPrev, shareMode, tabSequence]);

  // Variable Detection with validation
  useEffect(() => {
    const textsToScan = [
        formData.content, 
        formData.systemInstruction, 
        ...(formData.examples?.map(e => e.input) || [])
    ];
    const combinedText = textsToScan.join(' ');
    
    // Improved regex: matches {variable} but rejects nested braces like {var{inner}}
    // This regex ensures no nested braces are captured
    const matches = combinedText.matchAll(/\{([^{}]+)\}/g);
    const vars = Array.from(matches, m => m[1]);
    
    // Validate variable names: no nested braces, no empty, alphanumeric + underscore + dash
    const validVars = vars
      .filter(v => {
        const trimmed = v.trim();
        // Reject if contains braces (nested)
        if (trimmed.includes('{') || trimmed.includes('}')) {
          return false;
        }
        // Reject if empty
        if (trimmed === '') {
          return false;
        }
        // Optional: validate format (alphanumeric, underscore, dash, space allowed)
        // This is permissive but prevents obvious errors
        return trimmed.length > 0;
      })
      .map(v => v.trim());
    
    const uniqueVars = Array.from(new Set(validVars));
    setDetectedVariables(uniqueVars);
  }, [formData.content, formData.systemInstruction, formData.examples]);

  // Tag Autocomplete Logic
  const handleAddExample = () => {
      setFormData(prev => ({...prev, examples: [...(prev.examples || []), { input: '', output: '' }]}));
  };
  
  // Enhanced Template examples for quick insertion with diverse use cases
  const exampleTemplates = [
      {
          name: 'Text Classification',
          category: 'Analysis',
          input: 'Classify this text: "The weather is sunny and warm today."',
          output: 'Category: Weather\nSentiment: Positive\nTopic: Daily observation'
      },
      {
          name: 'Code Refactoring',
          category: 'Code',
          input: 'Refactor this code:\nfunction calc(x, y) { return x + y; }',
          output: 'function calculateSum(x: number, y: number): number {\n  return x + y;\n}'
      },
      {
          name: 'Email Extraction',
          category: 'Writing',
          input: 'Extract email addresses from: Contact us at support@example.com or sales@company.org',
          output: 'Found emails:\n- support@example.com\n- sales@company.org'
      },
      {
          name: 'Data Formatting',
          category: 'Analysis',
          input: 'Format this data: name=John, age=30, city=NYC',
          output: '{\n  "name": "John",\n  "age": 30,\n  "city": "NYC"\n}'
      },
      {
          name: 'Translation',
          category: 'Writing',
          input: 'Translate to Spanish: "Hello, how are you?"',
          output: 'Hola, ¿cómo estás?'
      },
      {
          name: 'Question Answering',
          category: 'Ideas',
          input: 'What are the benefits of renewable energy?',
          output: 'Benefits include: 1) Reduced carbon emissions 2) Lower long-term costs 3) Energy independence 4) Sustainable resource use'
      },
      {
          name: 'Code Explanation',
          category: 'Code',
          input: 'Explain this code: const result = arr.map(x => x * 2)',
          output: 'This code multiplies each element in the array by 2 using the map function, creating a new array with doubled values.'
      },
      {
          name: 'Content Summarization',
          category: 'Writing',
          input: 'Summarize: [Long article about AI development...]',
          output: 'Summary: The article discusses recent advances in AI, focusing on language models and their applications in various industries.'
      }
  ];
  
  const handleInsertTemplate = (template: { name: string; category?: string; input: string; output: string }) => {
      setFormData(prev => ({...prev, examples: [...(prev.examples || []), { input: template.input, output: template.output }]}));
      if (onNotify) onNotify(`Added "${template.name}" template`, 'success');
  };
  const handleUpdateExample = (index: number, field: 'input' | 'output', value: string) => {
      setFormData(prev => {
          const newExamples = [...(prev.examples || [])];
          newExamples[index] = { ...newExamples[index], [field]: value };
          return { ...prev, examples: newExamples };
      });
  };
  const handleRemoveExample = (index: number) => {
      setFormData(prev => ({...prev, examples: (prev.examples || []).filter((_, i) => i !== index)}));
  };
  const handleAddTag = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
        e.preventDefault();
        addTag(tagInput);
    }
  };
  const addTag = (tagName: string) => {
    if (tagName.trim() && !formData.tags.includes(tagName.trim())) {
        setFormData(prev => ({ ...prev, tags: [...prev.tags, tagName.trim()] }));
        setTagInput('');
        setTagSuggestions([]);
    }
  };
  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({ ...prev, tags: prev.tags.filter(t => t !== tagToRemove) }));
  };
  // Tag Autocomplete
  useEffect(() => {
    if (tagInput.trim()) {
        const lowerInput = tagInput.toLowerCase();
        const filtered = allAvailableTags.filter(t => t.toLowerCase().includes(lowerInput) && !formData.tags.includes(t));
        setTagSuggestions(filtered.slice(0, 5));
    } else { setTagSuggestions([]); }
  }, [tagInput, allAvailableTags, formData.tags]);
  const handleConfigChange = (key: keyof PromptConfig, value: any) => {
      setFormData(prev => ({...prev, config: {...prev.config!, [key]: value}}));
  };

  const getCompiledText = (text: string) => {
      let result = text;
      detectedVariables.forEach(v => {
          if (variableValues[v]) {
              result = result.split(`{${v}}`).join(variableValues[v]);
          }
      });
      return result;
  }

  const getCompiledPrompt = () => getCompiledText(formData.content);
  const getCompiledSystemInstruction = () => formData.systemInstruction ? getCompiledText(formData.systemInstruction) : undefined;
  const getCompiledExamples = () => formData.examples?.map(ex => ({ input: getCompiledText(ex.input), output: ex.output }));

  const handleRunGeminiStream = async () => {
    // Cancel any existing request
    if (abortControllerRef.current) {
        abortControllerRef.current.abort();
    }
    
    // Create new AbortController
    const abortController = new AbortController();
    abortControllerRef.current = abortController;
    
    setIsTesting(true);
    setTestResult("");
    const promptToSend = getCompiledPrompt();
    const systemToSend = getCompiledSystemInstruction();
    const examplesToSend = getCompiledExamples();
    
    if (!promptToSend) {
        setIsTesting(false);
        if (onNotify) onNotify("Prompt is empty!", "error");
        return;
    }

    try {
        const stream = runGeminiPromptStream(promptToSend, { 
            model: formData.config?.model,
            temperature: formData.config?.temperature, 
            maxOutputTokens: formData.config?.maxOutputTokens,
            topP: formData.config?.topP,
            topK: formData.config?.topK,
            systemInstruction: systemToSend,
            examples: examplesToSend,
            signal: abortController.signal
        });
        for await (const chunk of stream) {
            // Check if request was aborted
            if (abortController.signal.aborted) {
                return;
            }
            if (chunk.startsWith("Error:") || chunk.startsWith("\n[Error:")) {
                 if (onNotify) onNotify(chunk.trim(), "error");
            }
            setTestResult(prev => (prev || "") + chunk);
        }
    } catch (e) {
        // Don't report error if request was aborted
        if (abortController.signal.aborted) {
            return;
        }
        const errorMsg = e instanceof Error ? e.message : "Unknown error";
        setTestResult(prev => (prev || "") + `\n[Error executing stream: ${errorMsg}]`);
        if (onNotify) onNotify(`Execution failed: ${errorMsg}`, "error");
    } finally {
        if (!abortController.signal.aborted) {
            setIsTesting(false);
        }
        abortControllerRef.current = null;
    }
  };

  const handleSaveRun = () => {
      if (!testResult) return;
      const newRun: SavedRun = {
          id: crypto.randomUUID(),
          timestamp: Date.now(),
          model: formData.config?.model || 'unknown',
          inputValues: { ...variableValues },
          output: testResult
      };
      const updatedRuns = [newRun, ...savedRuns].slice(0, 20);
      setSavedRuns(updatedRuns);
      onSave({ ...formData, savedRuns: updatedRuns, lastVariableValues: variableValues });
      if (onNotify) onNotify("Run saved to history", "success");
  };

  const handleRateRun = (runId: string, rating: 'good' | 'bad') => {
      const updatedRuns = savedRuns.map(r => r.id === runId ? { ...r, rating } : r);
      setSavedRuns(updatedRuns);
      onSave({ ...formData, savedRuns: updatedRuns, lastVariableValues: variableValues });
  };

  const handleLoadRun = (run: SavedRun) => {
      setVariableValues(run.inputValues);
      setTestResult(run.output);
  };

  const handleDeleteRun = (runId: string) => {
      const updatedRuns = savedRuns.filter(r => r.id !== runId);
      setSavedRuns(updatedRuns);
      onSave({ ...formData, savedRuns: updatedRuns, lastVariableValues: variableValues });
  };

  const handleOptimizePrompt = async () => {
      if (!formData.content) return;
      setIsOptimizingPrompt(true);
      try {
        const goodRuns = savedRuns.filter(r => r.rating === 'good');
        const optimized = await optimizePromptContent(formData.content, 'prompt', goodRuns);
        setFormData(prev => ({ ...prev, content: optimized }));
        if (onNotify) onNotify("Prompt optimized successfully!", "success");
      } catch (error: any) {
        if (onNotify) onNotify(error.message || "Failed to optimize prompt", "error");
      } finally {
        setIsOptimizingPrompt(false);
      }
  };

  const handleOptimizeSystem = async () => {
      if (!formData.systemInstruction) return;
      setIsOptimizingSystem(true);
      try {
        const goodRuns = savedRuns.filter(r => r.rating === 'good');
        const optimized = await optimizePromptContent(formData.systemInstruction, 'system', goodRuns);
        // Check if component is still mounted and modal is still open
        if (isOpen) {
            setFormData(prev => ({ ...prev, systemInstruction: optimized }));
            if (onNotify) onNotify("System instruction optimized!", "success");
        }
      } catch (error: any) {
        if (isOpen && onNotify) {
            onNotify(error.message || "Failed to optimize system", "error");
        }
      } finally {
        if (isOpen) {
            setIsOptimizingSystem(false);
        }
      }
  };

  const handleAutoTag = async () => {
      if (!formData.content) { if (onNotify) onNotify("Add content first.", "info"); return; }
      setIsTagging(true);
      try {
          // Use default timeout (60s) for better reliability
          const tags = await generateTags(formData.title, formData.description, formData.content);
          if (tags.length > 0) {
              setFormData(prev => ({ ...prev, tags: [...new Set([...formData.tags, ...tags])] }));
              if (onNotify) onNotify(`Added ${tags.length} tags!`, "success");
          } else { if (onNotify) onNotify("No relevant tags found.", "info"); }
      } catch (error: any) { 
          console.error("Auto Tag Error:", error);
          if (onNotify) onNotify(error.message || "自动标记失败，请重试", "error"); 
      } finally { setIsTagging(false); }
  };

  const handleTranslateToEnglish = async () => {
      if (!formData.content || formData.content.trim().length === 0) {
          if (onNotify) onNotify("请先输入中文提示词", "info");
          return;
      }
      setIsTranslating(true);
      try {
          // Use default timeout (60s) for better reliability
          const englishPrompt = await translatePromptToEnglish(formData.content);
          setFormData(prev => ({ ...prev, englishPrompt }));
          if (onNotify) onNotify("翻译完成！英文提示词已自动保存", "success");
      } catch (error: any) {
          console.error("Translation Error:", error);
          if (onNotify) onNotify(error.message || "翻译失败，请重试", "error");
      } finally {
          setIsTranslating(false);
      }
  };
  const handleMagicFill = async () => {
      if (detectedVariables.length === 0) { if (onNotify) onNotify("No variables.", "info"); return; }
      setIsFilling(true);
      try {
          // Magic Fill is an assistive feature – keep a tighter timeout to avoid long hangs.
          const vals = await generateSampleVariables(formData.content, detectedVariables, 15000);
          setVariableValues(prev => ({ ...prev, ...vals }));
          if (onNotify) onNotify("Filled!", "success");
      } catch (error: any) { if (onNotify) onNotify(error.message, "error"); } finally { setIsFilling(false); }
  };
  const handleCopyRawPrompt = () => {
      const text = previewMode === 'interpolated' ? getCompiledPrompt() : formData.content;
      navigator.clipboard.writeText(text);
      setCopiedPreview(true);
      setTimeout(() => setCopiedPreview(false), 2000);
  };
  const handleDownloadPreview = () => {
      if (!formData.previewMediaUrl) {
          onNotify?.('当前提示词尚未配置预览图片 URL', 'info');
          return;
      }
      // Simple link download attempt for external URLs
      try {
          const link = document.createElement('a');
          link.href = formData.previewMediaUrl;
          link.download = `${formData.title || 'prompt'}-preview`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          onNotify?.('预览图片下载已开始', 'success');
      } catch (error) {
          console.error('Download preview image failed', error);
          onNotify?.('下载预览图片时出错，请稍后重试。', 'error');
      }
  };

  const handleCopyEnglishPrompt = () => {
      if (!formData.englishPrompt) {
          onNotify?.('No English prompt defined yet', 'info');
          return;
      }
      navigator.clipboard.writeText(formData.englishPrompt);
      onNotify?.('English prompt copied', 'success');
  };

  const handleCopyChinesePrompt = () => {
      if (!formData.chinesePrompt) {
          onNotify?.('尚未配置中文提示词', 'info');
          return;
      }
      navigator.clipboard.writeText(formData.chinesePrompt);
      onNotify?.('中文提示词已复制', 'success');
  };

  const handleCopyBilingualPrompt = () => {
      const lines: string[] = [];
      lines.push(`标题: ${formData.title}`);
      if (formData.englishPrompt) {
          lines.push('', 'English Prompt:', formData.englishPrompt);
      }
      if (formData.chinesePrompt) {
          lines.push('', '中文提示词:', formData.chinesePrompt);
      }
      const text = lines.join('\n');
      if (!text.trim()) {
          onNotify?.('暂无可复制的双语提示词', 'info');
          return;
      }
      navigator.clipboard.writeText(text);
      onNotify?.('双语提示词已复制', 'success');
  };
  const handleDuplicate = () => { onDuplicate?.(formData); onClose(); };
  const handleRestoreVersion = (version: PromptVersion) => {
      setConfirmDialog({
          isOpen: true,
          title: 'Restore Version',
          message: `Restore this version from ${new Date(version.timestamp).toLocaleString()}? Current changes will be lost.`,
          type: 'warning',
          onConfirm: () => {
              setFormData(prev => ({...prev, content: version.content, systemInstruction: version.systemInstruction || '', examples: version.examples || [], config: version.config || prev.config, title: version.title}));
              setActiveTab('edit');
              setConfirmDialog(prev => ({ ...prev, isOpen: false }));
          }
      });
  };

  const renderHighlightedContent = (text: string) => {
    if (!text) return <span className="text-gray-500 italic">No content...</span>;
    if (previewMode === 'interpolated') return <span className="whitespace-pre-wrap">{text}</span>;
    const parts = text.split(/(\{.*?\})/g);
    return (<span>{parts.map((part, i) => {
        if (part.startsWith('{') && part.endsWith('}')) {
            return <span key={i} className="text-brand-500 font-bold bg-brand-500/10 px-1 rounded shadow-[0_0_10px_rgba(var(--c-brand),0.2)]">{part}</span>;
        }
        return part;
    })}</span>);
  };

  if (!isOpen) return null;

  if (shareMode) {
      return (
          <AestheticCard 
            data={formData} 
            isModal={true} 
            onClose={() => setShareMode(false)}
            onDownload={handleDownloadPreview}
            onCopy={handleCopyRawPrompt}
            previewMode={previewMode}
            getCompiledPrompt={getCompiledPrompt}
          />
      );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-2 sm:p-3 md:p-6 animate-fade-in transition-all" data-modal-overlay>
      <div className="w-full max-w-[96vw] lg:max-w-6xl 2xl:max-w-[1500px] rounded-2xl bg-gray-950/95 border border-white/10 shadow-xl flex flex-col min-h-[65vh] md:min-h-[72vh] max-h-[94vh] md:max-h-[90vh] relative overflow-hidden animate-slide-up-fade text-sm sm:text-[15px] lg:text-base" data-modal-panel>
        {/* Header：简化为纯色条，减少视觉干扰 */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 sm:px-6 py-4 sm:py-5 border-b border-white/10 shrink-0 bg-gray-900/90 z-10 relative" data-modal-header>
          <div className="flex items-center gap-3 sm:gap-4 max-w-full">
              <div className="flex items-center gap-1">
                  <button 
                    onClick={onPrev} disabled={!hasPrev} 
                    className="p-2 rounded-lg hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-110 active:scale-95 border border-transparent hover:border-white/10 relative group/btn overflow-hidden"
                    title="Previous Prompt (Cmd+Left)"
                  >
                      <Icons.Trend className="rotate-[-90deg] relative z-10" size={18} />
                      <div className="absolute inset-0 bg-gradient-to-r from-brand-500/0 via-brand-500/20 to-brand-500/0 opacity-0 group-hover/btn:opacity-100 transition-opacity duration-300"></div>
                  </button>
                  <button 
                    onClick={onNext} disabled={!hasNext} 
                    className="p-2 rounded-lg hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-110 active:scale-95 border border-transparent hover:border-white/10 relative group/btn overflow-hidden"
                    title="Next Prompt (Cmd+Right)"
                  >
                      <Icons.Trend className="rotate-90deg relative z-10" size={18} />
                      <div className="absolute inset-0 bg-gradient-to-r from-brand-500/0 via-brand-500/20 to-brand-500/0 opacity-0 group-hover/btn:opacity-100 transition-opacity duration-300"></div>
                  </button>
              </div>
              {initialData ? (
                  <div className="flex flex-col min-w-0">
                      <h2 className="text-base sm:text-lg lg:text-xl font-bold text-white tracking-tight line-clamp-1 max-w-[320px] sm:max-w-[420px] lg:max-w-[560px]">{formData.title}</h2>
                      <span className="text-[11px] sm:text-xs text-gray-500 font-mono opacity-70">ID: {initialData.id.slice(0,8)}...</span>
                  </div>
              ) : (
                  <h2 className="text-base sm:text-lg lg:text-xl font-bold text-white tracking-tight">New Prompt</h2>
              )}
          </div>
          
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap justify-end">
              {/* Enhanced Tools Group */}
              <div className="flex items-center bg-white/8 border border-white/15 rounded-lg p-0.5 backdrop-blur-sm">
                  <button
                      onClick={() => setShareMode(true)}
                      className="p-2 text-gray-300 hover:text-white rounded-md hover:bg-white/12 transition-all duration-200 transform hover:scale-110 active:scale-95"
                      title="View Card (Share Mode)"
                  >
                      <Icons.Image size={18} />
                  </button>
                  <div className="w-[1px] h-5 bg-white/15 mx-0.5"></div>
                  <button
                      onClick={() => setShowSnippets(true)}
                      className="p-2 text-gray-300 hover:text-white rounded-md hover:bg-white/12 transition-all duration-200 transform hover:scale-110 active:scale-95"
                      title="Generate Code Snippets"
                  >
                      <Icons.Code size={18} />
                  </button>
              </div>

              {/* Enhanced Tab Navigation */}
              <div className="flex items-center gap-1 bg-gray-950/70 rounded-lg p-1 border border-white/15 shadow-inner backdrop-blur-sm flex-wrap">
                    <button 
                        onClick={() => setActiveTab('preview')}
                        className={`flex items-center gap-2 px-3 sm:px-4 py-1.5 text-xs font-semibold rounded-md transition-all duration-200 ${
                            activeTab === 'preview' 
                            ? 'bg-white/15 text-white shadow-sm border border-white/10' 
                            : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
                        }`}
                        title="Preview"
                    >
                        <Icons.Eye size={16} /> <span className="hidden sm:inline">Preview</span>
                    </button>
                    <button 
                        onClick={() => setActiveTab('edit')}
                        className={`flex items-center gap-2 px-3 sm:px-4 py-1.5 text-xs font-semibold rounded-md transition-all duration-200 ${
                            activeTab === 'edit' 
                            ? 'bg-white/15 text-white shadow-sm border border-white/10' 
                            : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
                        }`}
                        title="Edit"
                    >
                        <Icons.Edit size={16} /> <span className="hidden sm:inline">Edit</span>
                    </button>
                    <button 
                        onClick={() => setActiveTab('examples')}
                        className={`flex items-center gap-2 px-3 sm:px-4 py-1.5 text-xs font-semibold rounded-md transition-all duration-200 ${
                            activeTab === 'examples' 
                            ? 'bg-white/15 text-white shadow-sm border border-white/10' 
                            : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
                        }`}
                        title="Examples"
                    >
                        <Icons.List size={16} /> <span className="hidden sm:inline">Examples</span>
                    </button>
                    <button 
                        onClick={() => setActiveTab('test')}
                        className={`flex items-center gap-2 px-3 sm:px-4 py-1.5 text-xs font-semibold rounded-md transition-all duration-200 ${
                            activeTab === 'test' 
                            ? 'bg-brand-500 text-white shadow-[0_0_20px_rgba(var(--c-brand),0.4)]' 
                            : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
                        }`}
                        title="Run"
                    >
                        <Icons.Run size={16} /> <span className="hidden sm:inline">Run</span>
                    </button>
                     {initialData && (
                        <button 
                            onClick={() => setActiveTab('history')}
                            className={`flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-md transition-all duration-200 ${
                                activeTab === 'history' 
                                ? 'bg-white/15 text-white shadow-sm border border-white/10' 
                                : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
                            }`}
                            title="Version History"
                        >
                            <Icons.History size={16} />
                        </button>
                    )}
              </div>
              <button 
                onClick={onClose} 
                className="text-gray-400 hover:text-white transition-all duration-200 bg-white/8 hover:bg-white/12 p-2 rounded-lg border border-transparent hover:border-white/15 transform hover:scale-110 active:scale-95"
              >
                <Icons.Close size={20} />
              </button>
          </div>
        </div>

        {/* Enhanced Content Area */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-7 md:p-9 lg:p-10 custom-scrollbar bg-gray-950/40 text-sm sm:text-[15px] lg:text-base" data-modal-body>
            {/* Same content rendering logic as before, just ensuring we use `sortedRuns` in the Test tab */}
            {activeTab === 'preview' && (
                <div className="space-y-8 w-full max-w-5xl mx-auto animate-slide-up-fade">
                     {/* Quick Nav for long content */}
                     <div className="flex flex-wrap gap-2 text-[11px] text-gray-300">
                        {[
                          { id: 'section-overview', label: '概览' },
                          { id: 'section-bilingual', label: '双语摘要' },
                          { id: 'section-description', label: '描述' },
                          { id: 'section-examples', label: '示例' },
                          { id: 'section-variables', label: '变量/模拟' }
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
                     <div id="section-bilingual" className="bg-gray-900/60 border border-white/10 rounded-theme p-4 md:p-5 backdrop-blur-sm flex flex-col gap-4">
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
                                        onClick={handleCopyEnglishPrompt}
                                        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-white/15 bg-white/5 text-[11px] font-semibold text-gray-100 hover:bg-white/10 hover:border-white/25 transition-colors"
                                    >
                                        <Icons.Copy size={13} />
                                        <span>Copy EN</span>
                                    </button>
                                )}
                                {formData.chinesePrompt && (
                                    <button
                                        onClick={handleCopyChinesePrompt}
                                        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-white/15 bg-white/5 text-[11px] font-semibold text-gray-100 hover:bg-white/10 hover:border-white/25 transition-colors"
                                    >
                                        <Icons.Copy size={13} />
                                        <span>复制中文</span>
                                    </button>
                                )}
                                {(formData.englishPrompt || formData.chinesePrompt) && (
                                    <button
                                        onClick={handleCopyBilingualPrompt}
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
                                <div className="text-[11px] uppercase tracking-wider text-gray-500 flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                                    <span>English Preview</span>
                                </div>
                                <div className="text-[12px] md:text-sm text-gray-100 bg-gray-950/70 border border-white/10 rounded-lg p-3 font-mono whitespace-pre-wrap min-h-[60px] line-clamp-4">
                                    {formData.englishPrompt || 'No English prompt yet'}
                                </div>
                            </div>
                            <div className="space-y-1">
                                <div className="text-[11px] uppercase tracking-wider text-gray-500 flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                                    <span>中文预览</span>
                                </div>
                                <div className="text-[12px] md:text-sm text-gray-100 bg-gray-950/70 border border-white/10 rounded-lg p-3 whitespace-pre-wrap min-h-[60px] line-clamp-4">
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
                                <span key={tag} className="text-xs font-medium bg-white/8 text-gray-300 px-3 py-1.5 rounded-lg border border-white/10 hover:bg-white/12 hover:border-white/15 transition-all duration-200">
                                    #{tag}
                                </span>
                            ))}
                        </div>
                        <div className="flex gap-2 flex-wrap">
                            {detectedVariables.length > 0 && (
                                <div className="flex items-center gap-1 bg-gray-900/60 rounded-lg p-1 border border-white/10 backdrop-blur-sm">
                                    <button
                                        onClick={() => setPreviewMode('raw')}
                                        className={`px-3 py-1.5 text-xs uppercase font-semibold rounded-md transition-all duration-200 ${
                                            previewMode === 'raw' 
                                                ? 'bg-gray-800 text-white shadow-inner' 
                                                : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'
                                        }`}
                                    >
                                        Raw
                                    </button>
                                    <button
                                        onClick={() => setPreviewMode('interpolated')}
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
                                onClick={handleCopyRawPrompt}
                                className="flex items-center gap-2 text-xs font-semibold text-gray-300 hover:text-white transition-all duration-200 bg-white/8 px-4 py-2 rounded-lg border border-white/10 hover:bg-white/12 hover:border-white/15 hover:shadow-lg transform hover:scale-105 active:scale-95"
                            >
                                {copiedPreview ? (
                                    <>
                                        <Icons.Check size={16} className="text-green-400"/> 
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

                    {/* Enhanced Description Section with Better Visual Hierarchy */}
                    <div id="section-description" className="bg-gray-900/50 rounded-theme p-6 md:p-7 border border-white/12 backdrop-blur-sm shadow-lg transition-all duration-300">
                        <h3 className="text-xs font-semibold text-gray-400 mb-4 uppercase tracking-widest flex items-center gap-2.5">
                            <Icons.Edit size={18} className="text-gray-500" /> Description
                        </h3>
                        <p className="text-gray-200 text-base leading-relaxed max-w-4xl">{formData.description || <span className="text-gray-500 italic">No description provided.</span>}</p>
                    </div>

                     {/* Enhanced Examples Section with Better Visual Design */}
                     {formData.examples && formData.examples.length > 0 && (
                        <div id="section-examples" className="relative group">
                            <div className="flex items-center justify-between mb-5">
                                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-widest flex items-center gap-2.5">
                                    <Icons.List size={18} className="text-brand-400" /> Few-Shot Examples ({formData.examples.length})
                                </h3>
                                <button
                                    onClick={() => setActiveTab('examples')}
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
                                        {/* Enhanced Decorative Elements */}
                                        <div className="absolute top-0 right-0 w-32 h-32 bg-brand-500/8 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                                        <div className="absolute bottom-0 left-0 w-24 h-24 bg-blue-500/5 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                                        
                                        {/* Enhanced Example Number Badge */}
                                        <div className="absolute top-5 left-5 w-8 h-8 bg-gradient-to-br from-brand-500/25 to-brand-500/15 border border-brand-500/40 rounded-full flex items-center justify-center shadow-lg shadow-brand-500/20 z-10">
                                            <span className="text-[11px] font-bold text-brand-300">{i + 1}</span>
                                        </div>
                                        
                                        <div className="space-y-3.5 relative z-0 pt-2">
                                            <div className="text-xs font-semibold text-gray-300 uppercase flex items-center gap-2.5">
                                                <div className="w-2.5 h-2.5 rounded-full bg-blue-400 shadow-[0_0_8px_rgba(96,165,250,0.6)] animate-pulse"></div>
                                                <span>Input</span>
                                            </div>
                                            <div className="text-sm text-gray-200 font-mono whitespace-pre-wrap bg-gray-950/80 p-4 rounded-lg border border-blue-500/15 leading-relaxed shadow-inner hover:border-blue-500/25 transition-all">{ex.input}</div>
                                        </div>
                                        <div className="space-y-3.5 border-l border-white/15 md:pl-7 pl-0 md:border-l pt-6 md:pt-2 border-t md:border-t-0 relative z-0">
                                            <div className="text-xs font-semibold text-gray-300 uppercase flex items-center gap-2.5">
                                                <div className="w-2.5 h-2.5 rounded-full bg-brand-400 shadow-[0_0_8px_rgba(var(--c-brand),0.6)] animate-pulse"></div>
                                                <span>Output</span>
                                            </div>
                                            <div className="text-sm text-brand-300 font-mono whitespace-pre-wrap bg-gray-950/80 p-4 rounded-lg border border-brand-500/25 leading-relaxed shadow-inner hover:border-brand-500/35 transition-all">{ex.output}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Enhanced Variables Section */}
                    {previewMode === 'interpolated' && detectedVariables.length > 0 && (
                        <div id="section-variables" className="bg-gray-900/50 border border-white/10 rounded-theme p-6 animate-fade-in backdrop-blur-sm">
                            <div className="flex justify-between items-center mb-5">
                                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                    <Icons.Code size={16} className="text-purple-400"/> Simulation Inputs
                                </h3>
                                <button 
                                    onClick={handleMagicFill}
                                    disabled={isFilling}
                                    className="flex items-center gap-1.5 text-xs font-semibold bg-purple-500/15 text-purple-300 px-3 py-1.5 rounded-lg border border-purple-500/30 hover:bg-purple-500/25 hover:border-purple-500/40 disabled:opacity-50 transition-all duration-200 transform hover:scale-105 active:scale-95"
                                >
                                    {isFilling ? <span className="animate-pulse">Generating...</span> : <><Icons.Magic size={12}/> Magic Fill</>}
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
                                            onChange={(e) => setVariableValues(prev => ({ ...prev, [v]: e.target.value }))}
                                            placeholder={`Enter value for ${v}...`}
                                            className="bg-gray-950/80 border border-white/15 rounded-lg px-4 py-3 text-sm text-white font-mono focus:border-brand-500/50 focus:outline-none focus:ring-2 focus:ring-brand-500/20 transition-all shadow-inner min-h-[100px] resize-y hover:border-white/20"
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Redesigned Preview Card - "Image Button" Area */}
                    <div className="relative group/card">
                        <div className="flex items-center justify-between mb-5">
                            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-widest flex items-center gap-2.5">
                                <Icons.Code size={18} className="text-brand-400" />
                                {previewMode === 'interpolated' ? 'Preview Output Card' : 'Prompt Template Card'}
                            </h3>
                            <span className="text-[10px] text-gray-500">
                                悬停卡片以显示操作
                            </span>
                        </div>
                        
                        <AestheticCard 
                            data={formData} 
                            isModal={false} 
                            onDownload={handleDownloadPreview}
                            onCopy={handleCopyRawPrompt}
                            previewMode={previewMode}
                            getCompiledPrompt={getCompiledPrompt}
                        />
                    </div>
                    
                    {/* Enhanced System Instruction Section with Better Visual Design */}
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
            )}
            
            {/* ... other tabs ... */}
            {activeTab === 'examples' && (
                <div className="space-y-6 w-full animate-slide-up-fade">
                    {/* Enhanced Header Section */}
                    <div className="bg-gradient-to-br from-gray-900/60 to-gray-950/60 border border-white/10 rounded-theme p-6 backdrop-blur-sm shadow-lg">
                        <div className="flex items-start justify-between mb-6">
                            <div className="flex-1">
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="p-2.5 bg-brand-500/15 rounded-lg border border-brand-500/30 shadow-lg shadow-brand-500/10">
                                        <Icons.List size={20} className="text-brand-400" />
                                    </div>
                                    <div>
                                        <h3 className="text-base font-semibold text-white flex items-center gap-2">
                                            少样本示例
                                        </h3>
                                        <p className="text-xs text-gray-400 mt-1">通过展示输入/输出对来训练AI - 添加2-5个示例以获得最佳效果</p>
                                    </div>
                                </div>
                                
                                {/* Enhanced Usage Guide with Step-by-Step Instructions */}
                                <div className="mt-4 space-y-3">
                                    <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                                        <div className="flex items-start gap-3">
                                            <Icons.Ideas size={18} className="text-blue-400 mt-0.5 shrink-0" />
                                            <div className="flex-1 space-y-2">
                                                <p className="text-xs font-semibold text-blue-300 mb-2">少样本学习工作原理：</p>
                                                <ol className="text-xs text-gray-400 space-y-2 ml-4 list-decimal">
                                                    <li><strong className="text-blue-300">添加2-5个示例对</strong>，展示您想要的精确输入/输出格式</li>
                                                    <li><strong className="text-blue-300">AI会学习模式</strong>，从这些示例中学习，并将其应用到新输入</li>
                                                    <li><strong className="text-blue-300">结果变得更加一致</strong>，并自动遵循您想要的格式</li>
                                                </ol>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    {/* Step-by-Step Guide */}
                                    <div className="p-4 bg-purple-500/10 border border-purple-500/20 rounded-lg">
                                        <div className="flex items-start gap-3">
                                            <Icons.Sparkles size={18} className="text-purple-400 mt-0.5 shrink-0" />
                                            <div className="flex-1 space-y-2">
                                                <p className="text-xs font-semibold text-purple-300 mb-2">快速开始指南：</p>
                                                <div className="space-y-2 text-xs text-gray-400">
                                                    <div className="flex items-start gap-2">
                                                        <span className="flex items-center justify-center w-5 h-5 rounded-full bg-purple-500/20 text-purple-300 font-bold text-[10px] shrink-0 mt-0.5">1</span>
                                                        <span>点击 <strong className="text-purple-300">"添加示例"</strong> 或选择下方的模板</span>
                                                    </div>
                                                    <div className="flex items-start gap-2">
                                                        <span className="flex items-center justify-center w-5 h-5 rounded-full bg-purple-500/20 text-purple-300 font-bold text-[10px] shrink-0 mt-0.5">2</span>
                                                        <span>输入一个 <strong className="text-purple-300">真实的输入</strong> 示例（用户将发送的内容）</span>
                                                    </div>
                                                    <div className="flex items-start gap-2">
                                                        <span className="flex items-center justify-center w-5 h-5 rounded-full bg-purple-500/20 text-purple-300 font-bold text-[10px] shrink-0 mt-0.5">3</span>
                                                        <span>输入 <strong className="text-purple-300">期望的输出</strong>（AI应该如何响应）</span>
                                                    </div>
                                                    <div className="flex items-start gap-2">
                                                        <span className="flex items-center justify-center w-5 h-5 rounded-full bg-purple-500/20 text-purple-300 font-bold text-[10px] shrink-0 mt-0.5">4</span>
                                                        <span>添加2-3个更多具有 <strong className="text-purple-300">不同输入</strong> 的示例以提高准确性</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <button 
                                onClick={handleAddExample}
                                className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold bg-brand-500/20 hover:bg-brand-500/30 border border-brand-500/40 hover:border-brand-500/50 rounded-lg transition-all text-brand-300 hover:text-white transform hover:scale-105 active:scale-95 shadow-lg shadow-brand-500/10"
                            >
                                <Icons.Plus size={18} /> <span className="hidden sm:inline">添加示例</span><span className="sm:hidden">添加</span>
                            </button>
                        </div>
                    </div>
                        
                    {/* Enhanced Template Examples with Categories */}
                    {(!formData.examples || formData.examples.length === 0) && (
                            <div className="mt-6">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-2">
                                        <Icons.Sparkles size={18} className="text-purple-400" />
                                        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">示例模板</span>
                                    </div>
                                    <span className="text-[10px] text-gray-600">点击任意模板以添加</span>
                                </div>
                                
                                {/* Group templates by category */}
                                {['Code', 'Writing', 'Analysis', 'Ideas'].map(category => {
                                    const categoryTemplates = exampleTemplates.filter(t => t.category === category);
                                    if (categoryTemplates.length === 0) return null;
                                    
                                    return (
                                        <div key={category} className="mb-4">
                                            <div className="flex items-center gap-2 mb-2">
                                                <div className="w-1 h-4 bg-brand-500/50 rounded-full"></div>
                                                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{category}</span>
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                                                {categoryTemplates.map((template, idx) => (
                                                    <button
                                                        key={idx}
                                                        onClick={() => handleInsertTemplate(template)}
                                                        className="group text-left p-3.5 bg-gradient-to-br from-gray-950/80 to-gray-900/60 border border-white/10 rounded-lg hover:border-brand-500/40 hover:bg-gray-900/90 transition-all duration-200 transform hover:scale-[1.02] hover:shadow-lg relative overflow-hidden"
                                                    >
                                                        {/* Hover effect */}
                                                        <div className="absolute inset-0 bg-gradient-to-br from-brand-500/0 via-brand-500/0 to-brand-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                                                        
                                                        <div className="relative z-10">
                                                            <div className="flex items-center gap-2 mb-2">
                                                                <Icons.Run size={14} className="text-yellow-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                                                                <span className="text-xs font-semibold text-gray-300 group-hover:text-white">{template.name}</span>
                                                            </div>
                                                            <div className="text-[10px] text-gray-500 font-mono line-clamp-2 group-hover:text-gray-400 leading-relaxed">
                                                                {template.input.slice(0, 50)}...
                                                            </div>
                                                            <div className="mt-2 pt-2 border-t border-white/5">
                                                                <span className="text-[9px] text-gray-600 group-hover:text-gray-500">点击添加 →</span>
                                                            </div>
                                                        </div>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                        
                        <div className="space-y-4">
                            {(!formData.examples || formData.examples.length === 0) && (
                                <div className="text-center py-12 border-2 border-dashed border-white/10 rounded-theme bg-gray-950/30 backdrop-blur-sm">
                                    <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4 border border-white/10">
                                        <Icons.List size={20} className="text-gray-500" />
                                    </div>
                                    <p className="text-sm font-medium text-gray-400 mb-2">尚未添加示例</p>
                                    <p className="text-xs text-gray-500 mb-4">添加示例以提高AI响应质量</p>
                                    <button 
                                        onClick={handleAddExample} 
                                        className="px-4 py-2 text-xs font-semibold bg-brand-500/20 hover:bg-brand-500/30 text-brand-300 hover:text-brand-200 rounded-lg border border-brand-500/30 hover:border-brand-500/40 transition-all transform hover:scale-105"
                                    >
                                        创建您的第一个示例
                                    </button>
                                </div>
                            )}

                            {formData.examples?.map((ex, index) => (
                                <div 
                                    key={index} 
                                    className="group relative bg-gradient-to-br from-gray-900/80 to-gray-950/80 border border-white/10 rounded-theme p-5 shadow-lg hover:shadow-xl hover:border-brand-500/30 transition-all duration-300 backdrop-blur-sm overflow-hidden"
                                >
                                    {/* Enhanced Background Effects */}
                                    <div className="absolute inset-0 bg-gradient-to-br from-brand-500/0 via-brand-500/0 to-brand-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-brand-500/5 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                                    
                                    {/* Enhanced Example Number Badge */}
                                    <div className="absolute top-4 left-4 flex items-center gap-2 z-10">
                                        <div className="w-7 h-7 bg-gradient-to-br from-brand-500/25 to-brand-500/15 border border-brand-500/40 rounded-full flex items-center justify-center shadow-lg shadow-brand-500/20">
                                            <span className="text-[11px] font-bold text-brand-300">{index + 1}</span>
                                        </div>
                                    </div>
                                    
                                    {/* Enhanced Delete Button */}
                                    <div className="absolute top-4 right-4 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all duration-200 z-10">
                                        <button 
                                            onClick={() => handleRemoveExample(index)}
                                            className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/15 rounded-lg transition-all transform hover:scale-110 active:scale-95 border border-transparent hover:border-red-500/40 shadow-lg"
                                            title="删除示例"
                                        >
                                            <Icons.Close size={16} />
                                        </button>
                                    </div>
                                    
                                    {/* Enhanced Content Grid with Better Spacing */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-2 relative z-0 pt-8">
                                        <div className="space-y-3">
                                            <label className="text-xs font-semibold text-gray-300 uppercase flex items-center gap-2.5">
                                                <div className="w-2.5 h-2.5 rounded-full bg-blue-400 shadow-[0_0_10px_rgba(96,165,250,0.7)] animate-pulse"></div>
                                                <span>用户输入</span>
                                            </label>
                                            <textarea
                                                value={ex.input}
                                                onChange={(e) => handleUpdateExample(index, 'input', e.target.value)}
                                                className="w-full h-36 bg-gray-950/90 border border-blue-500/25 rounded-lg p-4 text-sm font-mono text-gray-200 focus:border-blue-500/60 focus:outline-none focus:ring-2 focus:ring-blue-500/40 resize-y transition-all hover:border-blue-500/40 shadow-inner backdrop-blur-sm"
                                                placeholder="输入用户输入示例..."
                                            />
                                        </div>
                                        <div className="space-y-3">
                                            <label className="text-xs font-semibold text-gray-300 uppercase flex items-center gap-2.5">
                                                <div className="w-2.5 h-2.5 rounded-full bg-brand-400 shadow-[0_0_10px_rgba(var(--c-brand),0.7)] animate-pulse"></div>
                                                <span>模型输出</span>
                                            </label>
                                            <textarea
                                                value={ex.output}
                                                onChange={(e) => handleUpdateExample(index, 'output', e.target.value)}
                                                className="w-full h-36 bg-gray-950/90 border border-brand-500/25 rounded-lg p-4 text-sm font-mono text-gray-200 focus:border-brand-500/60 focus:outline-none focus:ring-2 focus:ring-brand-500/40 resize-y transition-all hover:border-brand-500/40 shadow-inner backdrop-blur-sm"
                                                placeholder="输入期望的模型输出..."
                                            />
                                        </div>
                                    </div>
                                    
                                    {/* Enhanced Helper Text */}
                                    <div className="mt-5 pt-4 border-t border-white/10 flex items-center gap-2.5 text-[11px] text-gray-500 bg-gray-950/30 rounded-lg p-3 -mx-2">
                                        <Icons.Ideas size={14} className="text-yellow-400/60" />
                                        <span className="flex-1">此示例教会AI期望的输入/输出模式。使用清晰、多样化的示例以获得最佳效果。</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                </div>
            )}

            {/* TEST TAB - Enhanced */}
            {activeTab === 'test' && (
                <div className="space-y-8 w-full animate-slide-up-fade">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Left Col: Variables & Settings */}
                        <div className="md:col-span-1 space-y-6">
                            {/* Enhanced Parameters Box */}
                            <div className="bg-gray-900/50 border border-white/10 rounded-theme p-5 space-y-5 backdrop-blur-sm">
                                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                    <Icons.Activity size={16} className="text-brand-400" /> Model Config
                                </h3>
                                
                                <div className="space-y-2">
                                    <label className="text-xs text-gray-400 font-medium">Model</label>
                                    <select 
                                        value={formData.config?.model}
                                        onChange={(e) => handleConfigChange('model', e.target.value)}
                                        className="w-full bg-gray-950/80 border border-white/15 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-brand-500/50 focus:ring-2 focus:ring-brand-500/20 transition-all hover:border-white/20 backdrop-blur-sm cursor-pointer"
                                    >
                                        <option value="gemini-2.5-flash">Gemini 2.5 Flash</option>
                                        <option value="gemini-3-pro-preview">Gemini 3 Pro</option>
                                    </select>
                                </div>

                                <div>
                                    <div className="flex justify-between text-xs mb-2.5">
                                        <span className="text-gray-400">Temperature</span>
                                        <span className="font-mono text-brand-400 font-bold">{formData.config?.temperature}</span>
                                    </div>
                                    <input 
                                        type="range" 
                                        min="0" max="2" step="0.1"
                                        value={formData.config?.temperature}
                                        onChange={(e) => handleConfigChange('temperature', parseFloat(e.target.value))}
                                        className="w-full h-2 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-brand-500"
                                    />
                                </div>

                                <div>
                                    <div className="flex justify-between text-xs mb-2.5">
                                        <span className="text-gray-400">Max Tokens</span>
                                        <span className="font-mono text-brand-400 font-bold">{formData.config?.maxOutputTokens}</span>
                                    </div>
                                    <input 
                                        type="range" 
                                        min="100" max="32768" step="100"
                                        value={formData.config?.maxOutputTokens}
                                        onChange={(e) => handleConfigChange('maxOutputTokens', parseInt(e.target.value))}
                                        className="w-full h-2 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-brand-500"
                                    />
                                </div>
                                
                                <div>
                                    <div className="flex justify-between text-xs mb-2.5">
                                        <span className="text-gray-400">Top P</span>
                                        <span className="font-mono text-brand-400 font-bold">{formData.config?.topP}</span>
                                    </div>
                                    <input 
                                        type="range" 
                                        min="0" max="1" step="0.05"
                                        value={formData.config?.topP}
                                        onChange={(e) => handleConfigChange('topP', parseFloat(e.target.value))}
                                        className="w-full h-2 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-brand-500"
                                    />
                                </div>
                            </div>

                            {/* Enhanced Variables Box */}
                            {detectedVariables.length > 0 && (
                                <div className="space-y-3 bg-gray-900/50 border border-white/10 rounded-theme p-5 backdrop-blur-sm">
                                    <div className="flex justify-between items-center">
                                        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                            <Icons.Code size={16} className="text-purple-400" /> Variables
                                        </h3>
                                        <button 
                                            onClick={handleMagicFill}
                                            disabled={isFilling}
                                            className="flex items-center gap-1.5 text-xs font-semibold bg-purple-500/15 text-purple-300 px-2.5 py-1 rounded-lg border border-purple-500/30 hover:bg-purple-500/25 hover:border-purple-500/40 disabled:opacity-50 transition-all duration-200 transform hover:scale-105 active:scale-95"
                                            title="Generate sample values with AI"
                                        >
                                            {isFilling ? <span className="animate-pulse">...</span> : <><Icons.Magic size={12}/> Auto-Fill</>}
                                        </button>
                                    </div>
                                    {detectedVariables.map(v => (
                                        <div key={v} className="flex flex-col gap-2">
                                            <label className="text-xs text-brand-400 font-mono font-bold">{`{${v}}`}</label>
                                            <textarea 
                                                value={variableValues[v] || ''}
                                                onChange={(e) => setVariableValues(prev => ({ ...prev, [v]: e.target.value }))}
                                                placeholder={`Enter value for ${v}...`}
                                                className="bg-gray-950/80 border border-white/15 rounded-lg px-3 py-2 text-sm text-white font-mono focus:border-brand-500/50 focus:outline-none focus:ring-2 focus:ring-brand-500/20 transition-all shadow-inner min-h-[80px] resize-y hover:border-white/20 backdrop-blur-sm"
                                            />
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                        
                        {/* Right Col: Output & History */}
                        <div className="md:col-span-2 space-y-4">
                            <div className="bg-gray-900/60 border border-white/15 rounded-theme p-1 flex justify-center items-center min-h-[360px] max-h-[480px] relative backdrop-blur-sm">
                                {!testResult && !isTesting && (
                                     <div className="text-center space-y-4">
                                         <div className="w-16 h-16 bg-white/8 rounded-full flex items-center justify-center mx-auto text-gray-400 border border-white/10">
                                            <Icons.Run size={24} />
                                         </div>
                                         <p className="text-gray-400 text-sm font-medium">Ready to generate content.</p>
                                         <div className="text-xs text-gray-600">
                                            {formData.examples && formData.examples.length > 0 && (
                                                <span className="flex items-center justify-center gap-1.5">
                                                    <Icons.List size={12} /> Including {formData.examples.length} examples
                                                </span>
                                            )}
                                         </div>
                                         <button 
                                            onClick={handleRunGeminiStream}
                                            className="px-8 py-3 bg-brand-500 hover:bg-brand-600 text-white font-bold rounded-lg transition-all duration-200 shadow-lg shadow-brand-500/30 transform hover:scale-105 active:scale-95"
                                        >
                                            Generate
                                        </button>
                                     </div>
                                )}

                                {isTesting && !testResult && (
                                    <div className="text-center space-y-4 animate-pulse">
                                         <div className="w-16 h-16 bg-brand-500/15 rounded-full flex items-center justify-center mx-auto text-brand-400 border-2 border-brand-500/30">
                                            <Icons.Sparkles size={24} />
                                         </div>
                                         <p className="text-brand-400 text-sm font-mono font-medium">Connecting to Gemini...</p>
                                     </div>
                                )}

                                {(testResult || (isTesting && testResult)) && (
                                     <div className="absolute inset-0 flex flex-col rounded-theme overflow-hidden">
                                        <div className="flex items-center justify-between p-4 border-b border-white/10 bg-gray-900/70 backdrop-blur-sm">
                                            <span className="text-xs font-bold text-gray-300 uppercase flex items-center gap-2">
                                                Output {isTesting && <span className="w-2 h-2 rounded-full bg-brand-500 animate-pulse"/>}
                                            </span>
                                            <div className="flex gap-2">
                                                {!isTesting && (
                                                    <button 
                                                        onClick={handleSaveRun}
                                                        className="text-xs flex items-center gap-1.5 bg-brand-500/15 hover:bg-brand-500/25 text-brand-400 px-3 py-1.5 rounded-lg border border-brand-500/30 hover:border-brand-500/40 transition-all duration-200 transform hover:scale-105 active:scale-95"
                                                        title="Save this run to history"
                                                    >
                                                        <Icons.Check size={12} /> Save
                                                    </button>
                                                )}
                                                <button 
                                                    onClick={() => navigator.clipboard.writeText(testResult || '')} 
                                                    className="p-1.5 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-200 transform hover:scale-110 active:scale-95"
                                                    title="Copy output"
                                                >
                                                    <Icons.Copy size={14} />
                                                </button>
                                            </div>
                                        </div>
                                        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar text-gray-200 text-sm leading-relaxed markdown-body bg-gray-950/50">
                                            <Markdown
                                                components={{
                                                    code(props) {
                                                        const {children, className, node, ...rest} = props;
                                                        const match = /language-(\w+)/.exec(className || '');
                                                        if (match) {
                                                            return <CodeBlock language={match[1]} code={String(children).replace(/\n$/, '')} />;
                                                        }
                                                        return <code className={`${className}`} {...rest}>{children}</code>;
                                                    }
                                                }}
                                            >
                                                {testResult || ''}
                                            </Markdown>
                                        </div>
                                     </div>
                                )}
                            </div>
                            
                             {testResult && !isTesting && (
                                <div className="flex justify-end">
                                    <button 
                                        onClick={handleRunGeminiStream}
                                        className="text-xs text-brand-400 hover:text-brand-300 flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-brand-500/10 transition-all duration-200 transform hover:scale-105 active:scale-95"
                                    >
                                        <Icons.Run size={12} /> Regenerate
                                    </button>
                                </div>
                             )}

                             {/* Enhanced Saved Runs List */}
                             <div className="mt-6 border-t border-white/10 pt-5">
                                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-widest flex items-center gap-2 mb-4">
                                    <Icons.History size={16} className="text-brand-400" /> Saved Runs ({sortedRuns.length})
                                </h3>
                                <div className="space-y-2 max-h-[200px] overflow-y-auto custom-scrollbar pr-2">
                                    {sortedRuns.length === 0 && (
                                        <p className="text-xs text-gray-600 italic text-center py-4">No runs saved yet.</p>
                                    )}
                                    {sortedRuns.map(run => (
                                        <div key={run.id} className={`flex items-center justify-between p-3 rounded-lg border transition-all duration-200 group cursor-pointer hover:scale-[1.02] ${
                                            run.rating === 'good' ? 'bg-green-500/8 border-green-500/25 hover:bg-green-500/12' : 'bg-gray-900/50 border-white/10 hover:bg-white/5 hover:border-white/15'
                                        }`}>
                                            <div 
                                                className="flex-1 flex flex-col gap-1"
                                                onClick={() => handleLoadRun(run)}
                                            >
                                                <div className="flex items-center gap-2">
                                                    <span className={`text-xs font-mono font-medium ${run.rating === 'good' ? 'text-green-400' : run.rating === 'bad' ? 'text-red-400 line-through opacity-70' : 'text-gray-300'}`}>
                                                        {new Date(run.timestamp).toLocaleString()}
                                                    </span>
                                                    <span className="text-[10px] text-gray-500 border border-white/10 px-1.5 py-0.5 rounded bg-white/5">
                                                        {run.model.split('-').slice(-1)[0]}
                                                    </span>
                                                </div>
                                                <div className="text-[10px] text-gray-500 truncate max-w-[200px]">
                                                    {run.output.slice(0, 60)}...
                                                </div>
                                            </div>
                                            
                                            {/* Enhanced Action Buttons */}
                                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                                <button
                                                    onClick={() => handleRateRun(run.id, 'good')}
                                                    className={`p-1.5 rounded-lg hover:bg-green-500/15 transition-all duration-200 transform hover:scale-110 active:scale-95 ${run.rating === 'good' ? 'text-green-400' : 'text-gray-500 hover:text-green-400'}`}
                                                    title="Mark as Good"
                                                >
                                                    <Icons.ThumbsUp size={12} />
                                                </button>
                                                <button
                                                    onClick={() => handleRateRun(run.id, 'bad')}
                                                    className={`p-1.5 rounded-lg hover:bg-red-500/15 transition-all duration-200 transform hover:scale-110 active:scale-95 ${run.rating === 'bad' ? 'text-red-400' : 'text-gray-500 hover:text-red-400'}`}
                                                    title="Mark as Bad"
                                                >
                                                    <Icons.ThumbsDown size={12} />
                                                </button>
                                                <div className="w-[1px] h-4 bg-white/10 mx-1"></div>
                                                <button 
                                                    onClick={() => handleDeleteRun(run.id)}
                                                    className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all duration-200 transform hover:scale-110 active:scale-95"
                                                    title="Delete"
                                                >
                                                    <Icons.Close size={12} />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                             </div>
                        </div>
                    </div>
                </div>
            )}
            
            {activeTab === 'history' && initialData && (
                 <div className="space-y-6 w-full animate-slide-up-fade">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-semibold text-gray-200 flex items-center gap-2">
                             <Icons.History size={18} className="text-brand-500" /> Version History
                        </h3>
                        <span className="text-xs text-gray-500">Last 10 changes</span>
                    </div>

                    {!initialData.history || initialData.history.length === 0 ? (
                        <div className="text-center py-12 border border-dashed border-white/10 rounded-theme bg-white/5">
                            <Icons.History size={24} className="mx-auto text-gray-600 mb-2" />
                            <p className="text-sm text-gray-500">No history available yet.</p>
                            <p className="text-xs text-gray-600 mt-1">Versions are saved automatically when you edit.</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {initialData.history.map((version, i) => (
                                <div key={i} className="bg-gray-900/40 border border-white/5 rounded-theme p-4 flex items-center justify-between hover:border-brand-500/20 transition-all">
                                    <div className="flex items-start gap-4">
                                        <div className="p-2 bg-white/5 rounded-full text-gray-400">
                                            <Icons.History size={16} />
                                        </div>
                                        <div>
                                            <div className="text-sm font-medium text-gray-200">{new Date(version.timestamp).toLocaleString()}</div>
                                            <div className="text-xs text-gray-500 font-mono mt-1">
                                                {version.title} • {getTokenCount(version.content)} tokens
                                            </div>
                                            {version.examples && version.examples.length > 0 && (
                                                <div className="text-[10px] text-gray-600 mt-1 flex items-center gap-1">
                                                    <Icons.List size={14} /> {version.examples.length} examples
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <button 
                                        onClick={() => handleRestoreVersion(version)}
                                        className="flex items-center gap-2 px-3 py-1.5 text-xs font-bold text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 rounded border border-white/5 transition-colors"
                                    >
                                        <Icons.Restore size={14} /> Restore
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                 </div>
            )}

            {/* EDIT TAB - Reorganized with MECE Principle */}
            {activeTab === 'edit' && (
                <div className="w-full flex flex-col animate-slide-up-fade space-y-4 md:space-y-6 px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16">
                    {/* 1. Core Information Group - 核心信息汇总（可一键生成） */}
                    <div className="space-y-4 order-1">
                        <div className="flex items-center justify-between gap-2 mb-4">
                            <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider flex items-center gap-2">
                                <Icons.Edit size={16} className="text-brand-400" />
                                元信息
                            </h3>
                            <button
                                onClick={handleAutoMetadata}
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
                                        onChange={e => setFormData({ ...formData, title: e.target.value })}
                                        className="w-full bg-gray-950/70 border border-white/10 rounded-lg px-3 md:px-4 py-2 md:py-2.5 text-sm md:text-base text-white focus:outline-none focus:border-brand-500/50 focus:ring-1 focus:ring-brand-500/30 transition-all"
                                        placeholder="输入提示词标题..."
                                        autoFocus={!initialData}
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">类别</label>
                                    <select
                                        value={formData.category}
                                        onChange={e => setFormData({ ...formData, category: e.target.value as Category })}
                                        className="w-full bg-gray-950/70 border border-white/10 rounded-lg px-3 md:px-4 py-2 md:py-2.5 text-sm md:text-base text-white focus:outline-none focus:border-brand-500/50 focus:ring-1 focus:ring-brand-500/30 transition-all appearance-none cursor-pointer"
                                    >
                                        {allCategories.map(c => (
                                            <option key={c} value={c} className="bg-gray-900">{c}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">状态</label>
                                    <select
                                        value={formData.status || 'active'}
                                        onChange={e => setFormData({ ...formData, status: e.target.value as any })}
                                        className="w-full bg-gray-950/70 border border-white/10 rounded-lg px-3 md:px-4 py-2 md:py-2.5 text-sm md:text-base text-white focus:outline-none focus:border-brand-500/50 focus:ring-1 focus:ring-brand-500/30 transition-all appearance-none cursor-pointer"
                                    >
                                        <option value="active" className="bg-gray-900">Active</option>
                                        <option value="draft" className="bg-gray-900">Draft</option>
                                        <option value="archived" className="bg-gray-900">Archived</option>
                                    </select>
                                </div>
                            </div>
                        <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">描述</label>
                                <input
                                    type="text"
                                    value={formData.description}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
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
                                        onClick={handleOptimizeSystem}
                                        disabled={isOptimizingSystem || !formData.systemInstruction}
                                        className="flex items-center gap-1.5 text-xs font-medium bg-blue-500/15 text-blue-300 px-2 py-1 rounded-lg border border-blue-500/30 hover:bg-blue-500/25 disabled:opacity-50 transition-all"
                                    >
                                        {isOptimizingSystem ? <span className="animate-pulse">优化中...</span> : <><Icons.Sparkles size={12} /> 优化</>}
                                    </button>
                                </div>
                                <textarea
                                    value={formData.systemInstruction}
                                    onChange={e => setFormData({ ...formData, systemInstruction: e.target.value })}
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
                                                onClick={handleTranslateToEnglish}
                                                disabled={isTranslating || !formData.content}
                                                className="flex items-center gap-1.5 text-xs font-medium bg-green-500/15 text-green-300 px-2 py-1 rounded-lg border border-green-500/30 hover:bg-green-500/25 disabled:opacity-50 transition-all"
                                                title="将中文提示词翻译为英文"
                                            >
                                                {isTranslating ? <span className="animate-pulse">翻译中...</span> : <><Icons.Edit size={12} /> 翻译</>}
                                            </button>
                                            <button 
                                                onClick={handleOptimizePrompt}
                                                disabled={isOptimizingPrompt || !formData.content}
                                                className="flex items-center gap-1.5 text-xs font-medium bg-brand-500/15 text-brand-300 px-2 py-1 rounded-lg border border-brand-500/30 hover:bg-brand-500/25 disabled:opacity-50 transition-all"
                                                title="优化提示词内容"
                                            >
                                                {isOptimizingPrompt ? <span className="animate-pulse">优化中...</span> : <><Icons.Sparkles size={12} /> 优化</>}
                                            </button>
                                        </div>
                                    </div>
                                    <textarea
                                        value={formData.content}
                                        onChange={e => setFormData({ ...formData, content: e.target.value })}
                                        className="w-full h-56 md:h-64 xl:h-72 bg-gray-950/80 border border-white/15 rounded-lg px-3 md:px-4 py-2 md:py-3 text-xs md:text-sm font-mono text-gray-100 focus:outline-none focus:border-brand-500/60 focus:ring-1 focus:ring-brand-500/40 transition-all resize-y leading-relaxed"
                                        placeholder="在这里输入你的中文提示词...&#10;使用 {变量名} 创建动态输入"
                                    />
                                    <div className="flex justify-between items-center text-xs text-gray-500 flex-wrap gap-2">
                                        <span className="text-gray-600">提示：使用 <span className="text-brand-400 font-mono bg-brand-500/15 px-1.5 py-0.5 rounded border border-brand-500/30">{'{变量名}'}</span> 创建动态输入</span>
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
                                                    if (onNotify) onNotify('英文提示词已复制', 'success');
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
                                            onChange={e => setFormData({ ...formData, outputType: e.target.value as any || undefined })}
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
                                            onChange={e => setFormData({ ...formData, applicationScene: e.target.value as any || undefined })}
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
                                                setFormData({
                                                    ...formData,
                                                    recommendedModels: e.target.value.split(',').map(v => v.trim()).filter(Boolean)
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
                                            onClick={handleAutoTag}
                                            disabled={isTagging || !formData.content}
                                            className="flex items-center gap-1.5 text-xs font-medium bg-white/10 text-gray-300 px-2.5 py-1 rounded-lg border border-white/15 hover:bg-white/15 disabled:opacity-50 transition-all"
                                        >
                                            {isTagging ? <span className="animate-pulse">标记中...</span> : <><Icons.Tag size={12} /> 自动标记</>}
                                        </button>
                                    </div>
                        <div className="space-y-4">
                            {/* Main Tags */}
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">主要标签</label>
                                    <div className="relative">
                                    <div className="flex flex-wrap gap-2 p-3 bg-gray-950/70 border border-white/10 rounded-lg min-h-[60px]">
                                            {formData.tags.map(tag => (
                                            <span key={tag} className="flex items-center gap-1.5 text-sm font-medium bg-white/10 text-gray-200 px-2.5 py-1 rounded-lg border border-white/10">
                                                    {tag}
                                                    <button onClick={() => removeTag(tag)} className="hover:text-red-400 transition-colors">
                                                        <Icons.Close size={12} />
                                                    </button>
                                                </span>
                                            ))}
                                            <input
                                                type="text"
                                                value={tagInput}
                                                onChange={e => setTagInput(e.target.value)}
                                                onKeyDown={handleAddTag}
                                            className="bg-transparent border-none outline-none text-sm text-white flex-1 min-w-[100px] py-1 placeholder:text-gray-600"
                                                placeholder={formData.tags.length === 0 ? "输入标签并按 Enter..." : ""}
                                            />
                                        </div>
                                        {tagSuggestions.length > 0 && (
                                            <div className="absolute top-full left-0 mt-2 w-full bg-gray-900/95 border border-white/15 rounded-lg shadow-xl z-20 overflow-hidden backdrop-blur-md">
                                                <div className="px-3 py-2 text-[10px] font-bold text-gray-400 uppercase tracking-wider border-b border-white/10 bg-gray-950/50">建议</div>
                                                {tagSuggestions.map(suggestion => (
                                                    <button
                                                        key={suggestion}
                                                        onClick={() => addTag(suggestion)}
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
                                                setFormData({
                                                    ...formData,
                                                    technicalTags: e.target.value.split(',').map(v => v.trim()).filter(Boolean)
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
                                                setFormData({
                                                    ...formData,
                                                    styleTags: e.target.value.split(',').map(v => v.trim()).filter(Boolean)
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
                                                setFormData({
                                                    ...formData,
                                                    customLabels: e.target.value.split(',').map(v => v.trim()).filter(Boolean)
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
                                            onChange={e => setFormData({ ...formData, usageNotes: e.target.value })}
                                    className="w-full h-24 md:h-32 bg-gray-950/70 border border-white/10 rounded-lg px-3 md:px-4 py-2 md:py-3 text-sm text-gray-200 focus:outline-none focus:border-brand-500/50 focus:ring-1 focus:ring-brand-500/30 transition-all resize-y"
                                            placeholder="这个提示词怎么用、有什么技巧？"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">注意事项</label>
                                        <textarea
                                            value={formData.cautions || ''}
                                            onChange={e => setFormData({ ...formData, cautions: e.target.value })}
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
                                            onChange={e => setFormData({ ...formData, previewMediaUrl: e.target.value })}
                                    className="w-full bg-gray-950/70 border border-white/10 rounded-lg px-3 md:px-4 py-2 md:py-2.5 text-sm text-white focus:outline-none focus:border-brand-500/50 focus:ring-1 focus:ring-brand-500/30 transition-all"
                                            placeholder="示例图片/视频/音频链接"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">来源</label>
                                        <input
                                            type="text"
                                            value={formData.source || ''}
                                            onChange={e => setFormData({ ...formData, source: e.target.value })}
                                    className="w-full bg-gray-950/70 border border-white/10 rounded-lg px-3 md:px-4 py-2 md:py-2.5 text-sm text-white focus:outline-none focus:border-brand-500/50 focus:ring-1 focus:ring-brand-500/30 transition-all"
                                            placeholder="站点名称 / 平台"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">来源作者</label>
                                            <input
                                                type="text"
                                                value={formData.sourceAuthor || ''}
                                                onChange={e => setFormData({ ...formData, sourceAuthor: e.target.value })}
                                    className="w-full bg-gray-950/70 border border-white/10 rounded-lg px-3 md:px-4 py-2 md:py-2.5 text-sm text-white focus:outline-none focus:border-brand-500/50 focus:ring-1 focus:ring-brand-500/30 transition-all"
                                                placeholder="作者（可选）"
                                            />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">来源链接</label>
                                            <input
                                                type="text"
                                                value={formData.sourceUrl || ''}
                                                onChange={e => setFormData({ ...formData, sourceUrl: e.target.value })}
                                    className="w-full bg-gray-950/70 border border-white/10 rounded-lg px-3 md:px-4 py-2 md:py-2.5 text-sm text-white focus:outline-none focus:border-brand-500/50 focus:ring-1 focus:ring-brand-500/30 transition-all"
                                                placeholder="原始链接 URL"
                                            />
                                        </div>
                        </div>
                    </div>
                </div>
            )}

        {/* Enhanced Footer */}
        {activeTab === 'edit' && (
            <div className="p-6 border-t border-white/10 flex justify-between gap-4 shrink-0 bg-gray-900/60 backdrop-blur-md">
            <div>
                {initialData && (
                    <button
                        onClick={handleDuplicate}
                        className="px-4 py-2.5 text-sm font-semibold text-gray-300 hover:text-white transition-all duration-200 flex items-center gap-2 hover:bg-white/10 rounded-lg border border-white/10 hover:border-white/15 transform hover:scale-105 active:scale-95"
                        title="Duplicate Prompt"
                    >
                        <Icons.CopyPlus size={16} /> <span className="hidden sm:inline">Duplicate</span>
                    </button>
                )}
            </div>
            <div className="flex gap-3">
                <button
                    onClick={onClose}
                    className="px-6 py-2.5 text-sm font-semibold text-gray-300 hover:text-white transition-all duration-200 hover:bg-white/10 rounded-lg border border-white/10 hover:border-white/15 transform hover:scale-105 active:scale-95"
                >
                    Cancel
                </button>
                <button
                    onClick={() => {
                        onSave({ ...formData, savedRuns, lastVariableValues: variableValues });
                        onClose();
                    }}
                    className="btn-primary px-8 py-2.5 text-sm font-bold relative overflow-hidden group"
                >
                    <span className="relative z-10">Save Changes</span>
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
                </button>
            </div>
            </div>
        )}
      </div>
      
      {/* Code Snippets Overlay */}
      <CodeSnippetsModal 
        isOpen={showSnippets}
        onClose={() => setShowSnippets(false)}
        rawPrompt={formData.content}
        systemInstruction={formData.systemInstruction}
        examples={formData.examples}
        config={formData.config!}
        detectedVariables={detectedVariables}
        variableValues={variableValues}
      />
      
      {/* Confirm Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        type={confirmDialog.type}
        onConfirm={confirmDialog.onConfirm}
        onCancel={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
      />
      </div>
    </div>
  );
};

export const PromptModal = React.memo(PromptModalComponent);