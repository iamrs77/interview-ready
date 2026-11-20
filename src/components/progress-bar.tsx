import { cn } from '@/lib/cn';

/**
 * The thin indigo-to-violet bar used for lessons done, cards known, the study session and reading progress.
 * `label` is read by screen readers, together with the percent.
 */
export function ProgressBar({ percent, label, className }: { percent: number; label: string; className?: string }) {
  return (
    <div
      className={cn('h-1.5 overflow-hidden rounded-full bg-fd-muted', className)}
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={percent}
    >
      <div
        className="h-full rounded-full bg-linear-to-r from-indigo-500 to-violet-500 transition-[width] duration-150"
        style={{ width: `${percent}%` }}
      />
    </div>
  );
}

/** Whole percent of `part` in `total` (0 when total is 0). */
export const percentOf = (part: number, total: number) => (total === 0 ? 0 : Math.round((part / total) * 100));
