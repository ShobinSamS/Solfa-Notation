import { describe, expect, it } from 'vitest';
import { createBlock, createProject, enforceFiveBlocksPerPage, formatUpdatedAt, getVoiceLayout } from './projectModel';

describe('project model', () => {
  it('creates a valid default SATB project with required metadata', () => {
    const project = createProject({ title: 'Amazing Grace', scale: 'G' });
    expect(project.title).toBe('Amazing Grace');
    expect(project.scale).toBe('G');
    expect(project.voices).toEqual({ S: true, A: true, T: true, B: true });
    expect(project.pages).toHaveLength(1);
  });

  it('creates structured blank A4 blocks with lyric mode and warnings', () => {
    const block = createBlock();
    expect(block.lyricLines).toEqual([]);
    expect(block.measures).toHaveLength(1);
    expect(block.measures[0].voices).toEqual({ S: [], A: [], T: [], B: [] });
    expect(block.lyricMode).toBe('center');
    expect(block.underlines).toEqual([]);
    expect(block.warnings).toEqual([]);
  });

  it('creates new projects with a blank first block', () => {
    const project = createProject({ title: 'Blank', scale: 'C' });
    expect(project.pages[0].blocks[0].measures[0].voices).toEqual({ S: [], A: [], T: [], B: [] });
  });

  it('splits blocks after two per page', () => {
    const project = createProject({ title: 'Test', scale: 'C' });
    const blocks = Array.from({ length: 3 }, () => createBlock());
    const paged = enforceFiveBlocksPerPage({ ...project, pages: [{ id: 'page-test', blocks }] });
    expect(paged.pages).toHaveLength(2);
    expect(paged.pages[0].blocks).toHaveLength(2);
    expect(paged.pages[1].blocks).toHaveLength(1);
  });

  it('derives the correct dynamic voice layout', () => {
    expect(getVoiceLayout({ S: true, A: true, T: true, B: true })).toEqual([
      ['S', 'A'],
      ['T', 'B']
    ]);
    expect(getVoiceLayout({ S: true, A: true, T: false, B: false })).toEqual([['S', 'A']]);
    expect(getVoiceLayout({ S: false, A: false, T: true, B: true })).toEqual([['T', 'B']]);
  });

  it('formats update dates for dashboard cards', () => {
    expect(formatUpdatedAt('2026-06-01T10:15:00.000Z')).toMatch(/2026/);
  });
});
