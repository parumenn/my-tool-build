import { LucideIcon } from 'lucide-react';

export interface Tool {
  id: string;
  name: string;
  path: string;
  description: string;
  icon: LucideIcon;
  color: string;
  darkColor?: string; // Color for dark mode
}

export enum FileStatus {
  IDLE = 'idle',
  PROCESSING = 'processing',
  DONE = 'done',
  ERROR = 'error',
}