'use client';

import { useCallback, useEffect, useRef, useState, type CSSProperties, type KeyboardEvent, type PointerEvent } from 'react';
import dynamic from 'next/dynamic';
import { Eraser, Play, RotateCcw, SquareTerminal, X } from 'lucide-react';

/*
 * The JavaScript playground: a panel that slides in from the right on every lesson page.
 * Open and close it with the "JS Playground" button in the sidebar (under search) or Ctrl+` (backtick).
 * Phones have no sidebar, so they get a round "JS" button in the bottom-right corner instead.
 * Run with Ctrl+Enter.
 * Drag the left edge to change its width, and the bar above "Output" to change the output height.
 * "Reset" puts the starter code back right away (no question asked: fewer clicks).
 * Code runs in a Web Worker (public/js-runner.js), so an infinite loop can't freeze the page.
 * The code and the sizes are kept in this browser (localStorage), so they are still there next time.
 */

// The sidebar button sends this event; the panel listens for it.
const TOGGLE_EVENT = 'js-playground:toggle';

const CODE_KEY = 'js-playground-code';
const SIZE_KEY = 'js-playground-size';
// Code that is still running after this long is stopped (most likely an infinite loop).
const TIME_LIMIT_MS = 5000;

const DEFAULT_SIZE = { width: 576, outputHeight: 280 };
const MIN_WIDTH = 320;
const MIN_OUTPUT_HEIGHT = 80;
// Room always left for the code above the output.
const MIN_CODE_HEIGHT = 120;

const STARTER_CODE = `// Write JavaScript here, then press Ctrl+Enter to run it.
const numbers = [3, 1, 2];

numbers.sort((a, b) => a - b);

console.log(numbers);
`;

// The editor (CodeMirror) is big, so it loads only when the panel first opens.
const JsCodeEditor = dynamic(() => import('./js-code-editor'), {
  ssr: false,
  loading: () => <p className="p-4 text-sm text-fd-muted-foreground">Loading the editor…</p>,
});

type Line = { kind: 'log' | 'warn' | 'error'; text: string };
type Size = { width: number; outputHeight: number };

function readStorage<T>(key: string, fallback: T): T {
  try {
    const saved = localStorage.getItem(key);
    if (saved === null) {
      return fallback;
    }
    return key === CODE_KEY ? (saved as T) : (JSON.parse(saved) as T);
  } catch {
    return fallback;
  }
}

function writeStorage(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Storage is blocked (for example, a private window). Everything still works, it just isn't kept.
  }
}

/** Keeps a number between a low and a high limit. */
function clamp(value: number, low: number, high: number) {
  return Math.min(Math.max(value, low), Math.max(low, high));
}

