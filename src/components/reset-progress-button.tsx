'use client';

import { RotateCcw } from 'lucide-react';
import { resetAllPages, useDonePages } from '@/lib/progress';

/** Marks every lesson as not done, after asking first. */
export function ResetProgressButton() {
  const doneCount = useDonePages().size;

  return (
    <button
      type="button"
      disabled={doneCount === 0}
      onClick={() => {
        if (window.confirm(`Mark all ${doneCount} done lessons as not done? This can't be undone.`)) resetAllPages();
      }}
      className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm text-fd-muted-foreground transition-colors hover:bg-fd-accent hover:text-fd-foreground disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent"
    >
      <RotateCcw className="size-3.5" />
      Reset progress
    </button>
  );
}
