'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import type { DeckKey } from '@/lib/flashcards';
import { deckStats, useFlashcardProgress, useNow } from '@/lib/flashcard-progress';
import { sections } from '@/lib/sections';

type DeckSummary = { key: DeckKey; cardIds: string[] };

function ProgressBar({ percent }: { percent: number }) {
  return (
    <div
      className="h-1.5 overflow-hidden rounded-full bg-fd-muted"
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={percent}
    >
      <div
        className="h-full rounded-full bg-linear-to-r from-indigo-500 to-violet-500 transition-all"
        style={{ width: `${percent}%` }}
      />
    </div>
  );
}

const percentOf = (part: number, total: number) => (total === 0 ? 0 : Math.round((part / total) * 100));

export function DeckList({ decks }: { decks: DeckSummary[] }) {
  const progress = useFlashcardProgress();
  const now = useNow();
  const all = deckStats(
    decks.flatMap((deck) => deck.cardIds),
    progress,
    now,
  );
  const toStudy = all.due + all.fresh;

  return (
    <div className="mt-8">
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border bg-fd-card p-5 shadow-sm">
        <div className="min-w-56 flex-1">
          <p className="text-lg font-semibold">
            {all.known} of {all.total} cards known
          </p>
          <p className="mt-1 text-sm text-fd-muted-foreground">
            {all.due} due for review · {all.fresh} new
          </p>
          <div className="mt-3 max-w-md">
            <ProgressBar percent={percentOf(all.known, all.total)} />
          </div>
        </div>
        <Link
          href="/learn/system-design/flashcards/all"
          className="inline-flex items-center gap-2 rounded-lg bg-fd-primary px-4 py-2.5 text-sm font-medium text-fd-primary-foreground transition-colors hover:bg-fd-primary/85"
        >
          {toStudy > 0 ? `Study all decks (${toStudy})` : 'Practice all decks'}
          <ArrowRight className="size-4" />
        </Link>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {decks.map((deck) => {
          const stats = deckStats(deck.cardIds, progress, now);
          const section = sections[deck.key];
          return (
            <Link
              key={deck.key}
              href={`/learn/system-design/flashcards/${deck.key}`}
              className="group rounded-2xl border bg-fd-card p-5 shadow-sm transition hover:border-fd-primary/40 hover:shadow-md"
            >
              <div className="flex items-center gap-2">
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${section.className}`}
                >
                  <section.icon className="size-3.5" />
                  {section.label}
                </span>
                <ArrowRight className="ml-auto size-4 text-fd-muted-foreground transition group-hover:translate-x-1 group-hover:text-fd-primary" />
              </div>
              <p className="mt-3 text-sm text-fd-muted-foreground">
                {stats.total} cards · {stats.due} due · {stats.fresh} new
              </p>
              <div className="mt-3">
                <ProgressBar percent={percentOf(stats.known, stats.total)} />
              </div>
              <p className="mt-1.5 text-xs text-fd-muted-foreground">{stats.known} known</p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