export function JsPlayground() {
  const [open, setOpen] = useState(false);
  // Safe to read storage here: the panel only shows after a click, never in the server HTML.
  const [code, setCode] = useState(() => readStorage(CODE_KEY, STARTER_CODE));
  const [size, setSize] = useState<Size>(() => readStorage(SIZE_KEY, DEFAULT_SIZE));
  const [lines, setLines] = useState<Line[]>([]);
  const [running, setRunning] = useState(false);
  // Bumped on reset: a new key makes the editor start again with the starter code.
  const [editorKey, setEditorKey] = useState(0);
  const worker = useRef<Worker | null>(null);
  const timer = useRef<number | undefined>(undefined);

  const stopWorker = useCallback(() => {
    window.clearTimeout(timer.current);
    worker.current?.terminate();
    worker.current = null;
    setRunning(false);
  }, []);

  const run = useCallback(() => {
    // A new run always starts fresh: stop the old one, with any timers it left behind.
    stopWorker();
    setLines([]);
    setRunning(true);

    const next = new Worker('/js-runner.js');
    worker.current = next;

    next.onmessage = (event: MessageEvent<{ type: string; text?: string }>) => {
      const message = event.data;
      if (message.type === 'done') {
        // The code finished. Keep the worker, so timers it started can still print.
        window.clearTimeout(timer.current);
        setRunning(false);
        return;
      }
      const kind = message.type === 'warn' || message.type === 'error' ? message.type : 'log';
      setLines((old) => [...old, { kind, text: message.text ?? '' }]);
    };

    timer.current = window.setTimeout(() => {
      stopWorker();
      const text = `Stopped: the code ran longer than ${TIME_LIMIT_MS / 1000} seconds (an infinite loop?).`;
      setLines((old) => [...old, { kind: 'error', text }]);
    }, TIME_LIMIT_MS);

    next.postMessage(code);
  }, [code, stopWorker]);

  // Stop the worker when the page goes away.
  useEffect(() => stopWorker, [stopWorker]);

  // Ctrl+` (or Cmd+`) opens and closes the panel from anywhere on the page. So does the sidebar button.
  useEffect(() => {
    function toggle() {
      setOpen((value) => !value);
    }
    function onKeyDown(event: globalThis.KeyboardEvent) {
      if ((event.ctrlKey || event.metaKey) && event.key === '`') {
        event.preventDefault();
        toggle();
      }
    }
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener(TOGGLE_EVENT, toggle);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener(TOGGLE_EVENT, toggle);
    };
  }, []);

  function changeCode(value: string) {
    setCode(value);
    writeStorage(CODE_KEY, value);
  }

  function resetCode() {
    stopWorker();
    changeCode(STARTER_CODE);
    setLines([]);
    setEditorKey((key) => key + 1);
  }

  function changeSize(next: Size) {
    setSize(next);
    writeStorage(SIZE_KEY, JSON.stringify(next));
  }

  /**
   * Starts a drag on a resize handle. `onMove` gets the pointer position on every move.
   * Pointer capture keeps the moves coming even when the mouse runs past the handle.
   */
  function startDrag(event: PointerEvent<HTMLDivElement>, onMove: (x: number, y: number) => void) {
    event.preventDefault();
    const handle = event.currentTarget;
    handle.setPointerCapture(event.pointerId);
    // No text selection while dragging.
    document.body.style.userSelect = 'none';

    function move(moveEvent: globalThis.PointerEvent) {
      onMove(moveEvent.clientX, moveEvent.clientY);
    }
    function stop() {
      document.body.style.userSelect = '';
      handle.removeEventListener('pointermove', move);
      handle.removeEventListener('pointerup', stop);
      handle.removeEventListener('pointercancel', stop);
    }

    handle.addEventListener('pointermove', move);
    handle.addEventListener('pointerup', stop);
    handle.addEventListener('pointercancel', stop);
  }

  function resizeWidth(event: PointerEvent<HTMLDivElement>) {
    startDrag(event, (x) => {
      // The panel sits on the right, so its width is the distance from the pointer to the right edge.
      const width = clamp(window.innerWidth - x, MIN_WIDTH, window.innerWidth - 80);
      changeSize({ ...size, width });
    });
  }

  function resizeOutput(event: PointerEvent<HTMLDivElement>) {
    startDrag(event, (_x, y) => {
      // The output sits at the bottom, so its height is the distance from the pointer to the bottom edge.
      const highest = window.innerHeight - 48 - MIN_CODE_HEIGHT;
      const outputHeight = clamp(window.innerHeight - y, MIN_OUTPUT_HEIGHT, highest);
      changeSize({ ...size, outputHeight });
    });
  }

  function onPanelKeyDown(event: KeyboardEvent<HTMLElement>) {
    // Esc closes the panel, unless the editor used it (for example, to close the autocomplete list).
    if (event.key === 'Escape' && !event.defaultPrevented) {
      setOpen(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        title="JavaScript playground (Ctrl+`)"
        aria-label="Open the JavaScript playground"
        className="fixed right-4 bottom-4 z-40 inline-flex items-center md:hidden gap-1.5 rounded-full border bg-fd-card px-3.5 py-2 text-sm font-medium shadow-md transition hover:border-fd-primary/40 hover:text-fd-primary"
      >
        <SquareTerminal className="size-4" />
        JS
      </button>

      {open && (
        <aside
          aria-label="JavaScript playground"
          onKeyDown={onPanelKeyDown}
          style={{ '--playground-width': `${size.width}px` } as CSSProperties}
          className="fixed inset-y-0 right-0 z-50 flex w-full flex-col border-l bg-white shadow-2xl sm:w-(--playground-width) sm:max-w-[calc(100vw-80px)]"
        >
          {/* Drag the left edge to change the width (not on phones, where the panel is full width). */}
          <div
            onPointerDown={resizeWidth}
            title="Drag to resize"
            className="absolute inset-y-0 -left-1 z-10 hidden w-2 cursor-col-resize hover:bg-fd-primary/20 sm:block"
          />

          {/* Three zones, three colors: soft indigo bar, white code, gray output. */}
          <header className="flex h-12 shrink-0 items-center gap-2 border-b border-indigo-100 bg-indigo-50 px-3">
            <SquareTerminal className="size-4 text-indigo-600" />
            <h2 className="text-sm font-semibold">JavaScript</h2>
            <span className="hidden text-xs text-fd-muted-foreground sm:inline">Ctrl+Enter to run · Esc to close</span>
            <div className="ml-auto flex items-center gap-1">
              <button
                type="button"
                onClick={run}
                className="inline-flex items-center gap-1.5 rounded-md bg-fd-primary px-3 py-1.5 text-xs font-medium text-fd-primary-foreground transition hover:opacity-90"
              >
                <Play className="size-3.5" />
                Run
              </button>
              <button
                type="button"
                onClick={resetCode}
                title="Reset the code"
                aria-label="Reset the code"
                className="rounded-md p-1.5 text-fd-muted-foreground transition hover:bg-indigo-100 hover:text-fd-foreground"
              >
                <RotateCcw className="size-4" />
              </button>
              <button
                type="button"
                onClick={() => setLines([])}
                title="Clear the output"
                aria-label="Clear the output"
                className="rounded-md p-1.5 text-fd-muted-foreground transition hover:bg-indigo-100 hover:text-fd-foreground"
              >
                <Eraser className="size-4" />
              </button>
              <button
                type="button"
                onClick={() => setOpen(false)}
                title="Close (Esc)"
                aria-label="Close the playground"
                className="rounded-md p-1.5 text-fd-muted-foreground transition hover:bg-indigo-100 hover:text-fd-foreground"
              >
                <X className="size-4" />
              </button>
            </div>
          </header>

          <div className="min-h-0 flex-1 overflow-hidden bg-white">
            <JsCodeEditor key={editorKey} initialCode={code} onChange={changeCode} onRun={run} />
          </div>

          <section
            aria-label="Output"
            style={{ height: size.outputHeight }}
            className="relative flex shrink-0 flex-col border-t border-slate-200 bg-slate-50"
          >
            {/* Drag this bar to change the output height. */}
            <div
              onPointerDown={resizeOutput}
              title="Drag to resize"
              className="absolute inset-x-0 -top-1 z-10 h-2 cursor-row-resize hover:bg-fd-primary/20"
            />
            <div className="flex h-8 shrink-0 items-center border-b border-slate-200 bg-slate-100 px-4 text-xs font-medium text-slate-600">
              Output
              {running && <span className="ml-2 font-normal">Running…</span>}
            </div>
            <div role="log" className="min-h-0 flex-1 overflow-auto px-4 py-3 font-mono text-[13px] leading-relaxed">
              {lines.length === 0 && !running && (
                <p className="text-fd-muted-foreground">Nothing yet. console.log prints here.</p>
              )}
              {lines.map((line, index) => (
                <pre
                  key={index}
                  className={`break-words whitespace-pre-wrap ${
                    line.kind === 'error' ? 'text-red-700' : line.kind === 'warn' ? 'text-amber-700' : ''
                  }`}
                >
                  {line.text}
                </pre>
              ))}
            </div>
          </section>
        </aside>
      )}
    </>
  );
}

/** The "JS Playground" button in the sidebar, under search. Opens and closes the panel. */
export function JsPlaygroundButton() {
  return (
    <button
      type="button"
      onClick={() => window.dispatchEvent(new Event(TOGGLE_EVENT))}
      className="inline-flex w-full items-center gap-2 rounded-lg border bg-fd-secondary/50 p-1.5 ps-2 text-sm text-fd-muted-foreground transition-colors hover:bg-fd-accent hover:text-fd-accent-foreground"
    >
      <SquareTerminal className="size-4" />
      JS Playground
      <kbd className="ms-auto rounded-md border bg-fd-background px-1.5 font-sans text-xs">Ctrl `</kbd>
    </button>
  );
}
