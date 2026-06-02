import React, { useRef, useState, useEffect } from 'react';
import Link from 'next/link';
import { useTheme, Theme } from '../../hooks/useTheme';
import styles from './BlogNav.module.css';

const SearchIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);

const ThemeIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3" />
    <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
  </svg>
);

interface BlogNavProps {
  onSearch?: (query: string) => void;
  showSearch?: boolean;
}

const BlogNav: React.FC<BlogNavProps> = ({ onSearch, showSearch = false }) => {
  const { theme, changeTheme } = useTheme();
  const [themeOpen, setThemeOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setThemeOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (searchOpen) searchRef.current?.focus();
  }, [searchOpen]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    onSearch?.(e.target.value);
  };

  const themeOptions: { value: Theme; label: string; icon: string }[] = [
    { value: 'light', label: 'Light', icon: '☀️' },
    { value: 'dark', label: 'Dark', icon: '🌙' },
    { value: 'system', label: 'System', icon: '💻' },
  ];

  return (
    <nav className={styles.nav}>
      <div className={styles.inner}>
      <Link href="/blog"><a className={styles.brand}>Viorel Buliga</a></Link>

      <div className={styles.center}>
        <Link href="/"><a className={styles.navLink}>About me</a></Link>
      </div>

      <div className={styles.actions}>
        {showSearch && (
          <div className={styles.searchWrapper}>
            {searchOpen ? (
              <input
                ref={searchRef}
                className={styles.searchInput}
                value={searchQuery}
                onChange={handleSearch}
                placeholder="Search articles..."
                onBlur={() => { if (!searchQuery) setSearchOpen(false); }}
              />
            ) : (
              <button className={styles.iconBtn} onClick={() => setSearchOpen(true)} aria-label="Search">
                <SearchIcon />
              </button>
            )}
          </div>
        )}

        <div className={styles.themeWrapper} ref={dropdownRef}>
          <button className={styles.iconBtn} onClick={() => setThemeOpen(v => !v)} aria-label="Toggle theme">
            <ThemeIcon />
          </button>
          {themeOpen && (
            <div className={styles.dropdown}>
              {themeOptions.map(opt => (
                <button
                  key={opt.value}
                  className={`${styles.dropdownItem} ${theme === opt.value ? styles.active : ''}`}
                  onClick={() => { changeTheme(opt.value); setThemeOpen(false); }}
                >
                  <span>{opt.icon}</span>
                  {opt.label}
                  {theme === opt.value && <span className={styles.check}>✓</span>}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
      </div>
    </nav>
  );
};

export default BlogNav;
