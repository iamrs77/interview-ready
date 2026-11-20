import type { ReactNode } from 'react';

/*
 * The Free canvas fills the whole window, with no docs sidebar or header: the page brings its own top bar.
 * The root layout (fonts, theme, search) still applies.
 */
export default function CanvasLayout({ children }: { children: ReactNode }) {
  return <div className="flex h-dvh flex-col overflow-hidden bg-fd-background text-fd-foreground">{children}</div>;
}
