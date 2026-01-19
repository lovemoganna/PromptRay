import React from 'react';
import { LAYOUT, COMPONENT_STYLES } from './ui/styleTokens';

// 语义化颜色系统
export const SEMANTIC_COLORS = {
  // 基础颜色
  primary: {
    50: '#eff6ff',
    100: '#dbeafe',
    200: '#bfdbfe',
    300: '#93c5fd',
    400: '#60a5fa',
    500: '#3b82f6',
    600: '#2563eb',
    700: '#1d4ed8',
    800: '#1e40af',
    900: '#1e3a8a',
  },
  neutral: {
    50: '#f8fafc',
    100: '#f1f5f9',
    200: '#e2e8f0',
    300: '#cbd5e1',
    400: '#94a3b8',
    500: '#64748b',
    600: '#475569',
    700: '#334155',
    800: '#1e293b',
    900: '#0f172a',
  },
  success: {
    50: '#f0fdf4',
    100: '#dcfce7',
    200: '#bbf7d0',
    300: '#86efac',
    400: '#4ade80',
    500: '#22c55e',
    600: '#16a34a',
    700: '#15803d',
    800: '#166534',
    900: '#14532d',
  },
  warning: {
    50: '#fffbeb',
    100: '#fef3c7',
    200: '#fde68a',
    300: '#fcd34d',
    400: '#fbbf24',
    500: '#f59e0b',
    600: '#d97706',
    700: '#b45309',
    800: '#92400e',
    900: '#78350f',
  },
  error: {
    50: '#fef2f2',
    100: '#fee2e2',
    200: '#fecaca',
    300: '#fca5a5',
    400: '#f87171',
    500: '#ef4444',
    600: '#dc2626',
    700: '#b91c1c',
    800: '#991b1b',
    900: '#7f1d1d',
  },
} as const;

// 深度和层次系统
export const DEPTH_LEVELS = {
  ground: 'shadow-none',
  floating: 'shadow-sm',
  elevated: 'shadow-md',
  modal: 'shadow-lg',
  tooltip: 'shadow-xl',
  overlay: 'shadow-2xl',
} as const;

// 动画和过渡系统
export const ANIMATIONS = {
  // 微交互
  micro: {
    scale: 'hover:scale-105 active:scale-95 transition-transform duration-100',
    bounce: 'hover:scale-110 active:scale-90 transition-transform duration-150',
    glow: 'hover:shadow-lg hover:shadow-current/25 transition-shadow duration-200',
  },

  // 状态变化
  state: {
    fade: 'transition-opacity duration-200',
    slide: 'transition-transform duration-300 ease-out',
    color: 'transition-colors duration-200',
    all: 'transition-all duration-200 ease-out',
  },

  // 进入/离开
  entrance: {
    fadeIn: 'animate-in fade-in duration-300',
    slideUp: 'animate-in slide-in-from-bottom-4 duration-300',
    scaleIn: 'animate-in zoom-in-95 duration-200',
    bounceIn: 'animate-in bounce-in duration-500',
  },

  // 加载状态
  loading: {
    pulse: 'animate-pulse',
    spin: 'animate-spin',
    ping: 'animate-ping',
  },
} as const;

