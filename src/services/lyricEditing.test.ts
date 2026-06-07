import { describe, expect, it } from 'vitest';
import type { LyricCursor, LyricLine, NotationMeasure } from '../types/project';
import { backspaceLyric, computeMeasureGrid, insertLyricCharacter } from './lyricEditing';

const cursor: LyricCursor = { blockId: 'block', lyricLineId: 'lyric', measureIndex: 0, beatSlotIndex: 0, charOffset: 0 };

function line(): LyricLine {
  return { id: 'lyric', position: 'middle', text: '', slots: [] };
}

describe('lyric editing', () => {
  it('types lyric characters left-to-right in the active slot', () => {
    const h = insertLyricCharacter(line(), cursor, 'h');
    const hi = insertLyricCharacter(h.line, h.cursor, 'i');
    expect(hi.line.slots[0].text).toBe('hi');
    expect(hi.cursor.charOffset).toBe(2);
  });

  it('space moves to the next timing slot', () => {
    const h = insertLyricCharacter(line(), cursor, 'h');
    const moved = insertLyricCharacter(h.line, h.cursor, ' ');
    const t = insertLyricCharacter(moved.line, moved.cursor, 't');
    expect(t.line.slots).toEqual([
      { measureIndex: 0, beatSlotIndex: 0, slotIndex: 0, text: 'h' },
      { measureIndex: 0, beatSlotIndex: 1, slotIndex: 1, text: 't' }
    ]);
  });

  it('backspace removes lyric characters normally', () => {
    const h = insertLyricCharacter(line(), cursor, 'h');
    const hi = insertLyricCharacter(h.line, h.cursor, 'i');
    const back = backspaceLyric(hi.line, hi.cursor);
    expect(back.line.slots[0].text).toBe('h');
    expect(back.cursor.charOffset).toBe(1);
  });

  it('computes a shared measure grid from all active voices', () => {
    const measure: NotationMeasure = {
      id: 'm',
      voices: {
        S: [
          { type: 'note', value: 'd' },
          { type: 'rhythm', value: ':' },
          { type: 'note', value: 'r' },
          { type: 'rhythm', value: ':' },
          { type: 'note', value: 'm' }
        ],
        A: [],
        T: [],
        B: [
          { type: 'note', value: 'd' },
          { type: 'rhythm', value: ':-' },
          { type: 'note', value: 'r' },
          { type: 'rhythm', value: ':-' },
          { type: 'note', value: 'm' },
          { type: 'rhythm', value: ':-' }
        ]
      }
    };
    const grid = computeMeasureGrid(measure, ['S', 'B']);
    expect(grid.slotCount).toBe(3);
    expect(grid.tokens.S.map((slot) => slot.map((token) => token.value).join(''))).toEqual(['d:', 'r:', 'm']);
    expect(grid.tokens.B.map((slot) => slot.map((token) => token.value).join(''))).toEqual(['d:-', 'r:-', 'm:-']);
  });

  it('keeps dot and comma subdivisions inside the current beat slot', () => {
    const measure: NotationMeasure = {
      id: 'm',
      voices: {
        S: [
          { type: 'note', value: 'd' },
          { type: 'rhythm', value: ',' },
          { type: 'note', value: 'd' },
          { type: 'rhythm', value: ',' },
          { type: 'note', value: 'd' },
          { type: 'rhythm', value: ',' },
          { type: 'note', value: 'd' },
          { type: 'rhythm', value: ':' },
          { type: 'note', value: 'r' }
        ],
        A: [],
        T: [],
        B: []
      }
    };
    const grid = computeMeasureGrid(measure, ['S']);
    expect(grid.tokens.S.map((slot) => slot.map((token) => token.value).join(''))).toEqual(['d,', 'd,', 'd,', 'd:', 'r']);
  });
});
