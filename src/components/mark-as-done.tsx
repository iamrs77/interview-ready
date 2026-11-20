'use client';

import Link from 'next/link';
import { ArrowRight, Circle, CircleCheck } from 'lucide-react';
import { cn } from '@/lib/cn';
import { setPageDone, useDonePages } from '@/lib/progress';

type MarkAsDoneProps = {
  pageUrl: string;
  /** Shown as a button once the page is marked as done. */
  nextLesson?: { title: string; url: string };
};

export function MarkAsDone({ pageUrl, nextLesson }: MarkAsDoneProps) {
  const done = useDonePages().has(pageUrl);

  return (
    <div className="mt-10 flex flex-wrap items-center justify-between gap-4 rounded-xl border bg-fd-card p-4">
      <p className="text-sm text-fd-muted-foreground">
        {done ? 'Nice work! You finished this page.' : 'Finished reading? Mark this page as done.'}
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          aria-pressed={done}
          onClick={() => setPageDone(pageUrl, !done)}
          className={cn(
            'inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors',
            done
              ? 'bg-fd-success/15 text-fd-success hover:bg-fd-success/25'
              : 'bg-fd-primary text-fd-primary-foreground hover:bg-fd-primary/85',
          )}
        >
          {done ? <CircleCheck className="size-4" /> : <Circle className="size-4" />}
          {done ? 'Done' : 'Mark as done'}
        </button>

        {done && nextLesson && (
          <Link
            href={nextLesson.url}
            className="inline-flex items-center gap-2 rounded-lg bg-fd-primary px-4 py-2 text-sm font-medium text-fd-primary-foreground transition-colors hover:bg-fd-primary/85"
          >
            Next: {nextLesson.title}
            <ArrowRight className="size-4" />
          </Link>
        )}
      </div>
    </div>
  );
}
