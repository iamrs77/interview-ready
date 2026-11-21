'use client';

import { useDonePages } from '@/lib/progress';

/*
 * Marks done pages in the sidebar, from the "Mark as done" list:
 * - a lesson's check icon (svg[data-lesson-check], added in track-layout.tsx) turns green;
 * - a guide page (no check icon, like the Cheat Sheet) gets a green tick on the right instead;
 * - the text of every done page turns green.
 * Fumadocs renders each sidebar item as <a data-active="true|false" href="...">, so a small
 * stylesheet can style exactly those links.
 * The a[data-active] markup copies Fumadocs 16.19 internals. Re-check after a Fumadocs upgrade:
 * done lessons should still show a green check in the sidebar.
 */
export function SidebarDoneMarks() {
  const done = [...useDonePages()].filter((url) => /^\/learn\/[a-z0-9/-]+$/.test(url));
  if (done.length === 0) return null;

  const notActive = done.map((url) => `a[data-active="false"][href="${url}"]`);
  const checks = done.map((url) => `a[data-active][href="${url}"] svg[data-lesson-check]`);
  const guideTicks = done.map((url) => `a[data-active][href="${url}"]:not(:has(svg[data-lesson-check]))::after`);

  const css = `
${notActive.join(',\n')} {
  color: #047857;
}
${checks.join(',\n')} {
  color: #059669;
}
${guideTicks.join(',\n')} {
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
