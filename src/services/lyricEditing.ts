import type { LyricCursor, LyricLine, LyricSlot, NotationMeasure, NotationToken, VoiceKey } from '../types/project';

export type LyricEditResult = {
  line: LyricLine;
  cursor: LyricCursor;
};

export type MeasureGrid = {
  slotCount: number;
  tokens: Record<VoiceKey, NotationToken[][]>;
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
  const tokens = {
    S: tokensBySlot(measure.voices.S),
    A: tokensBySlot(measure.voices.A),
    T: tokensBySlot(measure.voices.T),
    B: tokensBySlot(measure.voices.B)
  };
  const slotCount = Math.max(1, ...activeVoices.map((voice) => tokens[voice].length));
  (['S', 'A', 'T', 'B'] as VoiceKey[]).forEach((voice) => {
    while (tokens[voice].length < slotCount) tokens[voice].push([]);
  });
  return { slotCount, tokens };
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
