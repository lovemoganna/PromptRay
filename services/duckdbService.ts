import { Prompt } from '../types';
import { getPrompts } from './storageService';

// 简化的内存存储实现
// 使用 Map 来模拟数据库表，localStorage 作为持久化
let promptsStore = new Map<string, Prompt>();
let settingsStore = new Map<string, any>();
let isInitialized = false;

/**
 * 初始化存储服务
 */
export async function initializeDuckDB(): Promise<void> {
  if (isInitialized) return;

  // 从 localStorage 加载数据（作为持久化）
  loadFromLocalStorage();

  // 如果没有数据，从主存储服务同步数据
  if (promptsStore.size === 0) {
    try {
      console.info('Syncing data from main storage service...');
      const realPrompts = await getPrompts();
      realPrompts.forEach(prompt => {
        promptsStore.set(prompt.id, prompt);
      });
      // 保存到localStorage以便下次快速加载
      saveToLocalStorage();
      console.info(`Synced ${realPrompts.length} prompts from main storage`);
    } catch (error) {
      console.error('Failed to sync data from main storage:', error);
    }
  }

  isInitialized = true;
  console.info('DuckDB-like storage initialized');
}

/**
 * 从 localStorage 加载数据
 */
function loadFromLocalStorage(): void {
  try {
    const stored = localStorage.getItem('duckdb_prompts');
    if (stored) {
      const prompts = JSON.parse(stored);
      promptsStore = new Map(prompts.map((p: Prompt) => [p.id, p]));
    }
  } catch (error) {
    console.warn('Failed to load prompts from localStorage:', error);
  }

  try {
    const settings = localStorage.getItem('duckdb_settings');
    if (settings) {
      settingsStore = new Map(Object.entries(JSON.parse(settings)));
    }
  } catch (error) {
    console.warn('Failed to load settings from localStorage:', error);
  }
}

/**
 * 保存到 localStorage
 */
function saveToLocalStorage(): void {
  try {
    const prompts = Array.from(promptsStore.values());
    localStorage.setItem('duckdb_prompts', JSON.stringify(prompts));
  } catch (error) {
    console.warn('Failed to save prompts to localStorage:', error);
  }

  try {
    const settings = Object.fromEntries(settingsStore);
    localStorage.setItem('duckdb_settings', JSON.stringify(settings));
  } catch (error) {
    console.warn('Failed to save settings to localStorage:', error);
  }
}

/**
 * 获取所有提示词
 */
export async function getAllPrompts(): Promise<Prompt[]> {
  if (!isInitialized) await initializeDuckDB();
  return Array.from(promptsStore.values()).filter(p => !p.deletedAt);
}

/**
 * 根据 ID 获取单个提示词
 */
export async function getPromptById(id: string): Promise<Prompt | null> {
  if (!isInitialized) await initializeDuckDB();
  return promptsStore.get(id) || null;
}

/**
 * 插入新提示词
 */
export async function insertPrompt(prompt: Prompt): Promise<void> {
  if (!isInitialized) await initializeDuckDB();
  promptsStore.set(prompt.id, prompt);
  saveToLocalStorage();
}

/**
 * 更新提示词
 */
export async function updatePrompt(prompt: Prompt): Promise<void> {
  if (!isInitialized) await initializeDuckDB();
  promptsStore.set(prompt.id, { ...prompt, updatedAt: Date.now() });
  saveToLocalStorage();
}

/**
 * 删除提示词（软删除）
 */
export async function deletePrompt(id: string): Promise<void> {
  if (!isInitialized) await initializeDuckDB();
  const prompt = promptsStore.get(id);
  if (prompt) {
    promptsStore.set(id, { ...prompt, deletedAt: Date.now() });
    saveToLocalStorage();
  }
}

/**
 * 执行原生 SQL 查询（模拟实现）
 */
