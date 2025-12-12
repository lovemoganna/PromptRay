import React, { useState, useEffect } from 'react';
import Markdown from 'react-markdown';
import { Highlight, themes } from 'prism-react-renderer';
import { Prompt, Category, PromptFormData } from '../types';
import { Icons } from './Icons';
import { runGeminiPrompt, optimizePromptContent } from '../services/geminiService';

interface PromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: PromptFormData) => void;
  initialData?: Prompt | null;
  onDuplicate?: (data: PromptFormData) => void;
  allCategories: string[];
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
                    <span className="ml-2 text-[10px] font-mono text-gray-400 uppercase tracking-wider">{language || 'text'}</span>
                </div>
                <button 
                    onClick={copyToClipboard}
                    className="flex items-center gap-1.5 text-[10px] font-medium text-gray-400 hover:text-white transition-colors bg-white/5 hover:bg-white/10 px-2 py-1 rounded"
                    title="Copy code"
                >
                    {isCopied ? <Icons.Check size={12} className="text-green-500"/> : <Icons.Copy size={12} />}
                    {isCopied ? 'Copied' : 'Copy'}
                </button>
            </div>
            <div className="overflow-x-auto">
                <Highlight theme={themes.vsDark} code={code} language={language || 'text'}>
                    {({ className, style, tokens, getLineProps, getTokenProps }) => (
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

export const PromptModal: React.FC<PromptModalProps> = ({ isOpen, onClose, onSave, initialData, onDuplicate, allCategories }) => {
  const [formData, setFormData] = useState<PromptFormData>({
    title: '',
    description: '',
    content: '',
    category: 'Misc',
    tags: [],
    isFavorite: false,
  });

  const [tagInput, setTagInput] = useState('');
  const [testResult, setTestResult] = useState<string | null>(null);
  const [isTesting, setIsTesting] = useState(false);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [activeTab, setActiveTab] = useState<'preview' | 'edit' | 'test'>('preview');
  const [copiedFilled, setCopiedFilled] = useState(false);
  const [copiedPreview, setCopiedPreview] = useState(false);
  
  // Variable Management
  const [detectedVariables, setDetectedVariables] = useState<string[]>([]);
  const [variableValues, setVariableValues] = useState<Record<string, string>>({});

  useEffect(() => {
    if (initialData) {
      setFormData({
        title: initialData.title,
        description: initialData.description,
        content: initialData.content,
        category: initialData.category,
        tags: initialData.tags,
        isFavorite: initialData.isFavorite,
      });
      setActiveTab('preview'); 
    } else {
        setFormData({
            title: '',
            description: '',
            content: '',
            category: 'Code',
            tags: [],
            isFavorite: false,
        });
        setActiveTab('edit');
    }
    setTestResult(null);
    setVariableValues({});
  }, [initialData, isOpen]);

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
        if (!isOpen) return;
        if ((e.metaKey || e.ctrlKey) && e.key === 's') {
            e.preventDefault();
            onSave(formData);
            onClose();
        }
        if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
            if (activeTab === 'test') {
                e.preventDefault();
                handleRunGemini();
            }
        }
        if (e.key === 'Escape') {
            onClose();
        }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, formData, activeTab]);

  useEffect(() => {
    if (!formData.content) {
        setDetectedVariables([]);
        return;
    }
    const matches = formData.content.matchAll(/\{([^{}]+)\}/g);
    const vars = Array.from(matches, m => m[1]);
    const uniqueVars = Array.from(new Set(vars));
    setDetectedVariables(uniqueVars);
  }, [formData.content]);

  const handleAddTag = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      if (!formData.tags.includes(tagInput.trim())) {
        setFormData(prev => ({ ...prev, tags: [...prev.tags, tagInput.trim()] }));
      }
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({ ...prev, tags: prev.tags.filter(t => t !== tagToRemove) }));
  };

  const getCompiledPrompt = () => {
    let promptToSend = formData.content;
    detectedVariables.forEach(v => {
        const val = variableValues[v] || `[${v}]`; 
        promptToSend = promptToSend.split(`{${v}}`).join(val);
    });
    return promptToSend;
  };

  const handleRunGemini = async () => {
    if (!formData.content) return;
    setIsTesting(true);
    setTestResult(null);
    const promptToSend = getCompiledPrompt();
    const result = await runGeminiPrompt(promptToSend);
    setTestResult(result);
    setIsTesting(false);
  };

  const handleOptimizePrompt = async () => {
      if (!formData.content) return;
      setIsOptimizing(true);
      const optimized = await optimizePromptContent(formData.content);
      setFormData(prev => ({ ...prev, content: optimized }));
      setIsOptimizing(false);
  };

  const handleCopyFilledPrompt = () => {
      const text = getCompiledPrompt();
      navigator.clipboard.writeText(text);
      setCopiedFilled(true);
      setTimeout(() => setCopiedFilled(false), 2000);
  };

  const handleCopyRawPrompt = () => {
      navigator.clipboard.writeText(formData.content);
      setCopiedPreview(true);
      setTimeout(() => setCopiedPreview(false), 2000);
  };

  const handleDuplicate = () => {
      if (onDuplicate) {
          onDuplicate(formData);
          onClose();
      }
  };

  const renderHighlightedContent = (text: string) => {
    if (!text) return <span className="text-gray-500 italic">No content...</span>;
    const parts = text.split(/(\{.*?\})/g);
    return (
        <span>
            {parts.map((part, i) => {
                if (part.startsWith('{') && part.endsWith('}')) {
                    return <span key={i} className="text-brand-500 font-bold bg-brand-500/10 px-1 rounded shadow-[0_0_10px_rgba(var(--c-brand),0.2)]">{part}</span>;
                }
                return part;
            })}
        </span>
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in transition-all">
      <div className="glass-panel w-full max-w-4xl rounded-theme shadow-2xl flex flex-col max-h-[90vh] relative overflow-hidden animate-slide-up-fade ring-1 ring-white/10">
        
        {/* Top Glow */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-brand-500 to-transparent opacity-50"></div>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/5 shrink-0 bg-gray-900/40 backdrop-blur-md">
          <div className="flex items-center gap-3">
              {initialData ? (
                  <div className="flex flex-col">
                      <h2 className="text-lg font-bold text-white tracking-tight">{formData.title}</h2>
                      <span className="text-xs text-gray-500 font-mono">ID: {initialData.id.slice(0,6)}...</span>
                  </div>
              ) : (
                  <h2 className="text-lg font-bold text-white tracking-tight">New Prompt</h2>
              )}
          </div>
          
          <div className="flex items-center gap-4">
              <div className="flex items-center gap-1 bg-gray-950/50 rounded-lg p-1 border border-white/10 shadow-inner">
                    <button 
                        onClick={() => setActiveTab('preview')}
                        className={`flex items-center gap-2 px-4 py-1.5 text-xs font-semibold rounded-md transition-all ${
                            activeTab === 'preview' 
                            ? 'bg-white/10 text-white shadow-sm border border-white/5' 
                            : 'text-gray-500 hover:text-gray-200'
                        }`}
                    >
                        <Icons.Eye size={14} /> Preview
                    </button>
                    <button 
                        onClick={() => setActiveTab('edit')}
                        className={`flex items-center gap-2 px-4 py-1.5 text-xs font-semibold rounded-md transition-all ${
                            activeTab === 'edit' 
                            ? 'bg-white/10 text-white shadow-sm border border-white/5' 
                            : 'text-gray-500 hover:text-gray-200'
                        }`}
                    >
                        <Icons.Edit size={14} /> Edit
                    </button>
                    <button 
                        onClick={() => setActiveTab('test')}
                        className={`flex items-center gap-2 px-4 py-1.5 text-xs font-semibold rounded-md transition-all ${
                            activeTab === 'test' 
                            ? 'bg-brand-500 text-white shadow-[0_0_15px_rgba(var(--c-brand),0.3)]' 
                            : 'text-gray-500 hover:text-gray-200'
                        }`}
                    >
                        <Icons.Run size={14} /> Run
                    </button>
              </div>
              <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors bg-white/5 hover:bg-white/10 p-2 rounded-full">
                <Icons.Close size={18} />
              </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8 scrollbar-thin bg-gray-950/30">
            
            {/* PREVIEW TAB */}
            {activeTab === 'preview' && (
                <div className="space-y-8 max-w-3xl mx-auto animate-slide-up-fade">
                    <div className="flex items-center justify-between">
                        <div className="flex gap-2">
                            <span className="text-xs font-bold tracking-wider uppercase bg-brand-500/10 text-brand-500 px-3 py-1 rounded border border-brand-500/20 shadow-[0_0_10px_rgba(var(--c-brand),0.1)]">
                                {formData.category}
                            </span>
                            {formData.tags.map(tag => (
                                <span key={tag} className="text-xs font-medium bg-white/5 text-gray-400 px-3 py-1 rounded border border-white/5">
                                    #{tag}
                                </span>
                            ))}
                        </div>
                        <button 
                            onClick={handleCopyRawPrompt}
                            className="flex items-center gap-2 text-xs font-medium text-gray-400 hover:text-white transition-colors bg-white/5 px-4 py-2 rounded-lg border border-white/5 hover:bg-white/10 hover:shadow-lg"
                        >
                            {copiedPreview ? <Icons.Check size={14} className="text-green-500"/> : <Icons.Copy size={14} />}
                            {copiedPreview ? 'Copied' : 'Copy Text'}
                        </button>
                    </div>

                    <div>
                        <h3 className="text-xs font-bold text-gray-500 mb-3 uppercase tracking-widest">Description</h3>
                        <p className="text-gray-300 text-sm leading-7 max-w-2xl">{formData.description || "No description provided."}</p>
                    </div>

                    <div className="relative group">
                        <h3 className="text-xs font-bold text-gray-500 mb-3 uppercase tracking-widest">Prompt Content</h3>
                        <div className="bg-gray-950/80 p-8 rounded-theme border border-white/10 text-gray-200 font-mono text-sm whitespace-pre-wrap leading-loose shadow-inner relative overflow-hidden">
                             {/* Subtle shine effect */}
                             <div className="absolute top-0 right-0 p-4 opacity-5">
                                 <Icons.Code size={48} />
                             </div>
                            {renderHighlightedContent(formData.content)}
                        </div>
                    </div>
                </div>
            )}

            {/* TEST TAB */}
            {activeTab === 'test' && (
                <div className="space-y-8 max-w-3xl mx-auto animate-slide-up-fade">
                    <div className="grid grid-cols-1 gap-6">
                        {detectedVariables.length > 0 ? (
                            <div className="bg-gray-950/60 border border-white/10 rounded-theme p-6 shadow-lg">
                                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                                    <Icons.Code size={14} /> Variables
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    {detectedVariables.map(v => (
                                        <div key={v} className="flex flex-col gap-2">
                                            <label className="text-xs text-brand-500 font-mono font-bold">{`{${v}}`}</label>
                                            <input 
                                                type="text" 
                                                value={variableValues[v] || ''}
                                                onChange={(e) => setVariableValues(prev => ({ ...prev, [v]: e.target.value }))}
                                                placeholder={`Enter value...`}
                                                className="bg-gray-900 border border-white/10 rounded-lg px-4 py-3 text-sm text-white focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500/20 transition-all shadow-inner"
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : (
                             <div className="bg-blue-500/10 border border-blue-500/20 rounded-theme p-4 text-sm text-blue-300 flex items-center gap-3">
                                 <div className="p-2 bg-blue-500/20 rounded-full"><Icons.Check size={16} /></div>
                                 No variables detected. Ready to run.
                             </div>
                        )}

                        <div className="flex gap-4 justify-center py-4">
                             <button 
                                onClick={handleRunGemini}
                                disabled={isTesting}
                                className="flex items-center gap-2 bg-gradient-to-br from-brand-500 to-brand-600 text-white px-8 py-3 rounded-xl font-bold hover:brightness-110 transition-all shadow-[0_0_20px_rgba(var(--c-brand),0.3)] hover:shadow-[0_0_30px_rgba(var(--c-brand),0.5)] transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                             >
                                {isTesting ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                        Processing...
                                    </>
                                ) : (
                                    <>
                                        <Icons.Run size={18} className="fill-current" />
                                        Run Prompt
                                    </>
                                )}
                             </button>
                             <button
                                onClick={handleCopyFilledPrompt}
                                className="flex items-center gap-2 bg-gray-850 text-gray-300 border border-white/10 px-6 py-3 rounded-xl hover:bg-white/5 transition-colors text-sm font-medium"
                             >
                                {copiedFilled ? <Icons.Check size={16} className="text-green-500" /> : <Icons.ClipboardCheck size={16} />}
                                {copiedFilled ? 'Copied' : 'Copy Compiled'}
                             </button>
                        </div>
                    </div>

                    {testResult && (
                        <div className="space-y-4 animate-slide-up-fade">
                            <div className="flex items-center justify-between border-t border-white/10 pt-8">
                                <h3 className="text-sm font-bold text-transparent bg-clip-text bg-gradient-to-r from-brand-400 to-purple-400 flex items-center gap-2">
                                    <Icons.Sparkles size={16} className="text-brand-400" /> AI Response
                                </h3>
                                <button 
                                    onClick={() => navigator.clipboard.writeText(testResult)} 
                                    className="text-xs flex items-center gap-1.5 text-gray-500 hover:text-white transition-colors bg-white/5 px-3 py-1.5 rounded-lg border border-white/5 hover:bg-white/10"
                                >
                                    <Icons.Copy size={12} /> Copy Result
                                </button>
                            </div>
                            <div className="bg-gray-950/80 p-6 rounded-theme border border-white/10 text-gray-300 shadow-2xl max-h-[500px] overflow-y-auto custom-scrollbar backdrop-blur-md">
                                <div className="markdown-body">
                                  <Markdown
                                    components={{
                                        code(props) {
                                            const {children, className, node, ...rest} = props;
                                            const match = /language-(\w+)/.exec(className || '');
                                            if (match) {
                                                return <CodeBlock language={match[1]} code={String(children).replace(/\n$/, '')} />;
                                            }
                                            return <code className={`${className} bg-white/10 rounded px-1.5 py-0.5 border border-white/5`} {...rest}>{children}</code>;
                                        }
                                    }}
                                  >
                                    {testResult}
                                  </Markdown>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* EDIT TAB */}
            {activeTab === 'edit' && (
                <div className="space-y-6 max-w-3xl mx-auto animate-slide-up-fade">
                    <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">Title</label>
                        <input
                            type="text"
                            value={formData.title}
                            onChange={e => setFormData({ ...formData, title: e.target.value })}
                            className="w-full bg-gray-900/50 border border-white/10 rounded-lg px-4 py-3 text-sm text-white focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500/20 transition-all"
                            placeholder="e.g. Code Refactor"
                            autoFocus={!initialData}
                        />
                        </div>
                        <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">Category</label>
                        <select
                            value={formData.category}
                            onChange={e => setFormData({ ...formData, category: e.target.value as Category })}
                            className="w-full bg-gray-900/50 border border-white/10 rounded-lg px-4 py-3 text-sm text-white focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500/20 transition-all appearance-none"
                        >
                            {allCategories.map(c => (
                            <option key={c} value={c}>{c}</option>
                            ))}
                        </select>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">Description</label>
                        <input
                        type="text"
                        value={formData.description}
                        onChange={e => setFormData({ ...formData, description: e.target.value })}
                        className="w-full bg-gray-900/50 border border-white/10 rounded-lg px-4 py-3 text-sm text-white focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500/20 transition-all"
                        placeholder="Short description of what this prompt does"
                        />
                    </div>

                    <div className="space-y-2">
                        <div className="flex justify-between items-center px-1">
                             <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Prompt Content</label>
                             <button 
                                onClick={handleOptimizePrompt}
                                disabled={isOptimizing || !formData.content}
                                className="flex items-center gap-1.5 text-[10px] font-bold bg-brand-500/10 text-brand-500 px-3 py-1 rounded-full border border-brand-500/20 hover:bg-brand-500/20 disabled:opacity-50 transition-colors"
                             >
                                {isOptimizing ? (
                                    <span className="animate-pulse">Optimizing...</span>
                                ) : (
                                    <>
                                        <Icons.Sparkles size={12} /> Magic Optimize
                                    </>
                                )}
                             </button>
                        </div>
                        <textarea
                        value={formData.content}
                        onChange={e => setFormData({ ...formData, content: e.target.value })}
                        className="w-full h-80 bg-gray-900/50 border border-white/10 rounded-lg px-5 py-4 text-sm font-mono text-gray-200 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500/20 transition-all resize-none leading-relaxed shadow-inner"
                        placeholder="Enter your prompt here. Use {variable} for dynamic placeholders."
                        />
                        <p className="text-[10px] text-gray-500 text-right pr-1">
                            Use <span className="text-brand-500 font-mono bg-brand-500/10 px-1 rounded">{'{variable}'}</span> to create input fields.
                        </p>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">Tags</label>
                        <div className="flex flex-wrap gap-2 p-3 bg-gray-900/50 border border-white/10 rounded-lg min-h-[50px]">
                        {formData.tags.map(tag => (
                            <span key={tag} className="flex items-center gap-1.5 text-xs font-medium bg-white/10 text-gray-200 px-3 py-1.5 rounded-full border border-white/5 hover:bg-white/15 transition-colors">
                            {tag}
                            <button onClick={() => removeTag(tag)} className="hover:text-red-400 transition-colors"><Icons.Close size={12} /></button>
                            </span>
                        ))}
                        <input
                            type="text"
                            value={tagInput}
                            onChange={e => setTagInput(e.target.value)}
                            onKeyDown={handleAddTag}
                            className="bg-transparent border-none outline-none text-sm text-white flex-1 min-w-[100px] py-1"
                            placeholder={formData.tags.length === 0 ? "Type tag & press Enter..." : ""}
                        />
                        </div>
                    </div>
                </div>
            )}
        </div>

        {/* Footer - Glassmorphic */}
        {activeTab === 'edit' && (
            <div className="p-5 border-t border-white/5 flex justify-between gap-3 shrink-0 bg-gray-900/40 backdrop-blur-md">
            <div>
                {initialData && (
                    <button
                        onClick={handleDuplicate}
                        className="px-4 py-2 text-sm font-medium text-gray-400 hover:text-white transition-colors flex items-center gap-2 hover:bg-white/5 rounded-lg border border-transparent hover:border-white/5"
                        title="Duplicate Prompt"
                    >
                        <Icons.CopyPlus size={16} /> <span className="hidden sm:inline">Duplicate</span>
                    </button>
                )}
            </div>
            <div className="flex gap-4">
                <button
                    onClick={onClose}
                    className="px-5 py-2 text-sm font-medium text-gray-400 hover:text-white transition-colors"
                >
                    Cancel
                </button>
                <button
                    onClick={() => {
                        onSave(formData);
                        onClose();
                    }}
                    className="px-6 py-2 text-sm font-bold bg-white text-black rounded-lg hover:bg-gray-100 transition-all shadow-[0_0_15px_rgba(255,255,255,0.1)] hover:shadow-[0_0_20px_rgba(255,255,255,0.2)] transform hover:-translate-y-0.5"
                >
                    Save Changes
                </button>
            </div>
            </div>
        )}
      </div>
    </div>
  );
};