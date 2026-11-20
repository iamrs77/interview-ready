'use client';

import { useDonePages } from '@/lib/progress';
import { ProgressBar, percentOf } from './progress-bar';

/** Shows "3 of 8 pages done" with a bar, for one track. */
export function TrackProgress({ pageUrls }: { pageUrls: string[] }) {
  const donePages = useDonePages();
  const done = pageUrls.filter((url) => donePages.has(url)).length;
  const total = pageUrls.length;
  const percent = percentOf(done, total);

  return (
    <div className="mt-4">
      <div className="mb-1.5 flex justify-between text-xs text-fd-muted-foreground">
        <span>
          {done} of {total} pages done
        </span>
        <span>{percent}%</span>
      </div>
      <ProgressBar percent={percent} label="Pages done" className="h-2" />
    </div>
  );
}
