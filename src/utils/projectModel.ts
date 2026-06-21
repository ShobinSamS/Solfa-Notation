import type {
  ChoirProject,
  FontTarget,
  NotationBlock,
  NotationMeasure,
  NotationToken,
  NotationPage,
  ProjectDraft,
  VoiceKey,
  VoiceSelection
} from '../types/project';
import { parseNotationTokens } from '../services/notationValidation';
import { makeNotationToken } from '../services/measureEditing';
import { editorBlocksPerPage } from '../data/constants';

export const defaultVoices: VoiceSelection = { S: true, A: true, T: true, B: true };

export const defaultStyles: ChoirProject['styles'] = {
  title: { family: 'Inter', size: 34 },
  subtitle: { family: 'Georgia', size: 16 },
  lyrics: { family: 'Georgia', size: 12 },
  metadata: { family: 'Inter', size: 10 },
  notes: { family: 'Consolas', size: 17 }
};

export function createId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function createBlock(): NotationBlock {
  return {
    id: createId('block'),
    measures: createDefaultMeasures(),
    lyricLines: [],
    lyricMode: 'center',
    underlines: [],
    warnings: []
  };
}

function createDefaultMeasures(): NotationMeasure[] {
  return [
    {
      id: createId('measure'),
      voices: { S: [], A: [], T: [], B: [] }
    }
  ];
}

export function createPage(): NotationPage {
  return {
    id: createId('page'),
    blocks: [createBlock()]
  };
}

export function createProject(draft: ProjectDraft): ChoirProject {
  const now = new Date().toISOString();
  return {
    id: createId('project'),
    title: draft.title.trim(),
    subtitles: draft.subtitles ?? ['', ''],
    scale: draft.scale,
    voices: draft.voices ?? defaultVoices,
    metadata: {
      composer: draft.metadata?.composer ?? '',
      extraComposer: draft.metadata?.extraComposer ?? '',
      tempo: draft.metadata?.tempo,
      beat: draft.metadata?.beat ?? '4/4',
      meterMode: draft.metadata?.meterMode ?? 'meter',
      meter: draft.metadata?.meter ?? '',
      exportTitleSize: draft.metadata?.exportTitleSize ?? defaultStyles.title.size,
      exportNotesSize: draft.metadata?.exportNotesSize ?? 18,
      exportLyricsSize: draft.metadata?.exportLyricsSize ?? draft.metadata?.exportNotesSize ?? 18
    },
    styles: {
      ...defaultStyles,
      ...(draft.styles ?? {})
    } as Record<FontTarget, { family: string; size: number }>,
    pages: [createPage()],
    createdAt: now,
    updatedAt: now
  };
}

export function updateProject(project: ChoirProject, patch: Partial<ChoirProject>): ChoirProject {
  return {
    ...project,
    ...patch,
    metadata: { ...project.metadata, ...(patch.metadata ?? {}) },
    styles: { ...project.styles, ...(patch.styles ?? {}) },
    updatedAt: new Date().toISOString()
  };
}

export function getVoiceLayout(voices: VoiceSelection): VoiceKey[][] {
  const top = (['S', 'A'] as VoiceKey[]).filter((voice) => voices[voice]);
  const bottom = (['T', 'B'] as VoiceKey[]).filter((voice) => voices[voice]);
  return [top, bottom].filter((row) => row.length > 0);
}

export function enforceFiveBlocksPerPage(project: ChoirProject): ChoirProject {
  const pages: NotationPage[] = [];
  const blocksPerPage = editorBlocksPerPage(project.voices);
  project.pages.forEach((page) => {
    for (let index = 0; index < page.blocks.length; index += blocksPerPage) {
      pages.push({
        id: index === 0 ? page.id : createId('page'),
        blocks: page.blocks.slice(index, index + blocksPerPage)
      });
    }
  });
  return { ...project, pages: pages.length ? pages : [createPage()] };
}

export function duplicateBlock(block: NotationBlock): NotationBlock {
  return {
    ...block,
    id: createId('block'),
    measures: block.measures.map((measure) => ({
      ...measure,
      id: createId('measure'),
      voices: {
        S: [...measure.voices.S],
        A: [...measure.voices.A],
        T: [...measure.voices.T],
        B: [...measure.voices.B]
      }
    })),
    lyricLines: block.lyricLines.map((line) => ({
      ...line,
      id: createId('lyric'),
      slots: line.slots.map((slot) => ({ ...slot }))
    })),
    underlines: block.underlines.map((underline) => ({ ...underline, id: createId('underline') })),
    warnings: [...block.warnings]
  };
}

