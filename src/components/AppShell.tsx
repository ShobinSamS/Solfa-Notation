import { Moon, Sun } from 'lucide-react';
import { Button } from './Button';
import { useProjects } from '../context/ProjectContext';

export function AppShell({ children, compact = false }: { children: React.ReactNode; compact?: boolean }) {
  const { darkMode, toggleDarkMode } = useProjects();

  return (
    <div className={`app-shell min-h-screen bg-slate-100 text-slate-950 transition dark:bg-slate-950 dark:text-slate-100 ${compact ? 'app-shell-compact' : ''}`}>
      <header className="app-header sticky top-0 z-30 border-b border-slate-200/80 bg-white/90 px-4 py-3 backdrop-blur dark:border-slate-800 dark:bg-slate-950/90">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/icons/solfatonic.svg" alt="" className="h-9 w-9 rounded-xl" />
            <div>
              <p className="text-base font-black tracking-normal">SolfaTonic</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">Offline SATB choir notation</p>
            </div>
          </div>
          <Button
            variant="secondary"
            aria-label="Toggle dark mode"
            title="Toggle dark mode"
            onClick={() => void toggleDarkMode()}
            className="h-11 w-11 px-0"
          >
            {darkMode ? <Sun size={18} /> : <Moon size={18} />}
          </Button>
        </div>
      </header>
      <main className="app-main mx-auto max-w-7xl px-4 py-5">{children}</main>
    </div>
  );
}
