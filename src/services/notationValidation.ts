import type { NotationPage, VoiceKey, VoiceSelection } from '../types/project';
import { MAX_BLOCKS_PER_PAGE } from '../data/constants';

export type NotationIssue = {
  index: number;
  message: string;
};

export type NotationValidationResult = {
  valid: boolean;
  issues: NotationIssue[];
};

const baseNotes = ['d', 'r', 'm', 'f', 's', 'l', 't'];
const chromaticNotes = ['de', 're', 'fe', 'se', 'ta'];
const noteTokens = [...chromaticNotes, ...baseNotes];
const rhythmSymbols = ['||', '|', ':-', ':', '-', '.', ',', "'"];
const noteSeparators = new Set(['||', '|', ':-', ':', '-', '.', ',', "'"]);
const octaveSymbols = ['\u00b9', '\u00b2', '\u00b3', '\u2081', '\u2082', '\u2083'];
const validMeterPatterns = new Set(['CM', 'SM', 'LM', 'PM', '6.5.6.5', '6.6.8.6', '8.7.8.7', '7.6.7.6', '8.8.8.8']);
const notePattern = new RegExp(`^(?:${noteTokens.join('|')})(?:[${octaveSymbols.join('')}])?'?$`);

export function validateMeterPattern(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed) return true;
  return validMeterPatterns.has(trimmed) || /^\d{1,2}\/\d{1,2}$/.test(trimmed);
}

export function parseNotationTokens(value: string): string[] {
  const tokens: string[] = [];
  let index = 0;

  while (index < value.length) {
    const char = value[index];
    if (/\s/.test(char)) {
      index += 1;
      continue;
    }

    if (value.slice(index, index + 2) === '||' || value.slice(index, index + 2) === ':-') {
      tokens.push(value.slice(index, index + 2));
      index += 2;
      continue;
    }

    if (rhythmSymbols.includes(char)) {
      tokens.push(char);
      index += 1;
      continue;
    }

    const chromatic = chromaticNotes.find((note) => value.slice(index, index + note.length) === note);
    const base = baseNotes.find((note) => value[index] === note);
    const note = chromatic ?? base;
    if (note) {
      let token = note;
      index += note.length;
      if (octaveSymbols.includes(value[index])) {
        token += value[index];
        index += 1;
      }
      if (value[index] === "'") {
        token += "'";
        index += 1;
      }
      tokens.push(token);
      continue;
    }

    let unknown = char;
    index += 1;
    while (index < value.length && !/\s/.test(value[index]) && !rhythmSymbols.includes(value[index])) {
      unknown += value[index];
      index += 1;
    }
    tokens.push(unknown);
  }

  return tokens;
}

export function isNoteToken(token: string): boolean {
  return notePattern.test(token);
}

function isStandaloneOctave(token: string): boolean {
  return octaveSymbols.includes(token);
}

export function validateNotation(value: string): NotationValidationResult {
  const issues: NotationIssue[] = [];
  const tokens = parseNotationTokens(value);

  tokens.forEach((token, index) => {
    if (isStandaloneOctave(token)) {
      issues.push({ index, message: `Octave "${token}" must be attached to a note.` });
      return;
    }

    if (!isNoteToken(token) && !noteSeparators.has(token)) {
      issues.push({ index, message: `Unknown notation token "${token}".` });
    }

    if (isNoteToken(token) && isNoteToken(tokens[index + 1] ?? '')) {
      issues.push({
        index,
        message: 'Use a tonic sol-fa rhythm symbol between notes; spacing alone is only for alignment.'
      });
    }

    if (token === '-' && index === 0) {
      issues.push({ index, message: 'Dash should normally follow a note or another dash.' });
    }

    if ((token === ':' || token === ':-') && (tokens[index - 1] === ':' || tokens[index - 1] === ':-')) {
      issues.push({ index, message: 'Repeated beat separators may be advanced notation; check this bar.' });
    }
  });

  return { valid: issues.length === 0, issues };
}

export function applyOctaveToLastNote(value: string, octave: string): string {
  if (!value.trim() || !octaveSymbols.includes(octave)) return value;

  const match = [...value.matchAll(/(?:de|re|fe|se|ta|d|r|m|f|s|l|t)[\u00b9\u00b2\u00b3\u2081\u2082\u2083]?/g)].pop();
  if (!match || match.index === undefined) return value;

  const start = match.index;
  const end = start + match[0].length;
  const note = match[0].replace(/[\u00b9\u00b2\u00b3\u2081\u2082\u2083]/g, '');
  return `${value.slice(0, start)}${note}${octave}${value.slice(end)}`;
}

function countMeasures(value: string): number {
  const tokens = parseNotationTokens(value);
  let count = 0;
  let hasContent = false;
  tokens.forEach((token) => {
    if (token === '|' || token === '||') {
      if (hasContent) count += 1;
      hasContent = false;
    } else {
      hasContent = true;
    }
  });
  return count + (hasContent ? 1 : 0);
}

export function validateBlockAlignment(
  voices: Record<VoiceKey, string>,
  enabledVoices: VoiceSelection
): NotationIssue[] {
  const activeCounts = (Object.keys(enabledVoices) as VoiceKey[])
    .filter((voice) => enabledVoices[voice])
    .map((voice) => ({ voice, count: countMeasures(voices[voice] ?? '') }));

  if (activeCounts.length < 2) return [];

  const expected = activeCounts[0].count;
  return activeCounts
    .filter((item) => item.count !== expected)
    .map((item, index) => ({
      index,
      message: `${item.voice} has a mismatched measure count. Align bar lines across active voices.`
    }));
}

export function validateBarRhythm(value: string, beat = '4/4'): NotationIssue[] {
  const expected = expectedBeatUnits(beat);
  if (!expected) return [];

  const issues: NotationIssue[] = [];
  const bars = extractBars(value);
  bars.forEach((bar, index) => {
    const tokens = parseNotationTokens(bar);
    if (!tokens.some(isNoteToken)) return;
    const groups = 1 + tokens.filter((token) => token === ':' || token === ':-').length;
    if (groups !== expected) {
      issues.push({
        index,
        message: `Bar ${index + 1} has ${groups} beat group${groups === 1 ? '' : 's'}; ${beat} expects ${expected} beat groups.`
      });
    }
  });

  return issues;
}

function expectedBeatUnits(beat: string): number | null {
  const match = beat.match(/^(\d{1,2})\/\d{1,2}$/);
  if (!match) return null;
  return Number(match[1]);
}

function extractBars(value: string): string[] {
  const bars: string[] = [];
  let current: string[] = [];
  parseNotationTokens(value).forEach((token) => {
    if (token === '|' || token === '||') {
      if (current.length) bars.push(current.join(''));
      current = [];
    } else {
      current.push(token);
    }
  });
  if (current.length) bars.push(current.join(''));
  return bars;
}

export function validatePageBlockCount(page: NotationPage): NotationIssue[] {
  if (page.blocks.length <= MAX_BLOCKS_PER_PAGE) return [];
  return [{ index: 0, message: `An A4 page can contain a maximum of ${MAX_BLOCKS_PER_PAGE} SATB blocks.` }];
}

export function validateMiddleLyrics(lines: unknown[]): NotationIssue[] {
  if (lines.length <= 6) return [];
  return [{ index: 6, message: 'Only 6 middle lyric lines fit inside the notation block; extra lyrics should appear after the block.' }];
}
