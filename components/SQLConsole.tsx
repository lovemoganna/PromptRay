import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Highlight, themes } from 'prism-react-renderer';
import { Icons } from './Icons';
import { useDuckDBSync } from '../hooks/useDuckDBSync';
import { FOUNDATION, LAYOUT, colors } from './ui/styleTokens';

// 类型定义
type TabType = 'analysis' | 'workbench' | 'history';

// SQL 查询历史类型
interface SQLHistoryItem {
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
}

// 查询结果类型
interface QueryResult {
  columns: string[];
  rows: any[][];
  executionTime: number;
  rowCount: number;
}

// 收藏的SQL类型
interface FavoriteSQL {
  id: string;
  name: string;
  sqlText: string;
  createdAt: number;
  tags?: string[];
}

interface SQLConsoleProps {
  className?: string;
  onClose?: () => void;
}

// 历史与收藏Tab组件
const HistoryAndFavoritesTab: React.FC<{
  history: SQLHistoryItem[];
  favorites: FavoriteSQL[];
  onExecuteQuery: (sql: string) => void;
  onSwitchToWorkbench: () => void;
  onAddToFavorites: (sql: string, name?: string) => void;
  onDeleteFavorite: (id: string) => void;
}> = ({
  history,
  favorites,
  onExecuteQuery,
  onSwitchToWorkbench,
  onAddToFavorites,
  onDeleteFavorite
}) => {
  // Tab切换状态
  const [activeSubTab, setActiveSubTab] = useState<'history' | 'favorites'>('history');

  return (
    <div className="h-full flex flex-col">
      {/* 子Tab导航 */}
      <div className="bg-gray-900/60 border-b border-white/5 flex-shrink-0">
        <div className="flex">
          {[
            { id: 'history' as const, label: '执行历史', icon: Icons.History },
            { id: 'favorites' as const, label: 'SQL收藏', icon: Icons.Star }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-2 py-3 px-3 text-sm font-medium transition-all duration-200 border-b-2 ${
                activeSubTab === tab.id
                  ? 'text-white bg-brand-500/20 border-brand-500 shadow-sm'
                  : 'text-gray-400 hover:text-white hover:bg-white/5 border-transparent'
              }`}
            >
              <tab.icon size={16} />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* 内容区域 */}
      <div className="flex-1 overflow-auto p-4">
        {activeSubTab === 'history' && (
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-white mb-4">执行历史</h3>
            {history.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                <Icons.History size={48} className="text-gray-600 mx-auto mb-4" />
                <div className="text-lg font-medium mb-2">暂无执行历史</div>
                <div className="text-sm">执行 SQL 查询后将显示在这里</div>
              </div>
            ) : (
              <div className="space-y-2">
                {history.slice(0, 20).map((item, index) => (
                  <div key={index} className="bg-gray-800/50 border border-white/10 rounded-lg p-3 hover:bg-gray-700/50 transition-all duration-200">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-white truncate mb-1">{item.executedSQL.substring(0, 80)}...</div>
                        <div className="text-xs text-gray-400">
                          {new Date(item.timestamp).toLocaleString()}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          item.success ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                        }`}>
                          {item.success ? '成功' : '失败'}
                        </span>
                        <button
                          onClick={() => onExecuteQuery(item.executedSQL)}
                          className="p-1 text-gray-400 hover:text-white hover:bg-white/10 rounded transition-all duration-200"
                          title="重新执行"
                        >
                          <Icons.Play size={14} />
                        </button>
                        <button
                          onClick={() => onAddToFavorites(item.executedSQL)}
                          className="p-1 text-gray-400 hover:text-white hover:bg-white/10 rounded transition-all duration-200"
                          title="添加到收藏"
                        >
                          <Icons.Star size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeSubTab === 'favorites' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">SQL收藏</h3>
              <button
                onClick={() => onSwitchToWorkbench()}
                className="px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white text-sm rounded-lg transition-all duration-200"
              >
                添加收藏
              </button>
            </div>
            {favorites.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                <Icons.Star size={48} className="text-gray-600 mx-auto mb-4" />
                <div className="text-lg font-medium mb-2">暂无收藏</div>
                <div className="text-sm">在工作台中将常用的 SQL 查询添加到收藏</div>
              </div>
            ) : (
              <div className="space-y-2">
                {favorites.map((favorite) => (
                  <div key={favorite.id} className="bg-gray-800/50 border border-white/10 rounded-lg p-3 hover:bg-gray-700/50 transition-all duration-200">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-white mb-1">{favorite.name}</div>
                        <div className="text-sm text-gray-300 truncate">{favorite.sqlText.substring(0, 100)}...</div>
                        <div className="text-xs text-gray-400 mt-1">
                          {new Date(favorite.createdAt).toLocaleString()}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        <button
                          onClick={() => onExecuteQuery(favorite.sqlText)}
                          className="p-1 text-gray-400 hover:text-white hover:bg-white/10 rounded transition-all duration-200"
                          title="执行"
                        >
                          <Icons.Play size={14} />
                        </button>
                        <button
                          onClick={() => onDeleteFavorite(favorite.id)}
                          className="p-1 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded transition-all duration-200"
                          title="删除"
                        >
                          <Icons.Trash size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// 数据分析Tab组件
const DataAnalysisTab: React.FC<{
  onExecuteQuery: (sql: string) => void;
  onSwitchToWorkbench: () => void;
  onSaveAnalysisSession: (session: any) => void;
}> = () => {
  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 overflow-auto p-4">
        <div className="text-center text-gray-500 py-8">
          <Icons.Analysis size={48} className="text-gray-600 mx-auto mb-4" />
          <div className="text-lg font-medium mb-2">数据分析功能</div>
          <div className="text-sm">即将推出...</div>
        </div>
      </div>
    </div>
  );
};

// SQL 语法高亮编辑器组件
const SQLHighlightEditor: React.FC<{
  value: string;
  onChange: (value: string) => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  height?: string | number;
  resizable?: boolean;
}> = ({ value, onChange, onKeyDown, placeholder, disabled, className, height = '12rem', resizable = false }) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const preRef = useRef<HTMLPreElement>(null);

  const handleScroll = () => {
    if (textareaRef.current && preRef.current) {
      preRef.current.scrollTop = textareaRef.current.scrollTop;
      preRef.current.scrollLeft = textareaRef.current.scrollLeft;
    }
  };

  const heightStyle = typeof height === 'number' ? `${height}px` : height;

  return (
    <div className={`relative ${className}`} style={{ height: heightStyle, minHeight: '8rem', maxHeight: '32rem' }}>
      {/* 语法高亮层 */}
      <pre
        ref={preRef}
        className="absolute inset-0 p-4 font-mono text-sm text-gray-200 pointer-events-none overflow-auto bg-transparent"
        style={{
          whiteSpace: 'pre-wrap',
          wordWrap: 'break-word',
          height: '100%',
          resize: resizable ? 'vertical' : 'none'
        }}
      >
        <Highlight
          theme={themes.vsDark}
          code={value || placeholder || ''}
          language="sql"
        >
          {({ className: highlightClass, style, tokens, getLineProps, getTokenProps }) => (
            <code className={highlightClass} style={style}>
              {tokens.map((line, i) => (
                <div key={i} {...getLineProps({ line })}>
                  {line.map((token, key) => (
                    <span
                      key={key}
                      {...getTokenProps({ token })}
                      style={{
                        ...getTokenProps({ token }).style,
                        opacity: value ? 1 : 0.5,
                        fontFamily: 'inherit'
                      }}
                    />
                  ))}
                </div>
              ))}
            </code>
          )}
        </Highlight>
      </pre>

      {/* 输入层 */}
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={onKeyDown}
        onScroll={handleScroll}
        placeholder=""
        disabled={disabled}
        className={`relative inset-0 w-full h-full p-4 font-mono text-sm text-transparent bg-transparent border border-white/10 rounded-xl focus:outline-none focus:border-brand-500/60 focus:ring-1 focus:ring-brand-500/20 caret-white ${resizable ? 'resize-y' : 'resize-none'}`}
        style={{
          background: 'transparent',
          color: 'transparent',
          caretColor: 'white',
          zIndex: 1,
          minHeight: '8rem',
          maxHeight: '32rem'
        }}
      />

      {/* 占位符 */}
      {!value && placeholder && (
        <div className="absolute top-4 left-4 text-gray-500 pointer-events-none font-mono text-sm">
          {placeholder}
        </div>
      )}

      {/* Resize handle hint */}
      {resizable && (
        <div className="absolute bottom-2 right-2 text-xs text-gray-500 opacity-50 pointer-events-none">
          ⇅
        </div>
      )}
    </div>
  );
};

// =============================================================================
// 数据表驱动的查询模板组件
// =============================================================================

// Prompts表模板
const PromptsTableTemplates: React.FC<{
  setQuery: (query: string) => void;
}> = ({ setQuery }) => {
  const templates = {
    // 基础CRUD操作
    crud: {
      title: '📝 基础CRUD',
      icon: Icons.Database,
      items: [
        {
          name: '统计总数',
          sql: 'SELECT COUNT(*) as total FROM prompts WHERE deletedAt IS NULL;',
          desc: 'COUNT(*) FROM prompts'
        },
        {
          name: '查看前5条',
          sql: 'SELECT id, title, category, createdAt FROM prompts WHERE deletedAt IS NULL ORDER BY createdAt DESC LIMIT 5;',
          desc: 'SELECT + LIMIT 5'
        },
        {
          name: '新增记录',
          sql: 'INSERT INTO prompts (id, title, content, description, category, isFavorite, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?);',
          desc: 'INSERT INTO prompts'
        },
        {
          name: '更新记录',
          sql: 'UPDATE prompts SET title = ?, updatedAt = ? WHERE id = ? AND deletedAt IS NULL;',
          desc: 'UPDATE prompts'
        },
        {
          name: '软删除',
          sql: 'UPDATE prompts SET deletedAt = ?, updatedAt = ? WHERE id = ?;',
          desc: '软删除记录'
        }
      ]
    },
    // 条件查询
    conditions: {
      title: '🔍 条件查询',
      icon: Icons.Search,
      items: [
        {
          name: '按分类筛选',
          sql: 'SELECT * FROM prompts WHERE category = ? AND deletedAt IS NULL;',
          desc: 'WHERE category = ?'
        },
        {
          name: '收藏夹',
          sql: 'SELECT * FROM prompts WHERE isFavorite = 1 AND deletedAt IS NULL;',
          desc: 'WHERE isFavorite = 1'
        },
        {
          name: '关键词搜索',
          sql: 'SELECT * FROM prompts WHERE (title LIKE ? OR content LIKE ?) AND deletedAt IS NULL;',
          desc: 'LIKE 模糊匹配'
        },
        {
          name: '时间范围',
          sql: 'SELECT * FROM prompts WHERE createdAt >= ? AND createdAt <= ? AND deletedAt IS NULL;',
          desc: '时间范围查询'
        },
        {
          name: '标签匹配',
          sql: 'SELECT * FROM prompts WHERE tags LIKE ? AND deletedAt IS NULL;',
          desc: 'JSON数组匹配'
        }
      ]
    },
    // 聚合分析
    analytics: {
      title: '📊 聚合分析',
      icon: Icons.Analysis,
      items: [
        {
          name: '分类统计',
          sql: 'SELECT category, COUNT(*) as count FROM prompts WHERE deletedAt IS NULL GROUP BY category ORDER BY count DESC;',
          desc: 'GROUP BY + COUNT'
        },
        {
          name: '每日创建',
          sql: 'SELECT DATE(createdAt) as date, COUNT(*) as count FROM prompts WHERE deletedAt IS NULL GROUP BY DATE(createdAt) ORDER BY date DESC;',
          desc: '按日期聚合'
        },
        {
          name: '最长内容',
          sql: 'SELECT id, title, LENGTH(content) as content_length FROM prompts WHERE deletedAt IS NULL ORDER BY content_length DESC LIMIT 10;',
          desc: 'LENGTH() 函数'
        },
        {
          name: '标签分布',
          sql: 'SELECT tags, COUNT(*) as count FROM prompts WHERE deletedAt IS NULL GROUP BY tags ORDER BY count DESC LIMIT 10;',
          desc: '标签统计分析'
        },
        {
          name: '收藏率',
          sql: 'SELECT category, AVG(CASE WHEN isFavorite = 1 THEN 1 ELSE 0 END) as favorite_rate, COUNT(*) as total FROM prompts WHERE deletedAt IS NULL GROUP BY category;',
          desc: '收藏率计算'
        }
      ]
    },
    // 高级查询
    advanced: {
      title: '🚀 高级查询',
      icon: Icons.Code,
      items: [
        {
          name: '窗口函数排名',
          sql: 'SELECT id, title, category, createdAt, ROW_NUMBER() OVER (ORDER BY createdAt DESC) as rank FROM prompts WHERE deletedAt IS NULL;',
          desc: 'ROW_NUMBER() 排名'
        },
        {
          name: '子查询筛选',
          sql: 'SELECT * FROM prompts WHERE category IN (SELECT category FROM prompts WHERE deletedAt IS NULL GROUP BY category HAVING COUNT(*) > 5) AND deletedAt IS NULL;',
          desc: '子查询 + HAVING'
        },
        {
          name: 'JSON提取',
          sql: 'SELECT id, title, json_extract(config, \'$.model\') as model FROM prompts WHERE deletedAt IS NULL AND config IS NOT NULL;',
          desc: 'JSON字段提取'
        },
        {
          name: '全文搜索',
          sql: 'SELECT * FROM prompts WHERE content LIKE ? OR title LIKE ? OR description LIKE ? AND deletedAt IS NULL;',
          desc: '多字段搜索'
        },
        {
          name: '数据完整性检查',
          sql: 'SELECT * FROM prompts WHERE (title IS NULL OR title = \'\') OR (content IS NULL OR content = \'\') AND deletedAt IS NULL;',
          desc: '数据质量检查'
        }
      ]
    }
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {Object.entries(templates).map(([key, category]) => (
        <div key={key} className="space-y-3">
          <h4 className="text-sm font-medium text-gray-300 flex items-center gap-2">
            <category.icon size={16} />
            {category.title}
          </h4>
          <div className="grid grid-cols-1 gap-2">
            {category.items.map((item, index) => (
              <button
                key={index}
                onClick={() => setQuery(item.sql)}
                className="text-left p-3 bg-gray-800/50 hover:bg-gray-700/50 border border-white/10 hover:border-white/20 rounded-lg transition-all duration-200 group"
              >
                <div className="text-sm font-medium text-gray-200 group-hover:text-white">{item.name}</div>
                <div className="text-xs text-gray-500 mt-1">{item.desc}</div>
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

// SQL历史表模板
const SQLHistoryTableTemplates: React.FC<{
  setQuery: (query: string) => void;
}> = ({ setQuery }) => {
  const templates = {
    history: {
      title: '📜 执行历史',
      icon: Icons.History,
      items: [
        { name: '最近执行', sql: 'SELECT * FROM sql_history ORDER BY executedAt DESC LIMIT 10;', desc: 'ORDER BY executedAt' },
        { name: '成功查询', sql: 'SELECT * FROM sql_history WHERE success = 1 ORDER BY executedAt DESC;', desc: 'WHERE success = 1' },
        { name: '失败查询', sql: 'SELECT * FROM sql_history WHERE success = 0 ORDER BY executedAt DESC;', desc: 'WHERE success = 0' },
        { name: '执行统计', sql: 'SELECT COUNT(*) as total, SUM(success) as success_count FROM sql_history;', desc: 'COUNT + SUM' }
      ]
    }
  };

  return <TemplateGrid templates={templates} setQuery={setQuery} />;
};

// SQL收藏表模板
const SQLFavoritesTableTemplates: React.FC<{
  setQuery: (query: string) => void;
}> = ({ setQuery }) => {
  const templates = {
    favorites: {
      title: '⭐ 收藏查询',
      icon: Icons.Star,
      items: [
        { name: '所有收藏', sql: 'SELECT * FROM sql_favorites ORDER BY createdAt DESC;', desc: 'ORDER BY createdAt' },
        { name: '按分类', sql: 'SELECT * FROM sql_favorites WHERE category = ? ORDER BY createdAt DESC;', desc: 'WHERE category = ?' },
        { name: '使用频率', sql: 'SELECT sql, COUNT(*) as usage_count FROM sql_history GROUP BY sql ORDER BY usage_count DESC;', desc: 'GROUP BY sql' }
      ]
    }
  };

  return <TemplateGrid templates={templates} setQuery={setQuery} />;
};

// 分析会话表模板
const AnalysisSessionsTableTemplates: React.FC<{
  setQuery: (query: string) => void;
}> = ({ setQuery }) => {
  const templates = {
    analysis: {
      title: '🔍 分析会话',
      icon: Icons.Analysis,
      items: [
        { name: '活跃会话', sql: 'SELECT * FROM analysis_sessions WHERE status = \'active\' ORDER BY createdAt DESC;', desc: 'WHERE status = \'active\'' },
        { name: '完成分析', sql: 'SELECT * FROM analysis_sessions WHERE status = \'completed\' ORDER BY completedAt DESC;', desc: 'WHERE status = \'completed\'' },
        { name: '会话统计', sql: 'SELECT status, COUNT(*) as count FROM analysis_sessions GROUP BY status;', desc: 'GROUP BY status' }
      ]
    }
  };

  return <TemplateGrid templates={templates} setQuery={setQuery} />;
};

// 通用模板网格组件
const TemplateGrid: React.FC<{
  templates: Record<string, { title: string; icon: any; items: Array<{ name: string; sql: string; desc: string; }> }>;
  setQuery: (query: string) => void;
}> = ({ templates, setQuery }) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
    {Object.entries(templates).map(([key, category]) => (
      <div key={key} className="space-y-3">
        <h4 className="text-sm font-medium text-gray-300 flex items-center gap-2">
          <category.icon size={16} />
          {category.title}
        </h4>
        <div className="grid grid-cols-1 gap-2">
          {category.items.map((item, index) => (
            <button
              key={index}
              onClick={() => setQuery(item.sql)}
              className="text-left p-3 bg-gray-800/50 hover:bg-gray-700/50 border border-white/10 hover:border-white/20 rounded-lg transition-all duration-200 group"
            >
              <div className="text-sm font-medium text-gray-200 group-hover:text-white">{item.name}</div>
              <div className="text-xs text-gray-500 mt-1">{item.desc}</div>
            </button>
          ))}
        </div>
      </div>
    ))}
  </div>
);

// 增强数据表格组件
const EnhancedDataTable: React.FC<{
  columns: string[];
  rows: any[][];
  onExecuteSQL: (sql: string) => void;
}> = ({ columns, rows, onExecuteSQL }) => {
  const [sortColumn, setSortColumn] = useState<number | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [filters, setFilters] = useState<Record<number, string>>({});
  const [editingCell, setEditingCell] = useState<{ row: number; col: number } | null>(null);
  const [editValue, setEditValue] = useState<string>('');

  // 排序和筛选数据
  const processedData = React.useMemo(() => {
    let data = rows.map((row: any[], index: number) => ({ row, originalIndex: index }));

    // 应用筛选
    Object.entries(filters).forEach(([colIndex, filterValue]) => {
      if (filterValue.trim()) {
        const col = parseInt(colIndex);
        data = data.filter(({ row }) => {
          const cellValue = String(row[col] || '').toLowerCase();
          return cellValue.includes(filterValue.toLowerCase());
        });
      }
    });

    // 应用排序
    if (sortColumn !== null) {
      data.sort((a, b) => {
        const aVal = a.row[sortColumn];
        const bVal = b.row[sortColumn];

        let comparison = 0;
        if (aVal === null || aVal === undefined) comparison = -1;
        else if (bVal === null || bVal === undefined) comparison = 1;
        else if (typeof aVal === 'number' && typeof bVal === 'number') {
          comparison = aVal - bVal;
        } else {
          comparison = String(aVal).localeCompare(String(bVal));
        }

        return sortDirection === 'asc' ? comparison : -comparison;
      });
    }

    return data;
  }, [rows, sortColumn, sortDirection, filters]);

  const handleSort = React.useCallback((columnIndex: number) => {
    if (sortColumn === columnIndex) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(columnIndex);
      setSortDirection('asc');
    }
  }, [sortColumn]);

  const handleFilterChange = React.useCallback((columnIndex: number, value: string) => {
    setFilters(prev => ({
      ...prev,
      [columnIndex]: value
    }));
  }, []);

  const handleCellEdit = React.useCallback((rowIndex: number, colIndex: number, value: any) => {
    setEditingCell({ row: rowIndex, col: colIndex });
    setEditValue(String(value || ''));
  }, []);

  const handleCellSave = React.useCallback(() => {
    if (!editingCell) return;

    // 这里可以生成UPDATE SQL语句
    const { row: rowIndex, col: colIndex } = editingCell;
    const originalRow = processedData[rowIndex];
    const columnName = columns[colIndex];
    const newValue = editValue;

    // 生成UPDATE语句（这里只是示例，实际需要根据主键来构造）
    const updateSQL = `UPDATE prompts SET ${columnName} = '${newValue}' WHERE id = '${originalRow.row[columns.indexOf('id')]}';`;

    onExecuteSQL(updateSQL);
    setEditingCell(null);
    setEditValue('');
  }, [editingCell, processedData, columns, editValue, onExecuteSQL]);

  const handleCellCancel = React.useCallback(() => {
    setEditingCell(null);
    setEditValue('');
  }, []);

  const handleDeleteRow = React.useCallback((rowIndex: number) => {
    const originalRow = processedData[rowIndex];
    const idValue = originalRow.row[columns.indexOf('id')];

    if (idValue) {
      const deleteSQL = `DELETE FROM prompts WHERE id = '${idValue}';`;
      onExecuteSQL(deleteSQL);
    }
  }, [processedData, columns, onExecuteSQL]);

  const exportToCSV = React.useCallback(() => {
    const csvContent = [
      columns.join(','),
      ...processedData.map(({ row }) => row.map(cell => {
        if (cell === null || cell === undefined) return '';
        const str = String(cell);
        return str.includes(',') || str.includes('"') || str.includes('\n')
          ? `"${str.replace(/"/g, '""')}"`
          : str;
      }).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'query_results.csv';
    link.click();
  }, [columns, processedData]);

  const exportToJSON = React.useCallback(() => {
    const jsonData = processedData.map(({ row }) => {
      const obj: any = {};
      columns.forEach((col, index) => {
        obj[col] = row[index];
      });
      return obj;
    });

    const jsonContent = JSON.stringify(jsonData, null, 2);
    const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'query_results.json';
    link.click();
  }, [columns, processedData]);

  return (
    <div className="p-4 space-y-4">
      {/* Table Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4 text-sm text-gray-400">
          <span>显示 {processedData.length} / {rows.length} 行</span>
          {Object.keys(filters).length > 0 && (
            <button
              onClick={() => setFilters({})}
              className="text-brand-400 hover:text-brand-300 text-xs"
            >
              清除筛选
            </button>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={exportToCSV}
            className="flex items-center gap-2 px-3 py-1.5 bg-gray-700/50 hover:bg-gray-600/50 text-gray-300 hover:text-white text-sm rounded-lg transition-all duration-200"
          >
            <Icons.Download size={14} />
            CSV
          </button>
          <button
            onClick={exportToJSON}
            className="flex items-center gap-2 px-3 py-1.5 bg-gray-700/50 hover:bg-gray-600/50 text-gray-300 hover:text-white text-sm rounded-lg transition-all duration-200"
          >
            <Icons.Download size={14} />
            JSON
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="border border-white/10 rounded-lg overflow-hidden">
        <div className="overflow-auto max-h-96">
          <table className="w-full text-sm">
            <thead className="bg-gray-800/50 sticky top-0">
              <tr>
                {columns.map((column, index) => (
                  <th key={index} className="px-4 py-3 text-left border-r border-white/10 last:border-r-0">
                    <div className="flex flex-col gap-2">
                      {/* Column Header with Sort */}
                      <div className="flex items-center gap-2">
                        <span className="text-gray-300 font-semibold">{column}</span>
                        <button
                          onClick={() => handleSort(index)}
                          className={`text-gray-500 hover:text-white transition-colors ${
                            sortColumn === index ? 'text-brand-400' : ''
                          }`}
                        >
                          {sortColumn === index ? (
                            sortDirection === 'asc' ?
                              <Icons.ArrowUp size={14} /> :
                              <Icons.ArrowDown size={14} />
                          ) : (
                            <Icons.ArrowUp size={14} className="opacity-50" />
                          )}
                        </button>
                      </div>

                      {/* Filter Input */}
                      <input
                        type="text"
                        placeholder="筛选..."
                        value={filters[index] || ''}
                        onChange={(e) => handleFilterChange(index, e.target.value)}
                        className="w-full px-2 py-1 text-xs bg-gray-900/50 border border-white/10 rounded text-gray-300 placeholder-gray-500 focus:outline-none focus:border-brand-500/50"
                      />
                    </div>
                  </th>
                ))}
                <th className="px-4 py-3 text-center text-gray-300 font-semibold border-l border-white/10">
                  操作
                </th>
              </tr>
            </thead>
            <tbody>
              {processedData.map(({ row }: { row: any[] }, rowIndex: number) => (
                <tr key={rowIndex} className="border-b border-white/5 hover:bg-white/5 transition-colors duration-150">
                    {row.map((cell, cellIndex) => (
                    <td
                      key={cellIndex}
                      className="px-4 py-3 text-gray-200 border-r border-white/5 last:border-r-0 max-w-xs"
                    >
                      {editingCell?.row === rowIndex && editingCell?.col === cellIndex ? (
                        <input
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleCellSave();
                            if (e.key === 'Escape') handleCellCancel();
                          }}
                          onBlur={handleCellSave}
                          className="w-full px-2 py-1 text-sm bg-gray-700 border border-brand-500/50 rounded text-white focus:outline-none"
                          autoFocus
                        />
                      ) : (
                        <div
                          className="cursor-pointer hover:bg-gray-700/50 rounded px-1 py-0.5 -mx-1 -my-0.5 transition-colors"
                          onClick={() => handleCellEdit(rowIndex, cellIndex, cell)}
                          title="点击编辑"
                        >
                          {cell === null || cell === undefined ? (
                            <span className="text-gray-500 italic text-xs bg-gray-700/50 px-2 py-1 rounded">NULL</span>
                          ) : typeof cell === 'boolean' ? (
                            <span className={`text-xs px-2 py-1 rounded font-medium ${
                              cell ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                            }`}>
                              {cell ? 'TRUE' : 'FALSE'}
                            </span>
                          ) : (
                            <span className={`${
                              typeof cell === 'number' ? 'text-blue-300 font-mono' :
                              typeof cell === 'string' && cell.length > 50 ? 'truncate block' : ''
                            }`}>
                              {String(cell)}
                            </span>
                          )}
                        </div>
                      )}
                    </td>
                  ))}
                  <td className="px-4 py-3 text-center border-l border-white/10">
                    <button
                      onClick={() => handleDeleteRow(rowIndex)}
                      className="text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded px-2 py-1 transition-colors"
                      title="删除行"
                    >
                      <Icons.Trash size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export const SQLConsole: React.FC<SQLConsoleProps> = ({
  className = '',
  onClose
}) => {
  const {
    executeSQL,
    isInitialized,
    saveSQLHistory,
    saveSQLFavorite,
    deleteSQLFavorite,
    loadSQLHistory,
    loadSQLFavorites
  } = useDuckDBSync();

  // TAB状态
  const [activeTab, setActiveTab] = useState<TabType>('workbench');

  // SQL工作台状态
  const [query, setQuery] = useState('');
  const [isExecuting, setIsExecuting] = useState(false);
  const [result, setResult] = useState<QueryResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<SQLHistoryItem[]>([]);
  const [favorites, setFavorites] = useState<FavoriteSQL[]>([]);

  // 编辑器配置状态
  const [editorHeight] = useState<number>(192); // 默认12rem (192px)

  // 模板配置状态
  const [selectedTable, setSelectedTable] = useState<string>('prompts');

  // 初始化和数据加载
  useEffect(() => {
    if (isInitialized) {
      loadSQLHistory().then(setHistory);
      loadSQLFavorites().then(setFavorites);
    }
  }, [isInitialized, loadSQLHistory, loadSQLFavorites]);

  // 执行SQL查询
  const executeQuery = useCallback(async () => {
    if (!query.trim()) return;

    setIsExecuting(true);
    setError(null);

    try {
      const startTime = Date.now();
      const sqlResult = await executeSQL(query);
      const executionTime = Date.now() - startTime;

      // 保存到历史记录
      const historyItem: SQLHistoryItem = {
        id: `hist_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        inputType: 'sql',
        inputText: query,
        executedSQL: query,
        timestamp: Date.now(),
        executionTime,
        resultCount: sqlResult?.length || 0,
        success: true
      };
      await saveSQLHistory(historyItem);

      // 更新历史状态
      setHistory(prev => [historyItem, ...prev.slice(0, 99)]);

      // 处理结果
      if (Array.isArray(sqlResult) && sqlResult.length > 0) {
        const columns = Object.keys(sqlResult[0]);
        setResult({
          columns,
          rows: sqlResult.map(row => columns.map(col => row[col])),
          executionTime,
          rowCount: sqlResult.length
        });
      } else {
        setResult({
          columns: ['message'],
          rows: [['查询执行成功']],
          executionTime,
          rowCount: 1
        });
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '未知错误';
      setError(errorMessage);

      // 保存失败记录到历史
      const historyItem: SQLHistoryItem = {
        id: `hist_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        inputType: 'sql',
        inputText: query,
        executedSQL: query,
        timestamp: Date.now(),
        success: false,
        error: errorMessage
      };
      await saveSQLHistory(historyItem);
      setHistory(prev => [historyItem, ...prev.slice(0, 99)]);
    } finally {
      setIsExecuting(false);
    }
  }, [query, executeSQL, saveSQLHistory]);

  // 键盘快捷键处理
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.ctrlKey && e.key === 'Enter') {
      e.preventDefault();
      executeQuery();
    }
  }, [executeQuery]);

  // 清空结果
  const clearResult = useCallback(() => {
    setResult(null);
    setError(null);
  }, []);

  // 添加到收藏
  const addToFavorites = useCallback(async (sql: string, name?: string) => {
    if (!sql.trim()) return;

    const favoriteName = name || `查询 ${new Date().toLocaleString()}`;
    const favorite: FavoriteSQL = {
      id: `fav_${Date.now()}`,
      name: favoriteName,
      sqlText: sql,
      createdAt: Date.now()
    };

    await saveSQLFavorite(favorite);
    setFavorites(prev => [favorite, ...prev]);
  }, [saveSQLFavorite]);

  return (
    <div className={`h-full ${colors.bg.cardDarker} ${colors.border.light} ${FOUNDATION.borderRadius['2xl']} ${LAYOUT.elevation.max} overflow-hidden flex flex-col ${className}`}>
      {/* Header */}
      <div className="relative flex items-center justify-between p-3 sm:p-4 min-w-0">
        <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-brand-500/20 to-purple-500/20 rounded-xl flex items-center justify-center border border-brand-500/30 flex-shrink-0">
            <Icons.Database size={18} className="sm:w-5 sm:h-5 text-brand-400" />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-lg sm:text-xl font-bold text-white truncate">DuckDB 数据控制台</h1>
            <p className="text-xs sm:text-sm text-gray-400 hidden sm:block">数据分析 • SQL 工作台 • 执行历史</p>
          </div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-xl transition-all duration-200 transform hover:scale-105 touch-manipulation ml-2 flex-shrink-0"
          >
            <Icons.Close size={20} />
          </button>
        )}
      </div>

      {/* TAB Navigation */}
      <div className={`${colors.bg.surface} ${colors.border.lighter} border-b flex-shrink-0`}>
        <div className="flex">
          {[
            { id: 'analysis' as TabType, label: '💬 数据分析', icon: Icons.Analysis },
            { id: 'workbench' as TabType, label: '📝 SQL 工作台', icon: Icons.Code },
            { id: 'history' as TabType, label: '📁 历史 & 收藏', icon: Icons.History }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-2 py-3 px-3 text-sm font-medium transition-all duration-200 border-b-2 ${
                activeTab === tab.id
                  ? 'text-white bg-brand-500/20 border-brand-500 shadow-sm'
                  : 'text-gray-400 hover:text-white hover:bg-white/5 border-transparent'
              }`}
            >
              <tab.icon size={16} />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 min-h-0 overflow-hidden">
        {activeTab === 'workbench' && (
          <div className="h-full flex flex-col">
            {/* SQL Editor */}
            <div className="p-4 border-b border-white/5 flex-shrink-0">
              <div className="space-y-4">
                {/* 标题区域 */}
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                    <Icons.Code size={20} className="text-brand-400" />
                    SQL 编辑器
                  </h3>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <span className="bg-gray-800/50 px-2 py-1 rounded">Ctrl+Enter 执行</span>
                    <span className="bg-gray-800/50 px-2 py-1 rounded hidden sm:inline">Ctrl+/ 格式化</span>
                    <span className="bg-gray-800/50 px-2 py-1 rounded hidden md:inline">⇅ 可调节高度</span>
                  </div>
                </div>

                {/* SQL 语法高亮编辑器 */}
                <SQLHighlightEditor
                  value={query}
                  onChange={setQuery}
                  onKeyDown={handleKeyDown}
                  placeholder="输入 DuckDB SQL 查询..."
                  disabled={isExecuting}
                  className="w-full"
                  height={editorHeight}
                  resizable={true}
                />

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-0">
                  <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                    <button
                      onClick={clearResult}
                      className={`flex items-center justify-center gap-2 px-3 sm:px-4 py-2.5 sm:py-2 ${colors.bg.muted} hover:${colors.bg.surface} ${colors.text.secondary} hover:${colors.text.primary} text-sm ${FOUNDATION.borderRadius.lg} ${colors.border.light} hover:${colors.border.primary} transition-all duration-200 min-h-[44px] touch-manipulation`}
                    >
                      <Icons.Trash size={14} />
                      <span className="hidden xs:inline">清空结果</span>
                    </button>
                    <button
                      onClick={() => {
                        // 简单的SQL格式化
                        const formatted = query
                          .replace(/\s+/g, ' ')
                          .replace(/\s*([(),;])\s*/g, '$1 ')
                          .replace(/\s*(\bSELECT|FROM|WHERE|ORDER BY|GROUP BY|LIMIT|INSERT|UPDATE|DELETE|INTO|VALUES|SET)\b\s*/gi, '\n$1 ')
                          .trim();
                        setQuery(formatted);
                      }}
                      disabled={!query.trim()}
                      className={`flex items-center justify-center gap-2 px-3 sm:px-4 py-2.5 sm:py-2 bg-purple-700/80 hover:bg-purple-600/80 disabled:bg-gray-700/50 disabled:text-gray-500 text-purple-300 hover:text-white disabled:cursor-not-allowed text-sm ${FOUNDATION.borderRadius.lg} border-purple-500/30 hover:border-purple-400/50 disabled:border-gray-600/30 transition-all duration-200 min-h-[44px] touch-manipulation`}
                    >
                      <Icons.Code size={14} />
                      <span className="hidden xs:inline">格式化</span>
                    </button>
                    <button
                      onClick={() => addToFavorites(query)}
                      disabled={!query.trim()}
                      className={`flex items-center justify-center gap-2 px-3 sm:px-4 py-2.5 sm:py-2 bg-yellow-700/80 hover:bg-yellow-600/80 disabled:bg-gray-700/50 disabled:text-gray-500 text-yellow-300 hover:text-white disabled:cursor-not-allowed text-sm ${FOUNDATION.borderRadius.lg} border-yellow-500/30 hover:border-yellow-400/50 disabled:border-gray-600/30 transition-all duration-200 min-h-[44px] touch-manipulation`}
                    >
                      <Icons.Star size={14} />
                      <span className="hidden xs:inline">收藏</span>
                    </button>
                  </div>

                  {/* 执行按钮 */}
                  <button
                    onClick={executeQuery}
                    disabled={!query.trim() || isExecuting}
                    className="flex items-center justify-center gap-2 px-4 sm:px-6 py-2.5 sm:py-2 bg-brand-600 hover:bg-brand-500 disabled:bg-gray-700/50 disabled:text-gray-500 text-white disabled:cursor-not-allowed text-sm font-medium rounded-lg border border-brand-500/50 hover:border-brand-400/70 disabled:border-gray-600/30 transition-all duration-200 shadow-sm hover:shadow-md min-h-[44px] touch-manipulation w-full sm:w-auto"
                  >
                    {isExecuting ? (
                      <>
                        <Icons.Loader size={14} className="animate-spin" />
                        执行中...
                      </>
                    ) : (
                      <>
                        <Icons.Play size={14} />
                        执行查询
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Results Area */}
            <div className="flex-1 overflow-hidden min-h-0">
              {error && (
                <div className="mx-4 mt-4 mb-0">
                  <div className="p-4 bg-red-900/20 border-l-4 border-red-500 rounded-r-lg">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-8 h-8 bg-red-500/20 rounded-full flex items-center justify-center">
                        <Icons.Error size={16} className="text-red-400" />
                      </div>
                      <span className="text-red-400 font-semibold text-lg">执行失败</span>
                    </div>
                    <div className="text-red-300 text-sm whitespace-pre-wrap">{error}</div>
                  </div>
                </div>
              )}

              {result && !error && (
                <div className="h-full flex flex-col">
                  <EnhancedDataTable
                    columns={result.columns}
                    rows={result.rows}
                    onExecuteSQL={executeQuery}
                  />
                </div>
              )}

              {!result && !error && (
                <div className="p-6">
                  {/* SQL 查询模板 - 数据表驱动设计 */}
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                        <Icons.Code size={20} className="text-brand-400" />
                        SQL 查询模板
                      </h3>
                      {/* 数据表选择器 */}
                      <select
                        value={selectedTable}
                        onChange={(e) => setSelectedTable(e.target.value)}
                        className="px-3 py-2 bg-gray-800/50 border border-white/10 rounded-lg text-sm text-gray-200 focus:outline-none focus:border-brand-500/50"
                      >
                        <option value="prompts">📝 prompts 表</option>
                        <option value="sql_history">📜 sql_history 表</option>
                        <option value="sql_favorites">⭐ sql_favorites 表</option>
                        <option value="analysis_sessions">🔍 analysis_sessions 表</option>
                      </select>
                    </div>
                    {/* 动态模板内容基于选中表 */}
                    {selectedTable === 'prompts' && <PromptsTableTemplates setQuery={setQuery} />}
                    {selectedTable === 'sql_history' && <SQLHistoryTableTemplates setQuery={setQuery} />}
                    {selectedTable === 'sql_favorites' && <SQLFavoritesTableTemplates setQuery={setQuery} />}
                    {selectedTable === 'analysis_sessions' && <AnalysisSessionsTableTemplates setQuery={setQuery} />}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'analysis' && (
          <DataAnalysisTab
            onExecuteQuery={executeQuery}
            onSwitchToWorkbench={() => setActiveTab('workbench')}
            onSaveAnalysisSession={() => {}}
          />
        )}

        {activeTab === 'history' && (
          <HistoryAndFavoritesTab
            history={history}
            favorites={favorites}
            onExecuteQuery={setQuery}
            onSwitchToWorkbench={() => setActiveTab('workbench')}
            onAddToFavorites={addToFavorites}
            onDeleteFavorite={async (id) => {
              // 删除收藏
              setFavorites(prev => prev.filter(f => f.id !== id));
              await deleteSQLFavorite(id);
            }}
          />
        )}
      </div>
    </div>
  );
};