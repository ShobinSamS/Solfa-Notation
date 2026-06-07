import { BookOpen, HelpCircle, Info, Plus, Search } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useProjects } from '../context/ProjectContext';
import type { ChoirProject } from '../types/project';
import { Button } from '../components/Button';
import { ProjectCard } from '../components/ProjectCard';

type Props = {
  onCreate: () => void;
  onEdit: (project: ChoirProject) => void;
  onOpen: (project: ChoirProject) => void;
  onAbout: () => void;
  onHelp: () => void;
};

export function Dashboard({ onCreate, onEdit, onOpen, onAbout, onHelp }: Props) {
  const { projects, loading, error, deleteProject } = useProjects();
  const [query, setQuery] = useState('');
  const filteredProjects = useMemo(
    () =>
      projects.filter((project) =>
        [project.title, ...project.subtitles, project.scale].join(' ').toLowerCase().includes(query.toLowerCase())
      ),
    [projects, query]
  );

  return (
    <div className="space-y-5">
      <section className="rounded-lg bg-white p-4 shadow-sm dark:bg-slate-900">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-black">Projects</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">Create, edit, export, and rehearse offline.</p>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={onAbout} title="About">
              <Info size={17} /> About
            </Button>
            <Button variant="secondary" onClick={onHelp} title="Help">
              <HelpCircle size={17} /> Help
            </Button>
            <Button onClick={onCreate}>
              <Plus size={18} /> New
            </Button>
          </div>
        </div>
        <label className="mt-4 flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 dark:border-slate-700 dark:bg-slate-950">
          <Search size={18} className="text-slate-400" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search title, subtitle, or scale"
            className="w-full bg-transparent text-sm outline-none"
          />
        </label>
      </section>

      {error && <div className="rounded-lg bg-amber-100 p-3 text-sm text-amber-900">{error}</div>}
      {loading && <div className="rounded-lg bg-white p-5 text-sm dark:bg-slate-900">Loading offline projects...</div>}
      {!loading && filteredProjects.length === 0 && (
        <section className="rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center dark:border-slate-700 dark:bg-slate-900">
          <BookOpen className="mx-auto mb-3 text-slate-400" size={36} />
          <h2 className="text-lg font-bold">No projects yet</h2>
          <p className="mt-1 text-sm text-slate-500">Start a choir sheet and SolfaTonic will save it offline.</p>
          <Button onClick={onCreate} className="mt-4">
            <Plus size={18} /> Create project
          </Button>
        </section>
      )}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {filteredProjects.map((project) => (
          <ProjectCard
            key={project.id}
            project={project}
            onOpen={() => onOpen(project)}
            onEdit={() => onEdit(project)}
            onDelete={() => {
              if (window.confirm(`Delete "${project.title}"? This cannot be undone.`)) {
                void deleteProject(project.id);
              }
            }}
          />
        ))}
      </section>
    </div>
  );
}
