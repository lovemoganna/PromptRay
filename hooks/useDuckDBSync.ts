import { useState, useEffect, useCallback, useRef } from 'react';
import { Prompt } from '../types';
import { duckDBStorage, savePromptsDuckDB } from '../services/duckdbStorageService';
import { getPrompts, savePrompts } from '../services/storageService';

// 同步状态
interface SyncState {
  isLoading: boolean;
  lastSyncAt: number | null;
  error: string | null;
}

// 数据变更事件类型
export type DataChangeEvent =
  | { type: 'PROMPT_CREATED'; payload: Prompt }
  | { type: 'PROMPT_UPDATED'; payload: Prompt }
  | { type: 'PROMPT_DELETED'; payload: { id: string } }
  | { type: 'CATEGORIES_UPDATED'; payload: string[] }
  | { type: 'THEME_UPDATED'; payload: string }
  | { type: 'FILTERS_UPDATED'; payload: any };

// 事件监听器类型
type DataChangeListener = (event: DataChangeEvent) => void;

// 全局事件系统
class DataSyncManager {
  private listeners = new Set<DataChangeListener>();
  private syncQueue: DataChangeEvent[] = [];
  private isProcessing = false;

  // 订阅数据变更
  subscribe(listener: DataChangeListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  // 发布数据变更事件
  emit(event: DataChangeEvent): void {
    // 添加到队列进行批处理
    this.syncQueue.push(event);
    this.processQueue();
  }

  // 批量处理事件队列
  private async processQueue(): Promise<void> {
    if (this.isProcessing || this.syncQueue.length === 0) return;

    this.isProcessing = true;

    try {
      // 批量处理所有待处理的事件
      const events = [...this.syncQueue];
      this.syncQueue = [];

      // 去重：相同类型的最新事件
      const latestEvents = new Map<string, DataChangeEvent>();
      events.forEach(event => {
        const key = `${event.type}_${'id' in event.payload ? event.payload.id : 'global'}`;
        latestEvents.set(key, event);
      });

      // 通知所有监听器
      latestEvents.forEach(event => {
        this.listeners.forEach(listener => {
          try {
            listener(event);
          } catch (error) {
            console.error('Error in data change listener:', error);
          }
        });
      });
    } finally {
      this.isProcessing = false;

      // 如果队列中还有新事件，继续处理
      if (this.syncQueue.length > 0) {
        setTimeout(() => this.processQueue(), 0);
      }
    }
  }

  // 清空所有监听器
  clear(): void {
    this.listeners.clear();
    this.syncQueue = [];
  }
}

// 全局同步管理器实例
export const dataSyncManager = new DataSyncManager();

/**
 * DuckDB 数据同步 Hook
 * 提供实时数据同步功能，自动监听数据变更并更新UI
 */
export function useDuckDBSync() {
  const [syncState, setSyncState] = useState<SyncState>({
    isLoading: true,
    lastSyncAt: null,
    error: null
  });

  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [userTheme, setUserTheme] = useState<string>('theme-default');
  const [filterState, setFilterState] = useState<any>(null);

  // 防抖更新引用
  const updateTimeoutRef = useRef<NodeJS.Timeout>();
  const isMountedRef = useRef(true);

  // 防抖更新函数
  const debouncedUpdate = useCallback((updater: () => Promise<void>, delay = 100) => {
    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current);
    }

    updateTimeoutRef.current = setTimeout(async () => {
      if (!isMountedRef.current) return;

      try {
        setSyncState(prev => ({ ...prev, isLoading: true, error: null }));
        await updater();
        setSyncState(prev => ({
          ...prev,
          isLoading: false,
          lastSyncAt: Date.now(),
          error: null
        }));
      } catch (error) {
        console.error('Data sync error:', error);
        setSyncState(prev => ({
          ...prev,
          isLoading: false,
          error: error instanceof Error ? error.message : 'Sync failed'
        }));
      }
    }, delay);
  }, []);

  // 同步SQL存储与主存储的数据
  const syncSQLDataWithMainStorage = useCallback(async () => {
    try {
      console.info('Syncing SQL data with main storage...');
      const mainPrompts = await getPrompts();

      // 更新SQL存储
      await savePromptsDuckDB(mainPrompts);
      console.info(`Synced ${mainPrompts.length} prompts to SQL storage`);
    } catch (error) {
      console.error('Failed to sync SQL data with main storage:', error);
      throw error;
    }
  }, []);

  // 加载所有数据
  const loadAllData = useCallback(async () => {
    try {
      const [promptsData, categoriesData, themeData, filtersData] = await Promise.all([
        duckDBStorage.getPrompts(),
        duckDBStorage.getCustomCategories(),
        duckDBStorage.getUserTheme(),
        duckDBStorage.getFilterState()
      ]);

      if (!isMountedRef.current) return;

      setPrompts(promptsData);
      setCategories(categoriesData);
      setUserTheme(themeData);
      setFilterState(filtersData);
    } catch (error) {
      console.error('Failed to load data:', error);
      throw error;
    }
  }, []);

  // 数据变更事件处理器
  const handleDataChange = useCallback((event: DataChangeEvent) => {
    switch (event.type) {
      case 'PROMPT_CREATED':
        console.info('➕ SQL Console created prompt:', event.payload.title);
        debouncedUpdate(async () => {
          // 更新主存储
          const mainPrompts = await getPrompts();
          const updatedMainPrompts = [event.payload, ...mainPrompts];
          await savePrompts(updatedMainPrompts);

          // 同步到SQL存储
          await savePromptsDuckDB(updatedMainPrompts);
          setPrompts(updatedMainPrompts);
        });
        break;

      case 'PROMPT_UPDATED':
        console.info('✏️ SQL Console updated prompt:', event.payload.title);
        debouncedUpdate(async () => {
          // 更新主存储
          const mainPrompts = await getPrompts();
          const updatedMainPrompts = mainPrompts.map(p =>
            p.id === event.payload.id ? event.payload : p
          );
          await savePrompts(updatedMainPrompts);

          // 同步到SQL存储
          await savePromptsDuckDB(updatedMainPrompts);
          setPrompts(updatedMainPrompts);
        });
        break;

      case 'PROMPT_DELETED':
        console.info('🗑️ SQL Console deleted prompt:', event.payload.id);
        debouncedUpdate(async () => {
          // 更新主存储
          const mainPrompts = await getPrompts();
          const updatedMainPrompts = mainPrompts.filter(p => p.id !== event.payload.id);
          await savePrompts(updatedMainPrompts);

          // 同步到SQL存储
          await savePromptsDuckDB(updatedMainPrompts);
          setPrompts(updatedMainPrompts);
        });
        break;

      case 'CATEGORIES_UPDATED':
        setCategories(event.payload);
        break;

      case 'THEME_UPDATED':
        setUserTheme(event.payload);
        break;

      case 'FILTERS_UPDATED':
        setFilterState(event.payload);
        break;
    }
  }, [debouncedUpdate]);

  // 初始化数据同步
  useEffect(() => {
    let unsubscribe: (() => void) | null = null;

    const initialize = async () => {
      try {
        // 初始化存储服务
        await duckDBStorage.initialize();

        // 确保SQL存储与主存储数据同步
        await syncSQLDataWithMainStorage();

        // 加载初始数据
        await loadAllData();

        // 订阅数据变更事件
        unsubscribe = dataSyncManager.subscribe(handleDataChange);

        setSyncState({
          isLoading: false,
          lastSyncAt: Date.now(),
          error: null
        });
      } catch (error) {
        console.error('Failed to initialize data sync:', error);
        setSyncState({
          isLoading: false,
          lastSyncAt: null,
          error: error instanceof Error ? error.message : 'Initialization failed'
        });
      }
    };

    initialize();

    return () => {
      isMountedRef.current = false;
      if (unsubscribe) {
        unsubscribe();
      }
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }
    };
  }, [loadAllData, handleDataChange]);

  // 数据操作方法
  const createPrompt = useCallback(async (prompt: Prompt) => {
    await duckDBStorage.savePrompt(prompt);
    dataSyncManager.emit({ type: 'PROMPT_CREATED', payload: prompt });
  }, []);

  const updatePrompt = useCallback(async (prompt: Prompt) => {
    await duckDBStorage.savePrompt(prompt);
    dataSyncManager.emit({ type: 'PROMPT_UPDATED', payload: prompt });
  }, []);

  const deletePromptById = useCallback(async (id: string) => {
    await duckDBStorage.deletePrompt(id);
    dataSyncManager.emit({ type: 'PROMPT_DELETED', payload: { id } });
  }, []);

  const updateCategories = useCallback(async (newCategories: string[]) => {
    await duckDBStorage.saveCustomCategories(newCategories);
    dataSyncManager.emit({ type: 'CATEGORIES_UPDATED', payload: newCategories });
  }, []);

  const updateTheme = useCallback(async (themeId: string) => {
    await duckDBStorage.saveUserTheme(themeId);
    dataSyncManager.emit({ type: 'THEME_UPDATED', payload: themeId });
  }, []);

  const updateFilters = useCallback(async (filters: any) => {
    await duckDBStorage.saveFilterState(filters);
    dataSyncManager.emit({ type: 'FILTERS_UPDATED', payload: filters });
  }, []);

  // 执行SQL查询
  const executeSQL = useCallback(async (sql: string, params: any[] = []) => {
    return await duckDBStorage.executeQuery(sql, params);
  }, []);

  // 初始化 SQL 控制台相关表
  const initializeSQLTables = useCallback(async () => {
    try {
      // 创建 sql_history 表
      await duckDBStorage.executeQuery(`
        CREATE TABLE IF NOT EXISTS sql_history (
          id TEXT PRIMARY KEY,
          inputType TEXT,
          inputText TEXT,
          generatedSQL TEXT,
          executedSQL TEXT,
          timestamp INTEGER,
          executionTime INTEGER,
          resultCount INTEGER,
          success INTEGER,
          error TEXT
        )
      `);

      // 创建 sql_favorites 表
      await duckDBStorage.executeQuery(`
        CREATE TABLE IF NOT EXISTS sql_favorites (
          id TEXT PRIMARY KEY,
          name TEXT,
          sqlText TEXT,
          createdAt INTEGER,
          tags TEXT
        )
      `);

      // 创建 analysis_sessions 表
      await duckDBStorage.executeQuery(`
        CREATE TABLE IF NOT EXISTS analysis_sessions (
          id TEXT PRIMARY KEY,
          fileName TEXT,
          fileType TEXT,
          aiResponse TEXT,
          createdAt INTEGER
        )
      `);

      console.log('SQL Console tables initialized successfully');
    } catch (error) {
      console.error('Failed to initialize SQL Console tables:', error);
    }
  }, []);

  // 保存 SQL 执行历史
  const saveSQLHistory = useCallback(async (history: {
    id: string;
    inputType: 'natural' | 'sql';
    inputText: string;
    generatedSQL?: string;
    executedSQL: string;
    timestamp: number;
    executionTime?: number;
    resultCount?: number;
    success: boolean;
    error?: string;
  }) => {
    try {
      await duckDBStorage.executeQuery(`
        INSERT OR REPLACE INTO sql_history
        (id, inputType, inputText, generatedSQL, executedSQL, timestamp, executionTime, resultCount, success, error)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        history.id,
        history.inputType,
        history.inputText,
        history.generatedSQL || null,
        history.executedSQL,
        history.timestamp,
        history.executionTime || null,
        history.resultCount || null,
        history.success ? 1 : 0,
        history.error || null
      ]);
    } catch (error) {
      console.error('Failed to save SQL history:', error);
    }
  }, []);

  // 保存收藏的 SQL
  const saveSQLFavorite = useCallback(async (favorite: {
    id: string;
    name: string;
    sqlText: string;
    createdAt: number;
    tags?: string[];
  }) => {
    try {
      await duckDBStorage.executeQuery(`
        INSERT OR REPLACE INTO sql_favorites
        (id, name, sqlText, createdAt, tags)
        VALUES (?, ?, ?, ?, ?)
      `, [
        favorite.id,
        favorite.name,
        favorite.sqlText,
        favorite.createdAt,
        favorite.tags ? JSON.stringify(favorite.tags) : null
      ]);
    } catch (error) {
      console.error('Failed to save SQL favorite:', error);
    }
  }, []);

  // 删除收藏的 SQL
  const deleteSQLFavorite = useCallback(async (id: string) => {
    try {
      await duckDBStorage.executeQuery('DELETE FROM sql_favorites WHERE id = ?', [id]);
    } catch (error) {
      console.error('Failed to delete SQL favorite:', error);
    }
  }, []);

  // 更新收藏的 SQL 名称
  const updateSQLFavoriteName = useCallback(async (id: string, name: string) => {
    try {
      await duckDBStorage.executeQuery('UPDATE sql_favorites SET name = ? WHERE id = ?', [name, id]);
    } catch (error) {
      console.error('Failed to update SQL favorite name:', error);
    }
  }, []);

  // 保存分析会话
  const saveAnalysisSession = useCallback(async (session: {
    id: string;
    fileName: string;
    fileType: string;
    aiResponse: string;
    createdAt: number;
  }) => {
    try {
      await duckDBStorage.executeQuery(`
        INSERT OR REPLACE INTO analysis_sessions
        (id, fileName, fileType, aiResponse, createdAt)
        VALUES (?, ?, ?, ?, ?)
      `, [
        session.id,
        session.fileName,
        session.fileType,
        session.aiResponse,
        session.createdAt
      ]);
    } catch (error) {
      console.error('Failed to save analysis session:', error);
    }
  }, []);

  // 加载 SQL 历史记录
  const loadSQLHistory = useCallback(async (): Promise<any[]> => {
    try {
      const result = await duckDBStorage.executeQuery('SELECT * FROM sql_history ORDER BY timestamp DESC LIMIT 100');
      return result || [];
    } catch (error) {
      console.error('Failed to load SQL history:', error);
      return [];
    }
  }, []);

  // 加载收藏的 SQL
  const loadSQLFavorites = useCallback(async (): Promise<any[]> => {
    try {
      const result = await duckDBStorage.executeQuery('SELECT * FROM sql_favorites ORDER BY createdAt DESC');
      return result || [];
    } catch (error) {
      console.error('Failed to load SQL favorites:', error);
      return [];
    }
  }, []);

  // 加载分析会话
  const loadAnalysisSessions = useCallback(async (): Promise<any[]> => {
    try {
      const result = await duckDBStorage.executeQuery('SELECT * FROM analysis_sessions ORDER BY createdAt DESC');
      return result || [];
    } catch (error) {
      console.error('Failed to load analysis sessions:', error);
      return [];
    }
  }, []);

  // 刷新数据
  const refresh = useCallback(async () => {
    await debouncedUpdate(loadAllData, 0);
  }, [debouncedUpdate, loadAllData]);

  return {
    // 状态
    syncState,
    prompts,
    categories,
    userTheme,
    filterState,

    // 操作方法
    createPrompt,
    updatePrompt,
    deletePromptById,
    updateCategories,
    updateTheme,
    updateFilters,
    executeSQL,
    refresh,

    // SQL 控制台相关
    initializeSQLTables,
    saveSQLHistory,
    saveSQLFavorite,
    deleteSQLFavorite,
    updateSQLFavoriteName,
    saveAnalysisSession,
    loadSQLHistory,
    loadSQLFavorites,
    loadAnalysisSessions,

    // 工具方法
    isInitialized: !syncState.isLoading && syncState.error === null,
    hasError: syncState.error !== null,
    lastSyncTime: syncState.lastSyncAt
  };
}

/**
 * 简化的同步 Hook - 只监听特定数据类型
 */
export function useDuckDBSyncSelective(dataTypes: Array<'prompts' | 'categories' | 'theme' | 'filters'> = []) {
  const { syncState, ...data } = useDuckDBSync();

  // 根据指定类型过滤数据
  const filteredData: any = {};

  if (dataTypes.includes('prompts')) {
    filteredData.prompts = data.prompts;
    filteredData.createPrompt = data.createPrompt;
    filteredData.updatePrompt = data.updatePrompt;
    filteredData.deletePromptById = data.deletePromptById;
  }

  if (dataTypes.includes('categories')) {
    filteredData.categories = data.categories;
    filteredData.updateCategories = data.updateCategories;
  }

  if (dataTypes.includes('theme')) {
    filteredData.userTheme = data.userTheme;
    filteredData.updateTheme = data.updateTheme;
  }

  if (dataTypes.includes('filters')) {
    filteredData.filterState = data.filterState;
    filteredData.updateFilters = data.updateFilters;
  }

  return {
    syncState,
    ...filteredData,
    executeSQL: data.executeSQL,
    refresh: data.refresh,
    isInitialized: data.isInitialized,
    hasError: data.hasError,
    lastSyncTime: data.lastSyncTime
  };
}
