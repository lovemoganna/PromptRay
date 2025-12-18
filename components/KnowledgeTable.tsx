import React from 'react';
import { Prompt } from '../types';
import { Icons } from './Icons';

interface KnowledgeTableProps {
  prompts: Prompt[];
  onOpenPrompt: (prompt: Prompt) => void;
}

const KnowledgeTableComponent: React.FC<KnowledgeTableProps> = ({ prompts, onOpenPrompt }) => {
  if (prompts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-gray-500 animate-slide-up-fade">
        <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
          <Icons.Table size={24} className="opacity-40" />
        </div>
        <p className="text-lg font-medium text-gray-400">No prompts in knowledge table yet</p>
      </div>
    );
  }

  const formatDate = (ts?: number) =>
    ts ? new Date(ts).toLocaleDateString() : '-';

  return (
    <div className="w-full pb-20 animate-slide-up-fade">
      <div className="overflow-x-auto rounded-theme border border-white/5 bg-gray-900/40 backdrop-blur-sm">
        <table className="w-full text-left border-collapse text-xs md:text-sm">
          <thead>
            <tr className="border-b border-white/5 bg-white/5 text-[10px] uppercase font-bold text-gray-500 tracking-wider">
              <th className="px-4 py-3 min-w-[180px]">Title</th>
              <th className="px-4 py-3 min-w-[220px]">English Prompt</th>
              <th className="px-4 py-3 min-w-[220px]">中文提示词</th>
              <th className="px-4 py-3 min-w-[80px]">Output</th>
              <th className="px-4 py-3 min-w-[120px]">应用场景</th>
              <th className="px-4 py-3 min-w-[140px]">模型</th>
              <th className="px-4 py-3 min-w-[140px] hidden lg:table-cell">技术标签</th>
              <th className="px-4 py-3 min-w-[140px] hidden lg:table-cell">风格标签</th>
              <th className="px-4 py-3 min-w-[140px]" title="收藏时间">Collected</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {prompts.map((p) => (
              <tr
                key={p.id}
                onClick={() => onOpenPrompt(p)}
                className="group hover:bg-white/5 cursor-pointer"
              >
                <td className="px-4 py-3 align-top">
                  <div className="flex flex-col gap-1 max-w-xs">
                    <span className="font-medium text-gray-100 truncate">{p.title}</span>
                    <span className="text-[10px] text-gray-500 font-mono truncate">
                      {p.category} · {p.status || 'active'}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3 align-top">
                  <div className="text-[11px] text-gray-300 font-mono line-clamp-3 whitespace-pre-wrap">
                    {p.englishPrompt || p.content}
                  </div>
                </td>
                <td className="px-4 py-3 align-top">
                  <div className="text-[11px] text-gray-300 line-clamp-3 whitespace-pre-wrap">
                    {p.chinesePrompt || '-'}
                  </div>
                </td>
                <td className="px-4 py-3 align-top">
                  <span className="inline-flex items-center gap-1 text-[11px] text-gray-300">
                    {p.outputType ? p.outputType.toUpperCase() : '-'}
                  </span>
                </td>
                <td className="px-4 py-3 align-top">
                  <span className="inline-flex items-center gap-1 text-[11px] text-gray-300">
                    {p.applicationScene || '-'}
                  </span>
                </td>
                <td className="px-4 py-3 align-top">
                  <div className="flex flex-col gap-0.5 text-[11px] text-gray-300">
                    {(p.recommendedModels || []).slice(0, 2).map((m) => (
                      <span key={m} className="truncate">
                        {m}
                      </span>
                    ))}
                    {p.recommendedModels && p.recommendedModels.length > 2 && (
                      <span className="text-[10px] text-gray-500">
                        +{p.recommendedModels.length - 2} more
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3 align-top hidden lg:table-cell">
                  <div className="flex flex-wrap gap-1 max-w-[180px]">
                    {(p.technicalTags || []).slice(0, 3).map((t) => (
                      <span
                        key={t}
                        className="px-1.5 py-0.5 rounded-full bg-white/5 text-[10px] text-gray-300"
                      >
                        {t}
                      </span>
                    ))}
                    {p.technicalTags && p.technicalTags.length > 3 && (
                      <span className="text-[10px] text-gray-500">
                        +{p.technicalTags.length - 3}
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3 align-top hidden lg:table-cell">
                  <div className="flex flex-wrap gap-1 max-w-[180px]">
                    {(p.styleTags || []).slice(0, 3).map((t) => (
                      <span
                        key={t}
                        className="px-1.5 py-0.5 rounded-full bg-white/5 text-[10px] text-gray-300"
                      >
                        {t}
                      </span>
                    ))}
                    {p.styleTags && p.styleTags.length > 3 && (
                      <span className="text[10px] text-gray-500">
                        +{p.styleTags.length - 3}
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3 align-top">
                  <div className="flex flex-col gap-0.5 text-[10px] text-gray-500 font-mono">
                    <span>Collected: {formatDate(p.collectedAt)}</span>
                    <span>Updated: {formatDate(p.updatedAt || p.createdAt)}</span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export const KnowledgeTable = React.memo(KnowledgeTableComponent);


