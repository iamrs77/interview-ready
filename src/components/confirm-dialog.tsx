'use client';

import { useEffect, useId, useRef } from 'react';

/**
 * A small Yes / No question, shown in the middle of the page (instead of the browser's own "localhost says" box).
 * Built on the native <dialog>: it blocks the page behind it and keeps keyboard focus inside.
 * "No" gets focus first, so pressing Enter by mistake changes nothing.
 * Esc or a click outside means No.
 */
export function ConfirmDialog({
  open,
  title,
  message,
  onYes,
  onNo,
}: {
  open: boolean;
  title: string;
  message?: string;
  onYes: () => void;
  onNo: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const messageId = useId();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      role="alertdialog"
      aria-labelledby={titleId}
      aria-describedby={message ? messageId : undefined}
      // Esc: let the parent close it, so its state stays in sync.
      onCancel={(event) => {
        event.preventDefault();
        onNo();
      }}
      // A click on the dim area around the box lands on the <dialog> itself.
      onClick={(event) => {
        if (event.target === event.currentTarget) onNo();
      }}
      className="confirm-dialog m-auto w-[calc(100%-2rem)] max-w-sm rounded-2xl border bg-fd-card p-0 text-fd-foreground shadow-xl backdrop:bg-black/25 backdrop:backdrop-blur-[2px]"
    >
      <div className="p-5">
        <h2 id={titleId} className="text-base font-semibold">
          {title}
        </h2>
        {message && (
          <p id={messageId} className="mt-1.5 text-sm leading-relaxed text-fd-muted-foreground">
            {message}
          </p>
        )}
        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onNo}
            className="min-w-20 rounded-lg border bg-fd-card px-4 py-2 text-sm font-medium hover:bg-fd-accent"
          >
            No
          </button>
          <button
            type="button"
            onClick={onYes}
            className="min-w-20 rounded-lg bg-fd-primary px-4 py-2 text-sm font-medium text-fd-primary-foreground hover:bg-fd-primary/85"
          >
            Yes
          </button>
        </div>
      </div>
    </dialog>
  );
}