// 组件变体系统
export const COMPONENT_VARIANTS = {
  button: {
    primary: `${COMPONENT_STYLES.button.base} ${COMPONENT_STYLES.button.variants.primary} ${ANIMATIONS.micro.bounce}`,
    secondary: `${COMPONENT_STYLES.button.base} ${COMPONENT_STYLES.button.variants.secondary} ${ANIMATIONS.state.color}`,
    ghost: `${COMPONENT_STYLES.button.base} ${COMPONENT_STYLES.button.variants.ghost} hover:bg-white/10 ${ANIMATIONS.state.color}`,
    danger: `${COMPONENT_STYLES.button.base} ${COMPONENT_STYLES.button.variants.danger} ${ANIMATIONS.micro.bounce}`,
  },

  input: {
    default: `${COMPONENT_STYLES.input.base} ${COMPONENT_STYLES.input.sizes.md} ${ANIMATIONS.state.all}`,
    error: `${COMPONENT_STYLES.input.base} ${COMPONENT_STYLES.input.variants.error} ${COMPONENT_STYLES.input.sizes.md} ${ANIMATIONS.state.all}`,
    success: `${COMPONENT_STYLES.input.base} ${COMPONENT_STYLES.input.variants.success} ${COMPONENT_STYLES.input.sizes.md} ${ANIMATIONS.state.all}`,
  },

  card: {
    default: `${COMPONENT_STYLES.card.base} ${COMPONENT_STYLES.card.variants.default} ${LAYOUT.spacing.padding.card}`,
    elevated: `${COMPONENT_STYLES.card.base} ${COMPONENT_STYLES.card.variants.elevated} ${LAYOUT.spacing.padding.card}`,
    glass: `${COMPONENT_STYLES.card.base} ${COMPONENT_STYLES.card.variants.glass} ${LAYOUT.spacing.padding.card}`,
    compact: `${COMPONENT_STYLES.card.base} ${COMPONENT_STYLES.card.variants.default} ${LAYOUT.spacing.componentSmall}`,
  },
} as const;

// 本体感设计系统 - 界面元素反映功能属性
export const AFFORDANCE_STYLES = {
  // 可点击元素
  clickable: {
    base: 'cursor-pointer select-none',
    hover: 'hover:bg-white/5 hover:scale-[1.02] transition-all duration-200',
    active: 'active:scale-[0.98] active:bg-white/10',
  },

  // 可拖拽元素
  draggable: {
    base: 'cursor-grab active:cursor-grabbing',
    hover: 'hover:shadow-md hover:-translate-y-1 transition-all duration-200',
    dragging: 'shadow-xl rotate-3 scale-105',
  },

  // 可编辑元素
  editable: {
    base: 'cursor-text',
    hover: 'hover:bg-white/5 hover:ring-1 hover:ring-white/20 transition-all duration-200',
    focus: 'ring-2 ring-blue-500/50 bg-white/10',
  },

  // 可选择元素
  selectable: {
    base: 'cursor-pointer',
    selected: 'ring-2 ring-blue-500/50 bg-blue-500/10',
    hover: 'hover:bg-white/5 transition-colors duration-200',
  },

  // 状态指示器
  status: {
    active: 'bg-green-500/20 text-green-400 border-green-500/30',
    inactive: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
    pending: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    error: 'bg-red-500/20 text-red-400 border-red-500/30',
  },
} as const;

// 响应式设计系统
export const RESPONSIVE_BREAKPOINTS = {
  mobile: '@media (max-width: 640px)',
  tablet: '@media (min-width: 641px) and (max-width: 1024px)',
  desktop: '@media (min-width: 1025px)',
  wide: '@media (min-width: 1281px)',
} as const;

// 统一的间距系统
export const SPACING_SCALE = {
  0: '0px',
  1: '4px',
  2: '8px',
  3: '12px',
  4: '16px',
  5: '20px',
  6: '24px',
  8: '32px',
  10: '40px',
  12: '48px',
  16: '64px',
  20: '80px',
  24: '96px',
  32: '128px',
} as const;

