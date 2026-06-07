import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ChoirProject } from '../types/project';
import { loadProjects, loadSettings, saveProjects, saveSettings } from '../services/storageService';

type ProjectContextValue = {
  projects: ChoirProject[];
  loading: boolean;
  error: string;
  darkMode: boolean;
  upsertProject: (project: ChoirProject) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
  toggleDarkMode: () => Promise<void>;
};

const ProjectContext = createContext<ProjectContextValue | undefined>(undefined);

export function ProjectProvider({ children }: { children: React.ReactNode }) {
  const [projects, setProjects] = useState<ChoirProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    Promise.all([loadProjects(), loadSettings()])
      .then(([storedProjects, settings]) => {
        setProjects(storedProjects);
        setDarkMode(settings.darkMode);
      })
      .catch(() => setError('SofaTonic recovered from a local data loading problem.'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
  }, [darkMode]);

  const persist = useCallback(async (nextProjects: ChoirProject[]) => {
    setProjects(nextProjects);
    await saveProjects(nextProjects);
  }, []);

  const upsertProject = useCallback(
    async (project: ChoirProject) => {
      const nextProjects = [project, ...projects.filter((item) => item.id !== project.id)].sort(
        (a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt)
      );
      await persist(nextProjects);
    },
    [persist, projects]
  );

  const deleteProject = useCallback(
    async (id: string) => {
      await persist(projects.filter((project) => project.id !== id));
    },
    [persist, projects]
  );

  const toggleDarkMode = useCallback(async () => {
    const nextValue = !darkMode;
    setDarkMode(nextValue);
    await saveSettings({ darkMode: nextValue });
  }, [darkMode]);

  const value = useMemo(
    () => ({ projects, loading, error, darkMode, upsertProject, deleteProject, toggleDarkMode }),
    [projects, loading, error, darkMode, upsertProject, deleteProject, toggleDarkMode]
  );

  return <ProjectContext.Provider value={value}>{children}</ProjectContext.Provider>;
}

export function useProjects(): ProjectContextValue {
  const context = useContext(ProjectContext);
  if (!context) {
    throw new Error('useProjects must be used inside ProjectProvider.');
  }
  return context;
}
