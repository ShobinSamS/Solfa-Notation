import type { ChoirProject, LyricLine, LyricSlot, MeasureCursor, NotationBlock, NotationMeasure, NotationToken, VoiceKey } from '../types/project';
import { createEmptyMeasure, insertMeasureToken, type MeasureEditResult } from './measureEditing';
import { createId } from '../utils/projectModel';
import { editorBlocksPerPage } from '../data/constants';
import { computeMeasureGrid } from './lyricEditing';

export const MAX_MEASURES_PER_BLOCK = 4;
export const MAX_TOKENS_PER_MEASURE = 36;
const MAX_VISUAL_POSITIONS_PER_BLOCK = 16;

export type ProjectEditResult = {
  project: ChoirProject;
  cursor: MeasureCursor;
  rejected?: boolean;
  warning?: string;
};

export function insertProjectToken(project: ChoirProject, cursor: MeasureCursor, value: string, groupMode: boolean): ProjectEditResult {
  const location = findBlockLocation(project, cursor.blockId);
  if (!location) return { project, cursor, rejected: true, warning: 'Active notation block was not found.' };

  const capacityCursor = printableCursorForToken(project, cursor, value);
  if ((value === '|' || value === '||') && capacityCursor.cursor.blockId !== cursor.blockId) return capacityCursor;

  const targetLocation = findBlockLocation(capacityCursor.project, capacityCursor.cursor.blockId);
  if (!targetLocation) return { project, cursor, rejected: true, warning: 'Active notation block was not found.' };

  const targetBlock = capacityCursor.project.pages[targetLocation.pageIndex].blocks[targetLocation.blockIndex];
  const result = insertMeasureToken(targetBlock, capacityCursor.cursor, value, capacityCursor.project.metadata.beat ?? '4/4', groupMode);
  if (result.rejected) return { project, cursor, rejected: true, warning: result.warning };

  return normalizeVisualOverflow(replaceBlock(capacityCursor.project, result.block), result.cursor);
}

function printableCursorForToken(project: ChoirProject, cursor: MeasureCursor, value: string): { project: ChoirProject; cursor: MeasureCursor } {
  if (value === '||') return { project, cursor };
  if (value === '|') {
    if (cursor.measureIndex >= MAX_MEASURES_PER_BLOCK - 1) return nextPrintableBlock(project, cursor, value);
    return { project, cursor };
  }

  const block = project.pages.flatMap((page) => page.blocks).find((item) => item.id === cursor.blockId);
  const measure = block?.measures[cursor.measureIndex];
  if (!measure) return { project, cursor };
  if (value === '|' && measure.ending) return { project, cursor };
  if (measure.voices[cursor.voice].length < MAX_TOKENS_PER_MEASURE) return { project, cursor };

  if (cursor.measureIndex < MAX_MEASURES_PER_BLOCK - 1) {
    const measures = [...block.measures];
    if (!measures[cursor.measureIndex + 1]) measures.splice(cursor.measureIndex + 1, 0, createEmptyMeasure(createId('measure')));
    const nextBlock = { ...block, measures };
    return {
      project: replaceBlock(project, nextBlock),
      cursor: { ...cursor, measureIndex: cursor.measureIndex + 1, tokenIndex: nextBlock.measures[cursor.measureIndex + 1].voices[cursor.voice].length }
    };
  }

  return nextPrintableBlock(project, cursor, value);
}

function nextPrintableBlock(project: ChoirProject, cursor: MeasureCursor, value: string): { project: ChoirProject; cursor: MeasureCursor } {
  const location = findBlockLocation(project, cursor.blockId);
  if (!location) return { project, cursor };

  let nextProject = project;
  if (value === '||') {
    const block = project.pages[location.pageIndex].blocks[location.blockIndex];
    const measures = [...block.measures];
    const measure = measures[cursor.measureIndex];
    measures[cursor.measureIndex] = { ...measure, ending: { id: createId('doubleBar'), type: 'doubleBar', value: '||' } };
    nextProject = replaceBlock(project, { ...block, measures });
  }

  const freshBlock = createEmptyBlock();
  const pages = nextProject.pages.map((page) => ({ ...page, blocks: [...page.blocks] }));
  if (pages[location.pageIndex].blocks.length < editorBlocksPerPage(project.voices)) {
    pages[location.pageIndex].blocks.splice(location.blockIndex + 1, 0, freshBlock);
  } else {
    pages.splice(location.pageIndex + 1, 0, { id: createId('page'), blocks: [freshBlock] });
  }

  return {
    project: { ...nextProject, pages },
    cursor: { blockId: freshBlock.id, measureIndex: 0, voice: cursor.voice, tokenIndex: 0 }
  };
}

