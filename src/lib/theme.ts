import { createContext, useContext } from 'react';

export type Theme = 'dark' | 'light';

export interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

export const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

export function getSystemTheme(): Theme {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function applyTheme(theme: Theme) {
  const root = document.documentElement;
  const isDark = theme === 'dark';

  // Remove existing theme classes
  root.classList.remove('dark', 'light');
  
  // Add new theme class
  root.classList.add(theme);
  
  // Update color scheme
  root.style.colorScheme = theme;

  // Update theme colors
  if (isDark) {
    root.style.setProperty('--color-background', '10, 15, 45');
    root.style.setProperty('--color-text', '255, 255, 255');
    root.style.setProperty('--color-text-secondary', '209, 213, 219');
  } else {
    root.style.setProperty('--color-background', '255, 255, 255');
    root.style.setProperty('--color-text', '17, 24, 39');
    root.style.setProperty('--color-text-secondary', '107, 114, 128');
  }
}