import { createContext, useContext, useEffect, useMemo, useState } from 'react';

// Theme types
export type Theme = 'dark' | 'light' | 'system';

type ThemeProviderProps = {
  children: React.ReactNode;
  defaultTheme?: Theme;
  storageKey?: string;
};

export type ThemeContextValue = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
};

// Create context without default to catch misuse
const ThemeProviderContext = createContext<ThemeContextValue | undefined>(undefined);

export function ThemeProvider({
  children,
  defaultTheme = 'system',
  storageKey = 'ui-theme',
}: ThemeProviderProps) {
  const getInitialTheme = () => {
    try {
      const stored = localStorage.getItem(storageKey) as Theme | null;
      return stored ?? defaultTheme;
    } catch {
      return defaultTheme;
    }
  };

  const [theme, setTheme] = useState<Theme>(getInitialTheme);

  useEffect(() => {
    try {
      const root = window.document.documentElement;
      root.classList.remove('light', 'dark');

      const resolved = theme === 'system'
        ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
        : theme;

      root.classList.add(resolved);
      localStorage.setItem(storageKey, theme);
    } catch {
      // no-op in non-browser environments
    }
  }, [theme, storageKey]);

  const value = useMemo<ThemeContextValue>(() => ({
    theme,
    setTheme,
  }), [theme]);

  return (
    <ThemeProviderContext.Provider value={value}>
      {children}
    </ThemeProviderContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeProviderContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
