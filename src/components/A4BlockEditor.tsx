import { GripVertical, MoveDown, MoveUp, Plus, Trash2 } from 'lucide-react';
import type { ChoirProject, LyricCursor, LyricLine, MeasureCursor, NotationBlock, VoiceKey, VoiceSelection } from '../types/project';
import { measureWarnings, tokenText, trimMeasuresAfterEnding } from '../services/measureEditing';
import { backspaceLyric, computeMeasureGrid, insertLyricCharacter, lyricTextAt } from '../services/lyricEditing';
import { validateMiddleLyrics } from '../services/notationValidation';

export type EditableRow =
  { blockId: string; kind: 'lyric'; lyricLineId: string; measureIndex: number; beatSlotIndex: number };

export type NotationMode = 'edit' | 'preview' | 'export';

export type A4BlockEditorProps = {
  block: NotationBlock;
  blockNumber: number;
  enabledVoices: VoiceSelection;
  styles: ChoirProject['styles'];
  beat: string;
  mode?: NotationMode;
  activeCursor: MeasureCursor | null;
  activeLyricCursor: LyricCursor | null;
  onFocusCursor: (cursor: MeasureCursor) => void;
  onFocusLyricCursor: (cursor: LyricCursor) => void;
  onChangeBlock: (block: NotationBlock) => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onDeleteBlock: () => void;
  onAddTopLyric: () => void;
  onAddMiddleLyric: () => void;
  onAddBottomLyric: () => void;
  onDeleteLyricLine: (lineId: string) => void;
  onChangeLyricLine: (line: LyricLine, cursor: LyricCursor) => void;
};

const voiceOrder: VoiceKey[] = ['S', 'A', 'T', 'B'];

