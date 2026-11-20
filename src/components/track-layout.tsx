import type { ReactNode } from 'react';
import { flattenTree } from 'fumadocs-core/page-tree';
import { DocsLayout } from 'fumadocs-ui/layouts/docs';
import type { LayoutTab } from 'fumadocs-ui/layouts/shared';
import { baseOptions } from '@/lib/layout.shared';
import { getTrackFolder, source, TRACKS, type Track } from '@/lib/source';
import { SidebarDoneMarks } from '@/components/sidebar-done-marks';

/*
 * Fumadocs centers the whole layout, so on wide screens the sidebar gets empty space on its left.
 * This grid puts the sidebar flush against the left edge, and centers the page + "On this page"
 * in the space that is left.
 * Columns: sidebar | gap | page | on-this-page | gap
 *
 * Copies Fumadocs 16.19 internals: the grid areas and CSS variables of its docs layout container
 * (node_modules/fumadocs-ui/dist/layouts/docs/slots/container.js). Re-check after a Fumadocs upgrade:
 * the sidebar should still sit flush left, with the page and "On this page" centered next to it.
 */
const gridTemplate = `"sidebar . header toc ."
"sidebar . toc-popover toc ."
"sidebar . tabs toc ."
"sidebar . main toc ." 1fr / var(--fd-sidebar-col) minmax(0, 1fr) minmax(0, calc(var(--fd-layout-width, 97rem) - var(--fd-sidebar-width) - var(--fd-toc-width))) var(--fd-toc-width) minmax(0, 1fr)`;


/**
 * The sidebar shows only the current track's lessons. Fumadocs finds the track from the page's place in the tree,
 * so pages that are not lessons would show every track as folders. Each track's layout passes
 * its own folder's contents instead.
 */
function trackTree(track: Track) {
  const tree = source.getPageTree();
  const folder = getTrackFolder(track);
  return folder ? { ...tree, children: folder.children } : tree;
}

/**
 * The switch at the top of the sidebar: one entry per track. They are plain links (not tied to a tree folder),
 * so Fumadocs marks the one whose URL starts the current address as selected, on every page of the track.
 */
function trackTabs(): LayoutTab[] {
  return TRACKS.flatMap((track) => {
    const folder = getTrackFolder(track);
    // Show a track only once it has pages.
    if (!folder || flattenTree([folder]).length === 0) return [];
    return [{ title: folder.name, description: folder.description, icon: folder.icon, url: `/learn/${track}` }];
  });
}

/** The docs layout (sidebar, track switch, done ticks) for one track. */
export function TrackLayout({ track, children }: { track: Track; children: ReactNode }) {
  return (
    <DocsLayout
      tree={trackTree(track)}
      tabs={trackTabs()}
      containerProps={{ style: { gridTemplate } }}
      {...baseOptions()}
    >
      <SidebarDoneMarks />
      {children}
    </DocsLayout>
  );
}
