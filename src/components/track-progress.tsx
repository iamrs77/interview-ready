'use client';

import { useDonePages } from '@/lib/progress';
import { ProgressBar, percentOf } from './progress-bar';

/** Shows "40% done" with a bar, for one track. */
export function TrackProgress({ pageUrls }: { pageUrls: string[] }) {
  const donePages = useDonePages();
  const done = pageUrls.filter((url) => donePages.has(url)).length;
  const percent = percentOf(done, pageUrls.length);

  return (
    <div className="mt-4">
      <p className="mb-1.5 text-xs text-fd-muted-foreground">{percent}% done</p>
      <ProgressBar percent={percent} label="Pages done" className="h-2" />
    </div>
  );
}
