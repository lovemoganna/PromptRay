import { useEffect, useMemo, useState } from 'react';
import { Prompt } from '../types';
import {
  getPrompts,
  savePrompts,
  getCustomCategories,
  saveCustomCategories
} from '../services/storageService';
import { STANDARD_CATEGORIES, SPECIAL_CATEGORY_TRASH } from '../constants';
import { dataSyncManager, DataChangeEvent } from './useDuckDBSync';

export const usePromptData = () => {
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [customCategories, setCustomCategories] = useState<string[]>([]);

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      try {
        const [loadedPrompts, loadedCategories] = await Promise.all([
          getPrompts(),
          getCustomCategories()
        ]);
        setPrompts(loadedPrompts);
        setCustomCategories(loadedCategories);
      } catch (error) {
        console.error('Failed to load initial data:', error);
      }
    };

    loadData();
  }, []);

  // Listen for data changes from SQL console
  useEffect(() => {
    const handleDataChange = (event: DataChangeEvent) => {
      console.info('📡 Received data change event:', event.type);

      switch (event.type) {
        case 'PROMPT_CREATED':
          console.info('➕ Adding new prompt from SQL console:', event.payload.title);
          setPrompts(prev => {
            // Avoid duplicates
            const exists = prev.some(p => p.id === event.payload.id);
            if (exists) {
              console.warn('⚠️ Prompt already exists, skipping:', event.payload.id);
              return prev;
            }
            return [event.payload, ...prev];
          });
          break;

        case 'PROMPT_UPDATED':
          console.info('✏️ Updating prompt from SQL console:', event.payload.title);
          setPrompts(prev => prev.map(p =>
            p.id === event.payload.id ? event.payload : p
          ));
          break;

        case 'PROMPT_DELETED':
          console.info('🗑️ Deleting prompt from SQL console:', event.payload.id);
          setPrompts(prev => prev.filter(p => p.id !== event.payload.id));
          break;

        case 'CATEGORIES_UPDATED':
          console.info('📂 Updating categories from SQL console:', event.payload);
          setCustomCategories(event.payload);
          break;

        default:
          // Ignore other event types
          break;
      }
    };

    // Subscribe to data change events
    const unsubscribe = dataSyncManager.subscribe(handleDataChange);

    return () => {
      unsubscribe();
    };
  }, []);

  // Persist prompts with debounce to avoid excessive writes
  useEffect(() => {
    const timeoutId = setTimeout(async () => {
      try {
        await savePrompts(prompts);
        // Notify SQL console about data changes
        console.info('💾 Main storage updated, notifying SQL console');
      } catch (error) {
        console.warn('Failed to save prompts:', error);
      }
    }, 300);
    return () => clearTimeout(timeoutId);
  }, [prompts]);

  // Persist custom categories with debounce
  useEffect(() => {
    const timeoutId = setTimeout(async () => {
      try {
        await saveCustomCategories(customCategories);
      } catch (error) {
        console.warn('Failed to save custom categories:', error);
      }
    }, 300);
    return () => clearTimeout(timeoutId);
  }, [customCategories]);

  const activePrompts = useMemo(
    () => prompts.filter(p => !p.deletedAt),
    [prompts]
  );

  const allTags = useMemo(() => {
    const tags = new Set<string>();
    activePrompts.forEach(p => p.tags.forEach(t => tags.add(t)));
    return Array.from(tags).sort();
  }, [activePrompts]);

  const topTags = useMemo(() => {
    const counts: Record<string, number> = {};
    activePrompts.forEach(p => p.tags.forEach(t => (counts[t] = (counts[t] || 0) + 1)));
    return Object.entries(counts).sort(([, a], [, b]) => b - a);
  }, [activePrompts]);

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    const all = [...STANDARD_CATEGORIES, ...customCategories, SPECIAL_CATEGORY_TRASH];
    all.forEach(c => (counts[c] = 0));
    counts['All'] = 0;

    prompts.forEach(p => {
      if (p.deletedAt) {
        counts[SPECIAL_CATEGORY_TRASH] += 1;
      } else {
        counts[p.category] = (counts[p.category] || 0) + 1;
        counts['All'] += 1;
      }
    });
    return counts;
  }, [prompts, customCategories]);

  return {
    prompts,
    setPrompts,
    customCategories,
    setCustomCategories,
    activePrompts,
    allTags,
    topTags,
    categoryCounts
  };
};


