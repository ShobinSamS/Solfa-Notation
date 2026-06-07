import { ArrowLeft, Save } from 'lucide-react';
import { useState } from 'react';
import { Button } from '../components/Button';
import { FieldControls } from '../components/FieldControls';
import { BEATS, METERS, SCALES } from '../data/constants';
import type { ChoirProject, VoiceKey } from '../types/project';
import { createProject, defaultStyles, defaultVoices, updateProject } from '../utils/projectModel';
import { validateMeterPattern } from '../services/notationValidation';
import { useProjects } from '../context/ProjectContext';

type Props = {
  existing?: ChoirProject;
  onCancel: () => void;
  onSaved: (project: ChoirProject) => void;
};

export function ProjectForm({ existing, onCancel, onSaved }: Props) {
  const { upsertProject } = useProjects();
  const [project, setProject] = useState<ChoirProject>(
    existing ?? createProject({ title: '', scale: 'C', voices: defaultVoices, styles: defaultStyles })
  );
  const [error, setError] = useState('');

  const setVoice = (voice: VoiceKey, enabled: boolean) => {
    const nextVoices = { ...project.voices, [voice]: enabled };
    if (!Object.values(nextVoices).some(Boolean)) return;
    setProject({ ...project, voices: nextVoices });
  };

  const save = async () => {
    if (!project.title.trim()) {
      setError('Song title is required.');
      return;
    }
    if (project.metadata.meterMode === 'meter' && !validateMeterPattern(project.metadata.meter ?? '')) {
      setError('Choose a traditional meter or enter a custom numeric meter pattern.');
      return;
    }
    if (project.metadata.tempo && !Number.isInteger(project.metadata.tempo)) {
      setError('Tempo must be a whole number.');
      return;
    }
    const saved = existing ? updateProject(existing, project) : createProject(project);
    await upsertProject(saved);
    onSaved(saved);
  };

  return (
    <div className="mx-auto max-w-4xl space-y-4">
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={onCancel}>
          <ArrowLeft size={18} /> Cancel
        </Button>
        <Button onClick={() => void save()}>
          <Save size={18} /> {existing ? 'Update' : 'Save'}
        </Button>
      </div>

      <section className="rounded-lg bg-white p-4 shadow-sm dark:bg-slate-900">
        <h1 className="text-xl font-black">{existing ? 'Edit project' : 'Create project'}</h1>
        {error && <p className="mt-3 rounded-lg bg-rose-100 p-3 text-sm text-rose-800">{error}</p>}
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <label className="space-y-2 md:col-span-2">
            <span className="field-label">Title</span>
            <input
              className="form-field text-center"
              value={project.title}
              onChange={(event) => setProject({ ...project, title: event.target.value })}
              required
            />
            <FieldControls
              target="title"
              value={project.styles.title}
              onChange={(style) => setProject({ ...project, styles: { ...project.styles, title: style } })}
            />
          </label>

          {[0, 1].map((index) => (
            <label key={index} className="space-y-2">
              <span className="field-label">Subtitle {index + 1}</span>
              <input
                className="form-field text-center"
                value={project.subtitles[index]}
                onChange={(event) => {
                  const subtitles: [string, string] = [...project.subtitles] as [string, string];
                  subtitles[index] = event.target.value;
                  setProject({ ...project, subtitles });
                }}
              />
            </label>
          ))}
          <div className="md:col-span-2">
            <FieldControls
              target="subtitle"
              value={project.styles.subtitle}
              onChange={(style) => setProject({ ...project, styles: { ...project.styles, subtitle: style } })}
            />
          </div>

          <label className="space-y-2">
            <span className="field-label">Composer / Musician</span>
            <input
              className="form-field"
              value={project.metadata.composer}
              onChange={(event) =>
                setProject({ ...project, metadata: { ...project.metadata, composer: event.target.value } })
              }
            />
          </label>
          <label className="space-y-2">
            <span className="field-label">Extra composer</span>
            <input
              className="form-field text-right"
              value={project.metadata.extraComposer}
              onChange={(event) =>
                setProject({ ...project, metadata: { ...project.metadata, extraComposer: event.target.value } })
              }
            />
          </label>

          <label className="space-y-2">
            <span className="field-label">Scale</span>
            <select
              className="form-field"
              value={project.scale}
              onChange={(event) => setProject({ ...project, scale: event.target.value })}
            >
              {SCALES.map((scale) => (
                <option key={scale} value={scale}>
                  Doh in: {scale}
                </option>
              ))}
            </select>
          </label>
          <div className="space-y-2">
            <span className="field-label">SATB voices</span>
            <div className="grid grid-cols-4 gap-2">
              {(['S', 'A', 'T', 'B'] as VoiceKey[]).map((voice) => (
                <label key={voice} className="flex items-center justify-center gap-2 rounded-lg border border-slate-200 p-3 dark:border-slate-700">
                  <input type="checkbox" checked={project.voices[voice]} onChange={(event) => setVoice(voice, event.target.checked)} />
                  <span className="font-bold">{voice}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <span className="field-label">Meter / C.M.</span>
            <div className="grid grid-cols-2 gap-2">
              {(['meter', 'cm'] as const).map((mode) => (
                <label key={mode} className="flex items-center justify-center gap-2 rounded-lg border border-slate-200 p-3 dark:border-slate-700">
                  <input
                    type="radio"
                    checked={project.metadata.meterMode === mode}
                    onChange={() => setProject({ ...project, metadata: { ...project.metadata, meterMode: mode } })}
                  />
                  <span className="font-semibold">{mode === 'meter' ? 'Meter' : 'C.M.'}</span>
                </label>
              ))}
            </div>
            <select
              className="form-field text-center"
              value={METERS.includes(project.metadata.meter ?? '') ? project.metadata.meter : 'custom'}
              disabled={project.metadata.meterMode !== 'meter'}
              onChange={(event) =>
                setProject({
                  ...project,
                  metadata: { ...project.metadata, meter: event.target.value === 'custom' ? '' : event.target.value }
                })
              }
            >
              {METERS.map((meter) => (
                <option key={meter} value={meter}>
                  {meter}
                </option>
              ))}
              <option value="custom">Custom</option>
            </select>
            {!METERS.includes(project.metadata.meter ?? '') && (
              <input
                className="form-field text-center"
                value={project.metadata.meter}
                placeholder="Custom meter"
                disabled={project.metadata.meterMode !== 'meter'}
                onChange={(event) =>
                  setProject({ ...project, metadata: { ...project.metadata, meter: event.target.value } })
                }
              />
            )}
          </div>

          <div className="grid grid-cols-2 gap-2">
            <label className="space-y-2">
              <span className="field-label">Tempo</span>
              <input
                className="form-field text-right"
                type="number"
                step="1"
                value={project.metadata.tempo ?? ''}
                onChange={(event) =>
                  setProject({
                    ...project,
                    metadata: { ...project.metadata, tempo: event.target.value ? Number(event.target.value) : undefined }
                  })
                }
              />
            </label>
            <label className="space-y-2">
              <span className="field-label">Beat</span>
              <select
                className="form-field"
                value={project.metadata.beat}
                onChange={(event) =>
                  setProject({ ...project, metadata: { ...project.metadata, beat: event.target.value } })
                }
              >
                {BEATS.map((beat) => (
                  <option key={beat}>{beat}</option>
                ))}
              </select>
            </label>
          </div>

          <div className="grid gap-2 md:col-span-2 md:grid-cols-3">
            <label className="space-y-2">
              <span className="field-label">PDF/PNG title px</span>
              <input
                className="form-field text-right"
                type="number"
                min="10"
                max="40"
                step="1"
                value={project.metadata.exportTitleSize ?? project.styles.title.size}
                onChange={(event) =>
                  setProject({ ...project, metadata: { ...project.metadata, exportTitleSize: Number(event.target.value) } })
                }
              />
            </label>
            <label className="space-y-2">
              <span className="field-label">PDF/PNG notes px</span>
              <input
                className="form-field text-right"
                type="number"
                min="10"
                max="20"
                step="1"
                value={project.metadata.exportNotesSize ?? 18}
                onChange={(event) =>
                  setProject({ ...project, metadata: { ...project.metadata, exportNotesSize: Number(event.target.value) } })
                }
              />
            </label>
            <label className="space-y-2">
              <span className="field-label">PDF/PNG lyrics px</span>
              <input
                className="form-field text-right"
                type="number"
                min="10"
                max="20"
                step="1"
                value={project.metadata.exportLyricsSize ?? 14}
                onChange={(event) =>
                  setProject({ ...project, metadata: { ...project.metadata, exportLyricsSize: Number(event.target.value) } })
                }
              />
            </label>
          </div>
        </div>
      </section>
    </div>
  );
}
