import React from 'react';

export type Category = string;

export interface CategoryDef {
  id: string;
  label: string;
  isCustom: boolean;
}

export interface Theme {
  id: string;
  label: string;
  colors: {
    brand: string; 
    bg: string;
  };
  radius: string; // "0px" | "0.25rem" | "0.75rem" | "1.5rem"
  bgPattern?: 'dots' | 'grid' | 'noise' | 'none';
}

export interface Prompt {
  id: string;
  title: string;
  content: string;
  description: string;
  category: string;
  tags: string[];
  isFavorite: boolean;
  createdAt: number;
}

export type PromptFormData = Omit<Prompt, 'id' | 'createdAt'>;

export interface SidebarItem {
  icon: React.ReactNode;
  label: string;
  category: string;
  count?: number;
}