# 需求对齐文档 - PromptRay 视觉与导出改造

## 原始需求
- 提升 Prompt 预览大卡片（含 System Instruction / Prompt Code 区块）的整体视觉质感，靠近深色高端 UI 截图风格。
- 确保标题 `h1 > span.bg-clip-text.text-transparent.bg-gradient-to-r` 在屏幕和导出图片中始终使用主题渐变文字，禁止在导出时被改成纯白/纯灰或被模糊。
- System / Prompt 头部需要有清晰分层的视觉结构（图标、双行标签、右侧状态/类别胶囊、小圆点等），避免“普通灰条”。
- 修复 `Copy as Image` / `Download as Image` 按钮交互错觉，保证只触发当前操作且 loading/禁用状态分离。
- 优化导出图片外框和阴影，在导出时弱化外轮廓，让正文区域成为视觉中心，同时不破坏文字可读性。

## 项目上下文
### 技术栈
- TypeScript + React + Vite
- Tailwind（CDN 注入）+ `index.html` 全局 CSS（主题变量、玻璃面板、动画等）
- 导出：`html2canvas`

### 现有架构理解（与本任务强相关）
- `index.html`
  - 全局主题变量（`--c-bg-main`/`--c-brand` 等）
  - 导出安全模式：
    - `[data-exporting="true"] [data-decorative-layer="true"]`：弱化装饰层
    - `[data-exporting="true"] [data-export-frame="true"]`：弱化外框/阴影
- `components/PromptModal.tsx`
  - `AestheticCard`：预览大卡片视觉 + Copy/Download as Image 逻辑
  - System/Prompt 卡片头部结构也在这里

## 需求理解
### In Scope
- 标题渐变：任何状态（预览/导出）保持渐变文字，不对文字本身做模糊/遮罩/强制变白。
- System/Prompt 头部：图标 + 双行标签 + 右侧小圆点/胶囊，统一间距与色调。
- 导出交互：copy/download 状态分离，只触发对应行为，且导出时仅弱化装饰/外框。

### Out of Scope
- 不重做全局主题体系、不变更数据结构、不替换导出库（继续 html2canvas）。

## 关键不确定点（默认方案）
- 图标：优先使用现有 `Icons.System` 与 `Icons.Code`。
- 标题渐变：按 `currentThemeId` 映射固定渐变（Obsidian/Ocean/Aurora/Terminal/Light）。

## 验收标准
- 标题：屏幕与导出图片中都保持渐变文字，清晰可读、无被背景“吃掉”。
- System/Prompt：头部层级清晰、能一眼区分；设计细节一致。
- Copy/Download：点击只触发对应操作；只有当前按钮显示 loading，高亮与禁用状态不会造成“两个都在忙”的错觉。
- 导出：外框/阴影较屏幕态明显弱化，主体内容成为视觉重心。


