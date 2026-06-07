import { ArrowLeft } from 'lucide-react';
import { Button } from '../components/Button';
import { futureFeatures } from '../data/futureFeatures';

export function AboutPage({ onBack }: { onBack: () => void }) {
  return (
    <section className="mx-auto max-w-3xl rounded-lg bg-white p-5 shadow-sm dark:bg-slate-900">
      <Button variant="ghost" onClick={onBack}>
        <ArrowLeft size={18} /> Back
      </Button>
      <h1 className="mt-4 text-2xl font-black">About SolfaTonic</h1>
      <p className="mt-3 text-slate-600 dark:text-slate-300">
        SolfaTonic is an offline-first tonic sol-fa notation editor for church choirs and music teams. It stores projects
        on the device, supports dynamic SATB layouts, and exports printable A4 score sheets.
      </p>
      <h2 className="mt-6 text-lg font-bold">Prepared extension points</h2>
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        {futureFeatures.map((feature) => (
          <div key={feature.key} className="rounded-lg border border-slate-200 p-3 text-sm dark:border-slate-700">
            <p className="font-semibold">{feature.label}</p>
            <p className="text-slate-500 dark:text-slate-400">{feature.serviceBoundary}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
