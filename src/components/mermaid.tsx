'use client';

import { useEffect, useRef, useState, useSyncExternalStore, type CSSProperties } from 'react';
import { Maximize2, X } from 'lucide-react';

// Soft colors that match the site theme and are easy on the eyes.
const themeVariables = {
  fontFamily: 'inherit',
  fontSize: '15px',
  background: '#fdfcf9',
  primaryColor: '#eceefa',
  primaryTextColor: '#2a2f45',
  primaryBorderColor: '#8189d4',
  secondaryColor: '#f7edf1',
  tertiaryColor: '#f6f4ee',
  lineColor: '#8f95b8',
  edgeLabelBackground: '#fdfcf9',
  clusterBkg: '#f6f4ee',
  clusterBorder: '#d8d2c4',
  actorBkg: '#eceefa',
  actorBorder: '#8189d4',
  actorTextColor: '#2a2f45',
  signalColor: '#5d6390',
  signalTextColor: '#2a2f45',
  labelBoxBkgColor: '#eceefa',
  labelBoxBorderColor: '#8189d4',
  noteBkgColor: '#fbf3e2',
  noteBorderColor: '#d8b878',
  altBackground: '#f6f4ee',
};

/*
 * Architecture diagram colors. Use them in flowcharts with ":::name", for example:
 *   Browser["Browser"]:::client --> LB["Load Balancer"]:::lb --> App["App Server"]:::service
 *   App --> DB[("Database")]:::db
 * One color per kind of component, the same on every page.
 */
const componentClasses = [
  'classDef client fill:#e7f0fc,stroke:#6a98d8,color:#1e2b45,stroke-width:1.5px', // users, browsers, phones
  'classDef lb fill:#efe9fb,stroke:#8a73d6,color:#2a2145,stroke-width:1.5px', // load balancers, gateways, proxies
  'classDef service fill:#eceefa,stroke:#7f88d2,color:#22263f,stroke-width:1.5px', // app servers, services, workers
  'classDef db fill:#fcf1de,stroke:#cf9a40,color:#3d2c10,stroke-width:1.5px', // databases
  'classDef cache fill:#fce8ec,stroke:#d9728a,color:#43202a,stroke-width:1.5px', // caches (Redis)
  'classDef queue fill:#e3f4f0,stroke:#46a08e,color:#13342d,stroke-width:1.5px', // queues, Kafka
  'classDef storage fill:#e8f5e6,stroke:#62a85c,color:#1d3a1b,stroke-width:1.5px', // file storage, S3, CDN
  'classDef external fill:#f2f1ee,stroke:#9b978d,color:#3a3833,stroke-width:1.5px,stroke-dasharray:4 3', // outside services
  'classDef network fill:#edf2f6,stroke:#8aa0b5,color:#26323d,stroke-width:1.5px', // routers, ISPs, DNS
].join('\n');

/*
 * Class diagram (UML) colors for Low-Level Design. Use them with ":::name" on a class, for example:
 *   class PaymentMethod:::iface
 *   class Vehicle:::abstract
 *   class Car:::concrete
 * One color per kind of class, the same on every page.
 */
const umlClasses = [
  'classDef iface fill:#e3f4f0,stroke:#46a08e,color:#13342d,stroke-width:1.5px', // interfaces
  'classDef abstract fill:#efe9fb,stroke:#8a73d6,color:#2a2145,stroke-width:1.5px', // abstract classes
  'classDef concrete fill:#eceefa,stroke:#7f88d2,color:#22263f,stroke-width:1.5px', // normal classes
  'classDef enum fill:#fcf1de,stroke:#cf9a40,color:#3d2c10,stroke-width:1.5px', // enums (fixed values)
  'classDef external fill:#f2f1ee,stroke:#9b978d,color:#3a3833,stroke-width:1.5px,stroke-dasharray:4 3', // outside code
].join('\n');

function addComponentClasses(chart: string) {
  if (/^\s*(flowchart|graph)\b/.test(chart)) return `${chart}\n${componentClasses}`;
  if (/^\s*classDiagram\b/.test(chart)) return `${chart}\n${umlClasses}`;
  return chart;
}

