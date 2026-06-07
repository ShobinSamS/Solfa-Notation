import type { BarToken, DoubleBarToken, MeasureCursor, NotationBlock, NotationMeasure, NotationToken, VoiceKey } from '../types/project';

const noteValues = new Set(['d', 'r', 'm', 'f', 's', 'l', 't', 'de', 're', 'fe', 'se', 'ta']);
const rhythmValues = new Set([':', ':-', '-', '.', ',', "'", '∣']);
const subdivisionUnits: Partial<Record<string, number>> = { '.': 2, ',': 1, "'": 1 };

export type MeasureEditResult = {
  block: NotationBlock;
  cursor: MeasureCursor;
  rejected?: boolean;
  warning?: string;
};

export function createEmptyMeasure(id: string): NotationMeasure {
  return {
    id,
    voices: { S: [], A: [], T: [], B: [] }
  };
}

export function makeNotationToken(value: string, grouped = false): NotationToken | BarToken | DoubleBarToken | null {
  if (value === '|') return { id: tokenId('bar'), type: 'bar', value: '|' };
  if (value === '||') return { id: tokenId('doubleBar'), type: 'doubleBar', value: '||' };
  if (noteValues.has(stripOctave(value))) {
    const octave = value.replace(stripOctave(value), '') || undefined;
    return { id: tokenId('note'), type: 'note', value: stripOctave(value), octave, underlined: grouped };
  }
  if (rhythmValues.has(value)) return { id: tokenId('rhythm'), type: 'rhythm', value: value as ':' | ':-' | '-' | '.' | ',' | "'" | '∣' };
  return null;
}

export function tokenText(token: NotationToken | BarToken | DoubleBarToken): string {
  if (token.type === 'note') return `${token.value}${token.octave ?? ''}`;
  if (token.type === 'rhythm' && token.value === '∣') return '|';
  return token.value;
}

export function insertMeasureToken(
  block: NotationBlock,
  cursor: MeasureCursor,
  value: string,
  beat: string,
  groupMode: boolean
): MeasureEditResult {
  if (value === '|' || value === '||') {
    const measures = ensureMeasure(block.measures, cursor.measureIndex);
    const measure = measures[cursor.measureIndex];
    if (value === '||') {
      if (measure.ending) {
        return { block, cursor, rejected: true, warning: 'Double bar already ends this section.' };
      }
      measures[cursor.measureIndex] = {
        ...measure,
        ending: { id: tokenId('doubleBar'), type: 'doubleBar', value: '||' },
        trailingBar: undefined
      };
      return {
        block: { ...block, measures: trimMeasuresAfterEnding(measures) },
        cursor: { ...cursor, tokenIndex: measure.voices[cursor.voice].length }
      };
    }
    if (measure.ending) {
      if (measure.trailingBar) {
        return { block, cursor, rejected: true, warning: 'Only one final bar may follow a double bar.' };
      }
      measures[cursor.measureIndex] = {
        ...measure,
        trailingBar: { id: tokenId('bar'), type: 'bar', value: '|' }
      };
      return {
        block: { ...block, measures: trimMeasuresAfterEnding(measures) },
        cursor: { ...cursor, tokenIndex: measure.voices[cursor.voice].length }
      };
    }
    if (!measures[cursor.measureIndex + 1]) measures.splice(cursor.measureIndex + 1, 0, createEmptyMeasure(`measure-${Date.now()}`));
    return { block: { ...block, measures }, cursor: { ...cursor, measureIndex: cursor.measureIndex + 1, tokenIndex: 0 } };
  }

  const token = makeNotationToken(value, groupMode);
  if (!token || token.type === 'bar' || token.type === 'doubleBar') {
    return { block, cursor, rejected: true, warning: `Unsupported notation token "${value}".` };
  }

  const measures = ensureMeasure(block.measures, cursor.measureIndex);
  const measure = measures[cursor.measureIndex];
  const voiceTokens = [...measure.voices[cursor.voice]];
  const tokenIndex = Math.max(0, Math.min(cursor.tokenIndex, voiceTokens.length));

  if (token.type === 'note') {
    const previous = voiceTokens[tokenIndex - 1];
    const next = voiceTokens[tokenIndex];
    if (previous?.type === 'note' || next?.type === 'note') {
      return { block, cursor, rejected: true, warning: 'Insert rhythm or bar before the next note.' };
    }
  }

  const nextVoiceTokens = [...voiceTokens.slice(0, tokenIndex), token, ...voiceTokens.slice(tokenIndex)];
  const expected = beatCapacity(beat);

  if (expected && exceedsBeatCapacity(nextVoiceTokens, expected)) {
    return { block, cursor, rejected: true, warning: 'Measure full for selected beat.' };
  }

  measures[cursor.measureIndex] = {
    ...measure,
    voices: { ...measure.voices, [cursor.voice]: nextVoiceTokens }
  };

  return { block: { ...block, measures }, cursor: { ...cursor, tokenIndex: tokenIndex + 1 } };
}

