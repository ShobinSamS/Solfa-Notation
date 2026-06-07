import type { FontTarget, VoiceKey } from '../types/project';

export const APP_NAME = 'SofaTonic';
export const MAX_BLOCKS_PER_PAGE = 2;

export const SCALES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

export const BEATS = ['2/4', '3/4', '4/4', '6/8', '9/8', '12/8'];

export const METERS = ['CM', 'SM', 'LM', 'PM', '6.5.6.5', '6.6.8.6', '8.7.8.7', '7.6.7.6', '8.8.8.8'];

export const FONT_FAMILIES = ['Inter', 'Consolas', 'Courier New', 'Georgia', 'Times New Roman', 'Arial', 'Roboto Mono', 'Noto Serif'];

export const FONT_SIZE_OPTIONS: Record<FontTarget, number[]> = {
  title: [24, 28, 32, 36, 42],
  subtitle: [13, 15, 17, 19, 21],
  lyrics: [10, 11, 12, 13, 14, 16],
  metadata: [9, 10, 11, 12, 13],
  notes: [13, 15, 17, 19, 21, 24]
};

export const NOTE_BUTTONS = ['d', 'r', 'm', 'f', 's', 'l', 't', 'de', 're', 'fe', 'se', 'ta'];

export const OCTAVE_BUTTONS = [
  { label: '\u00b9', value: '\u00b9' },
  { label: '\u00b2', value: '\u00b2' },
  { label: '\u00b3', value: '\u00b3' },
  { label: '\u2081', value: '\u2081' },
  { label: '\u2082', value: '\u2082' },
  { label: '\u2083', value: '\u2083' }
];

export const SYMBOL_BUTTONS = ['|', '||', ':', '\u2223', ':-', '.', ',', "'"];

export const VOICE_LABELS: Record<VoiceKey, string> = {
  S: 'Soprano',
  A: 'Alto',
  T: 'Tenor',
  B: 'Bass'
};