const mermaidConfig = {
  startOnLoad: false,
  securityLevel: 'strict',
  theme: 'base',
  themeVariables,
  flowchart: { curve: 'basis', padding: 14, nodeSpacing: 45, rankSpacing: 55 },
  // Narrow boxes and no repeated boxes at the bottom, so step-by-step diagrams fit without shrinking.
  sequence: { mirrorActors: false, width: 130, actorMargin: 40, boxMargin: 8, messageFontSize: 14, actorFontSize: 14, noteFontSize: 14 },
} as const;

/*
 * Drawn diagrams, kept for as long as the tab is open (key: the chart text). Going back to a lesson
 * shows its diagrams at once, without drawing them again.
 */
const svgCache = new Map<string, string>();
const drawing = new Map<string, Promise<string>>(); // charts being drawn right now, so each is drawn once
const cacheListeners = new Set<() => void>();

function subscribeToCache(onChange: () => void) {
  cacheListeners.add(onChange);
  return () => {
    cacheListeners.delete(onChange);
  };
}

/*
 * Each drawing gets a new SVG id (Mermaid's styles and arrow heads refer to it), so a new drawing never
 * clashes with a diagram already on the page. The random part keeps ids new after a dev hot reload.
 */
const idPrefix = `mermaid-${Math.random().toString(36).slice(2, 7)}-`;
let drawCount = 0;

function drawChart(text: string): Promise<string> {
  let promise = drawing.get(text);
  if (!promise) {
    promise = (async () => {
      const { default: mermaid } = await import('mermaid');
      mermaid.initialize(mermaidConfig);
      const { svg } = await mermaid.render(`${idPrefix}${++drawCount}`, text);
      svgCache.set(text, svg);
      cacheListeners.forEach((listener) => listener());
      return svg;
    })();
    drawing.set(text, promise);
    // A failed chart is tried again next time, not remembered.
    promise.catch(() => drawing.delete(text));
  }
  return promise;
}

/** Draws a Mermaid diagram. Lessons use it through ```mermaid code blocks. */
export function Mermaid({ chart }: { chart: string }) {
  const text = addComponentClasses(chart);
  // On the server and while the page hydrates: nothing yet (the placeholder). Then the drawn SVG, if cached.
  const svg = useSyncExternalStore(subscribeToCache, () => svgCache.get(text), () => undefined);
  const [error, setError] = useState<{ text: string; message: string }>();

  useEffect(() => {
    if (svgCache.has(text)) return;
    let cancelled = false;
    drawChart(text).catch((err: unknown) => {
      if (!cancelled) setError({ text, message: err instanceof Error ? err.message : String(err) });
    });
    return () => {
      cancelled = true;
    };
  }, [text]);

  if (error?.text === text) {
    return (
      <pre className="my-6 whitespace-pre-wrap rounded-lg border p-4 text-sm text-red-600">
        Diagram error: {error.message}
      </pre>
    );
  }

  if (!svg) {
    return (
      <div role="status" aria-label="Loading diagram" className="my-6 h-48 animate-pulse rounded-lg bg-fd-muted">
        <span className="sr-only">Loading diagram</span>
      </div>
    );
  }

  return <DiagramFrame svg={svg} />;
}

/** Width and height of the diagram's viewBox, or undefined if it has none. */
function viewBoxSize(svg: string): { width: number; height: number } | undefined {
  const values = svg.match(/<svg[^>]*?\sviewBox="([^"]+)"/)?.[1].trim().split(/[\s,]+/).map(Number);
  if (!values || values.length !== 4 || !(values[2] > 0) || !(values[3] > 0)) return undefined;
  return { width: values[2], height: values[3] };
}

/**
 * Shows the diagram, with a button (or a click on it) that opens it large on top of the page.
 * The large view is a native <dialog> opened with showModal(), like confirm-dialog.tsx: focus moves into it
 * and stays there, Esc closes it, and the page behind can't be used. A click anywhere closes it.
 */