export function backspaceToken(block: NotationBlock, cursor: MeasureCursor): MeasureEditResult {
  const measure = block.measures[cursor.measureIndex];
  if (!measure) return { block, cursor };
  const currentVoiceTokens = measure.voices[cursor.voice];

  if (measure.trailingBar && cursor.tokenIndex >= currentVoiceTokens.length) {
    const measures = [...block.measures];
    measures[cursor.measureIndex] = { ...measure, trailingBar: undefined };
    return { block: { ...block, measures }, cursor: { ...cursor, tokenIndex: currentVoiceTokens.length } };
  }

  if (measure.ending && cursor.tokenIndex >= currentVoiceTokens.length) {
    const measures = [...block.measures];
    measures[cursor.measureIndex] = { ...measure, ending: undefined };
    return { block: { ...block, measures }, cursor: { ...cursor, tokenIndex: currentVoiceTokens.length } };
  }

  if (cursor.tokenIndex <= 0) {
    if (cursor.measureIndex === 0) return { block, cursor };
    const previous = block.measures[cursor.measureIndex - 1];
    if (previous.ending) {
      const measures = [...block.measures];
      if (isEmptyMeasure(measure)) {
        measures.splice(cursor.measureIndex, 1);
        return {
          block: { ...block, measures },
          cursor: { ...cursor, measureIndex: cursor.measureIndex - 1, tokenIndex: previous.voices[cursor.voice].length }
        };
      }
      measures[cursor.measureIndex - 1] = { ...previous, ending: undefined };
      return {
        block: { ...block, measures },
        cursor: { ...cursor, measureIndex: cursor.measureIndex - 1, tokenIndex: previous.voices[cursor.voice].length }
      };
    }
    const measures = [...block.measures];
    const currentTokens = measure.voices[cursor.voice];
    measures[cursor.measureIndex - 1] = {
      ...previous,
      voices: {
        ...previous.voices,
        [cursor.voice]: [...previous.voices[cursor.voice], ...currentTokens]
      }
    };
    measures.splice(cursor.measureIndex, 1);
    return {
      block: { ...block, measures },
      cursor: { ...cursor, measureIndex: cursor.measureIndex - 1, tokenIndex: previous.voices[cursor.voice].length }
    };
  }

  const voiceTokens = [...measure.voices[cursor.voice]];
  voiceTokens.splice(cursor.tokenIndex - 1, 1);
  const measures = [...block.measures];
  measures[cursor.measureIndex] = { ...measure, voices: { ...measure.voices, [cursor.voice]: voiceTokens } };

  return { block: { ...block, measures }, cursor: { ...cursor, tokenIndex: cursor.tokenIndex - 1 } };
}

export function renderMeasureVoice(measures: NotationMeasure[], voice: VoiceKey): string {
  const visibleMeasures = trimMeasuresAfterEnding(measures);
  const last = visibleMeasures[visibleMeasures.length - 1];
  return (
    visibleMeasures.map((measure) => `| ${measure.voices[voice].map(tokenText).join('')}${measure.ending?.value ?? ''}${measure.trailingBar ? ' |' : ''}`).join(' ') +
    (last && !last.ending ? ' |' : '')
  );
}

export function beatGroups(tokens: NotationToken[]): number {
  const beatSeparators = tokens.filter((token) => token.type === 'rhythm' && (token.value === ':' || token.value === ':-' || token.value === '∣')).length;
  return (tokens.some((token) => token.type === 'note') ? 1 : 0) + beatSeparators;
}

export function beatCapacity(beat: string): number | null {
  const match = beat.match(/^(\d{1,2})\/\d{1,2}$/);
  return match ? Number(match[1]) : null;
}

export function measureWarnings(block: NotationBlock, beat: string, voices: VoiceKey[]): string[] {
  const capacity = beatCapacity(beat);
  if (!capacity) return [];
  const warnings: string[] = [];
  block.measures.forEach((measure, measureIndex) => {
    voices.forEach((voice) => {
      const groups = beatGroups(measure.voices[voice]);
      if (groups > 0 && groups < capacity) warnings.push(`${voice} measure ${measureIndex + 1} has ${groups} beat groups; ${beat} expects ${capacity}.`);
    });
  });
  return warnings;
}

export function stripOctave(value: string): string {
  return value.replace(/[\u00b9\u00b2\u00b3\u2081\u2082\u2083]/g, '');
}

export function trimMeasuresAfterEnding(measures: NotationMeasure[]): NotationMeasure[] {
  const endingIndex = measures.findIndex((measure) => measure.ending);
  return endingIndex >= 0 ? measures.slice(0, endingIndex + 1) : measures;
}

function ensureMeasure(measures: NotationMeasure[], index: number): NotationMeasure[] {
  const next = [...measures];
  while (!next[index]) next.push(createEmptyMeasure(`measure-${Date.now()}-${next.length}`));
  return next;
}

function exceedsBeatCapacity(tokens: NotationToken[], capacity: number): boolean {
  if (beatGroups(tokens) > capacity) return true;
  const subdivisions = tokens.reduce((total, token) => total + (token.type === 'rhythm' ? subdivisionUnits[token.value] ?? 0 : 0), 0);
  return subdivisions > capacity * 4;
}

function isEmptyMeasure(measure: NotationMeasure): boolean {
  return !measure.ending && !measure.trailingBar && (['S', 'A', 'T', 'B'] as VoiceKey[]).every((voice) => measure.voices[voice].length === 0);
}

function tokenId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}