export function A4BlockEditor({
  block,
  blockNumber,
  enabledVoices,
  styles,
  beat,
  mode = 'edit',
  activeCursor,
  activeLyricCursor,
  onFocusCursor,
  onFocusLyricCursor,
  onChangeBlock,
  onMoveUp,
  onMoveDown,
  onDeleteBlock,
  onAddTopLyric,
  onAddMiddleLyric,
  onAddBottomLyric,
  onDeleteLyricLine,
  onChangeLyricLine
}: A4BlockEditorProps) {
  const isEditMode = mode === 'edit';
  const enabled = voiceOrder.filter((voice) => enabledVoices[voice]);
  const hasSA = enabled.some((voice) => voice === 'S' || voice === 'A');
  const hasTB = enabled.some((voice) => voice === 'T' || voice === 'B');
  const warnings = [
    ...measureWarnings(block, beat, enabled),
    ...validateMiddleLyrics(block.lyricLines.filter((line) => line.position === 'middle')).map((issue) => issue.message),
    ...block.warnings
  ];
  const topLyrics = block.lyricLines.filter((line) => line.position === 'top');
  const middleLyrics = block.lyricLines.filter((line) => line.position === 'middle');
  const bottomLyrics = block.lyricLines.filter((line) => line.position === 'bottom');

  return (
    <article className={`satb-block satb-block-${mode}`} data-block-id={block.id}>
      {isEditMode && (
      <div className="satb-block-toolbar print:hidden" data-export-ignore>
        <span className="inline-flex items-center gap-1 text-xs font-bold text-slate-500">
          <GripVertical size={14} /> Block {blockNumber}
        </span>
        <div className="flex flex-wrap items-center gap-1">
          <button className="icon-tool" type="button" title="Move block up" onClick={onMoveUp}>
            <MoveUp size={14} />
          </button>
          <button className="icon-tool" type="button" title="Move block down" onClick={onMoveDown}>
            <MoveDown size={14} />
          </button>
          <button className="icon-tool" type="button" title="Remove block" onClick={onDeleteBlock}>
            <Trash2 size={14} />
          </button>
          {topLyrics.length === 0 && (
            <button className="small-text-tool" type="button" onClick={onAddTopLyric}>
              <Plus size={13} /> Top lyric
            </button>
          )}
          <button className="small-text-tool" type="button" onClick={onAddMiddleLyric} disabled={middleLyrics.length >= 6}>
            <Plus size={13} /> Middle lyric
          </button>
          {bottomLyrics.length === 0 && (
            <button className="small-text-tool" type="button" onClick={onAddBottomLyric}>
              <Plus size={13} /> Bottom lyric
            </button>
          )}
        </div>
      </div>
      )}

      {topLyrics.map((line) => (
        <LyricGridLine
          key={line.id}
          block={block}
          line={line}
          enabledVoices={enabled}
          styles={styles}
          activeLyricCursor={activeLyricCursor}
          mode={mode}
          onFocusLyricCursor={onFocusLyricCursor}
          onChangeLyricLine={onChangeLyricLine}
          onDeleteLyricLine={onDeleteLyricLine}
        />
      ))}

      {hasSA && (
        <div className="voice-group voice-group-sa">
          {enabled.filter((voice) => voice === 'S' || voice === 'A').map((voice) => (
            <MeasureVoiceRow
              key={voice}
              block={block}
              voice={voice}
              styles={styles}
              mode={mode}
              activeCursor={activeCursor}
              onFocusCursor={onFocusCursor}
            />
          ))}
        </div>
      )}

      {middleLyrics.length > 0 && (
        <div className={`middle-lyrics middle-lyrics-${block.lyricMode}`}>
          {middleLyrics.map((line) => (
            <LyricGridLine
              key={line.id}
              block={block}
              line={line}
              enabledVoices={enabled}
              styles={styles}
              activeLyricCursor={activeLyricCursor}
              mode={mode}
              onFocusLyricCursor={onFocusLyricCursor}
              onChangeLyricLine={onChangeLyricLine}
              onDeleteLyricLine={onDeleteLyricLine}
            />
          ))}
        </div>
      )}

      {hasTB && (
        <div className={`voice-group voice-group-tb ${hasSA ? 'voice-group-separated' : ''}`}>
          {enabled.filter((voice) => voice === 'T' || voice === 'B').map((voice) => (
            <MeasureVoiceRow
              key={voice}
              block={block}
              voice={voice}
              styles={styles}
              mode={mode}
              activeCursor={activeCursor}
              onFocusCursor={onFocusCursor}
            />
          ))}
        </div>
      )}

      {bottomLyrics.map((line) => (
        <LyricGridLine
          key={line.id}
          block={block}
          line={line}
          enabledVoices={enabled}
          styles={styles}
          activeLyricCursor={activeLyricCursor}
          mode={mode}
          onFocusLyricCursor={onFocusLyricCursor}
          onChangeLyricLine={onChangeLyricLine}
          onDeleteLyricLine={onDeleteLyricLine}
        />
      ))}

      {isEditMode && warnings.length > 0 && (
        <div className="block-warnings print:hidden" data-export-ignore>
          {warnings.slice(0, 3).map((warning) => (
            <p key={warning}>{warning}</p>
          ))}
        </div>
      )}
    </article>
  );
}

function MeasureVoiceRow({
  block,
  voice,
  styles,
  mode,
  activeCursor,
  onFocusCursor
}: {
  block: NotationBlock;
  voice: VoiceKey;
  styles: ChoirProject['styles'];
  mode: NotationMode;
  activeCursor: MeasureCursor | null;
  onFocusCursor: (cursor: MeasureCursor) => void;
}) {
  const isEditMode = mode === 'edit';
  const visibleMeasures = trimMeasuresAfterEnding(block.measures);
  const lastVisibleMeasure = visibleMeasures[visibleMeasures.length - 1];

  return (
    <div className="voice-row">
      <span className="voice-label">{voice}</span>
      <div className="measure-row" style={{ fontFamily: styles.notes.family, fontSize: styles.notes.size }}>
        {visibleMeasures.map((measure, measureIndex) => {
          const tokens = measure.voices[voice];
          const grid = computeMeasureGrid(measure, ['S', 'A', 'T', 'B']);
          const active = isEditMode && activeCursor?.blockId === block.id && activeCursor.measureIndex === measureIndex && activeCursor.voice === voice;
          return (
            <button
              key={measure.id}
              type="button"
              className={`measure-cell ${active ? 'measure-cell-active' : ''}`}
              onClick={() => {
                if (isEditMode) onFocusCursor({ blockId: block.id, measureIndex, voice, tokenIndex: tokens.length });
              }}
            >
              <span className="barline">|</span>
              <span className="measure-slot-grid" style={{ gridTemplateColumns: `repeat(${grid.slotCount}, minmax(0, 1fr))` }}>
                {grid.tokens[voice].map((slot, slotIndex) => (
                  <span key={slotIndex} className={slot.some((token) => token.type === 'note' && (token.underlined || token.grouped)) ? 'notation-row-underlined' : ''}>
                    {slot.map((token, tokenIndex) => (
                      <span key={`${token.id ?? tokenText(token)}-${tokenIndex}`}>
                        {tokenText(token)}
                      </span>
                    ))}
                  </span>
                ))}
              </span>
              {measure.ending?.value && <span className="double-bar">||</span>}
              {measure.trailingBar?.value && <span className="barline">|</span>}
            </button>
          );
        })}
        {!lastVisibleMeasure?.ending && <span className="barline">|</span>}
      </div>
    </div>
  );
}