function DiagramFrame({ svg }: { svg: string }) {
  const [expanded, setExpanded] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const openButtonRef = useRef<HTMLButtonElement>(null);

  // Mermaid writes style="max-width: 800px" on the <svg>. That inline style beats CSS classes,
  // so the large view uses a copy without it, which lets the diagram fill the screen.
  const naturalWidth = Number(svg.match(/max-width:\s*([\d.]+)px/)?.[1] ?? 0);
  const largeSvg = svg.replace(/(<svg[^>]*?)\sstyle="max-width:[^"]*"/, '$1');

  // On narrow screens, don't shrink a diagram below 70% of its real size (the text gets too small).
  // Wider diagrams scroll sideways instead.
  const minWidth = naturalWidth ? `${Math.round(naturalWidth * 0.7)}px` : '0px';

  const open = () => setExpanded(true);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (expanded && !dialog.open) dialog.showModal();
    if (!expanded && dialog.open) dialog.close();
    if (!expanded) return;
    // Stop the page behind from scrolling while the large view is open.
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [expanded]);

  /*
   * Large view size. On big screens the whole diagram fits the box (as large as it can be).
   * On narrow screens (below md) fitting would make it smaller than on the page, so there it is shown at
   * least at its real size (the page shows it at most that big) and the box scrolls instead.
   */
  const box = viewBoxSize(largeSvg);
  const fitWidth = box ? `min(100%, calc((88vh - 2 * var(--pad)) * ${(box.width / box.height).toFixed(4)}))` : '100%';
  const realWidth = naturalWidth || box?.width || 0;
  const largeStyle = { '--fit-w': fitWidth, '--real-w': `${Math.round(realWidth)}px` } as CSSProperties;

  return (
    <>
      <div className="group relative my-6 rounded-xl border bg-fd-card p-5">
        <button
          ref={openButtonRef}
          type="button"
          onClick={open}
          aria-label="Open the diagram large"
          title="Open large"
          className="absolute right-2 top-2 z-10 rounded-md border bg-fd-card p-1.5 text-fd-muted-foreground opacity-80 transition hover:text-fd-foreground hover:opacity-100 focus-visible:opacity-100 group-hover:opacity-100"
        >
          <Maximize2 className="size-4" />
        </button>
        <div
          onClick={open}
          style={{ '--diagram-min-width': minWidth } as CSSProperties}
          className="cursor-zoom-in overflow-x-auto [&_svg]:mx-auto [&_svg]:block [&_svg]:h-auto [&_svg]:max-w-full [&_svg]:min-w-[var(--diagram-min-width)]"
          dangerouslySetInnerHTML={{ __html: svg }}
        />
      </div>

      {/*
        The <dialog> covers the whole screen and is see-through: its ::backdrop dims the page, and the white
        box sits in the middle. `open:flex`, not `flex`: a display class would show the dialog while closed.
      */}
      <dialog
        ref={dialogRef}
        aria-label="Diagram"
        // Esc, the close button and clicks all end here: keep the state in sync and put focus back on the button.
        onClose={() => {
          setExpanded(false);
          openButtonRef.current?.focus({ preventScroll: true });
        }}
        // A click around the box lands on the <dialog> itself.
        onClick={(event) => {
          if (event.target === event.currentTarget) event.currentTarget.close();
        }}
        className="m-0 h-full max-h-none w-full max-w-none cursor-zoom-out items-center justify-center overflow-hidden border-0 bg-transparent p-4 text-fd-foreground open:flex backdrop:bg-black/40 backdrop:backdrop-blur-sm"
      >
        {expanded && (
          <>
            {/* First in the dialog, so it gets focus when the dialog opens. */}
            <button
              type="button"
              onClick={() => dialogRef.current?.close()}
              aria-label="Close"
              className="absolute right-5 top-5 z-10 rounded-md bg-fd-card p-2 text-fd-muted-foreground shadow hover:text-fd-foreground"
            >
              <X className="size-5" />
            </button>
            <div
              onClick={() => dialogRef.current?.close()}
              className="flex h-[88vh] w-[94vw] overflow-auto rounded-xl bg-fd-card p-(--pad) shadow-xl [--pad:0.75rem] sm:[--pad:1.5rem]"
            >
              <div
                style={largeStyle}
                className="m-auto w-(--fit-w) shrink-0 max-md:w-[max(var(--fit-w),var(--real-w))] [&_svg]:block [&_svg]:h-auto [&_svg]:w-full [&_svg]:max-w-none"
                dangerouslySetInnerHTML={{ __html: largeSvg }}
              />
            </div>
          </>
        )}
      </dialog>
    </>
  );
}
