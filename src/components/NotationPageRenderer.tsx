import type React from 'react';
import type { ChoirProject, LyricCursor, LyricLine, MeasureCursor, NotationBlock as ProjectNotationBlock, NotationPage } from '../types/project';
import { NotationBlock } from './NotationBlock';
import type { NotationMode } from './A4BlockEditor';
import { MAX_BLOCKS_PER_PAGE } from '../data/constants';

type Props = {
  project: ChoirProject;
  page: NotationPage;
  pageNumber: number;
  mode?: NotationMode;
  activeCursor: MeasureCursor | null;
  activeLyricCursor: LyricCursor | null;
  onFocusCursor: (cursor: MeasureCursor) => void;
  onFocusLyricCursor: (cursor: LyricCursor) => void;
  onChangeBlock: (block: ProjectNotationBlock) => void;
  onMoveBlock: (blockId: string, direction: -1 | 1) => void;
  onDeleteBlock: (blockId: string) => void;
  onAddTopLyric: (blockId: string) => void;
  onAddMiddleLyric: (blockId: string) => void;
  onAddBottomLyric: (blockId: string) => void;
  onDeleteLyricLine: (blockId: string, lineId: string) => void;
  onChangeLyricLine: (blockId: string, line: LyricLine, cursor: LyricCursor) => void;
};

export function NotationPageRenderer({
  project,
  page,
  pageNumber,
  mode = 'edit',
  activeCursor,
  activeLyricCursor,
  onFocusCursor,
  onFocusLyricCursor,
  onChangeBlock,
  onMoveBlock,
  onDeleteBlock,
  onAddTopLyric,
  onAddMiddleLyric,
  onAddBottomLyric,
  onDeleteLyricLine,
  onChangeLyricLine
}: Props) {
  const exportSizing = {
    '--export-title-font-size': `${project.metadata.exportTitleSize ?? project.styles.title.size}px`,
    '--export-notes-font-size': `${project.metadata.exportNotesSize ?? 18}px`,
    '--export-lyrics-font-size': `${project.metadata.exportLyricsSize ?? 14}px`
  } as React.CSSProperties;

  return (
    <section className={`a4-page a4-page-${mode}`} data-export-page data-page-number={pageNumber} style={exportSizing}>
      <header className="a4-header">
        <div className="flex justify-between text-left text-[10px] text-slate-600">
          <span style={{ fontFamily: project.styles.metadata.family, fontSize: project.styles.metadata.size }}>
            {project.metadata.composer}
          </span>
          <span style={{ fontFamily: project.styles.metadata.family, fontSize: project.styles.metadata.size }}>
            {project.metadata.extraComposer}
          </span>
        </div>
        <h1 className="font-bold" style={{ fontFamily: project.styles.title.family, fontSize: project.styles.title.size }}>
          {project.title || 'Untitled'}
        </h1>
        {project.subtitles.map((subtitle, index) => (
          <p key={index} style={{ fontFamily: project.styles.subtitle.family, fontSize: project.styles.subtitle.size }}>
            {subtitle}
          </p>
        ))}
        <div className="mt-2 flex justify-between text-left text-[10px] text-slate-600">
          <span>Doh in: {project.scale}</span>
          <span>
            {project.metadata.meterMode === 'meter' ? project.metadata.meter : 'C.M.'}
            {project.metadata.tempo ? ` - ${project.metadata.tempo} ${project.metadata.beat}` : ''}
          </span>
        </div>
      </header>

      <div className="a4-block-stack">
        {page.blocks.slice(0, MAX_BLOCKS_PER_PAGE).map((block, index) => (
          <NotationBlock
            key={block.id}
            block={block}
            blockNumber={(pageNumber - 1) * MAX_BLOCKS_PER_PAGE + index + 1}
            enabledVoices={project.voices}
            styles={project.styles}
            beat={project.metadata.beat ?? '4/4'}
            mode={mode}
            activeCursor={activeCursor}
            activeLyricCursor={activeLyricCursor}
            onFocusCursor={onFocusCursor}
            onFocusLyricCursor={onFocusLyricCursor}
            onChangeBlock={onChangeBlock}
            onMoveUp={() => onMoveBlock(block.id, -1)}
            onMoveDown={() => onMoveBlock(block.id, 1)}
            onDeleteBlock={() => onDeleteBlock(block.id)}
            onAddTopLyric={() => onAddTopLyric(block.id)}
            onAddMiddleLyric={() => onAddMiddleLyric(block.id)}
            onAddBottomLyric={() => onAddBottomLyric(block.id)}
            onDeleteLyricLine={(lineId) => onDeleteLyricLine(block.id, lineId)}
            onChangeLyricLine={(line, cursor) => onChangeLyricLine(block.id, line, cursor)}
          />
        ))}
      </div>
    </section>
  );
}
