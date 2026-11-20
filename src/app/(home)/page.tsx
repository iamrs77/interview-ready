import Link from 'next/link';
import { ArrowRight, Boxes, Network, type LucideIcon } from 'lucide-react';
import { source, type Track } from '@/lib/source';
import { TrackProgress } from '@/components/track-progress';
import { ResetProgressButton } from '@/components/reset-progress-button';

/** The tracks shown on the home page, in order. */
const TRACK_CARDS: { track: Track; title: string; icon: LucideIcon; iconClass: string }[] = [
  { track: 'system-design', title: 'System Design', icon: Network, iconClass: 'bg-indigo-500/10 text-indigo-600' },
  { track: 'low-level-design', title: 'Low-Level Design', icon: Boxes, iconClass: 'bg-teal-500/10 text-teal-700' },
];

export default function HomePage() {
  const pages = source.getPages();
  const pageUrlsOf = (track: Track) => pages.filter((page) => page.slugs[0] === track).map((page) => page.url);

  return (
    <main className="relative mx-auto w-full max-w-5xl px-4 py-16 md:py-24">
      {/* Soft color glow behind the title */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-96 bg-[radial-gradient(ellipse_at_top,var(--color-indigo-200),transparent_65%)] opacity-50"
      />

      <section className="text-center">
        <h1 className="text-3xl font-bold tracking-tight md:text-5xl">
          Get ready for your{' '}
          <span className="bg-linear-to-r from-indigo-600 via-violet-600 to-rose-500 bg-clip-text text-transparent">
            tech interviews
          </span>
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-fd-muted-foreground md:text-lg">
          Everything you need, in one place. Open it, pick a topic, and start learning.
        </p>
      </section>

      {/* Two cards per row; one per row on phones. */}
      <section className="mx-auto mt-16 grid max-w-4xl gap-4 md:grid-cols-2">
        {TRACK_CARDS.map(({ track, title, icon: Icon, iconClass }) => (
          <Link
            key={track}
            href={`/learn/${track}`}
            className="group block rounded-2xl border bg-fd-card p-6 shadow-sm transition hover:border-fd-primary/40 hover:shadow-md"
          >
            <div className="flex items-center gap-3">
              <span className={`rounded-xl p-2.5 ${iconClass}`}>
                <Icon className="size-5" />
              </span>
              <h2 className="text-lg font-semibold transition-colors group-hover:text-fd-primary">{title}</h2>
              <ArrowRight className="ml-auto size-5 shrink-0 text-fd-muted-foreground transition group-hover:translate-x-1 group-hover:text-fd-primary" />
            </div>
            <TrackProgress pageUrls={pageUrlsOf(track)} />
          </Link>
        ))}
        <div className="flex justify-end md:col-span-2">
          {/* Resets the done marks of every track. */}
          <ResetProgressButton pageUrls={pages.map((page) => page.url)} />
        </div>
      </section>
    </main>
  );
}
