import { describe, expect, it } from 'vitest';
import {
  applyOctaveToLastNote,
  parseNotationTokens,
  validateBarRhythm,
  validateBlockAlignment,
  validateMiddleLyrics,
  validateMeterPattern,
  validateNotation,
  validatePageBlockCount
} from './notationValidation';

describe('notation validation', () => {
  it('accepts common meter patterns and rejects malformed patterns', () => {
    expect(validateMeterPattern('6.5.6.5')).toBe(true);
    expect(validateMeterPattern('8.7.8.7')).toBe(true);
    expect(validateMeterPattern('7.6.7.6')).toBe(true);
    expect(validateMeterPattern('4/4')).toBe(true);
    expect(validateMeterPattern('12/8')).toBe(true);
    expect(validateMeterPattern('6-5-6-5')).toBe(false);
    expect(validateMeterPattern('65.65')).toBe(false);
  });

  it('requires musical rhythm symbols between notes instead of spaces alone', () => {
    expect(validateNotation('dr').valid).toBe(false);
    expect(validateNotation('rm').valid).toBe(false);
    expect(validateNotation('sf').valid).toBe(false);
    expect(validateNotation('d r').valid).toBe(false);
    expect(validateNotation('d re').valid).toBe(false);
    expect(validateNotation('d:r').valid).toBe(true);
    expect(validateNotation('d,r').valid).toBe(true);
    expect(validateNotation('d-r').valid).toBe(true);
    expect(validateNotation('d:-r').valid).toBe(true);
  });

  it('allows chromatic notes and required bar symbols', () => {
    const result = validateNotation("d:re,de.fe-se:-ta || m'");
    expect(result.valid).toBe(true);
    expect(parseNotationTokens("d:-re | m'")).toEqual(['d', ':-', 're', '|', "m'"]);
  });

  it('treats chromatic notes as one token', () => {
    expect(parseNotationTokens('de:r,re.fe-se:-ta')).toEqual(['de', ':', 'r', ',', 're', '.', 'fe', '-', 'se', ':-', 'ta']);
    expect(validateNotation('de:r').valid).toBe(true);
  });

  it('applies real octave symbols only to an existing note', () => {
    expect(applyOctaveToLastNote('d:r', '\u00b2')).toBe('d:r\u00b2');
    expect(applyOctaveToLastNote('d:r', '\u2083')).toBe('d:r\u2083');
    expect(applyOctaveToLastNote('| :', '\u00b9')).toBe('| :');
    expect(applyOctaveToLastNote('', '\u00b9')).toBe('');
    expect(validateNotation('\u00b9 d').valid).toBe(false);
  });

  it('warns when bar beat groups do not match the selected beat', () => {
    expect(validateBarRhythm('| d :r :m :f | s :l :t :d ||', '4/4')).toEqual([]);
    expect(validateBarRhythm('| d :r | m :f ||', '4/4')[0].message).toContain('4 beat');
    expect(validateBarRhythm('| d :r :m | f :s :l ||', '3/4')).toEqual([]);
    expect(validateBarRhythm('| d :r :m |', '6/8')[0].message).toContain('6 beat');
  });

  it('reports mismatched measure counts across enabled voices', () => {
    const issues = validateBlockAlignment(
      {
        S: '| d :r :m :f ||',
        A: '| m :f :s :l | t :d :r :m ||',
        T: '| s :l :t :d ||',
        B: '| d :d :s :s ||'
      },
      { S: true, A: true, T: true, B: true }
    );
    expect(issues.some((issue) => issue.message.includes('measure'))).toBe(true);
  });

  it('warns for lyric overflow and too many page blocks', () => {
    expect(validateMiddleLyrics(['1', '2', '3', '4', '5', '6', '7'])[0].message).toContain('6 middle lyric');
    expect(validatePageBlockCount({ id: 'page', blocks: Array.from({ length: 3 }, (_, index) => ({ id: String(index) }) as never) })[0].message).toContain('maximum of 2');
  });
});