function LyricGridLine({
  block,
  line,
  enabledVoices,
  styles,
  mode,
  activeLyricCursor,
  onFocusLyricCursor,
  onChangeLyricLine,
  onDeleteLyricLine
}: {
  block: NotationBlock;
  line: LyricLine;
  enabledVoices: VoiceKey[];
  styles: ChoirProject['styles'];
  mode: NotationMode;
  activeLyricCursor: LyricCursor | null;
  onFocusLyricCursor: (cursor: LyricCursor) => void;
  onChangeLyricLine: (line: LyricLine, cursor: LyricCursor) => void;
  onDeleteLyricLine: (lineId: string) => void;
}) {
  const isEditMode = mode === 'edit';
  const editLyric = (cursor: LyricCursor, key: string) => {
    if (!isEditMode) return;
    const result = key === 'Backspace' ? backspaceLyric(line, cursor) : insertLyricCharacter(line, cursor, key);
    onChangeLyricLine(result.line, result.cursor);
  };
  const visibleMeasures = trimMeasuresAfterEnding(block.measures);

  return (
    <div
      className={`lyric-grid-line lyric-${line.position}`}
      style={{ fontFamily: styles.lyrics.family, fontSize: styles.lyrics.size }}
      data-testid={`lyric-grid-line-${line.id}`}
    >
      {isEditMode && (
      <button className="delete-lyric-line print:hidden" type="button" onClick={() => onDeleteLyricLine(line.id)} data-export-ignore>
        Remove
      </button>
      )}
      <div className="lyric-system-grid">
        {visibleMeasures.map((measure, measureIndex) => {
          const grid = computeMeasureGrid(measure, enabledVoices);
          return (
            <div key={`${line.id}-${measure.id}`} className="lyric-measure" style={{ gridTemplateColumns: `auto repeat(${grid.slotCount}, minmax(0, 1fr))` }}>
              <span className="barline">|</span>
              {Array.from({ length: grid.slotCount }, (_, beatSlotIndex) => {
                const text = lyricTextAt(line, measureIndex, beatSlotIndex);
                const active =
                  isEditMode &&
                  activeLyricCursor?.lyricLineId === line.id &&
                  activeLyricCursor.measureIndex === measureIndex &&
                  activeLyricCursor.beatSlotIndex === beatSlotIndex;
                const cursor = {
                  blockId: block.id,
                  lyricLineId: line.id,
                  measureIndex,
                  beatSlotIndex,
                  charOffset: active ? activeLyricCursor.charOffset : text.length
                };
                return (
                  <button
                    key={beatSlotIndex}
                    type="button"
                    className={`lyric-slot ${active ? 'editable-a4-line-active' : ''}`}
                    aria-label={text ? `Lyric slot ${beatSlotIndex + 1}: ${text}` : `Empty lyric slot ${beatSlotIndex + 1}`}
                    onClick={() => {
                      if (isEditMode) onFocusLyricCursor(cursor);
                    }}
                    onKeyDown={(event) => {
                      if (!isEditMode) return;
                      if (event.key === 'Backspace' || event.key === ' ' || event.key.length === 1) {
                        event.preventDefault();
                        event.stopPropagation();
                        editLyric(cursor, event.key);
                      }
                    }}
                  >
                    {text}
                  </button>
                );
              })}
              {measure.ending?.value && <span className="double-bar">||</span>}
              {measure.trailingBar?.value && <span className="barline">|</span>}
            </div>
          );
        })}
      </div>
    </div>
  );
}
