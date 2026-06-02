import { useEffect, useState } from 'react';

export type Theme = 'light' | 'dark' | 'system';

const getSystemPreference = (): 'light' | 'dark' =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light';

const applyTheme = (theme: Theme) => {
  const resolved = theme === 'system' ? getSystemPreference() : theme;
  document.documentElement.setAttribute('data-theme', resolved);
};

export const useTheme = () => {
  const [theme, setTheme] = useState<Theme>('system');

  useEffect(() => {
    const saved = (localStorage.getItem('theme') as Theme) || 'system';
    setTheme(saved);
    applyTheme(saved);
  }, []);

  const changeTheme = (t: Theme) => {
    setTheme(t);
    localStorage.setItem('theme', t);
    applyTheme(t);
  };

  return { theme, changeTheme };
};
