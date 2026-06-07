import { ArrowLeft } from 'lucide-react';
import { Button } from '../components/Button';

export function HelpPage({ onBack }: { onBack: () => void }) {
  return (
    <section className="mx-auto max-w-3xl rounded-lg bg-white p-5 shadow-sm dark:bg-slate-900">
      <Button variant="ghost" onClick={onBack}>
        <ArrowLeft size={18} /> Back
      </Button>
      <h1 className="mt-4 text-2xl font-black">Help</h1>
      <div className="prose prose-slate mt-4 max-w-none dark:prose-invert">
        <p>Create a project, choose the voices you need, then edit notation blocks in the A4 editor.</p>
        <ul>
          <li>Use spaces between sol-fa notes so lyrics and note positions remain aligned.</li>
          <li>Use the bottom toolbar for note syllables, octaves, separators, ties, and group marks.</li>
          <li>Projects are stored offline on this device and auto-save while editing.</li>
          <li>Export PDF for print and PNG when sharing image previews.</li>
        </ul>
      </div>
    </section>
  );
}
