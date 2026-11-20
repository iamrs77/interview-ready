import Link from 'next/link';
import { ArrowRight, Network } from 'lucide-react';
import { source } from '@/lib/source';
import { TrackProgress } from '@/components/track-progress';
import { ResetProgressButton } from '@/components/reset-progress-button';

export default function HomePage() {
  const systemDesignPages = source
    .getPages()
    .filter((page) => page.slugs[0] === 'system-design')
    .map((page) => page.url);

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

      <section className="mx-auto mt-16 max-w-2xl">
        <Link
          href="/learn/system-design"
          className="group block rounded-2xl border bg-fd-card p-6 shadow-sm transition hover:border-fd-primary/40 hover:shadow-md"
        >
          <div className="flex items-center gap-3">
            <span className="rounded-xl bg-indigo-500/10 p-2.5 text-indigo-600">
              <Network className="size-5" />
            </span>
            <h2 className="text-lg font-semibold transition-colors group-hover:text-fd-primary">System Design</h2>
            <ArrowRight className="ml-auto size-5 shrink-0 text-fd-muted-foreground transition group-hover:translate-x-1 group-hover:text-fd-primary" />
          </div>
          <TrackProgress pageUrls={systemDesignPages} />
        </Link>
        <div className="mt-2 flex justify-end">
          <ResetProgressButton pageUrls={systemDesignPages} />
        </div>
      </section>
    </main>
  );
}
