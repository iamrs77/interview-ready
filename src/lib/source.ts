import { createElement } from 'react';
import { z } from 'zod';
import { loader, type LoaderPlugin } from 'fumadocs-core/source';
import { flattenTree } from 'fumadocs-core/page-tree';
import type * as PageTree from 'fumadocs-core/page-tree';
import { lucideIconsPlugin } from 'fumadocs-core/source/lucide-icons';
import { metaSchema, pageSchema } from 'fumadocs-core/source/schema';
import { rehypeCodeDefaultOptions, remarkMdxMermaid } from 'fumadocs-core/mdx-plugins';
import { defineDocs } from 'fumadocs-mdx/macro';
import { applyMdxPreset } from 'fumadocs-mdx/config';
import { learnRoute } from './shared';

// Every track (system-design, low-level-design, dsa) is a folder inside /content.
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
      rehypeCodeOptions: {
        // Fumadocs' own code transformers, plus one that writes the block's language on it
        // (data-language="js"), so code blocks know when to show the playground's "Run" button.
        transformers: [
          ...(rehypeCodeDefaultOptions.transformers ?? []),
          {
            name: 'language-attribute',
            pre(node) {
              node.properties['data-language'] = this.options.lang;
            },
          },
        ],
      },
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

/** The tracks, in the order of content/meta.json. Each is a root folder: /learn/<key>. */
export const TRACKS = ['system-design', 'low-level-design', 'dsa'] as const;
export type Track = (typeof TRACKS)[number];

/** The track of a page, from its slugs (['low-level-design', 'oop-basics', ...]) or its URL. */
export function trackOf(slugsOrUrl: string[] | string): Track {
  const first = Array.isArray(slugsOrUrl) ? slugsOrUrl[0] : slugsOrUrl.split('/')[2];
  return TRACKS.find((track) => track === first) ?? 'system-design';
}

/** The root folder of one track in the page tree: the folder whose pages live under /learn/<track>. */
export function getTrackFolder(track: Track): PageTree.Folder | undefined {
  const prefix = `${learnRoute}/${track}`;
  return source
    .getPageTree()
    .children.find(
      (node): node is PageTree.Folder =>
        node.type === 'folder' &&
        node.root === true &&
        flattenTree([node]).some((item) => item.url === prefix || item.url.startsWith(`${prefix}/`)),
    );
}

/** The next written page after this one, in sidebar order, in the same track. Planned pages are skipped. */
export function getNextLesson(currentUrl: string): { title: string; url: string } | undefined {
  const folder = getTrackFolder(trackOf(currentUrl));
  if (!folder) return undefined;
  const pagesByUrl = new Map(source.getPages().map((page) => [page.url, page]));
  const inSidebarOrder = flattenTree([folder])
    .map((item) => pagesByUrl.get(item.url))
    .filter((page) => page !== undefined);

  const current = inSidebarOrder.findIndex((page) => page.url === currentUrl);
  const next = inSidebarOrder.slice(current + 1).find((page) => !page.data.planned);
  return next && { title: next.data.title, url: next.url };
}
