import type { LyricCursor, LyricLine, LyricSlot, NotationMeasure, NotationToken, VoiceKey } from '../types/project';

export type LyricEditResult = {
  line: LyricLine;
  cursor: LyricCursor;
};

export type MeasureGrid = {
  slotCount: number;
  tokens: Record<VoiceKey, NotationToken[][]>;
  cells: Record<VoiceKey, { tokens: NotationToken[]; start: number; span: number }[]>;
  lyricSlots: { start: number; span: number }[];
};

export function insertLyricCharacter(line: LyricLine, cursor: LyricCursor, char: string): LyricEditResult {
  if (char === ' ') {
    return {
      line,
      cursor: { ...cursor, beatSlotIndex: cursor.beatSlotIndex + 1, charOffset: 0 }
    };
  }

  const slots = [...line.slots];
  const slot = findOrCreateSlot(slots, cursor.measureIndex, cursor.beatSlotIndex);
  const offset = Math.max(0, Math.min(cursor.charOffset, slot.text.length));
  slot.text = `${slot.text.slice(0, offset)}${char}${slot.text.slice(offset)}`;
  return {
    line: { ...line, text: lyricLineText(slots), slots },
    cursor: { ...cursor, charOffset: offset + char.length }
  };
}

export function backspaceLyric(line: LyricLine, cursor: LyricCursor): LyricEditResult {
  const slots = [...line.slots];
  const slot = slots.find((item) => item.measureIndex === cursor.measureIndex && item.beatSlotIndex === cursor.beatSlotIndex);
  if (slot && cursor.charOffset > 0) {
    const offset = Math.min(cursor.charOffset, slot.text.length);
    slot.text = `${slot.text.slice(0, offset - 1)}${slot.text.slice(offset)}`;
    const nextSlots = slots.filter((item) => item.text.length > 0);
    return { line: { ...line, text: lyricLineText(nextSlots), slots: nextSlots }, cursor: { ...cursor, charOffset: offset - 1 } };
  }

  if (cursor.beatSlotIndex > 0) {
    const previousSlot = slots.find((item) => item.measureIndex === cursor.measureIndex && item.beatSlotIndex === cursor.beatSlotIndex - 1);
    return {
      line,
      cursor: {
        ...cursor,
        beatSlotIndex: cursor.beatSlotIndex - 1,
        charOffset: previousSlot?.text.length ?? 0
      }
    };
  }

  return { line, cursor };
}

export function computeMeasureGrid(measure: NotationMeasure, activeVoices: VoiceKey[]): MeasureGrid {
  const parsed = {
    S: parseBeatCells(measure.voices.S),
    A: parseBeatCells(measure.voices.A),
    T: parseBeatCells(measure.voices.T),
    B: parseBeatCells(measure.voices.B)
  };
  const beatCount = Math.max(1, ...activeVoices.map((voice) => parsed[voice].length));
  const beatWidths = Array.from({ length: beatCount }, (_, beatIndex) =>
    Math.max(1, ...activeVoices.map((voice) => parsed[voice][beatIndex]?.length ?? 1))
  );
  const beatStarts = beatWidths.reduce<number[]>((starts, width, index) => {
    starts[index + 1] = starts[index] + width;
    return starts;
  }, [1]);
  const slotCount = beatWidths.reduce((total, width) => total + width, 0);
  const cells = Object.fromEntries(
    (['S', 'A', 'T', 'B'] as VoiceKey[]).map((voice) => [
      voice,
      parsed[voice].flatMap((beat, beatIndex) => {
        const width = beatWidths[beatIndex] ?? 1;
        return beat.map((tokens, subIndex) => {
          const span = Math.max(1, Math.floor(width / beat.length));
          const start = beatStarts[beatIndex] + Math.min(width - 1, Math.round((subIndex * width) / beat.length));
          return { tokens, start, span: beat.length === 1 ? width : span };
        });
      })
    ])
  ) as Record<VoiceKey, { tokens: NotationToken[]; start: number; span: number }[]>;
  const tokens = Object.fromEntries((['S', 'A', 'T', 'B'] as VoiceKey[]).map((voice) => [voice, cells[voice].map((cell) => cell.tokens)])) as Record<VoiceKey, NotationToken[][]>;
  const lyricSlots = Array.from({ length: slotCount }, (_, slotIndex) => ({ start: slotIndex + 1, span: 1 }));
  return { slotCount, tokens, cells, lyricSlots };
}

export function lyricTextAt(line: LyricLine, measureIndex: number, beatSlotIndex: number): string {
  return line.slots.find((slot) => slot.measureIndex === measureIndex && slot.beatSlotIndex === beatSlotIndex)?.text ?? '';
}

function findOrCreateSlot(slots: LyricSlot[], measureIndex: number, beatSlotIndex: number): LyricSlot {
  let slot = slots.find((item) => item.measureIndex === measureIndex && item.beatSlotIndex === beatSlotIndex);
  if (!slot) {
    slot = { measureIndex, beatSlotIndex, slotIndex: beatSlotIndex, text: '' };
    slots.push(slot);
  }
  if (slot.slotIndex === undefined) slot.slotIndex = slot.beatSlotIndex;
  return slot;
}

function lyricLineText(slots: LyricSlot[]): string {
  return slots
    .slice()
    .sort((a, b) => a.measureIndex - b.measureIndex || a.beatSlotIndex - b.beatSlotIndex)
    .map((slot) => slot.text)
    .filter(Boolean)
    .join(' ');
}

function tokensBySlot(tokens: NotationToken[]): NotationToken[][] {
  const slots: NotationToken[][] = [[]];
  tokens.forEach((token, index) => {
    if (token.type === 'rhythm') {
      slots[slots.length - 1].push(token);
      const next = tokens[index + 1];
      const createsNextSlot =
        token.value === ':' ||
        token.value === ':-' ||
        token.value === '∣' ||
        ((token.value === '.' || token.value === ',' || token.value === "'") && next?.type === 'note');
      if (createsNextSlot && index < tokens.length - 1) slots.push([]);
      return;
    }
    if (token.type === 'note') {
      slots[slots.length - 1].push(token);
    }
  });
  return slots;
}

function parseBeatCells(tokens: NotationToken[]): NotationToken[][][] {
  const beats: NotationToken[][][] = [[[]]];
  tokens.forEach((token, index) => {
    const beat = beats[beats.length - 1];
    const cell = beat[beat.length - 1];
    if (token.type === 'rhythm') {
      cell.push(token);
      const next = tokens[index + 1];
      if ((token.value === ':' || token.value === ':-' || token.value === '\u2223' || String(token.value) === 'âˆ£') && index < tokens.length - 1) {
        beats.push([[]]);
      } else if ((token.value === '.' || token.value === ',' || token.value === "'") && next?.type === 'note') {
        beat.push([]);
      }
      return;
    }
    cell.push(token);
  });
  return beats.map((beat) => beat.filter((cell) => cell.length > 0)).filter((beat) => beat.length > 0);
}
