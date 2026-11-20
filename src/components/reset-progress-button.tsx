'use client';

import { useState } from 'react';
import { RotateCcw } from 'lucide-react';
import { resetAllPages, useDonePages } from '@/lib/progress';
import { ConfirmDialog } from './confirm-dialog';

/**
 * Marks every lesson as not done, after asking first.
 * `pageUrls`: the track's current pages. Only those are counted, so old marks for removed pages
 * don't show up in the question or keep the button enabled.
 */
export function ResetProgressButton({ pageUrls }: { pageUrls: string[] }) {
  const donePages = useDonePages();
  const doneCount = pageUrls.filter((url) => donePages.has(url)).length;
  const [asking, setAsking] = useState(false);

  return (
    <>
      <button
        type="button"
        disabled={doneCount === 0}
        onClick={() => setAsking(true)}
        className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm text-fd-muted-foreground transition-colors hover:bg-fd-accent hover:text-fd-foreground disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent"
      >
        <RotateCcw className="size-3.5" />
        Reset progress
      </button>
      <ConfirmDialog
        open={asking}
        title="Reset your progress?"
        message={`All ${doneCount} done ${doneCount === 1 ? 'lesson' : 'lessons'} will be marked as not done.`}
        onYes={() => {
          resetAllPages();
          setAsking(false);
        }}
        onNo={() => setAsking(false)}
      />
    </>
  );
}
