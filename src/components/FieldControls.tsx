import { FONT_FAMILIES, FONT_SIZE_OPTIONS } from '../data/constants';
import type { FontTarget, TextStyle } from '../types/project';

type Props = {
  target: FontTarget;
  value: TextStyle;
  onChange: (style: TextStyle) => void;
};

export function FieldControls({ target, value, onChange }: Props) {
  return (
    <div className="grid grid-cols-2 gap-2">
      <select
        className="form-field"
        value={value.family}
        onChange={(event) => onChange({ ...value, family: event.target.value })}
        aria-label={`${target} font`}
      >
        {FONT_FAMILIES.map((font) => (
          <option key={font}>{font}</option>
        ))}
      </select>
      <select
        className="form-field"
        value={value.size}
        onChange={(event) => onChange({ ...value, size: Number(event.target.value) })}
        aria-label={`${target} font size`}
      >
        {FONT_SIZE_OPTIONS[target].map((size) => (
          <option key={size} value={size}>
            {size}px
          </option>
        ))}
      </select>
    </div>
  );
}
