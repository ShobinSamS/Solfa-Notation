import { describe, expect, it } from 'vitest';
import type { MeasureCursor, NotationBlock, NotationToken } from '../types/project';
import { backspaceToken, insertMeasureToken, makeNotationToken, renderMeasureVoice, tokenText } from './measureEditing';
import { insertProjectToken } from './projectEditing';
import type { ChoirProject } from '../types/project';

const values = (tokens: NotationToken[]) => tokens.map(tokenText);

function block(): NotationBlock {
  return {
    id: 'block',
    measures: [
      {
        id: 'm1',
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
    lyricLines: [],
    lyricMode: 'center',
    underlines: [],
    warnings: []
  };
}

function emptyBlock(): NotationBlock {
  return {
    ...block(),
    measures: [
      {
        id: 'm1',
        voices: { S: [], A: [], T: [], B: [] }
      }
    ]
  };
}

function projectWithBlocks(blocks: NotationBlock[]): ChoirProject {
  return {
    id: 'project',
    title: 'Song',
    subtitles: ['', ''],
    scale: 'C',
    voices: { S: true, A: true, T: true, B: true },
    metadata: { meterMode: 'meter', beat: '4/4' },
    styles: {
      title: { family: 'Inter', size: 24 },
      subtitle: { family: 'Inter', size: 12 },
      lyrics: { family: 'Georgia', size: 12 },
      metadata: { family: 'Inter', size: 10 },
      notes: { family: 'Consolas', size: 16 }
    },
    pages: [{ id: 'page-1', blocks }],
    createdAt: 'now',
    updatedAt: 'now'
  };
}

function fullWidthBlock(id: string): NotationBlock {
  const fullVoice = Array.from({ length: 18 }, (_, index): NotationToken[] => [
    { type: 'note', value: ['d', 'r', 'm', 'f', 's', 'l', 't'][index % 7] },
    { type: 'rhythm', value: index === 3 || index === 7 || index === 11 || index === 15 ? ':' : ',' }
  ]).flat();
  return {
    ...emptyBlock(),
    id,
    measures: Array.from({ length: 4 }, (_, index) => ({
      id: `m-${id}-${index}`,
      voices: {
        S: fullVoice,
        A: [],
        T: [],
        B: []
      }
    }))
  };
}

describe('measure editing', () => {
  it('creates bar and double-bar tokens as single token objects', () => {
    expect(makeNotationToken('|')).toMatchObject({ type: 'bar', value: '|' });
    expect(makeNotationToken('||')).toMatchObject({ type: 'doubleBar', value: '||' });
  });

  it('inserts notation tokens into the active measure voice', () => {
    const cursor: MeasureCursor = { blockId: 'block', measureIndex: 0, voice: 'S', tokenIndex: 3 };
    const separator = insertMeasureToken(block(), cursor, ':', '4/4', false);
    const result = insertMeasureToken(separator.block, separator.cursor, 'm', '4/4', false);
    expect(values(result.block.measures[0].voices.S)).toEqual(['d', ':', 'r', ':', 'm']);
    expect(result.cursor.tokenIndex).toBe(5);
  });

  it('moves to the next measure when inserting a bar line', () => {
    const cursor: MeasureCursor = { blockId: 'block', measureIndex: 0, voice: 'S', tokenIndex: 3 };
    const result = insertMeasureToken(block(), cursor, '|', '4/4', false);
    expect(result.block.measures).toHaveLength(2);
    expect(result.cursor.measureIndex).toBe(1);
    expect(result.cursor.tokenIndex).toBe(0);
  });

  it('stores double bar as one ending token and backspace removes it as one token', () => {
    const cursor: MeasureCursor = { blockId: 'block', measureIndex: 0, voice: 'S', tokenIndex: 3 };
    const inserted = insertMeasureToken(block(), cursor, '||', '4/4', false);
    expect(inserted.block.measures[0].ending).toMatchObject({ type: 'doubleBar', value: '||' });
    const removed = backspaceToken(inserted.block, inserted.cursor);
    expect(removed.block.measures[0].ending).toBeUndefined();
    expect(removed.cursor.measureIndex).toBe(0);
  });

  it('does not create a trailing empty measure after a double bar ending', () => {
    const cursor: MeasureCursor = { blockId: 'block', measureIndex: 0, voice: 'S', tokenIndex: 3 };
    const inserted = insertMeasureToken(block(), cursor, '||', '4/4', false);
    expect(inserted.block.measures).toHaveLength(1);
    expect(inserted.cursor).toMatchObject({ measureIndex: 0, tokenIndex: 3 });
  });

  it('allows one selected final single bar after a double bar ending', () => {
    const cursor: MeasureCursor = { blockId: 'block', measureIndex: 0, voice: 'S', tokenIndex: 3 };
    const ending = insertMeasureToken(block(), cursor, '||', '4/4', false);
    const finalBar = insertMeasureToken(ending.block, ending.cursor, '|', '4/4', false);

    expect(finalBar.block.measures).toHaveLength(1);
    expect(finalBar.block.measures[0].ending).toMatchObject({ type: 'doubleBar', value: '||' });
    expect(finalBar.block.measures[0].trailingBar).toMatchObject({ type: 'bar', value: '|' });
    expect(renderMeasureVoice(finalBar.block.measures, 'S')).toBe('| d:r|| |');
  });

  it('rejects multiple trailing bars after a double bar ending', () => {
    const cursor: MeasureCursor = { blockId: 'block', measureIndex: 0, voice: 'S', tokenIndex: 3 };
    const ending = insertMeasureToken(block(), cursor, '||', '4/4', false);
    const finalBar = insertMeasureToken(ending.block, ending.cursor, '|', '4/4', false);
    const extraBar = insertMeasureToken(finalBar.block, finalBar.cursor, '|', '4/4', false);

    expect(extraBar.rejected).toBe(true);
    expect(renderMeasureVoice(extraBar.block.measures, 'S')).toBe('| d:r|| |');
  });

  it('backspace removes the final single bar before removing the double bar', () => {
    const cursor: MeasureCursor = { blockId: 'block', measureIndex: 0, voice: 'S', tokenIndex: 3 };
    const ending = insertMeasureToken(block(), cursor, '||', '4/4', false);
    const finalBar = insertMeasureToken(ending.block, ending.cursor, '|', '4/4', false);
    const withoutFinalBar = backspaceToken(finalBar.block, finalBar.cursor);
    const withoutDoubleBar = backspaceToken(withoutFinalBar.block, withoutFinalBar.cursor);

    expect(withoutFinalBar.block.measures[0].trailingBar).toBeUndefined();
    expect(withoutFinalBar.block.measures[0].ending).toMatchObject({ type: 'doubleBar', value: '||' });
    expect(withoutDoubleBar.block.measures[0].ending).toBeUndefined();
    expect(values(withoutDoubleBar.block.measures[0].voices.S)).toEqual(['d', ':', 'r']);
  });

  it('backspace after a double bar plus empty bar removes the empty bar, not the double bar', () => {
    const withTrailingEmpty = {
      ...block(),
      measures: [
        { ...block().measures[0], ending: { type: 'doubleBar' as const, value: '||' as const } },
        { id: 'empty', voices: { S: [], A: [], T: [], B: [] } }
      ]
    };
    const removed = backspaceToken(withTrailingEmpty, { blockId: 'block', measureIndex: 1, voice: 'S', tokenIndex: 0 });
    expect(removed.block.measures).toHaveLength(1);
    expect(removed.block.measures[0].ending).toMatchObject({ type: 'doubleBar', value: '||' });
    expect(removed.cursor).toMatchObject({ measureIndex: 0, tokenIndex: 3 });
  });

  it('does not render trailing empty bars after a double bar ending', () => {
    const rendered = renderMeasureVoice(
      [
        { ...block().measures[0], ending: { type: 'doubleBar', value: '||' } },
        { id: 'empty', voices: { S: [], A: [], T: [], B: [] } }
      ],
      'S'
    );
    expect(rendered).toBe('| d:r||');
  });

  it('backspace removes a single bar by moving to the previous measure boundary', () => {
    const inserted = insertMeasureToken(block(), { blockId: 'block', measureIndex: 0, voice: 'S', tokenIndex: 3 }, '|', '4/4', false);
    const removed = backspaceToken(inserted.block, inserted.cursor);
    expect(removed.block.measures).toHaveLength(1);
    expect(removed.cursor).toMatchObject({ measureIndex: 0, tokenIndex: 3 });
  });

  it('backspace removes the previous token, not the previous character', () => {
    const cursor: MeasureCursor = { blockId: 'block', measureIndex: 0, voice: 'S', tokenIndex: 3 };
    const result = backspaceToken(block(), cursor);
    expect(values(result.block.measures[0].voices.S)).toEqual(['d', ':']);
    expect(result.cursor.tokenIndex).toBe(2);
  });

  it('backspace deletes combined rhythm tokens as one token', () => {
    const cursor: MeasureCursor = { blockId: 'block', measureIndex: 0, voice: 'S', tokenIndex: 3 };
    const inserted = insertMeasureToken(block(), cursor, ':-', '4/4', false);
    const result = backspaceToken(inserted.block, inserted.cursor);
    expect(values(result.block.measures[0].voices.S)).toEqual(['d', ':', 'r']);
  });

  it('rejects measures that exceed selected beat capacity', () => {
    const cursor: MeasureCursor = { blockId: 'block', measureIndex: 0, voice: 'S', tokenIndex: 3 };
    const withThird = insertMeasureToken(block(), cursor, ':', '3/4', false);
    const withFourth = insertMeasureToken(withThird.block, withThird.cursor, ':', '3/4', false);
    expect(withFourth.rejected).toBe(true);
    expect(withFourth.warning).toBe('Measure full for selected beat.');
  });

  it('marks inserted notes as underlined only while group mode is on', () => {
    const cursor: MeasureCursor = { blockId: 'block', measureIndex: 0, voice: 'S', tokenIndex: 0 };
    const groupedD = insertMeasureToken(emptyBlock(), cursor, 'd', '4/4', true);
    const separator = insertMeasureToken(groupedD.block, groupedD.cursor, ':', '4/4', true);
    const groupedR = insertMeasureToken(separator.block, separator.cursor, 'r', '4/4', true);
    expect(groupedR.block.measures[0].voices.S[0]).toMatchObject({ type: 'note', value: 'd', underlined: true });
    expect(groupedR.block.measures[0].voices.S[2]).toMatchObject({ type: 'note', value: 'r', underlined: true });
    expect(groupedR.block.measures[0].voices.S[1]).not.toHaveProperty('underlined', true);

    const nextSeparator = insertMeasureToken(groupedR.block, groupedR.cursor, ':', '4/4', false);
    const normal = insertMeasureToken(nextSeparator.block, nextSeparator.cursor, 'm', '4/4', false);
    expect(normal.block.measures[0].voices.S[4]).toMatchObject({ type: 'note', value: 'm' });
    expect(normal.block.measures[0].voices.S[4]).toMatchObject({ underlined: false });
  });

  it('blocks a note directly after another note even when group mode is on', () => {
    const cursor: MeasureCursor = { blockId: 'block', measureIndex: 0, voice: 'S', tokenIndex: 0 };
    const first = insertMeasureToken(emptyBlock(), cursor, 'd', '4/4', true);
    const second = insertMeasureToken(first.block, first.cursor, 'm', '4/4', true);
    expect(second.rejected).toBe(true);
    expect(values(second.block.measures[0].voices.S)).toEqual(['d']);
  });

  it('allows notes after rhythm and combined rhythm tokens', () => {
    const cursor: MeasureCursor = { blockId: 'block', measureIndex: 0, voice: 'S', tokenIndex: 0 };
    const d = insertMeasureToken(emptyBlock(), cursor, 'd', '4/4', false);
    const colon = insertMeasureToken(d.block, d.cursor, ':', '4/4', false);
    const r = insertMeasureToken(colon.block, colon.cursor, 'r', '4/4', false);
    expect(values(r.block.measures[0].voices.S)).toEqual(['d', ':', 'r']);

    const dashColon = insertMeasureToken(r.block, r.cursor, ':-', '4/4', false);
    const m = insertMeasureToken(dashColon.block, dashColon.cursor, 'm', '4/4', false);
    expect(values(m.block.measures[0].voices.S)).toEqual(['d', ':', 'r', ':-', 'm']);
  });

  it('does not treat spaces as notation separators', () => {
    const cursor: MeasureCursor = { blockId: 'block', measureIndex: 0, voice: 'S', tokenIndex: 0 };
    const first = insertMeasureToken(emptyBlock(), cursor, 'd', '4/4', false);
    const space = insertMeasureToken(first.block, first.cursor, ' ', '4/4', false);
    const nextNote = insertMeasureToken(space.block, space.cursor, 'r', '4/4', false);
    expect(space.rejected).toBe(true);
    expect(nextNote.rejected).toBe(true);
    expect(values(nextNote.block.measures[0].voices.S)).toEqual(['d']);
  });

  it('blocks rhythm overflow immediately in 4/4', () => {
    const cursor: MeasureCursor = { blockId: 'block', measureIndex: 0, voice: 'S', tokenIndex: 0 };
    let result = insertMeasureToken(emptyBlock(), cursor, 'd', '4/4', false);
    result = insertMeasureToken(result.block, result.cursor, ':', '4/4', false);
    result = insertMeasureToken(result.block, result.cursor, 'r', '4/4', false);
    result = insertMeasureToken(result.block, result.cursor, ':', '4/4', false);
    result = insertMeasureToken(result.block, result.cursor, 'm', '4/4', false);
    result = insertMeasureToken(result.block, result.cursor, ':', '4/4', false);
    result = insertMeasureToken(result.block, result.cursor, 'f', '4/4', false);
    const overflow = insertMeasureToken(result.block, result.cursor, ':', '4/4', false);
    expect(overflow.rejected).toBe(true);
    expect(overflow.warning).toBe('Measure full for selected beat.');
  });

  it('blocks comma subdivision overflow instead of allowing infinite commas', () => {
    const cursor: MeasureCursor = { blockId: 'block', measureIndex: 0, voice: 'S', tokenIndex: 0 };
    let result = insertMeasureToken(emptyBlock(), cursor, 'd', '4/4', false);
    for (let index = 0; index < 16; index += 1) {
      result = insertMeasureToken(result.block, result.cursor, ',', '4/4', false);
    }
    const overflow = insertMeasureToken(result.block, result.cursor, ',', '4/4', false);
    expect(overflow.rejected).toBe(true);
    expect(overflow.warning).toBe('Measure full for selected beat.');
  });

  it('moves insertion to a new block and page when the current printable block/page is full', () => {
    const project = projectWithBlocks(Array.from({ length: 5 }, (_, index) => fullWidthBlock(`block-${index}`)));
    const result = insertProjectToken(
      project,
      { blockId: 'block-4', measureIndex: 3, voice: 'S', tokenIndex: 36 },
      'd',
      false
    );

    expect(result.project.pages).toHaveLength(2);
    expect(result.project.pages[1].blocks).toHaveLength(1);
    expect(result.cursor.blockId).toBe(result.project.pages[1].blocks[0].id);
    expect(result.cursor.measureIndex).toBe(0);
    expect(result.cursor.tokenIndex).toBe(1);
    expect(result.project.pages[1].blocks[0].measures[0].voices.S[0]).toMatchObject({ type: 'note', value: 'd' });
  });

  it('keeps half-beat and quarter-beat subdivisions inside one 4/4 measure', () => {
    const sequence = ['d', '.', 'd', ':', 'r', '.', 'r', ':', 'm', ',', 'm', ',', 'm', ',', 'm', ',', ':', 'f'];
    let result = insertProjectToken(projectWithBlocks([emptyBlock()]), { blockId: 'block', measureIndex: 0, voice: 'S', tokenIndex: 0 }, sequence[0], false);

    sequence.slice(1).forEach((token) => {
      result = insertProjectToken(result.project, result.cursor, token, false);
      expect(result.rejected).not.toBe(true);
    });

    expect(result.cursor.blockId).toBe('block');
    expect(result.cursor.measureIndex).toBe(0);
    expect(values(result.project.pages[0].blocks[0].measures[0].voices.S)).toEqual(sequence);
  });

  it('accepts four quarter notes inside each beat of a 4/4 measure', () => {
    const sequence = ['d', ',', 'd', ',', 'd', ',', 'd', ':', 'r', ',', 'r', ',', 'r', ',', 'r', ':', 'm', ',', 'm', ',', 'm', ',', 'm', ':', 'f', ',', 'f', ',', 'f', ',', 'f'];
    let result = insertProjectToken(projectWithBlocks([emptyBlock()]), { blockId: 'block', measureIndex: 0, voice: 'S', tokenIndex: 0 }, sequence[0], false);

    sequence.slice(1).forEach((token) => {
      result = insertProjectToken(result.project, result.cursor, token, false);
      expect(result.rejected).not.toBe(true);
    });

    expect(result.cursor.blockId).toBe('block');
    expect(result.cursor.measureIndex).toBe(0);
    expect(values(result.project.pages[0].blocks[0].measures[0].voices.S)).toEqual(sequence);
  });
});
