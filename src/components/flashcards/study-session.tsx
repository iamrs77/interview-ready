'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, CircleCheck, RotateCcw } from 'lucide-react';
import type { Flashcard } from '@/lib/flashcards';
import { deckStats, recordAnswer, resetCards, useFlashcardProgress, useNow } from '@/lib/flashcard-progress';
import { RichText } from './rich-text';

type Phase = 'intro' | 'study' | 'done';

function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function Kbd({ children }: { children: string }) {
  return (
    <kbd className="ml-1 hidden rounded border border-current/20 px-1.5 py-0.5 text-[0.7rem] font-normal opacity-70 sm:inline">
      {children}
    </kbd>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl bg-fd-muted/60 p-3 text-center">
      <p className="text-2xl font-semibold">{value}</p>
      <p className="text-xs text-fd-muted-foreground">{label}</p>
    </div>
  );
}

export function StudySession({ cards }: { cards: Flashcard[] }) {
  const progress = useFlashcardProgress();
  const now = useNow();
  const cardIds = useMemo(() => cards.map((card) => card.id), [cards]);
  const byId = useMemo(() => new Map(cards.map((card) => [card.id, card])), [cards]);
  const stats = deckStats(cardIds, progress, now);
  const toStudy = stats.due + stats.fresh;

  const [phase, setPhase] = useState<Phase>('intro');
  const [queue, setQueue] = useState<string[]>([]);
  const [position, setPosition] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [result, setResult] = useState({ knew: 0, again: 0 });

  // "due": cards ready for review (shuffled), then new cards in lesson order. "all": every card, shuffled.
  function start(mode: 'due' | 'all') {
    const current = Date.now();
    const ids =
      mode === 'all'
        ? shuffle(cardIds)
        : [
            ...shuffle(cardIds.filter((id) => progress[id] && progress[id].due <= current)),
            ...cardIds.filter((id) => !progress[id]),
          ];
    if (ids.length === 0) return;
    setQueue(ids);
    setPosition(0);
    setRevealed(false);
    setResult({ knew: 0, again: 0 });
    setPhase('study');
  }

  function answer(knewIt: boolean) {
    const id = queue[position];
    recordAnswer(id, knewIt);
    setResult((r) => (knewIt ? { ...r, knew: r.knew + 1 } : { ...r, again: r.again + 1 }));
    // A missed card comes back at the end of this session too.
    const nextQueue = knewIt ? queue : [...queue, id];
    setQueue(nextQueue);
    setRevealed(false);
    if (position + 1 >= nextQueue.length) setPhase('done');
    else setPosition(position + 1);
  }

  function resetDeck() {
    if (window.confirm('Reset your progress for these cards? They will all be new again.')) resetCards(cardIds);
  }

  // Keyboard: Space or Enter shows the answer. 1 (or ←) = Again, 2 (or →) = I knew it.
  useEffect(() => {
    if (phase !== 'study') return;
    const onKey = (event: KeyboardEvent) => {
      if (event.altKey || event.ctrlKey || event.metaKey) return;
      if (!revealed && (event.key === ' ' || event.key === 'Enter')) {
        event.preventDefault();
        setRevealed(true);
      } else if (revealed && (event.key === '1' || event.key === 'ArrowLeft')) {
        event.preventDefault();
        answer(false);
      } else if (revealed && (event.key === '2' || event.key === 'ArrowRight')) {
        event.preventDefault();
        answer(true);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  if (phase === 'done') {
    return (
      <div className="mt-8 rounded-2xl border bg-fd-card p-8 text-center shadow-sm">
        <CircleCheck className="mx-auto size-10 text-emerald-600" />
        <h2 className="mt-3 text-xl font-semibold">Session done</h2>
        <p className="mt-2 text-fd-muted-foreground">
          You knew {result.knew}. {result.again} needed another try.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <button
            type="button"
            onClick={() => setPhase('intro')}
            className="inline-flex items-center gap-2 rounded-lg bg-fd-primary px-4 py-2.5 text-sm font-medium text-fd-primary-foreground hover:bg-fd-primary/85"
          >
            <RotateCcw className="size-4" /> Back to this deck
          </button>
          <Link
            href="/learn/system-design/flashcards"
            className="inline-flex items-center gap-2 rounded-lg border bg-fd-card px-4 py-2.5 text-sm font-medium hover:bg-fd-accent"
          >
            All decks <ArrowRight className="size-4" />
          </Link>
        </div>
      </div>
    );
  }

  if (phase === 'study') {
    const card = byId.get(queue[position])!;
    const percent = Math.round((position / queue.length) * 100);
    return (
      <div className="mt-8">
        <div className="mb-2 flex items-center justify-between text-sm text-fd-muted-foreground">
          <span>
            Card {position + 1} of {queue.length}
          </span>
          <button type="button" onClick={() => setPhase('done')} className="hover:text-fd-foreground">
            End session
          </button>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-fd-muted">
          <div
            className="h-full rounded-full bg-linear-to-r from-indigo-500 to-violet-500 transition-all"
            style={{ width: `${percent}%` }}
          />
        </div>

        <div className="mt-6 rounded-2xl border bg-fd-card p-6 shadow-sm md:p-8">
          <p className="text-xs font-medium uppercase tracking-wide text-fd-muted-foreground">Question</p>
          <p className="mt-3 text-xl font-medium leading-relaxed md:text-2xl">
            <RichText text={card.q} />
          </p>
          {revealed && (
            <div className="mt-6 border-t pt-6" aria-live="polite">
              <p className="text-xs font-medium uppercase tracking-wide text-fd-muted-foreground">Answer</p>
              <p className="mt-3 text-lg leading-relaxed">
                <RichText text={card.a} />
              </p>
              <Link
                href={card.lessonUrl}
                className="mt-4 inline-flex items-center gap-1 text-sm text-fd-primary hover:underline"
              >
                From the lesson: {card.lessonTitle} <ArrowRight className="size-3.5" />
              </Link>
            </div>
          )}
        </div>

        <div className="mt-5 flex flex-wrap justify-center gap-3">
          {revealed ? (
            <>
              <button
                type="button"
                onClick={() => answer(false)}
                className="inline-flex min-w-36 items-center justify-center rounded-lg bg-rose-500/10 px-5 py-2.5 text-sm font-medium text-rose-700 hover:bg-rose-500/20"
              >
                Again <Kbd>1</Kbd>
              </button>
              <button
                type="button"
                onClick={() => answer(true)}
                className="inline-flex min-w-36 items-center justify-center rounded-lg bg-emerald-500/10 px-5 py-2.5 text-sm font-medium text-emerald-700 hover:bg-emerald-500/20"
              >
                I knew it <Kbd>2</Kbd>
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => setRevealed(true)}
              className="inline-flex min-w-48 items-center justify-center rounded-lg bg-fd-primary px-5 py-2.5 text-sm font-medium text-fd-primary-foreground hover:bg-fd-primary/85"
            >
              Show answer <Kbd>Space</Kbd>
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="mt-8 rounded-2xl border bg-fd-card p-6 shadow-sm">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Cards" value={stats.total} />
        <Stat label="New" value={stats.fresh} />
        <Stat label="Due now" value={stats.due} />
        <Stat label="Known" value={stats.known} />
      </div>
      <p className="mt-5 text-sm text-fd-muted-foreground">
        Read the question, answer it in your head, then show the answer. Cards you know come back later (after 1, 3,
        7, 14, then 30 days). Cards you miss come back the same day.
      </p>
      {toStudy === 0 && (
        <p className="mt-3 text-sm font-medium">Nothing to review right now. Come back later, or practice all cards.</p>
      )}
      <div className="mt-6 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => start('due')}
          disabled={toStudy === 0}
          className="inline-flex items-center gap-2 rounded-lg bg-fd-primary px-4 py-2.5 text-sm font-medium text-fd-primary-foreground hover:bg-fd-primary/85 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Start ({toStudy} {toStudy === 1 ? 'card' : 'cards'}) <ArrowRight className="size-4" />
        </button>
        <button
          type="button"
          onClick={() => start('all')}
          className="inline-flex items-center gap-2 rounded-lg border bg-fd-card px-4 py-2.5 text-sm font-medium hover:bg-fd-accent"
        >
          Practice all {stats.total} cards
        </button>
        <button
          type="button"
          onClick={resetDeck}
          className="ml-auto text-sm text-fd-muted-foreground hover:text-fd-foreground"
        >
          Reset progress
        </button>
      </div>
    </div>
  );
}
