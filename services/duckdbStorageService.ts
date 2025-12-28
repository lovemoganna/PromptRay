import { Prompt } from '../types';
import {
  initializeDuckDB,
  getAllPrompts,
  getPromptById,
  insertPrompt,
  updatePrompt,
  deletePrompt,
  executeSQL,
  getDatabaseStats,
  closeDatabase
} from './duckdbService';

// 统一的存储API，兼容现有的IndexedDB接口
export class DuckDBStorageService {
  private static instance: DuckDBStorageService;
  private isInitialized = false;

  private constructor() {}

  static getInstance(): DuckDBStorageService {
    if (!DuckDBStorageService.instance) {
      DuckDBStorageService.instance = new DuckDBStorageService();
    }
    return DuckDBStorageService.instance;
  }

  /**
   * 初始化存储服务
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      await initializeDuckDB();
      this.isInitialized = true;
      console.info('DuckDB Storage Service initialized');
    } catch (error) {
      console.error('Failed to initialize DuckDB Storage Service:', error);
      throw error;
    }
  }

  /**
   * 获取所有提示词
   */
  async getPrompts(): Promise<Prompt[]> {
    await this.ensureInitialized();
    return await getAllPrompts();
  }

  /**
   * 根据ID获取提示词
   */
  async getPromptById(id: string): Promise<Prompt | null> {
    await this.ensureInitialized();
    return await getPromptById(id);
  }

  /**
   * 保存提示词（新增或更新）
   */
  async savePrompt(prompt: Prompt): Promise<void> {
    await this.ensureInitialized();

    const existing = await getPromptById(prompt.id);
    if (existing) {
      await updatePrompt(prompt);
    } else {
      await insertPrompt(prompt);
    }
  }

  /**
   * 删除提示词
   */
  async deletePrompt(id: string): Promise<void> {
    await this.ensureInitialized();
    await deletePrompt(id);
  }

  /**
   * 获取自定义分类
   */
  async getCustomCategories(): Promise<string[]> {
    await this.ensureInitialized();

    // 从提示词中提取唯一分类
    const prompts = await getAllPrompts();
    const categories = [...new Set(prompts.map(p => p.category))];
    return categories.sort();
  }

  /**
   * 保存自定义分类（DuckDB中分类从提示词自动提取，无需单独存储）
   */
  async saveCustomCategories(_categories: string[]): Promise<void> {
    // DuckDB中分类是动态的，从提示词数据中提取
    console.info('Categories are automatically derived from prompts in DuckDB');
  }

  /**
   * 获取用户主题
   */
  async getUserTheme(): Promise<string> {
    await this.ensureInitialized();

    const result = await executeSQL(`
      SELECT value FROM settings WHERE key = 'user_theme'
    `);

    const theme = result[0]?.value;
    return theme || 'theme-default';
  }

  /**
   * 保存用户主题
   */
  async saveUserTheme(themeId: string): Promise<void> {
    await this.ensureInitialized();

    await executeSQL(`
      INSERT OR REPLACE INTO settings (key, value, updatedAt)
      VALUES ('user_theme', ?, ?)
    `, [themeId, Date.now()]);
  }

  /**
   * 获取过滤器状态
   */
  async getFilterState(): Promise<any> {
    await this.ensureInitialized();

    const result = await executeSQL(`
      SELECT value FROM settings WHERE key = 'filter_state'
    `);

    const filterData = result[0]?.value;
    if (filterData) {
      try {
        return JSON.parse(filterData);
      } catch {
        return null;
      }
    }
    return null;
  }

  /**
   * 保存过滤器状态
   */
  async saveFilterState(filters: any): Promise<void> {
    await this.ensureInitialized();

    await executeSQL(`
      INSERT OR REPLACE INTO settings (key, value, updatedAt)
      VALUES ('filter_state', ?, ?)
    `, [JSON.stringify(filters), Date.now()]);
  }

  /**
   * 执行原生SQL查询
   */
  async executeQuery(sql: string, params: any[] = []): Promise<any[]> {
    await this.ensureInitialized();
    return await executeSQL(sql, params);
  }

  /**
   * 获取数据库统计信息
   */
  async getStats(): Promise<{
    totalPrompts: number;
    favoritePrompts: number;
    categories: number;
    totalTags: number;
  }> {
    await this.ensureInitialized();
    return await getDatabaseStats();
  }

  /**
   * 导出所有数据
   */
  async exportData(): Promise<any> {
    await this.ensureInitialized();

    const prompts = await getAllPrompts();
    const _categories = await this.getCustomCategories();
    const theme = await this.getUserTheme();
    const filters = await this.getFilterState();

    // Note: categories are included for compatibility but derived from prompts

    return {
      version: '2.0.0',
      exportedAt: Date.now(),
      prompts,
      categories: _categories,
      settings: {
        theme,
        filters
      }
    };
  }

  /**
   * 导入数据
   */
  async importData(data: any): Promise<void> {
    await this.ensureInitialized();

    if (data.prompts && Array.isArray(data.prompts)) {
      for (const prompt of data.prompts) {
        await this.savePrompt(prompt);
      }
    }

    // Categories are derived from prompts, no need to import separately
    if (data.categories) {
      // Just log for compatibility
      console.info(`Categories will be derived from ${data.prompts?.length || 0} imported prompts`);
    }

    if (data.settings) {
      if (data.settings.theme) {
        await this.saveUserTheme(data.settings.theme);
      }
      if (data.settings.filters) {
        await this.saveFilterState(data.settings.filters);
      }
    }
  }

  /**
   * 清空所有数据
   */
  async clearAllData(): Promise<void> {
    await this.ensureInitialized();

    await executeSQL('DELETE FROM prompts');
    await executeSQL('DELETE FROM settings');

    console.info('All DuckDB data cleared');
  }

  /**
   * 关闭数据库连接
   */
  async close(): Promise<void> {
    await closeDatabase();
    this.isInitialized = false;
  }

  private async ensureInitialized(): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize();
    }
  }
}

// 创建全局实例
export const duckDBStorage = DuckDBStorageService.getInstance();

// 兼容性函数 - 保持与现有API的兼容性
export const getPromptsDuckDB = () => duckDBStorage.getPrompts();
export const savePromptsDuckDB = async (prompts: Prompt[]) => {
  for (const prompt of prompts) {
    await duckDBStorage.savePrompt(prompt);
  }
};
export const savePromptDuckDB = (prompt: Prompt) => duckDBStorage.savePrompt(prompt);
export const deletePromptDuckDB = (id: string) => duckDBStorage.deletePrompt(id);

export const getCustomCategoriesDuckDB = () => duckDBStorage.getCustomCategories();
export const saveCustomCategoriesDuckDB = (categories: string[]) => duckDBStorage.saveCustomCategories(categories);

export const getUserThemeDuckDB = () => duckDBStorage.getUserTheme();
export const saveUserThemeDuckDB = (themeId: string) => duckDBStorage.saveUserTheme(themeId);

export const getFilterStateDuckDB = () => duckDBStorage.getFilterState();
export const saveFilterStateDuckDB = (filters: any) => duckDBStorage.saveFilterState(filters);
