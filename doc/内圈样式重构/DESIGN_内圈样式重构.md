# 设计文档 - 内圈样式重构

## 架构概览

### 整体架构图
```
AestheticPreviewCard Component
├── Background Layer (图片/渐变)
├── Decorative Elements Layer (重构重点)
│   ├── Outer Gradient Orbs (外层光晕)
│   ├── Middle Gradient Orbs (中层装饰)
│   └── Inner Accent Orbs (内层高光)
├── Window Title Bar
├── Action Controls
└── Content Layer
    ├── Category Badge
    ├── Title
    ├── Description
    ├── System Instruction Card (新增)
    └── Main Prompt Code Block
```

## 核心组件设计

### 1. 多层次装饰系统

#### 组件结构
```typescript
// 装饰元素配置
interface DecorativeOrbConfig {
  position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center';
  size: number; // 宽度/高度（px）
  blur: number; // 模糊半径（px）
  opacity: number; // 透明度 0-1
  gradient: string; // CSS渐变字符串
  zIndex: number; // 层级
  animation?: {
    type: 'pulse' | 'float' | 'rotate';
    duration: number;
    delay: number;
  };
}
```

#### 三层装饰系统

**外层（Outer Layer）**
- 位置：top-left, bottom-right（保持现有位置）
- 尺寸：w-96 h-96 (384px)
- 模糊：blur-3xl
- 透明度：0.15-0.20
- 功能：大范围环境光晕

**中层（Middle Layer）**
- 位置：top-right, bottom-left（新增）
- 尺寸：w-64 h-64 (256px)
- 模糊：blur-2xl
- 透明度：0.20-0.25
- 功能：增强视觉层次

**内层（Inner Layer）**
- 位置：center（新增，可选）
- 尺寸：w-32 h-32 (128px)
- 模糊：blur-xl
- 透明度：0.30-0.40
- 功能：视觉焦点引导

### 2. 系统提示词卡片组件

#### 组件结构
```tsx
<SystemInstructionCard
  content={data.systemInstruction}
  themeId={currentThemeId}
  isLightTheme={isLightTheme}
/>
```

#### 视觉设计规范

**布局**
- 位置：在描述和主提示词代码块之间
- 间距：mb-6（与主代码块间距）
- 宽度：与主代码块对齐

**样式**
- 背景：半透明背景，略浅于主代码块
- 边框：1px 主题色边框，圆角与主代码块一致
- 内边距：p-4 md:p-6
- 阴影：subtle shadow，弱于主代码块

**内容区域**
- 标题栏：显示 "SYSTEM INSTRUCTION" 标签和图标
- 内容区：系统提示词文本，使用等宽字体
- 样式：与主提示词区分，使用不同的字重和颜色

### 3. 配色系统增强

#### 主题配色映射

```typescript
const themeColorMap = {
  'theme-default': {
    primary: 'rgba(244,63,94,0.4)',    // 玫瑰红
    secondary: 'rgba(168,85,247,0.3)', // 紫色
    accent: 'rgba(251,146,60,0.25)',   // 橙色（新增）
    highlight: 'rgba(244,63,94,0.15)'  // 高光（新增）
  },
  'theme-midnight': {
    primary: 'rgba(56,189,248,0.4)',   // 天蓝色
    secondary: 'rgba(14,165,233,0.3)', // 深蓝色
    accent: 'rgba(59,130,246,0.25)',   // 蓝色（新增）
    highlight: 'rgba(56,189,248,0.15)' // 高光（新增）
  },
  // ... 其他主题
};
```

#### 透明度层次
- Layer 1 (最外层): 0.10-0.15
- Layer 2 (中层): 0.20-0.25
- Layer 3 (内层): 0.30-0.40
- Layer 4 (高光): 0.15-0.20

## 接口设计

### AestheticPreviewCard Props（保持不变）
```typescript
interface AestheticPreviewCardProps {
  data: {
    title: string;
    content: string;
    description?: string;
    category: string;
    previewMediaUrl?: string;
    systemInstruction?: string; // 已存在，现在会被使用
  };
  onClose?: () => void;
  isModal?: boolean;
  previewMode?: 'raw' | 'interpolated';
  getCompiledPrompt?: () => string;
  onNotify?: (message: string, type?: 'success' | 'info' | 'error') => void;
}
```

### 内部辅助函数

```typescript
// 获取主题装饰配置
function getThemeDecorativeConfig(themeId: string): DecorativeOrbConfig[];

// 生成渐变字符串
function generateGradient(
  themeId: string, 
  layer: 'outer' | 'middle' | 'inner'
): string;

// 检查是否显示系统提示词
function shouldShowSystemInstruction(
  systemInstruction?: string
): boolean;
```

## 数据流向

```
data.systemInstruction
    ↓
shouldShowSystemInstruction() 检查
    ↓
SystemInstructionCard 组件
    ↓
渲染到预览卡片
```

## 异常处理策略

1. **系统提示词为空**：不渲染系统提示词卡片，保持原有布局
2. **主题不存在**：回退到默认主题配置
3. **导出失败**：保持原有导出逻辑，新设计应自动兼容

## 性能优化策略

1. **CSS优化**
   - 使用 `transform` 和 `opacity` 实现动画（GPU加速）
   - 避免复杂的 `filter` 叠加
   - 使用 `will-change` 提示浏览器优化

2. **渲染优化**
   - 装饰元素使用 `pointer-events-none` 避免交互开销
   - 条件渲染系统提示词卡片（仅在存在时渲染）

3. **动画优化**
   - 使用 CSS 动画而非 JavaScript 动画
   - 限制动画元素数量
   - 提供 `prefers-reduced-motion` 支持

## 响应式设计

### 断点策略
- **移动端** (< 768px): 简化装饰元素，减少数量
- **平板** (768px - 1024px): 标准装饰配置
- **桌面** (> 1024px): 完整装饰系统

### 装饰元素响应式
- 移动端：仅显示外层装饰（2个）
- 平板：显示外层+中层（4个）
- 桌面：显示全部三层（5-6个）

## 可访问性

1. **对比度**：确保文本与背景对比度符合 WCAG AA 标准
2. **动画**：支持 `prefers-reduced-motion`
3. **语义化**：系统提示词使用适当的 HTML 语义标签