// 设计系统展示组件
const DesignSystem: React.FC = () => {
  return (
    <div className="p-8 max-w-6xl mx-auto space-y-12">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold text-white">设计系统</h1>
        <p className="text-xl text-gray-400">统一的视觉语言和交互规范</p>
      </div>

      {/* 颜色系统 */}
      <section className="space-y-6">
        <h2 className="text-2xl font-semibold text-white">颜色系统</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Object.entries(SEMANTIC_COLORS).map(([name, shades]) => (
            <div key={name} className="bg-white/5 rounded-lg p-4">
              <h3 className="text-lg font-medium text-white mb-3 capitalize">{name}</h3>
              <div className="grid grid-cols-5 gap-1">
                {Object.entries(shades).map(([shade, color]) => (
                  <div key={shade} className="text-center">
                    <div
                      className="w-8 h-8 rounded mx-auto mb-1 border border-white/10"
                      style={{ backgroundColor: color }}
                    />
                    <div className="text-xs text-gray-400">{shade}</div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 组件示例 */}
      <section className="space-y-6">
        <h2 className="text-2xl font-semibold text-white">组件示例</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* 按钮变体 */}
          <div className={COMPONENT_VARIANTS.card.default}>
            <h3 className="text-lg font-medium text-white mb-4">按钮变体</h3>
            <div className="space-y-3">
              {Object.entries(COMPONENT_VARIANTS.button).map(([variant, classes]) => (
                <button key={variant} className={`${classes} ${COMPONENT_STYLES.button.sizes.md} capitalize`}>
                  {variant} Button
                </button>
              ))}
            </div>
          </div>

          {/* 输入框变体 */}
          <div className={COMPONENT_VARIANTS.card.default}>
            <h3 className="text-lg font-medium text-white mb-4">输入框变体</h3>
            <div className="space-y-3">
              <input
                type="text"
                placeholder="默认输入框"
                className={COMPONENT_VARIANTS.input.default}
              />
              <input
                type="text"
                placeholder="错误状态"
                className={COMPONENT_VARIANTS.input.error}
              />
              <input
                type="text"
                placeholder="成功状态"
                className={COMPONENT_VARIANTS.input.success}
              />
            </div>
          </div>
        </div>
      </section>

      {/* 间距系统 */}
      <section className="space-y-6">
        <h2 className="text-2xl font-semibold text-white">间距系统</h2>

        <div className="bg-white/5 rounded-lg p-6">
          <div className="grid grid-cols-4 md:grid-cols-6 gap-4">
            {Object.entries(SPACING_SCALE).map(([key, value]) => (
              <div key={key} className="text-center">
                <div
                  className="bg-blue-500/20 border border-blue-500/30 rounded mx-auto mb-2"
                  style={{ width: value, height: value, minWidth: '20px', minHeight: '20px' }}
                />
                <div className="text-sm text-white">{key}</div>
                <div className="text-xs text-gray-400">{value}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 深度层次 */}
      <section className="space-y-6">
        <h2 className="text-2xl font-semibold text-white">深度层次</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {Object.entries(DEPTH_LEVELS).map(([level, shadow]) => (
            <div key={level} className={`bg-white/10 rounded-lg p-6 ${shadow}`}>
              <h3 className="text-lg font-medium text-white mb-2 capitalize">{level}</h3>
              <p className="text-sm text-gray-400">{shadow}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 本体感设计 */}
      <section className="space-y-6">
        <h2 className="text-2xl font-semibold text-white">本体感设计</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* 可点击元素 */}
          <div className={COMPONENT_VARIANTS.card.default}>
            <h3 className="text-lg font-medium text-white mb-4">可点击元素</h3>
            <button className={`${AFFORDANCE_STYLES.clickable.base} ${AFFORDANCE_STYLES.clickable.hover} ${AFFORDANCE_STYLES.clickable.active} bg-white/10 rounded-lg p-4 w-full text-left`}>
              <div className="text-white font-medium">点击我</div>
              <div className="text-gray-400 text-sm">我会轻微放大和缩小</div>
            </button>
          </div>

          {/* 可选择元素 */}
          <div className={COMPONENT_VARIANTS.card.default}>
            <h3 className="text-lg font-medium text-white mb-4">可选择元素</h3>
            <div className="space-y-2">
              {['选项 A', '选项 B', '选项 C'].map((option) => (
                <div key={option} className={`${AFFORDANCE_STYLES.selectable.base} ${AFFORDANCE_STYLES.selectable.hover} bg-white/5 rounded p-3`}>
                  <div className="text-white">{option}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default DesignSystem;
