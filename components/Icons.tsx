import React from 'react';
import { 
  Code2, 
  PenTool, 
  Lightbulb, 
  BarChart3, 
  Smile, 
  Box, 
  LayoutGrid, 
  Search, 
  Plus, 
  MoreHorizontal, 
  Copy, 
  Trash2, 
  Edit3,
  X,
  Star,
  Zap,
  Download,
  Upload,
  Check,
  FileJson,
  Sparkles,
  CopyPlus,
  ClipboardCheck,
  Eye,
  Hash,
  Palette
} from 'lucide-react';

export const Icons = {
  Code: Code2,
  Writing: PenTool,
  Ideas: Lightbulb,
  Analysis: BarChart3,
  Fun: Smile,
  Misc: Box,
  All: LayoutGrid,
  Search,
  Plus,
  More: MoreHorizontal,
  Copy,
  CopyPlus,
  ClipboardCheck,
  Run: Zap,
  Delete: Trash2,
  Edit: Edit3,
  Close: X,
  Star,
  Download,
  Upload,
  Check,
  FileJson,
  Sparkles,
  Eye,
  Hash,
  Palette
};

export const getIconForCategory = (category: string) => {
    switch (category) {
        case 'Code': return Icons.Code;
        case 'Writing': return Icons.Writing;
        case 'Ideas': return Icons.Ideas;
        case 'Analysis': return Icons.Analysis;
        case 'Fun': return Icons.Fun;
        case 'Misc': return Icons.Misc;
        case 'All': return Icons.All;
        default: return Icons.Hash;
    }
};