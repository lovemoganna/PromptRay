import React, { useMemo } from 'react';
import { Prompt } from '../types';
import { Icons } from './Icons';

interface DataVisualizationProps {
  prompts: Prompt[];
  isOpen: boolean;
  onClose: () => void;
}

// Simple bar chart component
const BarChart: React.FC<{
  data: Array<{ label: string; value: number; color: string }>;
  title: string;
}> = ({ data, title }) => {
  const maxValue = Math.max(...data.map(d => d.value));

  return (
    <div className="bg-white/5 rounded-lg p-4">
      <h3 className="text-lg font-semibold text-white mb-4">{title}</h3>
      <div className="space-y-3">
        {data.map((item, index) => (
          <div key={index} className="flex items-center gap-3">
            <div className="w-24 text-sm text-gray-300 truncate">{item.label}</div>
            <div className="flex-1 bg-white/10 rounded-full h-6 relative overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500 ease-out"
                style={{
                  width: `${maxValue > 0 ? (item.value / maxValue) * 100 : 0}%`,
                  backgroundColor: item.color
                }}
              />
            </div>
            <div className="w-12 text-sm text-gray-400 text-right">{item.value}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Simple pie chart component using SVG
const PieChart: React.FC<{
  data: Array<{ label: string; value: number; color: string }>;
  title: string;
}> = ({ data, title }) => {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  const radius = 60;
  const center = radius + 10;

  let currentAngle = -Math.PI / 2; // Start from top

  return (
    <div className="bg-white/5 rounded-lg p-4">
      <h3 className="text-lg font-semibold text-white mb-4">{title}</h3>
      <div className="flex items-center gap-6">
        <svg width={center * 2} height={center * 2} className="flex-shrink-0">
          {data.map((item, index) => {
            const percentage = item.value / total;
            const angle = percentage * 2 * Math.PI;
            const startAngle = currentAngle;
            const endAngle = currentAngle + angle;

            const x1 = center + radius * Math.cos(startAngle);
            const y1 = center + radius * Math.sin(startAngle);
            const x2 = center + radius * Math.cos(endAngle);
            const y2 = center + radius * Math.sin(endAngle);

            const largeArcFlag = angle > Math.PI ? 1 : 0;

            const pathData = [
              `M ${center} ${center}`,
              `L ${x1} ${y1}`,
              `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
              'Z'
            ].join(' ');

            currentAngle = endAngle;

            return (
              <path
                key={index}
                d={pathData}
                fill={item.color}
                stroke="rgba(255,255,255,0.1)"
                strokeWidth="1"
                className="transition-all duration-300 hover:opacity-80"
              />
            );
          })}
          {/* Center circle for donut effect */}
          <circle
            cx={center}
            cy={center}
            r={radius * 0.6}
            fill="rgba(0,0,0,0.5)"
          />
        </svg>

        <div className="flex-1 space-y-2">
          {data.map((item, index) => (
            <div key={index} className="flex items-center gap-3">
              <div
                className="w-4 h-4 rounded"
                style={{ backgroundColor: item.color }}
              />
              <span className="text-sm text-gray-300 flex-1">{item.label}</span>
              <span className="text-sm text-gray-400">
                {item.value} ({((item.value / total) * 100).toFixed(1)}%)
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Timeline chart component
const TimelineChart: React.FC<{
  data: Array<{ date: string; count: number }>;
  title: string;
}> = ({ data, title }) => {
  const maxCount = Math.max(...data.map(d => d.count));

  return (
    <div className="bg-white/5 rounded-lg p-4">
      <h3 className="text-lg font-semibold text-white mb-4">{title}</h3>
      <div className="space-y-2">
        {data.map((item, index) => (
          <div key={index} className="flex items-center gap-3">
            <div className="w-20 text-sm text-gray-400">{item.date}</div>
            <div className="flex-1 bg-white/10 rounded-full h-4 relative overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all duration-500 ease-out"
                style={{
                  width: `${maxCount > 0 ? (item.count / maxCount) * 100 : 0}%`
                }}
              />
            </div>
            <div className="w-8 text-sm text-gray-400 text-right">{item.count}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Tag cloud component
const TagCloud: React.FC<{
  tags: Array<{ tag: string; count: number }>;
  title: string;
}> = ({ tags, title }) => {
  const maxCount = Math.max(...tags.map(t => t.count));
  const minCount = Math.min(...tags.map(t => t.count));

  const getFontSize = (count: number) => {
    if (maxCount === minCount) return 14;
    const ratio = (count - minCount) / (maxCount - minCount);
    return 12 + ratio * 8; // 12px to 20px
  };

  const getOpacity = (count: number) => {
    if (maxCount === minCount) return 0.8;
    const ratio = (count - minCount) / (maxCount - minCount);
    return 0.5 + ratio * 0.5; // 0.5 to 1.0
  };

  return (
    <div className="bg-white/5 rounded-lg p-4">
      <h3 className="text-lg font-semibold text-white mb-4">{title}</h3>
      <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto">
        {tags.map((item, index) => (
          <span
            key={index}
            className="inline-block px-3 py-1 bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-white/10 rounded-full text-white hover:bg-white/10 transition-colors cursor-pointer"
            style={{
              fontSize: `${getFontSize(item.count)}px`,
              opacity: getOpacity(item.count)
            }}
          >
            {item.tag} ({item.count})
          </span>
        ))}
      </div>
    </div>
  );
};

const DataVisualization: React.FC<DataVisualizationProps> = ({
  prompts,
  isOpen,
  onClose
}) => {
  const stats = useMemo(() => {
    // Category distribution
    const categoryStats: Record<string, number> = {};
    prompts.forEach(prompt => {
      if (!prompt.deletedAt) {
        categoryStats[prompt.category] = (categoryStats[prompt.category] || 0) + 1;
      }
    });

    // Output type distribution
    const outputTypeStats: Record<string, number> = {};
    prompts.forEach(prompt => {
      if (!prompt.deletedAt && prompt.outputType) {
        outputTypeStats[prompt.outputType] = (outputTypeStats[prompt.outputType] || 0) + 1;
      }
    });

    // Application scene distribution
    const sceneStats: Record<string, number> = {};
    prompts.forEach(prompt => {
      if (!prompt.deletedAt && prompt.applicationScene) {
        sceneStats[prompt.applicationScene] = (sceneStats[prompt.applicationScene] || 0) + 1;
      }
    });

    // Tag statistics
    const tagStats: Record<string, number> = {};
    prompts.forEach(prompt => {
      if (!prompt.deletedAt) {
        prompt.tags.forEach(tag => {
          tagStats[tag] = (tagStats[tag] || 0) + 1;
        });
      }
    });

    // Creation timeline (last 30 days)
    const now = new Date();
    const timelineData = [];
    for (let i = 29; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const dateStr = date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });

      const count = prompts.filter(prompt => {
        if (prompt.deletedAt) return false;
        const promptDate = new Date(prompt.createdAt);
        return promptDate.toDateString() === date.toDateString();
      }).length;

      timelineData.push({ date: dateStr, count });
    }

    // Favorite statistics
    const favoriteCount = prompts.filter(p => !p.deletedAt && p.isFavorite).length;

    // Model usage statistics
    const modelStats: Record<string, number> = {};
    prompts.forEach(prompt => {
      if (!prompt.deletedAt && prompt.config?.model) {
        const model = prompt.config.model;
        modelStats[model] = (modelStats[model] || 0) + 1;
      }
    });

    return {
      categoryStats,
      outputTypeStats,
      sceneStats,
      tagStats,
      timelineData,
      favoriteCount,
      modelStats,
      totalPrompts: prompts.filter(p => !p.deletedAt).length
    };
  }, [prompts]);

  // Prepare chart data
  const categoryChartData = Object.entries(stats.categoryStats)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 8)
    .map(([label, value], index) => ({
      label,
      value,
      color: `hsl(${index * 45}, 70%, 60%)`
    }));

  const outputTypeChartData = Object.entries(stats.outputTypeStats)
    .sort(([,a], [,b]) => b - a)
    .map(([label, value], index) => ({
      label,
      value,
      color: `hsl(${index * 60 + 120}, 70%, 60%)`
    }));

  const modelChartData = Object.entries(stats.modelStats)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 6)
    .map(([label, value], index) => ({
      label: label.length > 15 ? label.substring(0, 15) + '...' : label,
      value,
      color: `hsl(${index * 50 + 180}, 70%, 60%)`
    }));

  const topTags = Object.entries(stats.tagStats)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 20)
    .map(([tag, count]) => ({ tag, count }));

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-7xl h-[90vh] bg-gray-900/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-white/5 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white">数据可视化面板</h2>
            <p className="text-gray-400 mt-1">深入了解您的提示词数据统计</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <Icons.Close size={24} />
          </button>
        </div>

        {/* Stats Overview */}
        <div className="p-6 border-b border-white/5">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white/5 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-blue-400">{stats.totalPrompts}</div>
              <div className="text-sm text-gray-400">总提示词数</div>
            </div>
            <div className="bg-white/5 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-green-400">{stats.favoriteCount}</div>
              <div className="text-sm text-gray-400">收藏数</div>
            </div>
            <div className="bg-white/5 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-purple-400">{Object.keys(stats.categoryStats).length}</div>
              <div className="text-sm text-gray-400">分类数</div>
            </div>
            <div className="bg-white/5 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-orange-400">{Object.keys(stats.tagStats).length}</div>
              <div className="text-sm text-gray-400">标签数</div>
            </div>
          </div>
        </div>

        {/* Charts Grid */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Category Distribution */}
            <BarChart
              data={categoryChartData}
              title="分类分布"
            />

            {/* Output Type Distribution */}
            {outputTypeChartData.length > 0 && (
              <PieChart
                data={outputTypeChartData}
                title="输出类型分布"
              />
            )}

            {/* Model Usage */}
            {modelChartData.length > 0 && (
              <BarChart
                data={modelChartData}
                title="模型使用情况"
              />
            )}

            {/* Creation Timeline */}
            <TimelineChart
              data={stats.timelineData}
              title="最近30天创建趋势"
            />

            {/* Top Tags */}
            {topTags.length > 0 && (
              <TagCloud
                tags={topTags}
                title="热门标签"
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DataVisualization;
