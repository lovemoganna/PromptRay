# TODO文档 - 内圈样式重构

## 待办事项

### ✅ 已完成（无需处理）
所有核心功能已完成，无待办事项。

## 可选优化建议

### 1. 动画效果增强（可选）
**优先级**: 低
**描述**: 为装饰元素添加微妙的动画效果，增强视觉节奏感
**建议实现**:
- 呼吸动画（pulse）：装饰元素透明度轻微变化
- 渐变流动：装饰元素位置轻微移动
- 支持 `prefers-reduced-motion` 媒体查询

**操作指引**:
```css
/* 示例：呼吸动画 */
@keyframes pulse {
  0%, 100% { opacity: 0.15; }
  50% { opacity: 0.25; }
}

.orb-pulse {
  animation: pulse 4s ease-in-out infinite;
}
```

### 2. 移动端优化（可选）
**优先级**: 低
**描述**: 在移动端减少装饰元素数量，提升性能
**建议实现**:
- 移动端（< 768px）：仅显示外层装饰（2个）
- 平板（768px - 1024px）：显示外层+中层（4个）
- 桌面（> 1024px）：显示全部（5个）

**操作指引**:
```typescript
// 在 getThemeDecorativeConfig 中添加响应式逻辑
const getResponsiveConfig = (themeId: string, isMobile: boolean) => {
  const fullConfig = getThemeDecorativeConfig(themeId);
  if (isMobile) {
    return fullConfig.filter(config => config.position === 'top-left' || config.position === 'bottom-right');
  }
  return fullConfig;
};
```

### 3. CSS变量优化（可选）
**优先级**: 低
**描述**: 使用CSS变量减少重复代码，提高可维护性
**建议实现**:
- 定义主题色CSS变量
- 在装饰元素配置中使用CSS变量
- 减少内联样式

**操作指引**:
```css
:root {
  --theme-primary: rgba(244,63,94,0.4);
  --theme-secondary: rgba(168,85,247,0.3);
  --theme-accent: rgba(251,146,60,0.35);
}
```

## 配置检查清单

### 环境配置
- ✅ TypeScript配置正常
- ✅ React版本兼容
- ✅ Tailwind CSS配置正常
- ✅ 无额外依赖需要安装

### 功能配置
- ✅ 所有主题配置完整
- ✅ 图标组件可用（Icons.System）
- ✅ 导出功能兼容（html2canvas）

### 测试配置
- ✅ 开发环境正常
- ✅ 构建流程正常
- ✅ 无环境变量需要配置

## 已知限制

### 无已知限制
当前实现无已知限制或问题。

## 支持资源

### 相关文档
- `ALIGNMENT_内圈样式重构.md` - 需求对齐文档
- `CONSENSUS_内圈样式重构.md` - 共识文档
- `DESIGN_内圈样式重构.md` - 设计文档
- `TASK_内圈样式重构.md` - 任务拆分文档
- `ACCEPTANCE_内圈样式重构.md` - 验收文档
- `FINAL_内圈样式重构.md` - 最终交付文档

### 代码位置
- 主要实现: `components/PromptModal.tsx`
  - 装饰配置系统: 第694-746行
  - 系统提示词组件: 第748-822行
  - 装饰元素渲染: 第976-1013行
  - 系统提示词集成: 第1094-1101行

### 关键函数
- `getThemeDecorativeConfig(themeId: string)`: 获取主题装饰配置
- `SystemInstructionCard`: 系统提示词卡片组件
- `getPositionClasses()`: 获取装饰元素位置类名

## 故障排查

### 如果装饰元素不显示
1. 检查 `currentThemeId` 是否正确
2. 检查 `getThemeDecorativeConfig` 是否返回正确配置
3. 检查CSS类名是否正确应用

### 如果系统提示词不显示
1. 检查 `data.systemInstruction` 是否有值
2. 检查 `SystemInstructionCard` 组件是否正确渲染
3. 检查条件渲染逻辑

### 如果导出功能异常
1. 检查 html2canvas 版本兼容性
2. 检查装饰元素的 `pointer-events-none` 是否正确
3. 检查图片加载是否完成

## 快速参考

### 添加新主题
1. 在 `getThemeDecorativeConfig` 中添加新主题配置
2. 在 `SystemInstructionCard` 的 `getThemeColor` 中添加新主题颜色
3. 测试新主题下的显示效果

### 修改装饰元素数量
1. 修改 `getThemeDecorativeConfig` 中的配置数组
2. 调整装饰元素的位置和大小
3. 测试视觉效果

### 修改系统提示词样式
1. 修改 `SystemInstructionCard` 组件的样式
2. 调整主题色配置
3. 测试各主题下的显示效果

---

**状态**: ✅ 所有核心功能已完成
**最后更新**: 2024年
**维护者**: 开发团队

