'use client';

import { useEffect, useEffectEvent, useId, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, CircleCheck, RotateCcw } from 'lucide-react';
import type { Flashcard, Lesson } from '@/lib/flashcards';
import { deckStats, recordAnswer, resetCards, useFlashcardProgress, useNow } from '@/lib/flashcard-progress';
import { cn } from '@/lib/cn';
import { ConfirmDialog } from '../confirm-dialog';
import { ProgressBar, percentOf } from '../progress-bar';
import { RichText } from './rich-text';

type Phase = 'intro' | 'study' | 'done';

/** Keys pressed in these belong to them (typing, pressing a button or link, a dialog), not to the cards. */
const OWN_KEYS = 'input, textarea, select, [contenteditable], button, a, [role="dialog"], dialog';
/** While any dialog is open (search, a Yes/No question), the card keys are off. */
const OPEN_DIALOG = 'dialog[open], [role="dialog"]:not(dialog), [role="alertdialog"]:not(dialog)';
/** The answer buttons: 1, 2, ← and → still work while one of them has focus. */
const ANSWER_KEYS = ['1', '2', 'ArrowLeft', 'ArrowRight'];

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

export function StudySession({ cards, lessons }: { cards: Flashcard[]; lessons: Record<string, Lesson> }) {
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
  // knew = cards known the first time they came up. missed = cards answered "Again" at least once (each counted once).
  const [result, setResult] = useState<{ knew: number; missed: string[] }>({ knew: 0, missed: [] });
  // Cards in this session. A missed card goes to the end of the queue again, but it is still one card.
  const [sessionSize, setSessionSize] = useState(0);

  const questionId = useId();
  const showAnswerRef = useRef<HTMLButtonElement>(null);
  const answersRef = useRef<HTMLDivElement>(null);

  // "due": cards ready for review (shuffled), then new cards in lesson order. "all": every card, shuffled.
  // Uses the same `now` as the "Due now" count, so the Start button and the session agree.
  function start(mode: 'due' | 'all') {
    const ids =
      mode === 'all'
        ? shuffle(cardIds)
        : [
            ...shuffle(cardIds.filter((id) => progress[id] && progress[id].due <= now)),
            ...cardIds.filter((id) => !progress[id]),
          ];
    if (ids.length === 0) return;
    setQueue(ids);
    setSessionSize(ids.length);
    setPosition(0);
    setRevealed(false);
    setResult({ knew: 0, missed: [] });
    setPhase('study');
  }

  function answer(knewIt: boolean) {
    const id = queue[position];
    recordAnswer(id, knewIt);
    setResult((r) => {
      if (r.missed.includes(id)) return r;
      return knewIt ? { ...r, knew: r.knew + 1 } : { ...r, missed: [...r.missed, id] };
    });
    // A missed card comes back at the end of this session too.
    const nextQueue = knewIt ? queue : [...queue, id];
    setQueue(nextQueue);
    setRevealed(false);
    if (position + 1 >= nextQueue.length) setPhase('done');
    else setPosition(position + 1);
  }

  const [askingReset, setAskingReset] = useState(false);

  // Keyboard: Space or Enter shows the answer. 1 (or ←) = Again, 2 (or →) = I knew it.
  const onKey = useEffectEvent((event: KeyboardEvent) => {
    if (event.defaultPrevented || event.isComposing || event.keyCode === 229) return;
    if (event.altKey || event.ctrlKey || event.metaKey) return;
    if (document.querySelector(OPEN_DIALOG)) return;
    const target = event.target instanceof Element ? event.target : null;
    const onAnswerButtons = ANSWER_KEYS.includes(event.key) && target?.closest('[data-card-keys]');
    if (target?.closest(OWN_KEYS) && !onAnswerButtons) return;

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
  });

  useEffect(() => {
    if (phase !== 'study') return;
    const listener = (event: KeyboardEvent) => onKey(event);
    window.addEventListener('keydown', listener);
    return () => window.removeEventListener('keydown', listener);
  }, [phase]);

  // Focus follows the card: the "Click the card…" hint for a new card, the answer buttons once it is shown.
  // (The answer buttons' group gets focus, not one button, so a second Space or Enter can't answer by mistake.)
  useEffect(() => {
    if (phase !== 'study') return;
    (revealed ? answersRef : showAnswerRef).current?.focus({ preventScroll: true });
  }, [phase, revealed, position]);

  if (phase === 'done') {
    return (
      <div className="mt-8 rounded-2xl border bg-fd-card p-8 text-center shadow-sm">
        <CircleCheck className="mx-auto size-10 text-emerald-600" />
        <h2 className="mt-3 text-xl font-semibold">Session done</h2>
        <p className="mt-2 text-fd-muted-foreground">
          You knew {result.knew}. {result.missed.length} needed another try.
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
    const lesson = lessons[card.lesson];
    // Cards still to answer "I knew it" in this session (the one on screen included). It never goes up,
    // so the bar never goes backwards when a missed card is queued again.
    const left = queue.length - position;
    return (
      <div className="mt-8">
        <div className="mb-2 flex items-center justify-between text-sm text-fd-muted-foreground">
          <span>
            {left} {left === 1 ? 'card' : 'cards'} left
          </span>
          <button type="button" onClick={() => setPhase('done')} className="hover:text-fd-foreground">
            End session
          </button>
        </div>
        <ProgressBar percent={percentOf(sessionSize - left, sessionSize)} label="Session progress" />

        {/*
          Click anywhere on the card to see the answer (the owner wants no "Show answer" button).
          The hint below is a plain-looking button only so the keyboard and screen readers can reveal it too.
        */}
        <div
          onClick={() => setRevealed(true)}
          className={cn(
            'mt-6 rounded-2xl border bg-fd-card p-6 shadow-sm transition md:p-8',
            !revealed && 'cursor-pointer hover:border-fd-primary/40 hover:shadow-md',
          )}
        >
          <p className="text-xs font-medium uppercase tracking-wide text-fd-muted-foreground">Question</p>
          <p id={questionId} className="mt-3 text-xl font-medium leading-relaxed md:text-2xl">
            <RichText text={card.q} />
          </p>
          {!revealed && (
            <button
              ref={showAnswerRef}
              type="button"
              aria-describedby={questionId}
              onClick={() => setRevealed(true)}
              className="mt-6 text-sm text-fd-muted-foreground hover:text-fd-foreground"
            >
              Click the card to see the answer <Kbd>Space</Kbd>
            </button>
          )}
          {revealed && (
            <div className="mt-6 border-t pt-6" aria-live="polite">
              <p className="text-xs font-medium uppercase tracking-wide text-fd-muted-foreground">Answer</p>
              <p className="mt-3 text-lg leading-relaxed">
                <RichText text={card.a} />
              </p>
              {lesson && (
                <Link
                  href={lesson.url}
                  className="mt-4 inline-flex items-center gap-1 text-sm text-fd-primary hover:underline"
                >
                  From the lesson: {lesson.title} <ArrowRight className="size-3.5" />
                </Link>
              )}
            </div>
          )}
        </div>

        {revealed && (
          <div
            ref={answersRef}
            role="group"
            aria-label="Did you know it?"
            tabIndex={-1}
            data-card-keys
            className="mt-5 flex flex-wrap justify-center gap-3 outline-none"
          >
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
          </div>
        )}
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
        Read the question, answer it in your head, then click the card to see the answer. Cards you know come back
        later (after 1, 3, 7, 14, then 30 days). Cards you miss come back the same day.
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
          onClick={() => setAskingReset(true)}
          className="ml-auto text-sm text-fd-muted-foreground hover:text-fd-foreground"
        >
          Reset progress
        </button>
      </div>
      <ConfirmDialog
        open={askingReset}
        title="Reset these cards?"
        message="Your progress for these cards will be cleared. They will all be new again."
        onYes={() => {
          resetCards(cardIds);
          setAskingReset(false);
        }}
        onNo={() => setAskingReset(false)}
      />
    </div>
  );
}
