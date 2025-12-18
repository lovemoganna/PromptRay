# 共识文档 - PromptRay 视觉与导出改造

## 目标（最终要达成的可见结果）
- 预览大卡片（`AestheticCard`）整体风格：深色背景 + 上深下浅蓝绿渐变；有节奏的装饰渐变，但不抢文字；信息层次清晰（标题 / System / Prompt / Category）。
- 标题：`h1 > span.bg-clip-text.text-transparent.bg-gradient-to-r` 在屏幕与导出图片中始终为“主题渐变文字”，禁止导出时变白/变灰/模糊。
- System / Prompt 头部：有设计细节（图标 + 双行标签 + 右侧圆点或胶囊 + 细分割线/微光），一眼区分 System 与 Prompt。
- Copy/Download 交互：只触发对应行为；loading 与禁用状态明确区分，不产生“两个一起响应”的错觉。
- 导出图片：构图与屏幕一致；文字始终高对比清晰；装饰可减弱但不得遮挡文字；导出时外框/阴影弱化。

## 技术实现约束
- 继续使用 `html2canvas` 进行导出。
- 导出期间只允许调整背景/装饰层/外框（通过 `data-exporting="true"` + 选择器控制），不得改变文字颜色、不得给文字加模糊/遮罩。
- 不大幅改布局，不做缩放/裁切核心内容。

## 验收清单（可测试）
- 标题渐变：在导出图片里与屏幕一致，且不被任何导出安全样式覆盖。
- System/Prompt 头部：符合“图标 + 双行标签 + 右侧点/胶囊”的结构，并与主题色一致。
- Copy/Download：点击各自按钮，只有对应按钮进入 loading；另一个仅禁用灰掉不显示 loading。
- 导出安全模式：仅弱化装饰层（`data-decorative-layer="true"`）与外框层（`data-export-frame="true"`），不影响正文/标题清晰度。