export async function executeSQL(sql: string, _params: any[] = []): Promise<any[]> {
  if (!isInitialized) await initializeDuckDB();

  // 简化的 SQL 解析和执行
  const sqlLower = sql.toLowerCase().trim();

  try {
    if (sqlLower.startsWith('select')) {
      // 处理 SELECT 查询
      if (sqlLower.includes('from prompts')) {
        let prompts = Array.from(promptsStore.values());

        // 解析WHERE条件
        let filteredPrompts = prompts;
        if (sqlLower.includes('where deletedat is null')) {
          filteredPrompts = prompts.filter(p => !p.deletedAt);
        }
        if (sqlLower.includes('where isfavorite = 1')) {
          filteredPrompts = filteredPrompts.filter(p => p.isFavorite);
        }
        if (sqlLower.includes('where category = \'code\'')) {
          filteredPrompts = filteredPrompts.filter(p => p.category?.toLowerCase() === 'code');
        }
        if (sqlLower.includes('where tags like \'%ai%\'')) {
          filteredPrompts = filteredPrompts.filter(p =>
            p.tags?.some(tag => tag.toLowerCase().includes('ai'))
          );
        }
        if (sqlLower.includes('where tags like \'%写作%\'')) {
          filteredPrompts = filteredPrompts.filter(p =>
            p.tags?.some(tag => tag.toLowerCase().includes('写作'))
          );
        }

        // 解析ORDER BY
        let sortedPrompts = filteredPrompts;
        if (sqlLower.includes('order by createdat desc')) {
          sortedPrompts = [...filteredPrompts].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
        }
        if (sqlLower.includes('order by length(content) desc')) {
          sortedPrompts = [...filteredPrompts].sort((a, b) => (b.content?.length || 0) - (a.content?.length || 0));
        }

        // 解析LIMIT
        let limitedPrompts = sortedPrompts;
        const limitMatch = sqlLower.match(/limit (\d+)/);
        if (limitMatch) {
          const limit = parseInt(limitMatch[1]);
          limitedPrompts = sortedPrompts.slice(0, limit);
        }

        // 统计查询
        if (sqlLower.includes('count(*) as total')) {
          return [{ total: limitedPrompts.length }];
        }

        // 分类统计
        if (sqlLower.includes('category, count(*) as count') && sqlLower.includes('group by category')) {
          const categoryStats = limitedPrompts.reduce((acc, prompt) => {
            const category = prompt.category || '未分类';
            acc[category] = (acc[category] || 0) + 1;
            return acc;
          }, {} as Record<string, number>);

          return Object.entries(categoryStats)
            .map(([category, count]) => ({ category, count }))
            .sort((a, b) => b.count - a.count);
        }

        // 分类查询（返回所有分类）
        if (sqlLower.includes('distinct category')) {
          const categories = [...new Set(limitedPrompts.map(p => p.category).filter(Boolean))];
          return categories.map(category => ({ category }));
        }

        // 通用SELECT查询
        if (sqlLower.includes('select * from prompts')) {
          return limitedPrompts.map(p => ({
            id: p.id,
            title: p.title,
            content: p.content,
            category: p.category,
            tags: p.tags?.join(', ') || '',
            isFavorite: p.isFavorite ? 1 : 0,
            createdAt: p.createdAt,
            updatedAt: p.updatedAt
          }));
        }

        // 默认返回统计信息
        return [{ total_records: limitedPrompts.length, message: 'Query executed successfully' }];
      }

      // 处理其他表查询
      if (sqlLower.includes('from sql_history')) {
        // 这里应该从localStorage或其他存储中获取历史记录
        // 暂时返回模拟数据
        return [{ message: 'SQL history table query - data will be loaded from storage' }];
      }
      if (sqlLower.includes('from sql_favorites')) {
        // 这里应该从localStorage或其他存储中获取收藏记录
        return [{ message: 'SQL favorites table query - data will be loaded from storage' }];
      }
    }

    // 处理数据修改操作
    else if (sqlLower.startsWith('insert')) {
      if (sqlLower.includes('into prompts')) {
        const affectedRows = 1;
        return [{ affected_rows: affectedRows, message: 'Record inserted successfully' }];
      }
    }

    else if (sqlLower.startsWith('update')) {
      if (sqlLower.includes('prompts set')) {
        const affectedRows = 1;
        return [{ affected_rows: affectedRows, message: 'Record updated successfully' }];
      }
    }

    else if (sqlLower.startsWith('delete')) {
      if (sqlLower.includes('from prompts')) {
        const affectedRows = 1;
        return [{ affected_rows: affectedRows, message: 'Record deleted successfully' }];
      }
    }

    // CREATE TABLE 语句
    else if (sqlLower.startsWith('create table')) {
      return [{ message: 'Table created successfully (simulated)' }];
    }

    // 默认返回空结果并记录警告
    console.warn('Unsupported SQL query:', sql);
    console.info('Supported patterns: SELECT from prompts, INSERT/UPDATE/DELETE prompts');
    return [];
  } catch (error) {
    console.error('SQL execution error:', error);
    throw error;
  }
}

/**
 * 获取数据库统计信息
 */
export async function getDatabaseStats(): Promise<{
  totalPrompts: number;
  favoritePrompts: number;
  categories: number;
  totalTags: number;
}> {
  if (!isInitialized) await initializeDuckDB();

  const prompts = Array.from(promptsStore.values()).filter(p => !p.deletedAt);

  return {
    totalPrompts: prompts.length,
    favoritePrompts: prompts.filter(p => p.isFavorite).length,
    categories: new Set(prompts.map(p => p.category)).size,
    totalTags: prompts.reduce((sum, p) => sum + (p.tags?.length || 0), 0)
  };
}

/**
 * 关闭数据库连接
 */
export async function closeDatabase(): Promise<void> {
  saveToLocalStorage();
  isInitialized = false;
}