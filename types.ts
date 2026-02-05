
import { LucideIcon } from 'lucide-react';

export interface Tool {
  id: string;
  name: string;
  path: string;
  description: string;
  longDescription?: string; // Enhanced description for SEO
  keywords?: string[]; // Specific keywords for meta tags
  icon: LucideIcon;
  color: string;
  lightBg: string; // Add explicit light background color for icons
  darkColor?: string; // Color for dark mode
  isExternal?: boolean; // Flag for external/static pages
  hideOnMobile?: boolean; // Flag to hide tool on mobile devices
}

export enum FileStatus {
  IDLE = 'idle',
  PROCESSING = 'processing',
  DONE = 'done',
  ERROR = 'error',
}
