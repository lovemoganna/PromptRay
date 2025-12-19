import { useCallback } from 'react';
import { PromptFormData } from '../../types';
import { runGeminiPrompt } from '../../services/geminiService';

type NotifyFn = (message: string, type: 'success' | 'info' | 'error') => void;

interface UsePromptExamplesLogicParams {
  formData: PromptFormData;
  setFormData: React.Dispatch<React.SetStateAction<PromptFormData>>;
  onNotify?: NotifyFn;
  setIsGeneratingExamples: (v: boolean) => void;
  setAutoFillingIndex: (v: number | null) => void;
}

export const usePromptExamplesLogic = ({
  formData,
  setFormData,
  onNotify,
  setIsGeneratingExamples,
  setAutoFillingIndex,
}: UsePromptExamplesLogicParams) => {
  const handleAddExample = useCallback(() => {
    setFormData(prev => ({
      ...prev,
      examples: [...(prev.examples || []), { input: '', output: '' }],
    }));
  }, [setFormData]);

  const handleUpdateExample = useCallback(
    (index: number, field: 'input' | 'output', value: string) => {
      setFormData(prev => {
        const newExamples = [...(prev.examples || [])];
        newExamples[index] = { ...newExamples[index], [field]: value };
        return { ...prev, examples: newExamples };
      });
    },
    [setFormData]
  );

  const handleRemoveExample = useCallback(
    (index: number) => {
      setFormData(prev => ({
        ...prev,
        examples: (prev.examples || []).filter((_, i) => i !== index),
      }));
    },
    [setFormData]
  );

  const handleClearExamples = useCallback(() => {
    setFormData(prev => ({ ...prev, examples: [] }));
  }, [setFormData]);

  const handleGenerateExamplesWithModel = useCallback(async () => {
    if (!formData.content && !formData.englishPrompt && !formData.chinesePrompt) {
      onNotify?.('请先为当前提示词填写内容，再让模型生成示例。', 'info');
      return;
    }

    setIsGeneratingExamples(true);
    try {
      const basePrompt = `你是一名少样本提示词设计专家，正在为一个 Prompt 设计「示例系统」。
请基于下面的信息，生成 3-5 组高质量的 few-shot 示例。

要求：
1. 每组示例包含两个字段：input（用户输入示例）、output（理想的模型输出示例）。
2. 覆盖不同典型场景，帮助模型理解边界和风格。
3. 示例要尽量贴近真实使用情境，语气和风格要与提示词保持一致。
4. 严格使用 JSON 返回，返回格式如下，不要添加任何解释文本：
{
  "examples": [
    { "input": "用户输入示例1", "output": "模型输出示例1" },
    { "input": "用户输入示例2", "output": "模型输出示例2" }
  ]
}

当前提示词信息：
标题: ${formData.title || '未命名提示词'}
描述: ${formData.description || '（暂无描述）'}
英文提示词: ${formData.englishPrompt || formData.content || '（无）'}
中文提示词: ${formData.chinesePrompt || '（无）'}
系统指令: ${formData.systemInstruction || '（无）'}`;

      const raw = await runGeminiPrompt(basePrompt, {
        model: formData.config?.model,
        temperature: formData.config?.temperature ?? 0.7,
        maxOutputTokens: formData.config?.maxOutputTokens ?? 2000,
        topP: formData.config?.topP,
        topK: formData.config?.topK,
      });

      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      const jsonText = jsonMatch ? jsonMatch[0] : raw;
      const parsed = JSON.parse(jsonText);
      const candidate = Array.isArray(parsed.examples) ? parsed.examples : [];

      const mapped = candidate
        .filter((ex: any) => typeof ex?.input === 'string' && typeof ex?.output === 'string')
        .map((ex: any) => ({
          input: ex.input.trim(),
          output: ex.output.trim(),
        }));

      if (!mapped.length) {
        throw new Error('No valid examples returned from model');
      }

      setFormData(prev => ({ ...prev, examples: mapped }));
      onNotify?.('已根据当前提示词自动生成示例，你可以继续编辑和微调。', 'success');
    } catch (error) {
      console.error('handleGenerateExamplesWithModel error:', error);
      if (error instanceof Error && (error.message.includes('503') || error.message.includes('overloaded'))) {
        onNotify?.(
          'Gemini 服务当前过载（503），你的 API Key 已生效，但暂时无法从模型获取示例，请稍后重试或暂时手动创建示例。',
          'info'
        );
      } else {
        onNotify?.('自动生成示例失败，请检查网络或稍后重试，必要时可手动创建示例。', 'error');
      }
    } finally {
      setIsGeneratingExamples(false);
    }
  }, [formData, onNotify, setFormData, setIsGeneratingExamples]);

  const handleAutoFillExampleOutput = useCallback(
    async (index: number) => {
      const currentExamples = formData.examples || [];
      const target = currentExamples[index];

      if (!target || !target.input) {
        onNotify?.('请先为该示例填写用户输入内容，再让模型补全输出。', 'info');
        return;
      }

      setAutoFillingIndex(index);
      try {
        const prompt = `你是一名用于 few-shot 学习的示例助手。
请根据下面的「总体提示词」和「示例输入」，生成一个高质量的「示例输出」，用于教会模型应该如何回答。

要求：
1. 输出内容要足够具体，尽量展示结构和风格。
2. 不要解释你在做什么，直接给出期望的模型输出内容。
3. 不要使用占位符，使用真实自然的内容。

总体提示词（可能包含中英文混排）：
${formData.englishPrompt || formData.content || ''}

系统指令（如果有）：
${formData.systemInstruction || '（无）'}

示例输入：
${target.input}`;

        const raw = await runGeminiPrompt(prompt, {
          model: formData.config?.model,
          temperature: formData.config?.temperature ?? 0.7,
          maxOutputTokens: formData.config?.maxOutputTokens ?? 2000,
          topP: formData.config?.topP,
          topK: formData.config?.topK,
        });

        const outputText = raw.trim();

        setFormData(prev => {
          const next = [...(prev.examples || [])];
          next[index] = { ...next[index], output: outputText };
          return { ...prev, examples: next };
        });

        onNotify?.('已为该示例生成参考输出，你可以继续修改。', 'success');
      } catch (error) {
        console.error('handleAutoFillExampleOutput error:', error);
        onNotify?.('自动补全示例输出失败，请稍后重试。', 'error');
      } finally {
        setAutoFillingIndex(null);
      }
    },
    [formData, onNotify, setFormData, setAutoFillingIndex]
  );

  return {
    handleAddExample,
    handleUpdateExample,
    handleRemoveExample,
    handleClearExamples,
    handleGenerateExamplesWithModel,
    handleAutoFillExampleOutput,
  };
};


