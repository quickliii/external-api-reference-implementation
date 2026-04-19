import { useState, type ReactNode } from 'react';
import { TerminalIcon } from './icons';
type Page = 'explorer' | 'transform';

type SidebarProps = {
  currentPage: Page;
  onPageChange: (page: Page) => void;
  children?: ReactNode;
};

function SwapIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3.5 5.5H12.5M10 3L12.5 5.5L10 8" />
      <path d="M12.5 10.5H3.5M6 8L3.5 10.5L6 13" />
    </svg>
  );
}

function DocIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 2H10.5L13 4.5V14H4V2Z" />
      <path d="M10.5 2V4.5H13" />
      <path d="M6.5 8H10.5M6.5 10.5H10.5" />
    </svg>
  );
}

function SunIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <circle cx="8" cy="8" r="3" />
      <path d="M8 2V3.5M8 12.5V14M2 8H3.5M12.5 8H14M3.75 3.75L4.8 4.8M11.2 11.2L12.25 12.25M3.75 12.25L4.8 11.2M11.2 4.8L12.25 3.75" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M13 9.5A5.5 5.5 0 116.5 3a4.5 4.5 0 006.5 6.5z" />
    </svg>
  );
}

export function Sidebar({ currentPage, onPageChange, children }: SidebarProps) {
  const [isDark, setIsDark] = useState(() => {
    const stored = localStorage.getItem('quickli-theme');
    return stored ? stored === 'dark' : true;
  });

  const toggleTheme = () => {
    const next = !isDark;
    setIsDark(next);
    document.documentElement.classList.toggle('dark', next);
    localStorage.setItem('quickli-theme', next ? 'dark' : 'light');
  };

  const navItem = (page: Page, icon: ReactNode, label: string) => (
    <button
      key={page}
      onClick={() => onPageChange(page)}
      className={`flex items-center gap-2.5 w-full text-left px-4 py-2.5 text-[13px] border-l-2 transition-all ${
        currentPage === page
          ? 'text-slate-900 dark:text-slate-100 border-slate-900 dark:border-brand-400 bg-slate-900/5 dark:bg-brand-400/5'
          : 'text-slate-500 dark:text-slate-400 border-transparent hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-500/5'
      }`}
    >
      <span className="w-5 flex items-center justify-center">{icon}</span>
      {label}
    </button>
  );

  return (
    <aside className="w-80 min-w-[320px] bg-slate-50 dark:bg-navy-900 border-r border-slate-200 dark:border-navy-600 flex flex-col h-screen sticky top-0">
      <div className="px-4 py-5">
        <div className="mb-2">
          <img src={isDark ? '/quickli-nav-white.svg' : '/quickli-nav-dark.svg'} alt="Quickli" className="h-5" />
        </div>
        <span className="text-slate-500 dark:text-slate-400 text-xs">External API Tools</span>
      </div>
      <div className="flex-1 overflow-y-auto">
        <nav className="py-3">
          <div className="text-slate-400 dark:text-slate-500 text-[11px] font-semibold uppercase tracking-wider px-4 pt-3 pb-2">Tools</div>
          {navItem('explorer', <TerminalIcon />, 'API Explorer')}
          {navItem('transform', <SwapIcon />, 'v2 ↔ v3 Transform')}
        </nav>
        {children}
        <div className="px-4 py-3">
          <div className="text-slate-400 dark:text-slate-500 text-[11px] font-semibold uppercase tracking-wider pb-2">Resources</div>
          <a href="https://external-api.quickli.com.au" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 py-2 text-slate-500 dark:text-slate-400 text-xs hover:text-slate-900 dark:hover:text-slate-100 transition-colors">
            <DocIcon />
            <span>API Documentation</span>
            <span className="ml-auto text-[10px] opacity-50">&#8599;</span>
          </a>
        </div>
      </div>
      <div className="px-4 py-3 border-t border-slate-200 dark:border-navy-600">
        <button
          onClick={toggleTheme}
          className="flex items-center gap-2 bg-slate-100 dark:bg-navy-700 border border-slate-200 dark:border-navy-600 text-slate-500 dark:text-slate-400 rounded-md px-3 py-1.5 text-xs hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
        >
          {isDark ? <SunIcon /> : <MoonIcon />}
          {isDark ? 'Light mode' : 'Dark mode'}
        </button>
      </div>
    </aside>
  );
}

export type { Page };
