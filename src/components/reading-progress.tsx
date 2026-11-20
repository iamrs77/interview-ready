'use client';

import { useSyncExternalStore } from 'react';
import { BookOpen } from 'lucide-react';
import { ProgressBar } from './progress-bar';

function subscribe(onChange: () => void) {
  window.addEventListener('scroll', onChange, { passive: true });
  window.addEventListener('resize', onChange);
  // The page gets taller after it loads (diagrams, fonts), so check again when its height changes.
  const observer = new ResizeObserver(onChange);
  observer.observe(document.body);
  return () => {
    window.removeEventListener('scroll', onChange);
    window.removeEventListener('resize', onChange);
    observer.disconnect();
  };
}

/** How far down the page you have scrolled, from 0 to 100. */
function getProgress(): number {
  const scrollable = document.documentElement.scrollHeight - window.innerHeight;
  if (scrollable <= 0) return 100;
  return Math.min(100, Math.max(0, Math.round((window.scrollY / scrollable) * 100)));
}

/** Shown above "On this page" on the right side of each lesson. */
export function ReadingProgress() {
  const progress = useSyncExternalStore(subscribe, getProgress, () => 0);

  return (
    <div className="mb-6">
      <div className="mb-2 flex items-center justify-between text-xs text-fd-muted-foreground">
        <span>Reading progress</span>
        <span className="flex items-center gap-1.5">
          {progress}%
          <BookOpen className="size-3.5" />
        </span>
      </div>
      <ProgressBar percent={progress} label="Reading progress" />
    </div>
  );
}
