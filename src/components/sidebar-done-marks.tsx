'use client';

import { useDonePages } from '@/lib/progress';

/*
 * Marks done lessons in the sidebar: green text and a green tick on the right.
 * Fumadocs renders each sidebar item as <a data-active="true|false" href="...">, so a small
 * stylesheet built from the "Mark as done" list can style exactly those links.
 * The a[data-active] markup copies Fumadocs 16.19 internals. Re-check after a Fumadocs upgrade:
 * done lessons should still show green text and a tick in the sidebar.
 */
export function SidebarDoneMarks() {
  const done = [...useDonePages()].filter((url) => /^\/learn\/[a-z0-9/-]+$/.test(url));
  if (done.length === 0) return null;

  const links = done.map((url) => `a[data-active][href="${url}"]`);
  const notActive = done.map((url) => `a[data-active="false"][href="${url}"]`);

  const css = `
${notActive.join(',\n')} {
  color: #047857;
}
${links.map((selector) => `${selector}::after`).join(',\n')} {
  content: "✓";
  margin-inline-start: auto;
  flex-shrink: 0;
  display: inline-grid;
  place-items: center;
  width: 1.1rem;
  height: 1.1rem;
  border-radius: 9999px;
  background: rgba(16, 185, 129, 0.16);
  color: #047857;
  font-size: 0.65rem;
  font-weight: 700;
}`;

  return <style>{css}</style>;
}
