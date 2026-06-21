export type VoiceKey = 'S' | 'A' | 'T' | 'B';

export type VoiceSelection = Record<VoiceKey, boolean>;

export type FontTarget = 'title' | 'subtitle' | 'lyrics' | 'metadata' | 'notes';

export type TextStyle = {
  family: string;
  size: number;
};

export type MeterMode = 'meter' | 'cm';

export type ProjectMetadata = {
  composer?: string;
  extraComposer?: string;
  tempo?: number;
  beat?: string;
  meterMode: MeterMode;
  meter?: string;
  exportTitleSize?: number;
  exportNotesSize?: number;
  exportLyricsSize?: number;
};

export type LyricMode = 'center' | 'close';

export type ActiveRowKind = 'voice' | 'topLyric' | 'middleLyric' | 'bottomLyric';

export type UnderlineRange = {
  id: string;
  row: VoiceKey;
  measureIndex: number;
  start: number;
  end: number;
};

export type NoteToken = {
  id?: string;
  type: 'note';
  value: string;
  octave?: string;
  grouped?: boolean;
  underlined?: boolean;
};

export type RhythmToken = {
  id?: string;
  type: 'rhythm';
  value: ':' | ':-' | '-' | '.' | ',' | "'" | '∣';
};

export type DoubleBarToken = {
  id?: string;
  type: 'doubleBar';
  value: '||';
};

export type BarToken = {
  id?: string;
  type: 'bar';
  value: '|';
};

export type NotationToken = NoteToken | RhythmToken;

export type NotationMeasure = {
  id: string;
  voices: Record<VoiceKey, NotationToken[]>;
  ending?: DoubleBarToken;
  trailingBar?: BarToken;
  continuation?: boolean;
  continues?: boolean;
};

export type NotationBlock = {
  id: string;
  measures: NotationMeasure[];
  lyricLines: LyricLine[];
  lyricMode: LyricMode;
  underlines: UnderlineRange[];
  warnings: string[];
};

export type LyricPosition = 'top' | 'middle' | 'bottom';

export type LyricSlot = {
  measureIndex: number;
  beatSlotIndex: number;
  slotIndex?: number;
  text: string;
};

export type LyricLine = {
  id: string;
  position: LyricPosition;
  text: string;
  slots: LyricSlot[];
};

export type MeasureCursor = {
  blockId: string;
  measureIndex: number;
  voice: VoiceKey;
  tokenIndex: number;
};

export type LyricCursor = {
  blockId: string;
  lyricLineId: string;
  measureIndex: number;
  beatSlotIndex: number;
  charOffset: number;
};

export type NotationPage = {
  id: string;
  blocks: NotationBlock[];
};

export type ChoirProject = {
  id: string;
  title: string;
  subtitles: [string, string];
  scale: string;
  voices: VoiceSelection;
  metadata: ProjectMetadata;
  styles: Record<FontTarget, TextStyle>;
  pages: NotationPage[];
  createdAt: string;
  updatedAt: string;
};

export type ProjectDraft = Partial<Omit<ChoirProject, 'id' | 'createdAt' | 'updatedAt' | 'pages'>> & {
  title: string;
  scale: string;
};