function createEmptyBlock(): NotationBlock {
  return {
    id: createId('block'),
    measures: [createEmptyMeasure(createId('measure'))],
    lyricLines: [],
    lyricMode: 'center',
    underlines: [],
    warnings: []
  };
}

function replaceBlock(project: ChoirProject, nextBlock: NotationBlock): ChoirProject {
  return {
    ...project,
    pages: project.pages.map((page) => ({
      ...page,
      blocks: page.blocks.map((block) => (block.id === nextBlock.id ? nextBlock : block))
    }))
  };
}

function normalizeVisualOverflow(project: ChoirProject, cursor: MeasureCursor): ProjectEditResult {
  const location = findBlockLocation(project, cursor.blockId);
  if (!location) return { project, cursor };

  const block = project.pages[location.pageIndex].blocks[location.blockIndex];
  const split = visualOverflowSplit(block, project);
  if (!split) return { project, cursor };

  const stayingMeasures = block.measures.slice(0, split.measureIndex);
  const movingMeasures = block.measures.slice(split.measureIndex + 1);
  let splitCursorTokenIndex: number | null = null;

  if (split.slotIndex <= 0) {
    movingMeasures.unshift(block.measures[split.measureIndex]);
  } else {
    const splitMeasure = splitMeasureAtSlot(block.measures[split.measureIndex], split.slotIndex, split.voices);
    if (!splitMeasure) return { project, cursor };
    stayingMeasures.push(splitMeasure.before);
    movingMeasures.unshift(splitMeasure.after);
    if (cursor.measureIndex === split.measureIndex) {
      const beforeLength = splitMeasure.before.voices[cursor.voice].length;
      splitCursorTokenIndex = Math.max(0, cursor.tokenIndex - beforeLength);
    }
  }

  if (movingMeasures.length === 0 || stayingMeasures.length === 0) return { project, cursor };

  const { oldLines, newLines } = splitLyricLines(block, split.measureIndex, split.slotIndex);
  const oldBlock = { ...block, measures: stayingMeasures, lyricLines: oldLines };
  const newBlock = {
    ...createEmptyBlock(),
    measures: movingMeasures,
    lyricLines: newLines,
    lyricMode: block.lyricMode
  };
  const pages = project.pages.map((page) => ({ ...page, blocks: [...page.blocks] }));
  pages[location.pageIndex].blocks[location.blockIndex] = oldBlock;
  if (pages[location.pageIndex].blocks.length < editorBlocksPerPage(project.voices)) {
    pages[location.pageIndex].blocks.splice(location.blockIndex + 1, 0, newBlock);
  } else {
    pages.splice(location.pageIndex + 1, 0, { id: createId('page'), blocks: [newBlock] });
  }

  const nextCursor =
    cursor.measureIndex > split.measureIndex
      ? { ...cursor, blockId: newBlock.id, measureIndex: cursor.measureIndex - split.measureIndex }
      : cursor.measureIndex === split.measureIndex && (split.slotIndex <= 0 || splitCursorTokenIndex !== null)
        ? { ...cursor, blockId: newBlock.id, measureIndex: 0, tokenIndex: splitCursorTokenIndex ?? cursor.tokenIndex }
      : cursor;

  return normalizeVisualOverflow({ ...project, pages }, nextCursor);
}

function visualOverflowSplit(block: NotationBlock, project: ChoirProject): { measureIndex: number; slotIndex: number; voices: VoiceKey[] } | null {
  const voices = (['S', 'A', 'T', 'B'] as const).filter((voice) => project.voices[voice]);
  let usedPositions = 0;
  for (let index = 0; index < block.measures.length; index += 1) {
    const slots = computeMeasureGrid(block.measures[index], voices).slotCount;
    if (usedPositions + slots > MAX_VISUAL_POSITIONS_PER_BLOCK) {
      return { measureIndex: index, slotIndex: MAX_VISUAL_POSITIONS_PER_BLOCK - usedPositions, voices };
    }
    usedPositions += slots;
  }
  return null;
}

