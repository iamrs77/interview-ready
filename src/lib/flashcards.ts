import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { flattenTree } from 'fumadocs-core/page-tree';
import { source } from './source';

/*
 * Flashcards live in src/data/flashcards/system-design/*.json, one or more files per deck:
 *   { "deck": "foundations", "cards": [{ "id": "foundations/dns-1", "lesson": "foundations/dns", "q": "...", "a": "..." }] }
 * - deck:   a module folder name (see DECK_ORDER), or "guide" for the top-level pages.
 * - id:     stable. Progress is saved by id, so never reuse or change an id.
 * - lesson: the lesson the card comes from, as a path inside content/system-design ("index" = Start Here).
 * - q / a:  simple English. `code`, **bold** and line breaks (\n) are allowed.
 * Run `npm run check:flashcards` after editing.
 */

export const DECK_ORDER = [
  'guide',
  'foundations',
  'hld-basics',
  'databases',
  'caching',
  'messaging',
  'distributed-systems',
  'reliability-security',
  'advanced-components',
  'production',
  'questions',
] as const;

export type DeckKey = (typeof DECK_ORDER)[number];

export type Flashcard = {
  id: string;
  q: string;
  a: string;
  lessonTitle: string;
  lessonUrl: string;
};

export type Deck = { key: DeckKey; cards: Flashcard[] };

type RawCard = { id: string; lesson: string; q: string; a: string };
type RawFile = { deck: DeckKey; cards: RawCard[] };

const dataDir = join(process.cwd(), 'src', 'data', 'flashcards', 'system-design');

function lessonSlugs(lesson: string): string[] {
  return lesson === 'index' ? ['system-design'] : ['system-design', ...lesson.split('/')];
}

let cache: Deck[] | undefined;

/** All decks in sidebar order. Cards inside a deck follow the order of their lessons in the sidebar. */
export function getDecks(): Deck[] {
  // Cache only in production builds, so card edits show up right away while developing.
  if (cache && process.env.NODE_ENV === 'production') return cache;

  // Position of each lesson in the sidebar, used to sort cards.
  const lessonOrder = new Map(flattenTree(source.getPageTree().children).map((item, index) => [item.url, index]));

  const byDeck = new Map<DeckKey, { card: Flashcard; order: number; index: number }[]>();
  let index = 0;

  for (const file of readdirSync(dataDir).filter((name) => name.endsWith('.json')).sort()) {
    const data = JSON.parse(readFileSync(join(dataDir, file), 'utf8')) as RawFile;
    if (!DECK_ORDER.includes(data.deck)) throw new Error(`${file}: unknown deck "${data.deck}"`);

    for (const raw of data.cards) {
      const page = source.getPage(lessonSlugs(raw.lesson));
      if (!page) throw new Error(`${file}: card ${raw.id} points to a missing lesson "${raw.lesson}"`);
      const list = byDeck.get(data.deck) ?? [];
      list.push({
        card: { id: raw.id, q: raw.q, a: raw.a, lessonTitle: page.data.title, lessonUrl: page.url },
        order: lessonOrder.get(page.url) ?? Number.MAX_SAFE_INTEGER,
        index: index++,
      });
      byDeck.set(data.deck, list);
    }
  }

  cache = DECK_ORDER.filter((key) => byDeck.has(key)).map((key) => ({
    key,
    cards: byDeck
      .get(key)!
      .sort((a, b) => a.order - b.order || a.index - b.index)
      .map((entry) => entry.card),
  }));
  return cache;
}

export function getDeck(key: string): Deck | undefined {
  if (key === 'all') return { key: 'guide', cards: getDecks().flatMap((deck) => deck.cards) };
  return getDecks().find((deck) => deck.key === key);
}
