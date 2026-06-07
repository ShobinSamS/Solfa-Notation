import { Edit3, Trash2 } from 'lucide-react';
import type { ChoirProject } from '../types/project';
import { formatUpdatedAt } from '../utils/projectModel';
import { Button } from './Button';

type Props = {
  project: ChoirProject;
  onOpen: () => void;
  onEdit: () => void;
  onDelete: () => void;
};

export function ProjectCard({ project, onOpen, onEdit, onDelete }: Props) {
  const meter = project.metadata.meterMode === 'cm' ? 'CM' : project.metadata.meter || 'Custom';

  return (
    <article className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <button className="block w-full text-left" onClick={onOpen}>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="truncate text-lg font-bold">{project.title}</h2>
          </div>
        </div>
        <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
          <div>
            <dt className="text-slate-500 dark:text-slate-400">Meter</dt>
            <dd className="font-semibold">{meter}</dd>
          </div>
          <div>
            <dt className="text-slate-500 dark:text-slate-400">Scale</dt>
            <dd className="font-semibold">Doh in: {project.scale}</dd>
          </div>
          <div className="col-span-2">
            <dt className="text-slate-500 dark:text-slate-400">Updated</dt>
            <dd className="font-semibold">{formatUpdatedAt(project.updatedAt)}</dd>
          </div>
        </dl>
      </button>
      <div className="mt-4 flex gap-2">
        <Button variant="secondary" onClick={onEdit} className="flex-1">
          <Edit3 size={16} /> Edit
        </Button>
        <Button variant="danger" onClick={onDelete} className="h-11 w-12 px-0" title="Delete project">
          <Trash2 size={16} />
        </Button>
      </div>
    </article>
  );
}
