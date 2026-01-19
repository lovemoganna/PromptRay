import React, { useState, useEffect } from 'react';
import { AFFORDANCE_STYLES, ANIMATIONS } from './ui/styleTokens';
import { Icons } from './Icons';

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  content: React.ReactNode;
  target?: string; // CSS selector for highlighting
  position: 'top' | 'bottom' | 'left' | 'right' | 'center';
}

interface OnboardingFlowProps {
  isActive: boolean;
  onComplete: () => void;
  onSkip: () => void;
}

const OnboardingFlow: React.FC<OnboardingFlowProps> = ({
  isActive,
  onComplete,
  onSkip
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  const steps: OnboardingStep[] = [
    {
      id: 'welcome',
      title: '欢迎使用 Prompt Ray',
      description: '让我们快速了解一下这个强大的AI提示词工具',
      content: (
        <div className="space-y-4">
          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Icons.Sparkles size={32} className="text-white" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Prompt Ray</h2>
            <p className="text-gray-300">AI 提示词创作和管理工具</p>
          </div>
          <div className="bg-white/5 rounded-lg p-4">
            <h3 className="font-medium text-white mb-2">您可以：</h3>
            <ul className="space-y-2 text-sm text-gray-300">
              <li>• 创建和管理AI提示词</li>
              <li>• 与大模型AI实时交互测试</li>
              <li>• 组织和分类您的提示词库</li>
              <li>• 导出和分享您的创作</li>
            </ul>
          </div>
        </div>
      ),
      position: 'center'
    },
    {
      id: 'create-first',
      title: '创建您的第一个提示词',
      description: '点击创建按钮开始您的AI提示词创作之旅',
      content: (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
              <Icons.Plus size={24} className="text-blue-400" />
            </div>
            <div>
              <h3 className="font-medium text-white">创建新提示词</h3>
              <p className="text-sm text-gray-400">从空白开始或使用模板</p>
            </div>
          </div>
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
            <p className="text-sm text-blue-300">
              💡 提示：您可以创建不同类型的提示词，包括文本生成、图像创作、代码编写等。
            </p>
          </div>
        </div>
      ),
      target: '[data-create-button]',
      position: 'bottom'
    },
    {
      id: 'explore-features',
      title: '探索强大功能',
      description: '了解Prompt Ray的核心功能特性',
      content: (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white/5 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-2">
                <Icons.Search size={20} className="text-purple-400" />
                <span className="font-medium text-white">智能搜索</span>
              </div>
              <p className="text-sm text-gray-400">全局搜索您的提示词，支持多条件筛选</p>
            </div>
            <div className="bg-white/5 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-2">
                <Icons.TestTube size={20} className="text-green-400" />
                <span className="font-medium text-white">实时测试</span>
              </div>
              <p className="text-sm text-gray-400">直接与AI模型对话，测试提示词效果</p>
            </div>
            <div className="bg-white/5 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-2">
                <Icons.BarChart size={20} className="text-orange-400" />
                <span className="font-medium text-white">数据可视化</span>
              </div>
              <p className="text-sm text-gray-400">查看使用统计和趋势分析</p>
            </div>
            <div className="bg-white/5 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-2">
                <Icons.Share size={20} className="text-pink-400" />
                <span className="font-medium text-white">批量操作</span>
              </div>
              <p className="text-sm text-gray-400">批量导出、复制、删除提示词</p>
            </div>
          </div>
        </div>
      ),
      position: 'center'
    },
    {
      id: 'keyboard-shortcuts',
      title: '键盘快捷键',
      description: '掌握这些快捷键，让操作更加高效',
      content: (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <h4 className="font-medium text-white">全局快捷键</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-300">全局搜索</span>
                  <kbd className="px-2 py-1 bg-white/10 rounded text-xs">⌘K</kbd>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">命令面板</span>
                  <kbd className="px-2 py-1 bg-white/10 rounded text-xs">⌘P</kbd>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">创建提示词</span>
                  <kbd className="px-2 py-1 bg-white/10 rounded text-xs">⌘J</kbd>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">切换主题</span>
                  <kbd className="px-2 py-1 bg-white/10 rounded text-xs">D</kbd>
                </div>
              </div>
            </div>
            <div className="space-y-3">
              <h4 className="font-medium text-white">列表操作</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-300">全选</span>
                  <kbd className="px-2 py-1 bg-white/10 rounded text-xs">⌘A</kbd>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">删除选中</span>
                  <kbd className="px-2 py-1 bg-white/10 rounded text-xs">Del</kbd>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">清除选择</span>
                  <kbd className="px-2 py-1 bg-white/10 rounded text-xs">Esc</kbd>
                </div>
              </div>
            </div>
          </div>
          <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3">
            <p className="text-sm text-yellow-300">
              💡 提示：熟练使用快捷键可以大幅提升您的工作效率！
            </p>
          </div>
        </div>
      ),
      position: 'center'
    },
    {
      id: 'complete',
      title: '准备开始创作！',
      description: '您已经掌握了Prompt Ray的基础用法',
      content: (
        <div className="space-y-4">
          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Icons.CheckCircle size={32} className="text-white" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">准备就绪！</h2>
            <p className="text-gray-300">开始您的AI提示词创作之旅吧</p>
          </div>

          <div className="bg-white/5 rounded-lg p-4">
            <h3 className="font-medium text-white mb-3">接下来您可以：</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="flex items-center gap-2 text-sm text-gray-300">
                <Icons.Plus size={16} className="text-blue-400" />
                创建您的第一个提示词
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-300">
                <Icons.Search size={16} className="text-purple-400" />
                探索现有的提示词模板
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-300">
                <Icons.Settings size={16} className="text-orange-400" />
                配置AI模型设置
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-300">
                <Icons.Book size={16} className="text-green-400" />
                查看使用文档
              </div>
            </div>
          </div>
        </div>
      ),
      position: 'center'
    }
  ];

  useEffect(() => {
    if (isActive) {
      setIsVisible(true);
      setCurrentStep(0);
    } else {
      setIsVisible(false);
    }
  }, [isActive]);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = () => {
    setIsVisible(false);
    setTimeout(() => {
      onComplete();
    }, 300);
  };

  const handleSkip = () => {
    setIsVisible(false);
    setTimeout(() => {
      onSkip();
    }, 300);
  };

  if (!isActive || !isVisible) return null;

  const step = steps[currentStep];

  return (
    <div className="fixed inset-0 z-50 pointer-events-none">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      {/* Highlight target element */}
      {step.target && (
        <div className="absolute inset-0">
          <div
            className={`absolute border-2 border-blue-400 rounded-lg ${ANIMATIONS.micro.glow} pointer-events-none`}
            style={{
              // This would need to be calculated based on the target element
              // For demo purposes, we'll use a placeholder
            }}
          />
        </div>
      )}

      {/* Modal */}
      <div className="absolute inset-0 flex items-center justify-center p-4 pointer-events-auto">
        <div className={`max-w-2xl w-full bg-gray-900/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl ${ANIMATIONS.entrance.scaleIn}`}>
          {/* Header */}
          <div className="p-6 border-b border-white/5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-white">{step.title}</h2>
                <p className="text-gray-400 mt-1">{step.description}</p>
              </div>
              <button
                onClick={handleSkip}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <Icons.Close size={20} />
              </button>
            </div>

            {/* Progress indicator */}
            <div className="mt-4 flex gap-2">
              {steps.map((_, index) => (
                <div
                  key={index}
                  className={`h-1 flex-1 rounded-full transition-colors duration-300 ${
                    index <= currentStep ? 'bg-blue-500' : 'bg-white/20'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Content */}
          <div className="p-6 max-h-96 overflow-y-auto">
            {step.content}
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-white/5 flex justify-between">
            <button
              onClick={handleSkip}
              className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
            >
              跳过引导
            </button>

            <div className="flex gap-3">
              {currentStep > 0 && (
                <button
                  onClick={handlePrevious}
                  className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
                >
                  上一步
                </button>
              )}

              <button
                onClick={handleNext}
                className={`px-6 py-2 rounded-lg font-medium transition-all duration-200 ${AFFORDANCE_STYLES.functional.primary} ${AFFORDANCE_STYLES.interaction.clickable.hover} ${AFFORDANCE_STYLES.interaction.clickable.active}`}
              >
                {currentStep === steps.length - 1 ? '开始使用' : '下一步'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OnboardingFlow;
