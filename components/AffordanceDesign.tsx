import React, { useState } from 'react';
import { AFFORDANCE_STYLES, ANIMATIONS } from './ui/styleTokens';
import { Icons } from './Icons';

const AffordanceDesign: React.FC = () => {
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  const toggleSelection = (itemId: string) => {
    setSelectedItems(prev =>
      prev.includes(itemId)
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

  const mockItems = [
    { id: '1', title: '创意写作提示词', type: 'content', priority: 'high' },
    { id: '2', title: '图像生成模板', type: 'media', priority: 'medium' },
    { id: '3', title: '代码生成助手', type: 'tool', priority: 'low' },
  ];

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold text-white">本体感设计演示</h1>
        <p className="text-xl text-gray-400">界面元素直观反映功能属性</p>
      </div>

      {/* 功能类型指示器 */}
      <section className="space-y-6">
        <h2 className="text-2xl font-semibold text-white">功能类型指示器</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <button className={`px-6 py-3 rounded-lg font-medium transition-all duration-200 ${AFFORDANCE_STYLES.functional.primary} ${AFFORDANCE_STYLES.interaction.clickable.hover} ${AFFORDANCE_STYLES.interaction.clickable.active}`}>
            创建新项目
          </button>

          <button className={`px-6 py-3 rounded-lg font-medium transition-all duration-200 ${AFFORDANCE_STYLES.functional.secondary} ${AFFORDANCE_STYLES.interaction.clickable.hover} ${AFFORDANCE_STYLES.interaction.clickable.active}`}>
            编辑设置
          </button>

          <button className={`px-6 py-3 rounded-lg font-medium transition-all duration-200 ${AFFORDANCE_STYLES.functional.success} ${AFFORDANCE_STYLES.interaction.clickable.hover} ${AFFORDANCE_STYLES.interaction.clickable.active}`}>
            保存更改
          </button>

          <button className={`px-6 py-3 rounded-lg font-medium transition-all duration-200 ${AFFORDANCE_STYLES.functional.danger} ${AFFORDANCE_STYLES.interaction.clickable.hover} ${AFFORDANCE_STYLES.interaction.clickable.active}`}>
            删除项目
          </button>
        </div>
      </section>

      {/* 可选择元素 */}
      <section className="space-y-6">
        <h2 className="text-2xl font-semibold text-white">可选择元素</h2>
        <div className={`p-6 rounded-lg border ${AFFORDANCE_STYLES.layout.container}`}>
          <div className="space-y-3">
            {mockItems.map((item) => (
              <div
                key={item.id}
                onClick={() => toggleSelection(item.id)}
                className={`p-4 rounded-lg border cursor-pointer transition-all duration-200 ${
                  selectedItems.includes(item.id)
                    ? AFFORDANCE_STYLES.interaction.selectable.selected
                    : 'border-white/10 hover:border-white/20'
                } ${AFFORDANCE_STYLES.interaction.selectable.hover}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={selectedItems.includes(item.id)}
                      onChange={() => {}} // Handled by parent onClick
                      className="rounded border-white/20 bg-white/10 text-blue-500 focus:ring-blue-500 focus:ring-2"
                    />
                    <div>
                      <h3 className="font-medium text-white">{item.title}</h3>
                      <p className="text-sm text-gray-400">类型: {item.type}</p>
                    </div>
                  </div>
                  <div className={`px-2 py-1 rounded text-xs font-medium ${
                    item.priority === 'high' ? 'bg-red-500/20 text-red-400' :
                    item.priority === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                    'bg-green-500/20 text-green-400'
                  }`}>
                    {item.priority === 'high' ? '高优先级' :
                     item.priority === 'medium' ? '中优先级' : '低优先级'}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {selectedItems.length > 0 && (
            <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
              <p className="text-blue-400 text-sm">
                已选择 {selectedItems.length} 个项目
              </p>
            </div>
          )}
        </div>
      </section>

      {/* 可编辑元素 */}
      <section className="space-y-6">
        <h2 className="text-2xl font-semibold text-white">可编辑元素</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              项目标题
            </label>
            <input
              type="text"
              defaultValue="创意写作提示词"
              className={`w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 transition-all duration-200 ${AFFORDANCE_STYLES.interaction.editable.base} ${AFFORDANCE_STYLES.interaction.editable.hover} ${AFFORDANCE_STYLES.interaction.editable.focus}`}
              placeholder="输入标题..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              项目描述
            </label>
            <textarea
              defaultValue="用于生成创意写作内容的AI提示词集合"
              rows={3}
              className={`w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 transition-all duration-200 resize-none ${AFFORDANCE_STYLES.interaction.editable.base} ${AFFORDANCE_STYLES.interaction.editable.hover} ${AFFORDANCE_STYLES.interaction.editable.focus}`}
              placeholder="输入描述..."
            />
          </div>
        </div>
      </section>

      {/* 可展开/折叠元素 */}
      <section className="space-y-6">
        <h2 className="text-2xl font-semibold text-white">可展开/折叠元素</h2>
        <div className={`p-6 rounded-lg border ${AFFORDANCE_STYLES.layout.container}`}>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className={`w-full flex items-center justify-between p-4 rounded-lg transition-all duration-200 ${AFFORDANCE_STYLES.interaction.clickable.base} ${AFFORDANCE_STYLES.interaction.clickable.hover} ${AFFORDANCE_STYLES.interaction.clickable.active}`}
          >
            <div className="flex items-center gap-3">
              <Icons.ChevronDown
                size={20}
                className={`text-gray-400 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
              />
              <span className="text-white font-medium">高级设置</span>
            </div>
            <span className="text-sm text-gray-400">
              {isExpanded ? '点击收起' : '点击展开'}
            </span>
          </button>

          {isExpanded && (
            <div className={`mt-4 p-4 bg-white/5 rounded-lg border border-white/10 ${ANIMATIONS.entrance.fadeIn}`}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    最大输出长度
                  </label>
                  <input
                    type="number"
                    defaultValue="2000"
                    className={`w-full px-3 py-2 bg-white/5 border border-white/10 rounded text-white ${AFFORDANCE_STYLES.interaction.editable.focus}`}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    温度参数
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="2"
                    step="0.1"
                    defaultValue="0.7"
                    className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* 数据状态指示器 */}
      <section className="space-y-6">
        <h2 className="text-2xl font-semibold text-white">数据状态指示器</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className={`p-4 rounded-lg border ${AFFORDANCE_STYLES.data.success}`}>
            <div className="flex items-center gap-3">
              <Icons.CheckCircle size={20} />
              <div>
                <div className="font-medium">同步完成</div>
                <div className="text-sm opacity-70">所有数据已同步</div>
              </div>
            </div>
          </div>

          <div className={`p-4 rounded-lg border ${AFFORDANCE_STYLES.data.warning}`}>
            <div className="flex items-center gap-3">
              <Icons.Clock size={20} />
              <div>
                <div className="font-medium">正在处理</div>
                <div className="text-sm opacity-70">请稍候...</div>
              </div>
            </div>
          </div>

          <div className={`p-4 rounded-lg border ${AFFORDANCE_STYLES.data.error}`}>
            <div className="flex items-center gap-3">
              <Icons.AlertCircle size={20} />
              <div>
                <div className="font-medium">连接失败</div>
                <div className="text-sm opacity-70">请检查网络</div>
              </div>
            </div>
          </div>

          <div className={`p-4 rounded-lg border ${AFFORDANCE_STYLES.data.empty}`}>
            <div className="flex items-center gap-3">
              <Icons.Inbox size={20} />
              <div>
                <div className="font-medium">暂无数据</div>
                <div className="text-sm opacity-70">开始创建第一个项目</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 导航和标签页 */}
      <section className="space-y-6">
        <h2 className="text-2xl font-semibold text-white">导航和标签页</h2>
        <div className={`p-1 rounded-lg border ${AFFORDANCE_STYLES.layout.container}`}>
          <div className="flex">
            {[
              { id: 'overview', label: '概览', icon: Icons.Home },
              { id: 'projects', label: '项目', icon: Icons.Folder },
              { id: 'analytics', label: '分析', icon: Icons.BarChart },
              { id: 'settings', label: '设置', icon: Icons.Settings },
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-md font-medium transition-all duration-200 ${
                    activeTab === tab.id
                      ? AFFORDANCE_STYLES.navigation.tab.active
                      : AFFORDANCE_STYLES.navigation.tab.inactive
                  }`}
                >
                  <Icon size={16} />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="p-6 bg-white/5 rounded-lg border border-white/10">
          <div className="text-center text-gray-400">
            当前激活标签页: <span className="text-white font-medium">{activeTab}</span>
          </div>
        </div>
      </section>

      {/* 优先级指示器 */}
      <section className="space-y-6">
        <h2 className="text-2xl font-semibold text-white">优先级指示器</h2>
        <div className="space-y-3">
          {[
            { priority: 'high', title: '紧急任务', desc: '需要在今天完成' },
            { priority: 'medium', title: '重要任务', desc: '本周内完成' },
            { priority: 'low', title: '普通任务', desc: '可以延后处理' },
          ].map((item, index) => (
            <div
              key={index}
              className={`p-4 rounded-lg ${AFFORDANCE_STYLES.data.priority[item.priority as keyof typeof AFFORDANCE_STYLES.data.priority]}`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-white">{item.title}</h3>
                  <p className="text-sm text-gray-400">{item.desc}</p>
                </div>
                <div className={`px-2 py-1 rounded text-xs font-medium ${
                  item.priority === 'high' ? 'bg-red-500/20 text-red-400' :
                  item.priority === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                  'bg-green-500/20 text-green-400'
                }`}>
                  {item.priority === 'high' ? '高' : item.priority === 'medium' ? '中' : '低'}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default AffordanceDesign;
