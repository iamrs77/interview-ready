import { source } from '@/lib/source';
import { getSection } from '@/lib/sections';
import { createFromSource } from 'fumadocs-core/search/server';

/*
 * Search across every lesson: titles, headings and body text.
 * The search box (sidebar, mobile header, Ctrl/Cmd+K) calls this route: /api/search?query=...
 */

/**
 * A matching lesson title, then a matching heading, counts more than a sentence that mentions the word.
 * Kept small on purpose: a bigger boost lifts titles that match only one word ("Load Testing" for "load balancer").
 */
const boostByType: Record<string, number> = { page: 1.5, heading: 1.2 };
const boost = (type: string) => boostByType[type] ?? 1;

export const { GET } = createFromSource(source, {
  // English stemming, so word forms match: "load balancer" finds "Load Balancing", "cache" finds "Caching".
  tokenizer: { language: 'english', stemming: true },
  search: {
    sortBy: ([, scoreA, docA], [, scoreB, docB]) => scoreB * boost(docB.type) - scoreA * boost(docA.type),
  },
  buildIndex: (page) => ({
    id: page.url,
    url: page.url,
    title: page.data.title,
    description: page.data.description,
    structuredData: page.data.structuredData,
    // Shown under each result: the lesson's section, like the colored label at the top of the page.
    breadcrumbs: [getSection(page.slugs).label],
  }),
});
