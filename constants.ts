export const STANDARD_CATEGORIES = ['All', 'Code', 'Writing', 'Ideas', 'Analysis', 'Fun', 'Misc'] as const;

export type StandardCategory = (typeof STANDARD_CATEGORIES)[number];

export const SPECIAL_CATEGORY_TRASH = 'Trash';

export const PAGE_SIZE = 60;

export type PromptView = 'grid' | 'dashboard' | 'list' | 'table';

export type SortBy = 'createdAt' | 'title' | 'category';

export type SortOrder = 'asc' | 'desc';


