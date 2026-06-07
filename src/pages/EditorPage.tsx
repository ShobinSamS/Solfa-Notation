import { ArrowLeft, Download, Eye, EyeOff, FileImage, Minus, Plus, Printer, Save } from 'lucide-react';
import type React from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { NotationPageRenderer } from '../components/NotationPageRenderer';
import { Button } from '../components/Button';
import { NotationToolbar } from '../components/NotationToolbar';
import { useProjects } from '../context/ProjectContext';
import type { ChoirProject, LyricCursor, LyricLine, MeasureCursor, NotationBlock } from '../types/project';
import { validateMeterPattern, validatePageBlockCount } from '../services/notationValidation';
import { backspaceToken } from '../services/measureEditing';
import { insertProjectToken } from '../services/projectEditing';
import { backspaceLyric, insertLyricCharacter } from '../services/lyricEditing';
import { exportProjectPdf, exportProjectPng } from '../services/exportUtils';
import { createBlock, deleteBlock, enforceFiveBlocksPerPage, moveBlock, updateProject } from '../utils/projectModel';
import { useDebouncedEffect } from '../hooks/useDebouncedEffect';

type Props = {
  project: ChoirProject;
  onBack: () => void;
};

export function EditorPage({ project: initialProject, onBack }: Props) {
  const { upsertProject } = useProjects();
  const [project, setProject] = useState(() => enforceFiveBlocksPerPage(initialProject));
  const firstBlock = project.pages[0]?.blocks[0];
  const [activeCursor, setActiveCursor] = useState<MeasureCursor | null>(
    firstBlock ? { blockId: firstBlock.id, measureIndex: 0, voice: 'S', tokenIndex: firstBlock.measures[0]?.voices.S.length ?? 0 } : null
  );
  const [activeLyricCursor, setActiveLyricCursor] = useState<LyricCursor | null>(null);
  const [activeInputType, setActiveInputType] = useState<'notation' | 'lyric'>('notation');
  const [status, setStatus] = useState('Saved offline');
  const [previewMode, setPreviewMode] = useState(false);
  const [groupMode, setGroupMode] = useState(false);
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [pageZoom, setPageZoom] = useState(1);
  const exportRef = useRef<HTMLDivElement>(null);
  const mobileLyricInputRef = useRef<HTMLInputElement>(null);

  const projectWarnings = useMemo(() => {
    const warnings: string[] = [];
    if (!project.title.trim()) warnings.push('Missing title.');
    if (!project.scale.trim()) warnings.push('Missing scale.');
    if (project.metadata.meterMode === 'meter' && !validateMeterPattern(project.metadata.meter ?? '')) warnings.push('Invalid meter format.');
    project.pages.forEach((page) => validatePageBlockCount(page).forEach((issue) => warnings.push(issue.message)));
    return warnings;
  }, [project]);

  useDebouncedEffect(() => {
    void upsertProject(updateProject(project, {}))
      .then(() => setStatus('Auto-saved offline'))
      .catch(() => setStatus('Save failed. Your latest edit is still on this page.'));
  }, [project], 700);

  const updateBlock = (nextBlock: NotationBlock) => {
    setProject((current) => ({
      ...current,
      pages: current.pages.map((page) => ({
        ...page,
        blocks: page.blocks.map((block) => (block.id === nextBlock.id ? nextBlock : block))
      }))
    }));
  };

  const editActiveBlock = (edit: (block: NotationBlock, cursor: MeasureCursor) => { block: NotationBlock; cursor: MeasureCursor; warning?: string; rejected?: boolean }) => {
    if (!activeCursor || activeInputType === 'lyric') return;
    const block = project.pages.flatMap((page) => page.blocks).find((item) => item.id === activeCursor.blockId);
    if (!block) return;
    const result = edit(block, activeCursor);
    if (result.rejected) {
      setStatus(result.warning ?? 'Invalid measure edit.');
      return;
    }
    updateBlock(result.block);
    setActiveCursor(result.cursor);
  };

  const insertToken = (token: string) => {
    if (!activeCursor || activeInputType === 'lyric') return;
    const result = insertProjectToken(project, activeCursor, token, groupMode);
    if (result.rejected) {
      setStatus(result.warning ?? 'Invalid measure edit.');
      return;
    }
    setProject(result.project);
    setActiveCursor(result.cursor);
    const pageIndex = result.project.pages.findIndex((page) => page.blocks.some((block) => block.id === result.cursor.blockId));
    if (pageIndex >= 0) setCurrentPageIndex(pageIndex);
  };

  const backspace = () => {
    if (activeInputType === 'lyric' && activeLyricCursor) {
      editActiveLyric((line, cursor) => backspaceLyric(line, cursor));
      return;
    }
    editActiveBlock((block, cursor) => backspaceToken(block, cursor));
  };

  const applyOctave = (octave: string) => {
    if (activeInputType === 'lyric') return;
    editActiveBlock((block, cursor) => {
      const measure = block.measures[cursor.measureIndex];
      if (!measure) return { block, cursor };
      const tokens = [...measure.voices[cursor.voice]];
      for (let index = Math.min(cursor.tokenIndex - 1, tokens.length - 1); index >= 0; index -= 1) {
        const token = tokens[index];
        if (token.type === 'note') {
          tokens[index] = { ...token, octave };
          const measures = [...block.measures];
          measures[cursor.measureIndex] = { ...measure, voices: { ...measure.voices, [cursor.voice]: tokens } };
          return { block: { ...block, measures }, cursor };
        }
      }
      return { block, cursor };
    });
  };

  const editActiveLyric = (edit: (line: LyricLine, cursor: LyricCursor) => { line: LyricLine; cursor: LyricCursor }) => {
    if (!activeLyricCursor) return;
    patchBlock(activeLyricCursor.blockId, (block) => {
      const line = block.lyricLines.find((item) => item.id === activeLyricCursor.lyricLineId);
      if (!line) return block;
      const result = edit(line, activeLyricCursor);
      setActiveLyricCursor(result.cursor);
      return { ...block, lyricLines: block.lyricLines.map((item) => (item.id === line.id ? result.line : item)) };
    });
  };

  const addBlock = () => {
    const block = createBlock();
    setProject((current) => {
      const lastPageIndex = Math.max(current.pages.length - 1, 0);
      const pages = current.pages.length ? current.pages : [{ id: `page-${Date.now()}`, blocks: [] }];
      const nextProject = enforceFiveBlocksPerPage({
        ...current,
        pages: pages.map((page, index) => (index === lastPageIndex ? { ...page, blocks: [...page.blocks, block] } : page))
      });
      return nextProject;
    });
    setActiveCursor({ blockId: block.id, measureIndex: 0, voice: 'S', tokenIndex: 0 });
    setActiveInputType('notation');
  };

  const handleMoveBlock = (blockId: string, direction: -1 | 1) => {
    setProject((current) => moveBlock(current, blockId, direction));
  };

  const handleDeleteBlock = (blockId: string) => {
    setProject((current) => {
      const nextProject = deleteBlock(current, blockId);
      const nextBlock = nextProject.pages[0]?.blocks[0];
      if (activeCursor?.blockId === blockId) {
        setActiveCursor(nextBlock ? { blockId: nextBlock.id, measureIndex: 0, voice: 'S', tokenIndex: nextBlock.measures[0]?.voices.S.length ?? 0 } : null);
        setActiveInputType('notation');
        setActiveLyricCursor(null);
      }
      return nextProject;
    });
  };

  const patchBlock = (blockId: string, patch: (block: NotationBlock) => NotationBlock) => {
    setProject((current) => ({
      ...current,
      pages: current.pages.map((page) => ({
        ...page,
        blocks: page.blocks.map((block) => (block.id === blockId ? patch(block) : block))
      }))
    }));
  };

  const pages = exportRef.current ? Array.from(exportRef.current.querySelectorAll<HTMLElement>('[data-export-page]')) : [];
  useEffect(() => {
    if (activeInputType !== 'lyric' || !activeLyricCursor || previewMode) return;
    const handle = window.setTimeout(() => mobileLyricInputRef.current?.focus(), 30);
    return () => window.clearTimeout(handle);
  }, [activeInputType, activeLyricCursor, previewMode]);

  const handleEditorKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (previewMode) return;
    const target = event.target as HTMLElement;
    if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || target.isContentEditable) return;
    if (!activeLyricCursor) return;
    if (event.key === 'Backspace') {
      event.preventDefault();
      backspace();
      return;
    }
    if (event.key === ' ') {
      event.preventDefault();
      editActiveLyric((line, cursor) => insertLyricCharacter(line, cursor, ' '));
      return;
    }
    if (event.key.length === 1) {
      event.preventDefault();
      editActiveLyric((line, cursor) => insertLyricCharacter(line, cursor, event.key));
    }
  };

  const handleMobileLyricInput = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.currentTarget.value;
    event.currentTarget.value = '';
    if (!value || activeInputType !== 'lyric' || !activeLyricCursor) return;
    editActiveLyric((line, cursor) => {
      let nextLine = line;
      let nextCursor = cursor;
      Array.from(value).forEach((character) => {
        const result = insertLyricCharacter(nextLine, nextCursor, character);
        nextLine = result.line;
        nextCursor = result.cursor;
      });
      return { line: nextLine, cursor: nextCursor };
    });
  };

  return (
    <div className={`editor-shell ${previewMode ? 'print-preview-mode' : ''}`} onKeyDown={handleEditorKeyDown}>
      <input
        ref={mobileLyricInputRef}
        className="mobile-lyric-keyboard-input"
        aria-label="Mobile lyric input"
        autoCapitalize="sentences"
        autoCorrect="on"
        inputMode="text"
        onChange={handleMobileLyricInput}
        onKeyDown={(event) => {
          if (activeInputType !== 'lyric' || !activeLyricCursor) return;
          if (event.key === 'Backspace') {
            event.preventDefault();
            backspace();
          }
        }}
      />
      {previewMode && (
        <div className="preview-topbar print:hidden">
          <Button variant="secondary" onClick={() => setPreviewMode(false)}>
            <ArrowLeft size={17} /> Back to editor
          </Button>
        </div>
      )}

      <div className="editor-topbar" data-export-ignore>
        <Button variant="ghost" onClick={onBack}>
          <ArrowLeft size={18} /> Dashboard
        </Button>
        <div className="editor-actions flex flex-wrap gap-2">
          <Button title="Zoom out" variant="secondary" onClick={() => setPageZoom((value) => Math.max(0.72, Number((value - 0.12).toFixed(2))))}>
            <Minus size={17} /> Zoom
          </Button>
          <Button title="Zoom in" variant="secondary" onClick={() => setPageZoom((value) => Math.min(1.35, Number((value + 0.12).toFixed(2))))}>
            <Plus size={17} /> Zoom
          </Button>
          <Button title="Add SATB block" variant="secondary" onClick={addBlock}>
            <Plus size={17} /> Block
          </Button>
          <Button title={previewMode ? 'Exit preview' : 'Preview'} variant="secondary" onClick={() => setPreviewMode((value) => !value)}>
            {previewMode ? <EyeOff size={17} /> : <Eye size={17} />} Preview
          </Button>
          <Button title="Print" variant="secondary" onClick={() => window.print()}>
            <Printer size={17} /> Print
          </Button>
          <Button title="Export PNG" variant="secondary" onClick={() => void exportProjectPng(project, pages).catch((error) => setStatus(`Export failed: ${error.message}`))}>
            <FileImage size={17} /> PNG
          </Button>
          <Button title="Export PDF" onClick={() => void exportProjectPdf(project, pages).catch((error) => setStatus(`Export failed: ${error.message}`))}>
            <Download size={17} /> PDF
          </Button>
        </div>
      </div>

      {projectWarnings.length > 0 && (
        <section className="rounded-lg bg-amber-100 p-3 text-sm text-amber-950 print:hidden" data-export-ignore>
          {projectWarnings.slice(0, 4).map((warning) => (
            <p key={warning}>{warning}</p>
          ))}
        </section>
      )}

      <div className="editor-grid">
        <NotationToolbar
          groupMode={groupMode}
          onInsert={insertToken}
          onOctave={applyOctave}
          onBackspace={backspace}
          onToggleGroupMode={() => setGroupMode((value) => !value)}
        />
        <div className="min-w-0 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-white px-3 py-2 text-sm text-slate-500 shadow-sm dark:bg-slate-900 print:hidden" data-export-ignore>
            <span className="inline-flex items-center gap-2">
              <Save size={15} /> {status}
            </span>
            <label className="inline-flex items-center gap-2">
              Page
              <select className="form-field w-auto py-1" value={currentPageIndex} onChange={(event) => setCurrentPageIndex(Number(event.target.value))}>
                {project.pages.map((page, index) => (
                  <option key={page.id} value={index}>
                    {index + 1}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div ref={exportRef} className="a4-scroll" style={{ '--a4-zoom': pageZoom } as React.CSSProperties}>
            {project.pages.map((page, index) => (
              <NotationPageRenderer
                key={page.id}
                project={project}
                page={page}
                pageNumber={index + 1}
                mode={previewMode ? 'preview' : 'edit'}
                activeCursor={activeCursor}
                activeLyricCursor={activeLyricCursor}
                onFocusCursor={(cursor) => {
                  setActiveCursor(cursor);
                  setActiveLyricCursor(null);
                  setActiveInputType('notation');
                }}
                onFocusLyricCursor={(cursor) => {
                  setActiveLyricCursor(cursor);
                  setActiveInputType('lyric');
                  mobileLyricInputRef.current?.focus();
                }}
                onChangeBlock={updateBlock}
                onMoveBlock={handleMoveBlock}
                onDeleteBlock={handleDeleteBlock}
                onAddTopLyric={(blockId) => patchBlock(blockId, (block) => ({ ...block, lyricLines: [...block.lyricLines, { id: `lyric-${Date.now()}`, position: 'top', text: '', slots: [] }] }))}
                onAddMiddleLyric={(blockId) =>
                  patchBlock(blockId, (block) =>
                    block.lyricLines.filter((line) => line.position === 'middle').length < 6
                      ? { ...block, lyricLines: [...block.lyricLines, { id: `lyric-${Date.now()}`, position: 'middle', text: '', slots: [] }] }
                      : block
                  )
                }
                onAddBottomLyric={(blockId) => patchBlock(blockId, (block) => ({ ...block, lyricLines: [...block.lyricLines, { id: `lyric-${Date.now()}`, position: 'bottom', text: '', slots: [] }] }))}
                onDeleteLyricLine={(blockId, lineId) =>
                  patchBlock(blockId, (block) => ({ ...block, lyricLines: block.lyricLines.filter((line) => line.id !== lineId) }))
                }
                onChangeLyricLine={(blockId, line, cursor) => {
                  setActiveLyricCursor(cursor);
                  setActiveInputType('lyric');
                  patchBlock(blockId, (block) => ({ ...block, lyricLines: block.lyricLines.map((item) => (item.id === line.id ? line : item)) }));
                }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
