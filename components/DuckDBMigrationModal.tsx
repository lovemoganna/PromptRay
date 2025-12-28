import React, { useState } from 'react';
import { Icons } from './Icons';
import { duckDBStorage } from '../services/duckdbStorageService';
import { getPrompts, getCustomCategories, getUserTheme, getFilterState } from '../services/storageService';

interface MigrationProgress {
  stage: 'idle' | 'analyzing' | 'migrating' | 'verifying' | 'completed' | 'error';
  currentStep: number;
  totalSteps: number;
  message: string;
  error?: string;
}

interface MigrationResult {
  success: boolean;
  migratedPrompts: number;
  migratedCategories: number;
  migratedSettings: number;
  errors: string[];
  duration: number;
}

interface DuckDBMigrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onMigrationComplete?: (result: MigrationResult) => void;
}

export const DuckDBMigrationModal: React.FC<DuckDBMigrationModalProps> = ({
  isOpen,
  onClose,
  onMigrationComplete
}) => {
  const [progress, setProgress] = useState<MigrationProgress>({
    stage: 'idle',
    currentStep: 0,
    totalSteps: 5,
    message: '准备开始迁移...'
  });

  const [result, setResult] = useState<MigrationResult | null>(null);

  // 执行迁移
  const executeMigration = async () => {
    const startTime = Date.now();

    try {
      setProgress({
        stage: 'analyzing',
        currentStep: 1,
        totalSteps: 5,
        message: '分析现有数据...'
      });

      // 1. 从 IndexedDB 读取现有数据
      const legacyPrompts = getPrompts();
      const legacyCategories = getCustomCategories();
      const legacyTheme = getUserTheme();
      const legacyFilters = getFilterState();

      console.info('Legacy data analysis complete:', {
        prompts: legacyPrompts.length,
        categories: legacyCategories.length,
        hasTheme: !!legacyTheme,
        hasFilters: !!legacyFilters
      });

      setProgress({
        stage: 'migrating',
        currentStep: 2,
        totalSteps: 5,
        message: '迁移提示词数据...'
      });

      // 2. 初始化 DuckDB 存储服务
      await duckDBStorage.initialize();

      // 3. 迁移提示词数据
      for (const prompt of legacyPrompts) {
        await duckDBStorage.savePrompt(prompt);
      }

      setProgress({
        stage: 'migrating',
        currentStep: 3,
        totalSteps: 5,
        message: '迁移分类和设置...'
      });

      // 4. 迁移分类
      if (legacyCategories.length > 0) {
        await duckDBStorage.saveCustomCategories(legacyCategories);
      }

      // 5. 迁移设置
      if (legacyTheme) {
        await duckDBStorage.saveUserTheme(legacyTheme);
      }

      if (legacyFilters) {
        await duckDBStorage.saveFilterState(legacyFilters);
      }

      setProgress({
        stage: 'verifying',
        currentStep: 4,
        totalSteps: 5,
        message: '验证迁移结果...'
      });

      // 6. 验证迁移结果
      const migratedPrompts = await duckDBStorage.getPrompts();
      const migratedCategories = await duckDBStorage.getCustomCategories();

      // 验证设置迁移
      await duckDBStorage.getUserTheme();
      await duckDBStorage.getFilterState();

      const errors: string[] = [];

      if (migratedPrompts.length !== legacyPrompts.length) {
        errors.push(`提示词数量不匹配: 期望 ${legacyPrompts.length}, 实际 ${migratedPrompts.length}`);
      }

      if (migratedCategories.length !== legacyCategories.length) {
        errors.push(`分类数量不匹配: 期望 ${legacyCategories.length}, 实际 ${migratedCategories.length}`);
      }

      const duration = Date.now() - startTime;

      const migrationResult: MigrationResult = {
        success: errors.length === 0,
        migratedPrompts: migratedPrompts.length,
        migratedCategories: migratedCategories.length,
        migratedSettings: (legacyTheme ? 1 : 0) + (legacyFilters ? 1 : 0),
        errors,
        duration
      };

      setResult(migrationResult);
      setProgress({
        stage: migrationResult.success ? 'completed' : 'error',
        currentStep: 5,
        totalSteps: 5,
        message: migrationResult.success ? '迁移完成！' : '迁移完成但有错误',
        error: errors.length > 0 ? errors.join('; ') : undefined
      });

      onMigrationComplete?.(migrationResult);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '未知错误';
      setProgress({
        stage: 'error',
        currentStep: 5,
        totalSteps: 5,
        message: '迁移失败',
        error: errorMessage
      });

      setResult({
        success: false,
        migratedPrompts: 0,
        migratedCategories: 0,
        migratedSettings: 0,
        errors: [errorMessage],
        duration: Date.now() - startTime
      });
    }
  };

  // 重置模态框
  const resetModal = () => {
    setProgress({
      stage: 'idle',
      currentStep: 0,
      totalSteps: 5,
      message: '准备开始迁移...'
    });
    setResult(null);
  };

  // 开始迁移
  const startMigration = () => {
    resetModal();
    executeMigration();
  };

  // 关闭模态框
  const handleClose = () => {
    resetModal();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900 border border-white/10 rounded-theme max-w-2xl w-full max-h-[90vh] overflow-hidden">
        {/* 头部 */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-brand-500/20 rounded-lg">
              <Icons.Database size={24} className="text-brand-500" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-white">DuckDB 存储迁移</h2>
              <p className="text-sm text-gray-400">将数据从 IndexedDB 迁移到 DuckDB</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <Icons.Close size={24} />
          </button>
        </div>

        {/* 内容区域 */}
        <div className="p-6">
          {progress.stage === 'idle' && (
            <div className="space-y-4">
              <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Icons.Info size={20} className="text-blue-400 mt-0.5" />
                  <div className="space-y-2">
                    <h3 className="text-blue-300 font-semibold">迁移说明</h3>
                    <ul className="text-sm text-blue-200 space-y-1">
                      <li>• 将把所有提示词数据从 IndexedDB 迁移到 DuckDB</li>
                      <li>• 迁移完成后，数据将使用 DuckDB 进行存储和管理</li>
                      <li>• 原 IndexedDB 数据将被保留作为备份</li>
                      <li>• 迁移过程是不可逆的，请确保数据备份</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Icons.Warning size={20} className="text-yellow-400 mt-0.5" />
                  <div>
                    <h3 className="text-yellow-300 font-semibold">重要提醒</h3>
                    <p className="text-sm text-yellow-200 mt-1">
                      迁移前请确保已备份重要数据。迁移完成后无法恢复到 IndexedDB 存储方式。
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {(progress.stage === 'analyzing' || progress.stage === 'migrating' || progress.stage === 'verifying') && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-8 h-8 border-2 border-brand-500/30 border-t-brand-500 rounded-full animate-spin"></div>
                </div>
                <div>
                  <div className="text-white font-semibold">{progress.message}</div>
                  <div className="text-sm text-gray-400">
                    步骤 {progress.currentStep} / {progress.totalSteps}
                  </div>
                </div>
              </div>

              {/* 进度条 */}
              <div className="w-full bg-gray-800 rounded-full h-2">
                <div
                  className="bg-brand-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(progress.currentStep / progress.totalSteps) * 100}%` }}
                ></div>
              </div>
            </div>
          )}

          {progress.stage === 'completed' && result && (
            <div className="space-y-4">
              <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <Icons.Check size={24} className="text-green-400" />
                  <div>
                    <h3 className="text-green-300 font-semibold">迁移成功完成！</h3>
                    <p className="text-sm text-green-200 mt-1">
                      数据已成功迁移到 DuckDB 存储
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-800/50 rounded-lg p-3">
                  <div className="text-2xl font-bold text-white">{result.migratedPrompts}</div>
                  <div className="text-sm text-gray-400">提示词</div>
                </div>
                <div className="bg-gray-800/50 rounded-lg p-3">
                  <div className="text-2xl font-bold text-white">{result.migratedCategories}</div>
                  <div className="text-sm text-gray-400">分类</div>
                </div>
                <div className="bg-gray-800/50 rounded-lg p-3">
                  <div className="text-2xl font-bold text-white">{result.migratedSettings}</div>
                  <div className="text-sm text-gray-400">设置项</div>
                </div>
                <div className="bg-gray-800/50 rounded-lg p-3">
                  <div className="text-2xl font-bold text-white">{(result.duration / 1000).toFixed(1)}s</div>
                  <div className="text-sm text-gray-400">耗时</div>
                </div>
              </div>
            </div>
          )}

          {progress.stage === 'error' && (
            <div className="space-y-4">
              <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <Icons.Error size={24} className="text-red-400" />
                  <div>
                    <h3 className="text-red-300 font-semibold">迁移失败</h3>
                    <p className="text-sm text-red-200 mt-1">{progress.error}</p>
                  </div>
                </div>
              </div>

              {result && result.errors.length > 0 && (
                <div className="bg-gray-800/50 rounded-lg p-3">
                  <h4 className="text-sm font-semibold text-gray-300 mb-2">详细错误信息：</h4>
                  <ul className="text-sm text-gray-400 space-y-1">
                    {result.errors.map((error, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <span className="text-red-400">•</span>
                        <span>{error}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        {/* 底部按钮 */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-white/10">
          {progress.stage === 'idle' && (
            <>
              <button
                onClick={handleClose}
                className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
              >
                取消
              </button>
              <button
                onClick={startMigration}
                className="px-6 py-2 bg-brand-500 hover:bg-brand-600 text-white rounded-lg transition-colors"
              >
                开始迁移
              </button>
            </>
          )}

          {(progress.stage === 'completed' || progress.stage === 'error') && (
            <button
              onClick={handleClose}
              className="px-6 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
            >
              关闭
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
