import type { ChoirProject, MeasureCursor, NotationBlock } from '../types/project';
import { createEmptyMeasure, insertMeasureToken, type MeasureEditResult } from './measureEditing';
import { createId } from '../utils/projectModel';
import { MAX_BLOCKS_PER_PAGE } from '../data/constants';

export const MAX_MEASURES_PER_BLOCK = 4;
export const MAX_TOKENS_PER_MEASURE = 36;

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

  return {
    project: replaceBlock(capacityCursor.project, result.block),
    cursor: result.cursor
  };
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
  if (pages[location.pageIndex].blocks.length < MAX_BLOCKS_PER_PAGE) {
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

function findBlockLocation(project: ChoirProject, blockId: string): { pageIndex: number; blockIndex: number } | null {
  for (let pageIndex = 0; pageIndex < project.pages.length; pageIndex += 1) {
    const blockIndex = project.pages[pageIndex].blocks.findIndex((block) => block.id === blockId);
    if (blockIndex >= 0) return { pageIndex, blockIndex };
  }
  return null;
}
