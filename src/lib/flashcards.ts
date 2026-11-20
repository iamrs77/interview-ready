import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { flattenTree } from 'fumadocs-core/page-tree';
import { source } from './source';
import { sections } from './sections';

/*
 * Flashcards live in src/data/flashcards/system-design/*.json, one or more files per deck:
 *   { "deck": "foundations", "cards": [{ "id": "foundations/dns-1", "lesson": "foundations/dns", "q": "...", "a": "..." }] }
 * - deck:   a module folder name (see DECK_ORDER), or "guide" for the top-level pages.
 * - id:     stable. Progress is saved by id, so never reuse or change an id.
 * - lesson: the lesson the card comes from, as a path inside content/system-design ("index" = Start Here).
 * - q / a:  simple English. `code`, **bold** and line breaks (\n) are allowed.
 * Run `npm run check:flashcards` after editing.
 */

/**
 * The decks, in sidebar order: "guide" plus one per module folder. The list comes from `sections`
 * (src/lib/sections.ts), which also gives each deck its label and colour. scripts/check-flashcards.mjs
 * can't import TypeScript, so it reads the module folders in content/system-design instead.
 */
export const DECK_ORDER = Object.keys(sections) as DeckKey[];

export type DeckKey = keyof typeof sections;

/** `lesson` is a key into the deck's `lessons` table, so the title and URL are sent once per lesson, not per card. */
export type Flashcard = { id: string; q: string; a: string; lesson: string };

export type Lesson = { title: string; url: string };

export type Deck = { key: DeckKey | 'all'; cards: Flashcard[]; lessons: Record<string, Lesson> };

/** One module's deck (not "all"). */
export type ModuleDeck = Deck & { key: DeckKey };

type RawCard = { id: string; lesson: string; q: string; a: string };
type RawFile = { deck: DeckKey; cards: RawCard[] };

const dataDir = join(process.cwd(), 'src', 'data', 'flashcards', 'system-design');

function lessonSlugs(lesson: string): string[] {
  return lesson === 'index' ? ['system-design'] : ['system-design', ...lesson.split('/')];
}

let cache: ModuleDeck[] | undefined;

/** All decks in sidebar order. Cards inside a deck follow the order of their lessons in the sidebar. */
export function getDecks(): ModuleDeck[] {
  // Cache only in production builds, so card edits show up right away while developing.
  if (cache && process.env.NODE_ENV === 'production') return cache;

  // Position of each lesson in the sidebar, used to sort cards.
  const lessonOrder = new Map(flattenTree(source.getPageTree().children).map((item, index) => [item.url, index]));

  const byDeck = new Map<DeckKey, { card: Flashcard; order: number; index: number }[]>();
  const lessons: Record<string, Lesson> = {};
  let index = 0;

  for (const file of readdirSync(dataDir).filter((name) => name.endsWith('.json')).sort()) {
    const data = JSON.parse(readFileSync(join(dataDir, file), 'utf8')) as RawFile;
    if (!DECK_ORDER.includes(data.deck)) throw new Error(`${file}: unknown deck "${data.deck}"`);

    for (const raw of data.cards) {
      const page = source.getPage(lessonSlugs(raw.lesson));
      if (!page) throw new Error(`${file}: card ${raw.id} points to a missing lesson "${raw.lesson}"`);
      lessons[raw.lesson] = { title: page.data.title, url: page.url };
      const list = byDeck.get(data.deck) ?? [];
      list.push({
        card: { id: raw.id, q: raw.q, a: raw.a, lesson: raw.lesson },
        order: lessonOrder.get(page.url) ?? Number.MAX_SAFE_INTEGER,
        index: index++,
      });
      byDeck.set(data.deck, list);
    }
  }

  const decks = DECK_ORDER.filter((key) => byDeck.has(key)).map((key): ModuleDeck => {
    const cards = byDeck
      .get(key)!
      .sort((a, b) => a.order - b.order || a.index - b.index)
      .map((entry) => entry.card);
    return { key, cards, lessons: lessonsFor(cards, lessons) };
  });
  cache = decks;
  return decks;
}

/** Only the lessons these cards use. */
function lessonsFor(cards: Flashcard[], all: Record<string, Lesson>): Record<string, Lesson> {
  return Object.fromEntries(cards.map((card) => [card.lesson, all[card.lesson]]));
}

/** One deck by key, or "all": every card from every deck. */
export function getDeck(key: string): Deck | undefined {
  if (key === 'all') {
    const decks = getDecks();
    return {
      key: 'all',
      cards: decks.flatMap((deck) => deck.cards),
      lessons: Object.assign({}, ...decks.map((deck) => deck.lessons)),
    };
  }
  return getDecks().find((deck) => deck.key === key);
}
