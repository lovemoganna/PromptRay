import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Prompt, PromptFormData, PromptConfig, PromptVersion, SavedRun } from '../types';
import { Icons } from './Icons';
import { ConfirmDialog } from './ConfirmDialog';
import { CodeSnippetsModal } from './CodeSnippetsModal';
import { AestheticCard } from './AestheticCard';
import { PromptExamplesTab } from './promptModal/PromptExamplesTab';
import { PromptTestTab } from './promptModal/PromptTestTab';
import { PromptPreviewTab } from './promptModal/PromptPreviewTab';
import { PromptHistoryTab } from './promptModal/PromptHistoryTab';
import { PromptEditTab } from './promptModal/PromptEditTab';
import { usePromptMetaAndTags } from './promptModal/usePromptMetaAndTags';
import { usePromptExamplesLogic } from './promptModal/usePromptExamplesLogic';
import { runGeminiPromptStream, generateSampleVariables } from '../services/geminiService';

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
  const [isGeneratingExamples, setIsGeneratingExamples] = useState(false);
  const [autoFillingIndex, setAutoFillingIndex] = useState<number | null>(null);


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

  const {
    handleAutoMetadata,
    handleOptimizePrompt,
    handleOptimizeSystem,
    handleAutoTag,
    handleTranslateToEnglish,
  } = usePromptMetaAndTags({
    formData,
    setFormData,
    savedRuns,
    onNotify,
    isOpen,
    setIsAutoMeta,
    setIsOptimizingPrompt,
    setIsOptimizingSystem,
    setIsTagging,
    setIsTranslating,
  });

  const {
    handleAddExample,
    handleUpdateExample,
    handleRemoveExample,
    handleClearExamples,
    handleGenerateExamplesWithModel,
    handleAutoFillExampleOutput,
  } = usePromptExamplesLogic({
    formData,
    setFormData,
    onNotify,
    setIsGeneratingExamples,
    setAutoFillingIndex,
  });


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

  const handleVariableChange = (name: string, value: string) => {
      setVariableValues(prev => ({ ...prev, [name]: value }));
  };

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
        <div className="flex-1 overflow-y-auto p-5 sm:p-7 md:p-9 lg:p-10 custom-scrollbar bg-gradient-to-b from-slate-950 via-slate-950 to-black text-sm sm:text-[15px] lg:text-base" data-modal-body>
            {activeTab === 'preview' && (
              <PromptPreviewTab
                formData={formData}
                            previewMode={previewMode}
                onPreviewModeChange={setPreviewMode}
                detectedVariables={detectedVariables}
                variableValues={variableValues}
                isFilling={isFilling}
                copiedPreview={copiedPreview}
                onCopyRawPrompt={handleCopyRawPrompt}
                onCopyEnglishPrompt={handleCopyEnglishPrompt}
                onCopyChinesePrompt={handleCopyChinesePrompt}
                onCopyBilingualPrompt={handleCopyBilingualPrompt}
                onMagicFill={handleMagicFill}
                onVariableChange={handleVariableChange}
                onSetActiveTab={setActiveTab}
              />
            )}
            
            {/* ... other tabs ... */}
            {activeTab === 'examples' && (
                <PromptExamplesTab
                    examples={formData.examples || []}
                    isGeneratingExamples={isGeneratingExamples}
                    autoFillingIndex={autoFillingIndex}
                    onGenerateExamples={handleGenerateExamplesWithModel}
                    onAddExample={handleAddExample}
                    onClearExamples={handleClearExamples}
                    onRemoveExample={handleRemoveExample}
                    onUpdateExample={handleUpdateExample}
                    onAutoFillOutput={handleAutoFillExampleOutput}
                />
            )}

            {/* TEST TAB - Enhanced */}
            {activeTab === 'test' && (
                <PromptTestTab
                    config={formData.config || undefined}
                    detectedVariables={detectedVariables}
                    variableValues={variableValues}
                    testResult={testResult}
                    isTesting={isTesting}
                    isFilling={isFilling}
                    sortedRuns={sortedRuns}
                    onConfigChange={handleConfigChange}
                    onVariableChange={handleVariableChange}
                    onMagicFill={handleMagicFill}
                    onRun={handleRunGeminiStream}
                    onSaveRun={handleSaveRun}
                    onLoadRun={handleLoadRun}
                    onRateRun={handleRateRun}
                    onDeleteRun={handleDeleteRun}
                />
            )}
            
            {activeTab === 'history' && initialData && (
              <PromptHistoryTab
                initialData={initialData}
                getTokenCount={getTokenCount}
                onRestoreVersion={handleRestoreVersion}
              />
            )}

        {activeTab === 'edit' && (
              <PromptEditTab
                formData={formData}
                initialData={initialData || undefined}
                allCategories={allCategories}
                tagInput={tagInput}
                tagSuggestions={tagSuggestions}
                isAutoMeta={isAutoMeta}
                isOptimizingSystem={isOptimizingSystem}
                isTranslating={isTranslating}
                isOptimizingPrompt={isOptimizingPrompt}
                isTagging={isTagging}
                onFormDataChange={setFormData}
                onAutoMetadata={handleAutoMetadata}
                onOptimizeSystem={handleOptimizeSystem}
                onTranslateToEnglish={handleTranslateToEnglish}
                onOptimizePrompt={handleOptimizePrompt}
                onAutoTag={handleAutoTag}
                onTagInputChange={setTagInput}
                onTagKeyDown={handleAddTag}
                onRemoveTag={removeTag}
                onAddTagFromSuggestion={addTag}
                getTokenCount={getTokenCount}
                onDuplicate={initialData ? handleDuplicate : undefined}
                onCancel={onClose}
                onSaveClick={() => {
                        onSave({ ...formData, savedRuns, lastVariableValues: variableValues });
                        onClose();
                    }}
              />
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