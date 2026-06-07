import { fireEvent, render, screen, within } from '@testing-library/react';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { A4BlockEditor } from './A4BlockEditor';
import type { ChoirProject, LyricCursor, LyricLine, NotationBlock } from '../types/project';
import { defaultStyles } from '../utils/projectModel';

const voices = { S: true, A: true, T: true, B: true };

function blockWithLyric(line: LyricLine): NotationBlock {
  return {
    id: 'block',
    measures: [
      {
        id: 'measure',
        voices: {
          S: [
            { type: 'note', value: 'd' },
            { type: 'rhythm', value: ':' },
            { type: 'note', value: 'r' }
          ],
          A: [],
          T: [],
          B: []
        }
      }
    ],
    lyricLines: [line],
    lyricMode: 'center',
    underlines: [],
    warnings: []
  };
}

function Harness() {
  const [line, setLine] = useState<LyricLine>({ id: 'lyric', position: 'middle', text: '', slots: [] });
  const [cursor, setCursor] = useState<LyricCursor | null>(null);
  const block = blockWithLyric(line);

  return (
    <A4BlockEditor
      block={block}
      blockNumber={1}
      enabledVoices={voices}
      styles={defaultStyles as ChoirProject['styles']}
      beat="4/4"
      activeCursor={null}
      activeLyricCursor={cursor}
      onFocusCursor={vi.fn()}
      onFocusLyricCursor={setCursor}
      onChangeBlock={vi.fn()}
      onMoveUp={vi.fn()}
      onMoveDown={vi.fn()}
      onDeleteBlock={vi.fn()}
      onAddTopLyric={vi.fn()}
      onAddMiddleLyric={vi.fn()}
      onAddBottomLyric={vi.fn()}
      onDeleteLyricLine={vi.fn()}
      onChangeLyricLine={(nextLine, nextCursor) => {
        setLine(nextLine);
        setCursor(nextCursor);
      }}
    />
  );
}

describe('A4BlockEditor lyric input', () => {
  it('renders lyric syllables from the left on the same measure grid as notation', () => {
    render(<Harness />);
    const firstSlot = screen.getByRole('button', { name: 'Empty lyric slot 1' });
    fireEvent.click(firstSlot);
    fireEvent.keyDown(firstSlot, { key: 'h' });
    fireEvent.keyDown(firstSlot, { key: 'i' });
    fireEvent.keyDown(firstSlot, { key: ' ' });
    const secondSlot = screen.getByRole('button', { name: 'Empty lyric slot 2' });
    fireEvent.keyDown(secondSlot, { key: 't' });
    fireEvent.keyDown(secondSlot, { key: 'o' });

    const lyricLine = screen.getByTestId('lyric-grid-line-lyric');
    expect(within(lyricLine).getByText('hi')).toBeInTheDocument();
    expect(within(lyricLine).getByText('to')).toBeInTheDocument();
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
  });

  it('hides lyric and block controls in preview mode', () => {
    const line: LyricLine = { id: 'lyric', position: 'middle', text: '', slots: [] };
    render(
      <A4BlockEditor
        block={blockWithLyric(line)}
        blockNumber={1}
        enabledVoices={voices}
        styles={defaultStyles as ChoirProject['styles']}
        beat="4/4"
        mode="preview"
        activeCursor={{ blockId: 'block', measureIndex: 0, voice: 'S', tokenIndex: 3 }}
        activeLyricCursor={{ blockId: 'block', lyricLineId: 'lyric', measureIndex: 0, beatSlotIndex: 0, charOffset: 0 }}
        onFocusCursor={vi.fn()}
        onFocusLyricCursor={vi.fn()}
        onChangeBlock={vi.fn()}
        onMoveUp={vi.fn()}
        onMoveDown={vi.fn()}
        onDeleteBlock={vi.fn()}
        onAddTopLyric={vi.fn()}
        onAddMiddleLyric={vi.fn()}
        onAddBottomLyric={vi.fn()}
        onDeleteLyricLine={vi.fn()}
        onChangeLyricLine={vi.fn()}
      />
    );

    expect(screen.queryByText('Remove')).not.toBeInTheDocument();
    expect(screen.queryByTitle('Move block up')).not.toBeInTheDocument();
    expect(screen.queryByText('Middle lyric')).not.toBeInTheDocument();
    expect(document.querySelector('.measure-cell-active')).not.toBeInTheDocument();
    expect(document.querySelector('.editable-a4-line-active')).not.toBeInTheDocument();
  });

  it('exposes a block remove control in edit mode', () => {
    const line: LyricLine = { id: 'lyric', position: 'middle', text: '', slots: [] };
    const onDeleteBlock = vi.fn();
    render(
      <A4BlockEditor
        block={blockWithLyric(line)}
        blockNumber={1}
        enabledVoices={voices}
        styles={defaultStyles as ChoirProject['styles']}
        beat="4/4"
        activeCursor={null}
        activeLyricCursor={null}
        onFocusCursor={vi.fn()}
        onFocusLyricCursor={vi.fn()}
        onChangeBlock={vi.fn()}
        onMoveUp={vi.fn()}
        onMoveDown={vi.fn()}
        onDeleteBlock={onDeleteBlock}
        onAddTopLyric={vi.fn()}
        onAddMiddleLyric={vi.fn()}
        onAddBottomLyric={vi.fn()}
        onDeleteLyricLine={vi.fn()}
        onChangeLyricLine={vi.fn()}
      />
    );

    fireEvent.click(screen.getByTitle('Remove block'));
    expect(onDeleteBlock).toHaveBeenCalledTimes(1);
  });
});
