import type { ReactNode } from 'react';
import { CircleCheck } from 'lucide-react';
import { flattenTree } from 'fumadocs-core/page-tree';
import type * as PageTree from 'fumadocs-core/page-tree';
import { DocsLayout } from 'fumadocs-ui/layouts/docs';
import type { LayoutTab } from 'fumadocs-ui/layouts/shared';
import { baseOptions } from '@/lib/layout.shared';
import { getTrackFolder, source, TRACKS, type Track } from '@/lib/source';
import { SidebarDoneMarks } from '@/components/sidebar-done-marks';
import { JsPlayground, JsPlaygroundButton } from '@/components/js-playground';
import { PLAYGROUND_TRACKS } from '@/lib/playground';
import { SidebarFoldersToggle } from '@/components/sidebar-folders-toggle';

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
  return folder ? { ...tree, children: withLessonChecks(folder.children, track, false) } : tree;
}

// Top-level pages that are guides, not lessons. They keep their own icon.
const GUIDE_PAGES = ['interview-framework', 'cheat-sheet', 'revision'];
// In these tracks the first page is a lesson, not a "Start Here" guide.
const TRACKS_WITH_LESSON_INDEX: Track[] = ['git'];

function isLesson(track: Track, url: string, inSection: boolean): boolean {
  if (inSection) {
    return true;
  }
  const trackUrl = `/learn/${track}`;
  if (url === trackUrl) {
    return TRACKS_WITH_LESSON_INDEX.includes(track);
  }
  // Links to other places (Free Canvas, NeetCode 150) are not lessons.
  if (!url.startsWith(`${trackUrl}/`)) {
    return false;
  }
  return !GUIDE_PAGES.includes(url.slice(trackUrl.length + 1));
}

/**
 * Lessons show one check icon instead of a topic icon: gray until the lesson is done, green after
 * (the colors are in global.css and SidebarDoneMarks). Sections and guide pages keep their icons.
 */
function withLessonChecks(nodes: PageTree.Node[], track: Track, inSection: boolean): PageTree.Node[] {
  return nodes.map((node) => {
    if (node.type === 'folder') {
      return { ...node, children: withLessonChecks(node.children, track, true) };
    }
    if (node.type === 'page' && isLesson(track, node.url, inSection)) {
      return { ...node, icon: <CircleCheck data-lesson-check="" /> };
    }
    return node;
  });
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


/** The docs layout (sidebar, track switch, done ticks, and the JS playground on LLD and DSA) for one track. */
export function TrackLayout({ track, children }: { track: Track; children: ReactNode }) {
  const hasPlayground = PLAYGROUND_TRACKS.includes(track);

  return (
    <DocsLayout
      tree={trackTree(track)}
      tabs={trackTabs()}
      containerProps={{ style: { gridTemplate } }}
      // The JS Playground button sits under search, where the cursor already goes.
      // "Collapse all / Expand all" sits right above the list of sections.
      sidebar={{
        banner: (
          <>
            {hasPlayground && <JsPlaygroundButton />}
            <SidebarFoldersToggle />
          </>
        ),
      }}
      {...baseOptions()}
    >
      <SidebarDoneMarks />
      {children}
      {hasPlayground && <JsPlayground />}
    </DocsLayout>
  );
}
