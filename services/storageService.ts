import { Prompt, Category } from '../types';

const STORAGE_KEY = 'prompts_data_v1';
const CATEGORIES_KEY = 'prompts_categories_v1';
const THEME_KEY = 'prompts_theme_v1';

const SEED_DATA: Prompt[] = [
  {
    id: '1',
    title: '代码重构专家',
    description: '扮演资深架构师，优化代码的可读性与性能。',
    content: '你是一位拥有10年经验的资深软件架构师。请审查以下代码，重点关注代码的**可读性**、**性能**以及是否符合**最佳实践**。如果发现潜在Bug，请指出并修复。\n\n代码:\n{code}',
    category: 'Code',
    tags: ['重构', 'Debug', 'Clean Code'],
    isFavorite: true,
    createdAt: Date.now()
  },
  {
    id: '2',
    title: '小红书爆款文案',
    description: '生成吸引眼球的小红书风格种草文案。',
    content: '你是一位小红书爆款文案写手。请为主题 {topic} 写一篇种草笔记。\n\n要求：\n1. 标题要足够吸引人，多使用Emoji。\n2. 正文采用“痛点+解决方案+效果展示”的结构。\n3. 语气亲切、活泼，像闺蜜聊天。\n4. 结尾加上相关标签。',
    category: 'Writing',
    tags: ['社交媒体', '营销', '文案'],
    isFavorite: true,
    createdAt: Date.now() - 10000
  },
  {
    id: '3',
    title: 'Git Commit 生成器',
    description: '根据 Diff 内容生成符合规范的提交信息。',
    content: '分析以下的 git diff 内容，并根据 Conventional Commits 规范生成 3 个 commit message 选项。\n\nDiff 内容:\n{diff}',
    category: 'Code',
    tags: ['Git', '生产力'],
    isFavorite: false,
    createdAt: Date.now() - 20000
  },
  {
    id: '4',
    title: '复杂概念通俗解释',
    description: '用简单的类比向外行解释复杂的概念。',
    content: '请用通俗易懂的语言，配合生活中的类比，向一个完全没有背景知识的小学生解释以下概念：\n\n概念：{concept}',
    category: 'Ideas',
    tags: ['学习', '解释'],
    isFavorite: false,
    createdAt: Date.now() - 30000
  },
  {
    id: '5',
    title: '中英互译专家',
    description: '地道、信达雅的中英文互译。',
    content: '你是一位精通中英文的专业翻译家。请将以下文本翻译成{target_language}。\n\n要求：不要逐字翻译，要意译，确保语气和语境符合目标语言的习惯，追求“信达雅”。\n\n文本：\n{text}',
    category: 'Writing',
    tags: ['翻译', '语言'],
    isFavorite: true,
    createdAt: Date.now() - 40000
  },
  {
    id: '6',
    title: 'SWOT 分析助手',
    description: '对商业创意或产品进行 SWOT 分析。',
    content: '请对 {product_or_idea} 进行详细的 SWOT 分析（优势、劣势、机会、威胁）。\n\n分析后，请给出 3 条具体的战略建议。',
    category: 'Analysis',
    tags: ['商业', '策略'],
    isFavorite: false,
    createdAt: Date.now() - 50000
  }
];

export const getPrompts = (): Prompt[] => {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(SEED_DATA));
    return SEED_DATA;
  }
  try {
    return JSON.parse(stored);
  } catch (e) {
    console.error("Failed to parse prompts", e);
    return [];
  }
};

export const savePrompts = (prompts: Prompt[]) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(prompts));
};

export const getCustomCategories = (): string[] => {
    const stored = localStorage.getItem(CATEGORIES_KEY);
    if (!stored) return [];
    try {
        return JSON.parse(stored);
    } catch (e) {
        return [];
    }
};

export const saveCustomCategories = (categories: string[]) => {
    localStorage.setItem(CATEGORIES_KEY, JSON.stringify(categories));
};

export const getUserTheme = (): string => {
    return localStorage.getItem(THEME_KEY) || 'default';
};

export const saveUserTheme = (themeId: string) => {
    localStorage.setItem(THEME_KEY, themeId);
};