function splitMeasureAtSlot(measure: NotationMeasure, slotIndex: number, voices: VoiceKey[]): { before: NotationMeasure; after: NotationMeasure } | null {
  const grid = computeMeasureGrid(measure, voices);
  if (slotIndex <= 0 || slotIndex >= grid.slotCount) return null;

  const beforeVoices = { S: [] as NotationToken[], A: [] as NotationToken[], T: [] as NotationToken[], B: [] as NotationToken[] };
  const afterVoices = { S: [] as NotationToken[], A: [] as NotationToken[], T: [] as NotationToken[], B: [] as NotationToken[] };
  (['S', 'A', 'T', 'B'] as VoiceKey[]).forEach((voice) => {
    grid.cells[voice].forEach((cell) => {
      const cellEnd = cell.start + cell.span - 1;
      if (cellEnd <= slotIndex || cell.start <= slotIndex) {
        beforeVoices[voice].push(...cell.tokens);
      } else {
        afterVoices[voice].push(...cell.tokens);
      }
    });
  });

  const hasAfter = (['S', 'A', 'T', 'B'] as VoiceKey[]).some((voice) => afterVoices[voice].length > 0);
  if (!hasAfter) return null;

  return {
    before: { id: measure.id, voices: beforeVoices, continuation: measure.continuation, continues: true },
    after: {
      id: createId('measure'),
      voices: afterVoices,
      ending: measure.ending,
      trailingBar: measure.trailingBar,
      continuation: true
    }
  };
}

function splitLyricLines(block: NotationBlock, splitMeasureIndex: number, splitSlotIndex: number): { oldLines: LyricLine[]; newLines: LyricLine[] } {
  const oldLines = block.lyricLines.map((line) => ({
    ...line,
    slots: line.slots.filter((slot) => isOldLyricSlot(slot, splitMeasureIndex, splitSlotIndex)),
    text: line.slots.filter((slot) => isOldLyricSlot(slot, splitMeasureIndex, splitSlotIndex) && slot.text).map((slot) => slot.text).join(' ')
  }));
  const newLines = block.lyricLines.map((line) => ({
    ...line,
    slots: line.slots
      .filter((slot) => !isOldLyricSlot(slot, splitMeasureIndex, splitSlotIndex))
      .map((slot) => moveLyricSlot(slot, splitMeasureIndex, splitSlotIndex)),
    text: line.slots.filter((slot) => !isOldLyricSlot(slot, splitMeasureIndex, splitSlotIndex) && slot.text).map((slot) => slot.text).join(' ')
  }));
  return { oldLines, newLines };
}

function isOldLyricSlot(slot: LyricSlot, splitMeasureIndex: number, splitSlotIndex: number): boolean {
  return slot.measureIndex < splitMeasureIndex || (slot.measureIndex === splitMeasureIndex && slot.beatSlotIndex < splitSlotIndex);
}

function moveLyricSlot(slot: LyricSlot, splitMeasureIndex: number, splitSlotIndex: number): LyricSlot {
  if (slot.measureIndex === splitMeasureIndex) {
    const beatSlotIndex = Math.max(0, slot.beatSlotIndex - splitSlotIndex);
    return { ...slot, measureIndex: 0, beatSlotIndex, slotIndex: beatSlotIndex };
  }
  return { ...slot, measureIndex: slot.measureIndex - splitMeasureIndex, slotIndex: slot.beatSlotIndex };
}

function findBlockLocation(project: ChoirProject, blockId: string): { pageIndex: number; blockIndex: number } | null {
  for (let pageIndex = 0; pageIndex < project.pages.length; pageIndex += 1) {
    const blockIndex = project.pages[pageIndex].blocks.findIndex((block) => block.id === blockId);
    if (blockIndex >= 0) return { pageIndex, blockIndex };
  }
  return null;
}
