import { source } from '@/lib/source';
import { DocsLayout } from 'fumadocs-ui/layouts/docs';
import { baseOptions } from '@/lib/layout.shared';
import { SidebarDoneMarks } from '@/components/sidebar-done-marks';

/*
 * Fumadocs centers the whole layout, so on wide screens the sidebar gets empty space on its left.
 * This grid puts the sidebar flush against the left edge, and centers the page + "On this page"
 * in the space that is left.
 * Columns: sidebar | gap | page | on-this-page | gap
 */
const gridTemplate = `"sidebar . header toc ."
"sidebar . toc-popover toc ."
"sidebar . tabs toc ."
"sidebar . main toc ." 1fr / var(--fd-sidebar-col) minmax(0, 1fr) minmax(0, calc(var(--fd-layout-width, 97rem) - var(--fd-sidebar-width) - var(--fd-toc-width))) var(--fd-toc-width) minmax(0, 1fr)`;

/*
 * System Design is the only track, so the sidebar always shows its contents. Without this, pages
 * that are not lessons (the flashcards) would show a collapsed "System Design" folder instead.
 * When a second track (DSA) arrives, pass the full tree again and turn the tabs back on.
 */
function sidebarTree() {
  const tree = source.getPageTree();
  const track = tree.children.find((node) => node.type === 'folder' && node.root);
  return track?.type === 'folder' ? { ...tree, children: track.children } : tree;
}

export default function Layout({ children }: LayoutProps<'/learn'>) {
  return (
    // tabs={false}: no track switcher while System Design is the only track. Turn it back on for DSA.
    <DocsLayout
      tree={sidebarTree()}
      tabs={false}
      containerProps={{ style: { gridTemplate } }}
      {...baseOptions()}
    >
      <SidebarDoneMarks />
      {children}
    </DocsLayout>
  );
}
