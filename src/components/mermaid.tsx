'use client';

import { useEffect, useId, useState, type CSSProperties } from 'react';
import { Maximize2, X } from 'lucide-react';

type DiagramState = { svg?: string; error?: string };

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

function addComponentClasses(chart: string) {
  return /^\s*(flowchart|graph)\b/.test(chart) ? `${chart}\n${componentClasses}` : chart;
}

/** Draws a Mermaid diagram. Lessons use it through ```mermaid code blocks. */
export function Mermaid({ chart }: { chart: string }) {
  const id = `mermaid-${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  const [state, setState] = useState<DiagramState>({});

  useEffect(() => {
    let cancelled = false;

    async function draw() {
      try {
        const { default: mermaid } = await import('mermaid');
        mermaid.initialize({
          startOnLoad: false,
          securityLevel: 'strict',
          theme: 'base',
          themeVariables,
          flowchart: { curve: 'basis', padding: 14, nodeSpacing: 45, rankSpacing: 55 },
          // Narrow boxes and no repeated boxes at the bottom, so step-by-step diagrams fit without shrinking.
          sequence: { mirrorActors: false, width: 130, actorMargin: 40, boxMargin: 8, messageFontSize: 14, actorFontSize: 14, noteFontSize: 14 },
        });
        const { svg } = await mermaid.render(id, addComponentClasses(chart));
        if (!cancelled) setState({ svg });
      } catch (error) {
        if (!cancelled) setState({ error: error instanceof Error ? error.message : String(error) });
      }
    }

    void draw();
    return () => {
      cancelled = true;
    };
  }, [chart, id]);

  if (state.error) {
    return (
      <pre className="my-6 whitespace-pre-wrap rounded-lg border p-4 text-sm text-red-600">
        Diagram error: {state.error}
      </pre>
    );
  }

  if (!state.svg) {
    return <div className="my-6 h-48 animate-pulse rounded-lg bg-fd-muted" aria-label="Loading diagram" />;
  }

  return <DiagramFrame svg={state.svg} />;
}

/** Shows the diagram, with a button (or a click on it) that opens it large on top of the page. */
function DiagramFrame({ svg }: { svg: string }) {
  const [expanded, setExpanded] = useState(false);

  // Mermaid writes style="max-width: 800px" on the <svg>. That inline style beats CSS classes,
  // so the large view uses a copy without it, which lets the diagram fill the screen.
  const naturalWidth = Number(svg.match(/max-width:\s*([\d.]+)px/)?.[1] ?? 0);
  const largeSvg = svg.replace(/(<svg[^>]*?)\sstyle="max-width:[^"]*"/, '$1');

  // On narrow screens, don't shrink a diagram below 70% of its real size (the text gets too small).
  // Wider diagrams scroll sideways instead.
  const minWidth = naturalWidth ? `${Math.round(naturalWidth * 0.7)}px` : '0px';

  useEffect(() => {
    if (!expanded) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setExpanded(false);
    };
    window.addEventListener('keydown', closeOnEscape);
    // Stop the page behind from scrolling while the large view is open.
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', closeOnEscape);
      document.body.style.overflow = previousOverflow;
    };
  }, [expanded]);

  return (
    <>
      <div className="group relative my-6 rounded-xl border bg-fd-card p-5">
        <button
          type="button"
          onClick={() => setExpanded(true)}
          aria-label="Open the diagram large"
          title="Open large"
          className="absolute right-2 top-2 z-10 rounded-md border bg-fd-card p-1.5 text-fd-muted-foreground opacity-60 transition hover:text-fd-foreground hover:opacity-100 group-hover:opacity-100"
        >
          <Maximize2 className="size-4" />
        </button>
        <div
          onClick={() => setExpanded(true)}
          style={{ '--diagram-min-width': minWidth } as CSSProperties}
          className="cursor-zoom-in overflow-x-auto [&_svg]:mx-auto [&_svg]:block [&_svg]:h-auto [&_svg]:max-w-full [&_svg]:min-w-[var(--diagram-min-width)]"
          dangerouslySetInnerHTML={{ __html: svg }}
        />
      </div>

      {expanded && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Diagram"
          onClick={() => setExpanded(false)}
          className="fixed inset-0 z-50 flex cursor-zoom-out items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
        >
          <button
            type="button"
            onClick={() => setExpanded(false)}
            aria-label="Close"
            className="absolute right-5 top-5 rounded-md bg-fd-card p-2 text-fd-muted-foreground shadow hover:text-fd-foreground"
          >
            <X className="size-5" />
          </button>
          <div
            className="h-[88vh] w-[94vw] rounded-xl bg-fd-card p-6 shadow-xl [&_svg]:h-full [&_svg]:w-full [&_svg]:max-w-none"
            dangerouslySetInnerHTML={{ __html: largeSvg }}
          />
        </div>
      )}
    </>
  );
}
