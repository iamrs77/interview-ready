import { createElement } from 'react';
import { z } from 'zod';
import { loader, type LoaderPlugin } from 'fumadocs-core/source';
import { flattenTree } from 'fumadocs-core/page-tree';
import { lucideIconsPlugin } from 'fumadocs-core/source/lucide-icons';
import { metaSchema, pageSchema } from 'fumadocs-core/source/schema';
import { remarkMdxMermaid } from 'fumadocs-core/mdx-plugins';
import { defineDocs } from 'fumadocs-mdx/macro';
import { applyMdxPreset } from 'fumadocs-mdx/config';
import { learnRoute } from './shared';

// Every track (system-design, later dsa) is a folder inside /content.
const content = defineDocs({
  dir: 'content',
  docs: {
    schema: pageSchema.extend({
      /** true = page is in the plan but not written yet. */
      planned: z.boolean().default(false),
    }),
    mdxOptions: applyMdxPreset({
      // Turns ```mermaid code blocks into <Mermaid /> diagrams.
      remarkPlugins: (defaults) => [remarkMdxMermaid, ...defaults],
    }),
  },
  meta: {
    schema: metaSchema,
  },
});

/** Sidebar tweaks. */
const sidebarPlugin: LoaderPlugin = {
  name: 'sidebar-tweaks',
  transformPageTree: {
    // Show planned (not written yet) pages dimmed.
    file(node, filePath) {
      if (!filePath) return node;
      const file = this.storage.read(filePath);
      const planned = file?.format === 'page' && (file.data as { planned?: boolean }).planned === true;
      if (planned) node.name = createElement('span', { className: 'opacity-50' }, node.name);
      return node;
    },
  },
};

// See https://fumadocs.dev/docs/headless/source-api for more info
export const source = loader({
  baseUrl: learnRoute,
  source: content.toFumadocsSource(),
  plugins: [lucideIconsPlugin(), sidebarPlugin],
});

/** The next written page after this one, in sidebar order. Planned pages are skipped. */
export function getNextLesson(currentUrl: string): { title: string; url: string } | undefined {
  const pagesByUrl = new Map(source.getPages().map((page) => [page.url, page]));
  const inSidebarOrder = flattenTree(source.getPageTree().children)
    .map((item) => pagesByUrl.get(item.url))
    .filter((page) => page !== undefined);

  const current = inSidebarOrder.findIndex((page) => page.url === currentUrl);
  const next = inSidebarOrder.slice(current + 1).find((page) => !page.data.planned);
  return next && { title: next.data.title, url: next.url };
}
