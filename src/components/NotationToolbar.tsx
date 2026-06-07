import { Delete, Link2 } from 'lucide-react';
import type React from 'react';
import { NOTE_BUTTONS, OCTAVE_BUTTONS, SYMBOL_BUTTONS } from '../data/constants';
import { Button } from './Button';

type Props = {
  groupMode: boolean;
  onInsert: (value: string) => void;
  onOctave: (value: string) => void;
  onBackspace: () => void;
  onToggleGroupMode: () => void;
};

export function NotationToolbar({ groupMode, onInsert, onOctave, onBackspace, onToggleGroupMode }: Props) {
  const keepA4Focus = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
  };

  return (
    <aside className="notation-toolbar sticky bottom-0 z-20 border-t border-slate-200 bg-white/95 p-3 shadow-xl backdrop-blur dark:border-slate-800 dark:bg-slate-950/95 lg:top-20 lg:h-[calc(100vh-6rem)] lg:w-64 lg:border lg:shadow-none" data-export-ignore>
      <div className="space-y-4">
        <div className="toolbar-actions grid grid-cols-2 gap-2">
          <Button variant="secondary" onMouseDown={keepA4Focus} onClick={onBackspace}>
            <Delete size={17} /> Back
          </Button>
          <Button variant={groupMode ? 'primary' : 'secondary'} onMouseDown={keepA4Focus} onClick={onToggleGroupMode}>
            <Link2 size={17} /> Group
          </Button>
        </div>
        <div>
          <p className="mb-2 text-xs font-bold uppercase text-slate-500">Symbols</p>
          <div className="symbol-buttons grid grid-cols-8 gap-2 lg:grid-cols-4">
            {SYMBOL_BUTTONS.map((symbol) => (
              <Button key={symbol} variant="ghost" className="min-h-10 px-0 font-notation" onMouseDown={keepA4Focus} onClick={() => onInsert(symbol)}>
                {symbol}
              </Button>
            ))}
          </div>
        </div>
        <div>
          <p className="mb-2 text-xs font-bold uppercase text-slate-500">Notes</p>
          <div className="note-buttons grid grid-cols-6 gap-2 lg:grid-cols-4">
            {NOTE_BUTTONS.map((note) => (
              <Button key={note} variant="secondary" className="min-h-10 px-0 font-notation" onMouseDown={keepA4Focus} onClick={() => onInsert(note)}>
                {note}
              </Button>
            ))}
          </div>
        </div>
        <div>
          <p className="mb-2 text-xs font-bold uppercase text-slate-500">Octave</p>
          <div className="octave-buttons grid grid-cols-6 gap-2 lg:grid-cols-3">
            {OCTAVE_BUTTONS.map((button) => (
              <Button key={button.value} variant="ghost" className="min-h-10 px-0 font-notation" onMouseDown={keepA4Focus} onClick={() => onOctave(button.value)}>
                {button.label}
              </Button>
            ))}
          </div>
        </div>
      </div>
    </aside>
  );
}
