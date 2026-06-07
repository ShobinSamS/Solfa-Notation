import localforage from 'localforage';
import type { ChoirProject } from '../types/project';
import { normalizeProject } from '../utils/projectModel';

const PROJECTS_KEY = 'solfatonic-projects-v1';
const SETTINGS_KEY = 'solfatonic-settings-v1';

localforage.config({
  name: 'SolfaTonic',
  storeName: 'offline_projects',
  description: 'Offline project storage for SolfaTonic choir notation files.'
});

export type AppSettings = {
  darkMode: boolean;
};

export async function loadProjects(): Promise<ChoirProject[]> {
  try {
    const projects = await localforage.getItem<ChoirProject[]>(PROJECTS_KEY);
    return Array.isArray(projects) ? projects.map(normalizeProject) : [];
  } catch (error) {
    console.error('Unable to load projects', error);
    return [];
  }
}

export async function saveProjects(projects: ChoirProject[]): Promise<void> {
  try {
    await localforage.setItem(PROJECTS_KEY, projects);
  } catch (error) {
    throw new Error('Could not save projects to offline storage.');
  }
}

export async function loadSettings(): Promise<AppSettings> {
  try {
    const settings = await localforage.getItem<AppSettings>(SETTINGS_KEY);
    return settings ?? { darkMode: false };
  } catch {
    return { darkMode: false };
  }
}

export async function saveSettings(settings: AppSettings): Promise<void> {
  await localforage.setItem(SETTINGS_KEY, settings);
}