export function deleteBlock(project: ChoirProject, blockId: string): ChoirProject {
  const pages = project.pages
    .map((page) => ({ ...page, blocks: page.blocks.filter((block) => block.id !== blockId) }))
    .filter((page) => page.blocks.length > 0);

  return enforceFiveBlocksPerPage({
    ...project,
    pages: pages.length ? pages : [createPage()]
  });
}

export function moveBlock(project: ChoirProject, blockId: string, direction: -1 | 1): ChoirProject {
  const blocks = project.pages.flatMap((page) => page.blocks);
  const index = blocks.findIndex((block) => block.id === blockId);
  const nextIndex = index + direction;
  if (index < 0 || nextIndex < 0 || nextIndex >= blocks.length) return project;

  const nextBlocks = [...blocks];
  [nextBlocks[index], nextBlocks[nextIndex]] = [nextBlocks[nextIndex], nextBlocks[index]];

  return enforceFiveBlocksPerPage({
    ...project,
    pages: [{ id: project.pages[0]?.id ?? createId('page'), blocks: nextBlocks }]
  });
}

export function formatUpdatedAt(value: string): string {
  return new Intl.DateTimeFormat(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(value));
}

export function normalizeProject(project: ChoirProject): ChoirProject {
  return {
    ...project,
    pages: project.pages.map((page) => ({
      ...page,
      blocks: page.blocks.map((block) => {
        if (Array.isArray(block.measures) && Array.isArray(block.lyricLines)) {
          return {
            ...block,
            lyricLines: block.lyricLines.map((line) => ({
              ...line,
              text: line.text ?? line.slots.map((slot) => slot.text).filter(Boolean).join(' ')
            }))
          };
        }
        const legacy = block as unknown as { voices?: Record<VoiceKey, string>; lyricTop?: string; lyricCenter?: string[]; lyricBottom?: string };
        const fallback = createBlock();
        return {
          ...fallback,
          id: block.id,
          measures: legacy.voices ? measuresFromLegacyVoices(legacy.voices) : fallback.measures,
          lyricLines: legacyLyricLines(legacy),
          lyricMode: block.lyricMode ?? 'center',
          underlines: block.underlines ?? [],
          warnings: block.warnings ?? []
        };
      })
    }))
  };
}

function measuresFromLegacyVoices(voices: Record<VoiceKey, string>): NotationMeasure[] {
  const byVoice = {
    S: splitLegacyMeasures(voices.S),
    A: splitLegacyMeasures(voices.A),
    T: splitLegacyMeasures(voices.T),
    B: splitLegacyMeasures(voices.B)
  };
  const count = Math.max(1, byVoice.S.length, byVoice.A.length, byVoice.T.length, byVoice.B.length);
  return Array.from({ length: count }, (_, index) => ({
    id: createId('measure'),
    voices: {
      S: byVoice.S[index] ?? [],
      A: byVoice.A[index] ?? [],
      T: byVoice.T[index] ?? [],
      B: byVoice.B[index] ?? []
    }
  }));
}

function splitLegacyMeasures(value = ''): NotationToken[][] {
  const measures: NotationToken[][] = [[]];
  parseNotationTokens(value).forEach((token) => {
    if (token === '|' || token === '||') {
      if (measures[measures.length - 1].length > 0) measures.push([]);
      return;
    }
    const notationToken = makeNotationToken(token);
    if (notationToken && notationToken.type !== 'bar' && notationToken.type !== 'doubleBar') measures[measures.length - 1].push(notationToken);
  });
  return measures.filter((measure) => measure.length > 0);
}

function legacyLyricLines(legacy: { lyricTop?: string; lyricCenter?: string[]; lyricBottom?: string }) {
  const lines = [];
  if (legacy.lyricTop) lines.push({ id: createId('lyric'), position: 'top' as const, text: legacy.lyricTop, slots: [{ measureIndex: 0, beatSlotIndex: 0, text: legacy.lyricTop }] });
  legacy.lyricCenter?.filter(Boolean).forEach((text) => {
    lines.push({ id: createId('lyric'), position: 'middle' as const, text, slots: [{ measureIndex: 0, beatSlotIndex: 0, text }] });
  });
  if (legacy.lyricBottom) lines.push({ id: createId('lyric'), position: 'bottom' as const, text: legacy.lyricBottom, slots: [{ measureIndex: 0, beatSlotIndex: 0, text: legacy.lyricBottom }] });
  return lines;
}
