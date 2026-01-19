import React, { useState } from 'react';
import { ANIMATIONS, AFFORDANCE_STYLES, DEPTH_LEVELS, SEMANTIC_COLORS } from './ui/styleTokens';
import { Icons } from './Icons';

const MicroInteractions: React.FC = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  const showNotification = (message: string) => {
    setNotification(message);
    setTimeout(() => setNotification(null), 3000);
  };

  const simulateLoading = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      showNotification('操作完成！');
    }, 2000);
  };

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold text-white">微交互效果演示</h1>
        <p className="text-xl text-gray-400">精致的动画和交互反馈</p>
      </div>

      {/* 通知提示 */}
      {notification && (
        <div className={`fixed top-4 right-4 z-50 bg-green-500/20 border border-green-500/30 text-green-400 px-4 py-2 rounded-lg ${ANIMATIONS.entrance.slideUp} backdrop-blur-sm`}>
          <div className="flex items-center gap-2">
            <Icons.CheckCircle size={16} />
            {notification}
          </div>
        </div>
      )}

      {/* 可点击元素 */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-white">可点击元素</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            className={`bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 border border-blue-500/30 rounded-lg p-4 transition-all duration-200 ${AFFORDANCE_STYLES.interaction.clickable.hover} ${AFFORDANCE_STYLES.interaction.clickable.active}`}
            onClick={() => showNotification('点击效果！')}
          >
            <div className="text-center">
              <Icons.Star size={24} className="mx-auto mb-2" />
              <div className="font-medium">悬停放大</div>
              <div className="text-sm opacity-70">点击缩小</div>
            </div>
          </button>

          <button
            className={`bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 border border-purple-500/30 rounded-lg p-4 transition-all duration-200 ${ANIMATIONS.micro.bounce}`}
            onClick={() => showNotification('弹跳效果！')}
          >
            <div className="text-center">
              <Icons.Heart size={24} className="mx-auto mb-2" />
              <div className="font-medium">弹性弹跳</div>
              <div className="text-sm opacity-70">hover:scale-110</div>
            </div>
          </button>

          <button
            className={`bg-green-500/20 hover:bg-green-500/30 text-green-400 border border-green-500/30 rounded-lg p-4 transition-all duration-200 ${ANIMATIONS.micro.glow}`}
            onClick={() => showNotification('发光效果！')}
          >
            <div className="text-center">
              <Icons.Ideas size={24} className="mx-auto mb-2" />
              <div className="font-medium">悬停发光</div>
              <div className="text-sm opacity-70">shadow-lg glow</div>
            </div>
          </button>
        </div>
      </section>

      {/* 加载状态 */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-white">加载状态</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <button
            onClick={simulateLoading}
            disabled={isLoading}
            className={`bg-blue-500/20 hover:bg-blue-500/30 disabled:opacity-50 text-blue-400 border border-blue-500/30 rounded-lg p-4 transition-all duration-200 ${AFFORDANCE_STYLES.interaction.clickable.active}`}
          >
            <div className="text-center">
              {isLoading ? (
                <div className={`w-6 h-6 border-2 border-current border-t-transparent rounded-full mx-auto mb-2 ${ANIMATIONS.loading.spin}`} />
              ) : (
                <Icons.RefreshCw size={24} className="mx-auto mb-2" />
              )}
              <div className="font-medium">旋转加载</div>
              <div className="text-sm opacity-70">animate-spin</div>
            </div>
          </button>

          <div className={`bg-orange-500/20 text-orange-400 border border-orange-500/30 rounded-lg p-4 transition-all duration-200 ${isLoading ? ANIMATIONS.loading.pulse : ''}`}>
            <div className="text-center">
              <Icons.Run size={24} className="mx-auto mb-2" />
              <div className="font-medium">脉冲效果</div>
              <div className="text-sm opacity-70">animate-pulse</div>
            </div>
          </div>

          <div className={`bg-pink-500/20 text-pink-400 border border-pink-500/30 rounded-lg p-4 transition-all duration-200 ${isLoading ? ANIMATIONS.loading.ping : ''}`}>
            <div className="text-center">
              <Icons.Radio size={24} className="mx-auto mb-2" />
              <div className="font-medium">扩散效果</div>
              <div className="text-sm opacity-70">animate-ping</div>
            </div>
          </div>

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className={`bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-400 border border-indigo-500/30 rounded-lg p-4 transition-all duration-200 ${AFFORDANCE_STYLES.interaction.clickable.active}`}
          >
            <div className="text-center">
              <Icons.ChevronDown size={24} className={`mx-auto mb-2 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
              <div className="font-medium">旋转动画</div>
              <div className="text-sm opacity-70">transform rotate</div>
            </div>
          </button>
        </div>

        {/* 展开内容 */}
        {isExpanded && (
          <div className={`bg-indigo-500/10 border border-indigo-500/20 rounded-lg p-4 ${ANIMATIONS.entrance.fadeIn}`}>
            <p className="text-indigo-300">这是展开的内容，带有淡入动画效果。</p>
          </div>
        )}
      </section>

      {/* 深度层次 */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-white">深度层次</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {Object.entries(DEPTH_LEVELS).map(([level, shadow]) => (
            <div
              key={level}
              className={`bg-white/10 border border-white/20 rounded-lg p-4 transition-all duration-300 hover:scale-105 ${shadow}`}
            >
              <div className="text-center">
                <div className="text-lg font-medium text-white capitalize">{level}</div>
                <div className="text-sm text-gray-400 mt-1">{shadow}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 颜色过渡 */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-white">颜色过渡</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <h3 className="text-lg font-medium text-white">主色调</h3>
            <div className="flex gap-1">
              {Object.entries(SEMANTIC_COLORS.primary).slice(0, 6).map(([shade]) => (
                <div
                  key={shade}
                  className="w-8 h-8 rounded cursor-pointer transition-all duration-200 hover:scale-110"
                  style={{ backgroundColor: (SEMANTIC_COLORS.primary as any)[shade] || SEMANTIC_COLORS.primary[500] }}
                  title={`primary-${shade}`}
                />
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="text-lg font-medium text-white">成功色</h3>
            <div className="flex gap-1">
              {Object.entries(SEMANTIC_COLORS.success).slice(0, 6).map(([shade]) => (
                <div
                  key={shade}
                  className="w-8 h-8 rounded cursor-pointer transition-all duration-200 hover:scale-110"
                  style={{ backgroundColor: (SEMANTIC_COLORS.success as any)[shade] || SEMANTIC_COLORS.success[500] }}
                  title={`success-${shade}`}
                />
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="text-lg font-medium text-white">警告色</h3>
            <div className="flex gap-1">
              {Object.entries(SEMANTIC_COLORS.warning).slice(0, 6).map(([shade]) => (
                <div
                  key={shade}
                  className="w-8 h-8 rounded cursor-pointer transition-all duration-200 hover:scale-110"
                  style={{ backgroundColor: (SEMANTIC_COLORS.warning as any)[shade] || SEMANTIC_COLORS.warning[500] }}
                  title={`warning-${shade}`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 状态反馈 */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-white">状态反馈</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className={`bg-green-500/20 text-green-400 border border-green-500/30 rounded-lg p-4 ${AFFORDANCE_STYLES.data.success}`}>
            <div className="flex items-center gap-2">
              <Icons.CheckCircle size={20} />
              <span className="font-medium">成功状态</span>
            </div>
          </div>

          <div className={`bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 rounded-lg p-4 ${AFFORDANCE_STYLES.data.warning}`}>
            <div className="flex items-center gap-2">
              <Icons.Clock size={20} />
              <span className="font-medium">等待状态</span>
            </div>
          </div>

          <div className={`bg-red-500/20 text-red-400 border border-red-500/30 rounded-lg p-4 ${AFFORDANCE_STYLES.data.error}`}>
            <div className="flex items-center gap-2">
              <Icons.AlertCircle size={20} />
              <span className="font-medium">错误状态</span>
            </div>
          </div>

          <div className={`bg-gray-500/20 text-gray-400 border border-gray-500/30 rounded-lg p-4 ${AFFORDANCE_STYLES.data.empty}`}>
            <div className="flex items-center gap-2">
              <Icons.Close size={20} />
              <span className="font-medium">非活跃状态</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default MicroInteractions;
