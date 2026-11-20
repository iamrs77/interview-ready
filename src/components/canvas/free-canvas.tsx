'use client';

import { useCallback, useEffect, useRef, useState, type KeyboardEvent, type MouseEvent } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, TriangleAlert } from 'lucide-react';
import { getBoard, saveBoard, type SavedScene } from '@/lib/canvas-store';
import { loadBoard } from './excalidraw-loader';

/*
 * The Free canvas: one blank board to draw anything.
 * It saves itself in this browser (IndexedDB) about a second after each change, and when the tab is hidden or
 * closed, so it is there next time. Clear canvas and Save as image are in the board's menu.
 */

const BOARD_ID = 'free-canvas';
const SAVE_DELAY = 1000;
const LESSONS_URL = '/learn/system-design';

const Board = dynamic(() => loadBoard(), {
  ssr: false,
  loading: () => (
    <div className="grid h-full place-items-center text-sm text-fd-muted-foreground">Loading the drawing board…</div>
  ),
});

/**
 * Ctrl/Cmd+K inside the board belongs to Excalidraw (with one shape selected, it adds a link to it). React runs
 * this after Excalidraw's own key handler and before the site search, which listens on window, so stopping it
 * here keeps search closed. Outside the board, Ctrl/Cmd+K still opens search.
 */
function keepCtrlKInBoard(event: KeyboardEvent) {
  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') event.stopPropagation();
}

type Status = 'idle' | 'saving' | 'saved';

export function FreeCanvas() {
  const router = useRouter();
  // undefined = still reading the saved board. The board mounts only after that, because it reads its
  // starting drawing once.
  const [initial, setInitial] = useState<{ scene: SavedScene | null }>();
  const [canSave, setCanSave] = useState(true);
  const [status, setStatus] = useState<Status>('idle');
  const pending = useRef<SavedScene | null>(null);
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;
    getBoard(BOARD_ID)
      .then((scene) => {
        if (!cancelled) setInitial({ scene: scene ?? null });
      })
      .catch(() => {
        if (cancelled) return;
        setCanSave(false);
        setInitial({ scene: null });
      });
    return () => {
      cancelled = true;
    };
  }, []);

  /** Writes the latest drawing now, if there is one waiting. */
  const flush = useCallback(() => {
    window.clearTimeout(timer.current);
    timer.current = undefined;
    const scene = pending.current;
    if (!scene) return;
    pending.current = null;
    saveBoard(BOARD_ID, scene)
      .then(() => setStatus('saved'))
      .catch(() => setCanSave(false));
  }, []);

  const onSceneChange = useCallback(
    (scene: SavedScene) => {
      pending.current = scene;
      setStatus('saving');
      window.clearTimeout(timer.current);
      timer.current = window.setTimeout(flush, SAVE_DELAY);
    },
    [flush],
  );

  // Save right away when the tab is hidden or closed, and when leaving the page.
  useEffect(() => {
    const onHide = () => flush();
    const onVisibility = () => {
      if (document.visibilityState === 'hidden') flush();
    };
    window.addEventListener('pagehide', onHide);
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      window.removeEventListener('pagehide', onHide);
      document.removeEventListener('visibilitychange', onVisibility);
      flush();
    };
  }, [flush]);

  // "Back" returns to the page you came from (usually a lesson). Opened on its own, it goes to the lessons.
  function goBack(event: MouseEvent<HTMLAnchorElement>) {
    if (window.history.length > 1) {
      event.preventDefault();
      router.back();
    }
  }

  return (
    <>
      <header className="flex h-14 shrink-0 items-center gap-4 border-b bg-fd-card px-4">
        <Link
          href={LESSONS_URL}
          onClick={goBack}
          className="inline-flex shrink-0 items-center gap-1.5 text-sm text-fd-muted-foreground transition hover:text-fd-foreground"
        >
          <ArrowLeft className="size-4" />
          Back
        </Link>
        <span aria-hidden className="h-5 w-px shrink-0 bg-fd-border" />
        <h1 className="text-sm font-semibold">Free canvas</h1>
        <div className="flex flex-1 justify-end">
          {canSave ? (
            <span className="text-xs text-fd-muted-foreground" role="status">
              {status === 'saving' ? 'Saving…' : status === 'saved' ? 'Saved in this browser' : ''}
            </span>
          ) : (
            <p
              role="status"
              title="This browser blocks saving (for example, a private window). You can still draw, but nothing is kept."
              className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 px-3 py-1 text-xs font-medium text-amber-800"
            >
              <TriangleAlert className="size-3.5" />
              Can&apos;t save in this browser
            </p>
          )}
        </div>
      </header>
      {/* The library button is hidden: it links to Excalidraw's site. */}
      <section
        aria-label="Drawing board"
        onKeyDown={keepCtrlKInBoard}
        className="relative min-h-0 flex-1 bg-white [&_.default-sidebar-trigger]:hidden"
      >
        <div className="absolute inset-0">
          {initial ? (
            <Board initialScene={initial.scene} onSceneChange={onSceneChange} />
          ) : (
            <div className="grid h-full place-items-center text-sm text-fd-muted-foreground">Loading your drawing…</div>
          )}
        </div>
      </section>
    </>
  );
}
