# 验收记录 - PromptRay 视觉与导出改造

## 构建与静态检查
- [x] `npm run build` 通过（`tsc -b && vite build`）

## 需求验收清单（对应 CONSENSUS）

### 1) 标题渐变一致性（预览 vs 导出）
- [x] 标题 DOM 仍为 `h1 > span.bg-clip-text.text-transparent.bg-gradient-to-r`
- [x] 标题渐变通过 `span` 的 `backgroundImage` 按主题映射（不依赖导出时的覆盖）
- [x] 导出安全模式仅影响 `data-decorative-layer="true"` 与 `data-export-frame="true"`，不会修改文字节点样式

### 2) System / Prompt Header 视觉层级
- [x] System：图标 + 双行标签（SYSTEM/INSTRUCTION）+ 右侧小圆点指示器
- [x] Prompt：图标 + 双行标签（PROMPT/CODE）+ 右侧类别胶囊

### 3) Copy / Download 按钮交互
- [x] Copy：`data-action-button="copy"`，仅触发复制流程
- [x] Download：`data-action-button="download"`，仅触发下载流程
- [x] 导出中：两按钮 disabled，但仅当前 `exportMode` 的按钮显示 spinner 和高亮，避免“双按钮一起响应”的错觉

### 4) 导出时外框/阴影弱化
- [x] Card root 已标记 `data-export-frame="true"`，导出期间自动弱化外框与阴影
- [x] 背景渐变层已标记 `data-decorative-layer="true"`，导出期间降低不透明度/饱和度，提升文字可读性稳定性

## 备注
- Vite 构建提示 chunk > 500kB 属警告，不影响功能验收；如需可后续做代码分包优化。


