import React from 'react';
import { Prompt, PromptVersion } from '../../types';
import { Icons } from '../Icons';

interface PromptHistoryTabProps {
  initialData: Prompt;
  getTokenCount: (text: string) => number;
  onRestoreVersion: (version: PromptVersion) => void;
}

export const PromptHistoryTab: React.FC<PromptHistoryTabProps> = ({
  initialData,
  getTokenCount,
  onRestoreVersion,
}) => {
  return (
    <div className="space-y-6 w-full animate-slide-up-fade">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-gray-200 flex items-center gap-2">
          <Icons.History size={18} className="text-brand-500" /> Version History
        </h3>
        <span className="text-xs text-gray-500">Last 10 changes</span>
      </div>

      {!initialData.history || initialData.history.length === 0 ? (
        <div className="text-center py-12 border border-dashed border-white/10 rounded-theme bg-white/5">
          <Icons.History size={24} className="mx-auto text-gray-600 mb-2" />
          <p className="text-sm text-gray-500">No history available yet.</p>
          <p className="text-xs text-gray-600 mt-1">Versions are saved automatically when you edit.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {initialData.history.map((version, i) => (
            <div
              key={i}
              className="bg-gray-900/40 border border-white/5 rounded-theme p-4 flex items-center justify-between hover:border-brand-500/20 transition-all"
            >
              <div className="flex items-start gap-4">
                <div className="p-2 bg-white/5 rounded-full text-gray-400">
                  <Icons.History size={16} />
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-200">
                    {new Date(version.timestamp).toLocaleString()}
                  </div>
                  <div className="text-xs text-gray-500 font-mono mt-1">
                    {version.title} • {getTokenCount(version.content)} tokens
                  </div>
                  {version.examples && version.examples.length > 0 && (
                    <div className="text-[10px] text-gray-600 mt-1 flex items-center gap-1">
                      <Icons.List size={14} /> {version.examples.length} examples
                    </div>
                  )}
                </div>
              </div>
              <button
                onClick={() => onRestoreVersion(version)}
                className="flex items-center gap-2 px-3 py-1.5 text-xs font-bold text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 rounded border border-white/5 transition-colors"
              >
                <Icons.Restore size={14} /> Restore
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};


