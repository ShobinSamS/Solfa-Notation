import { describe, expect, it } from 'vitest';
import { OCTAVE_BUTTONS, SYMBOL_BUTTONS } from './constants';

describe('toolbar constants', () => {
  it('contains the required tonic sol-fa symbols', () => {
    expect(SYMBOL_BUTTONS).toEqual(['|', '||', ':', '\u2223', ':-', '.', ',', "'"]);
  });

  it('contains real octave marks without note placeholders', () => {
    expect(OCTAVE_BUTTONS.map((button) => button.value)).toEqual(['\u00b9', '\u00b2', '\u00b3', '\u2081', '\u2082', '\u2083']);
  });
});
