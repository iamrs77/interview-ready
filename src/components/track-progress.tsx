'use client';

import { useDonePages } from '@/lib/progress';

/** Shows "3 of 8 pages done" with a bar, for one track. */
export function TrackProgress({ pageUrls }: { pageUrls: string[] }) {
  const donePages = useDonePages();
  const done = pageUrls.filter((url) => donePages.has(url)).length;
  const total = pageUrls.length;
  const percent = total === 0 ? 0 : Math.round((done / total) * 100);

  return (
    <div className="mt-4">
      <div className="mb-1.5 flex justify-between text-xs text-fd-muted-foreground">
        <span>
          {done} of {total} pages done
        </span>
        <span>{percent}%</span>
      </div>
      <div
        className="h-2 overflow-hidden rounded-full bg-fd-muted"
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
    </div>
  );
}
