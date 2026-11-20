// Checks the flashcards in src/data/flashcards/system-design/*.json.
// Run: npm run check:flashcards
//  - every card has a unique, well-formed id, a lesson that exists, a question and an answer
//  - a card's deck matches its lesson's module ("guide" = the top-level pages)
//  - text is short enough to fit on a card
//  - coverage: every lesson has at least MIN_CARDS cards (Start Here: 1, Cheat Sheet: 0)
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const root = process.cwd();
const dataDir = join(root, 'src', 'data', 'flashcards', 'system-design');
const contentDir = join(root, 'content', 'system-design');
const DECKS = ['guide', 'foundations', 'hld-basics', 'databases', 'caching', 'messaging', 'distributed-systems',
  'reliability-security', 'advanced-components', 'production', 'questions'];
const MIN_CARDS = 3;
const MIN_FOR = { index: 1, 'cheat-sheet': 0 };
const MAX_Q = 160;
const MAX_A = 320;

const errors = [];
const warnings = [];

const walk = (d) => readdirSync(d).flatMap((n) => (statSync(join(d, n)).isDirectory() ? walk(join(d, n)) : n.endsWith('.mdx') ? [join(d, n)] : []));
const lessons = walk(contentDir).map((f) => relative(contentDir, f).replace(/\\/g, '/').replace(/\.mdx$/, ''));
const cardsPerLesson = Object.fromEntries(lessons.map((l) => [l, 0]));
const perDeck = Object.fromEntries(DECKS.map((d) => [d, 0]));
const seen = new Set();

for (const file of readdirSync(dataDir).filter((n) => n.endsWith('.json')).sort()) {
  let data;
  try {
    data = JSON.parse(readFileSync(join(dataDir, file), 'utf8'));
  } catch (e) {
    errors.push(`${file}: not valid JSON (${e.message})`);
    continue;
  }
  if (!DECKS.includes(data.deck)) errors.push(`${file}: unknown deck "${data.deck}"`);
  if (!Array.isArray(data.cards)) {
    errors.push(`${file}: "cards" must be a list`);
    continue;
  }
  for (const [i, card] of data.cards.entries()) {
    const where = `${file} card ${i + 1} (${card.id ?? 'no id'})`;
    for (const field of ['id', 'lesson', 'q', 'a']) {
      if (typeof card[field] !== 'string' || !card[field].trim()) errors.push(`${where}: missing "${field}"`);
    }
    if (typeof card.id !== 'string') continue;
    if (!/^[a-z0-9-]+(\/[a-z0-9-]+)*-\d+$/.test(card.id)) errors.push(`${where}: id should look like "folder/lesson-1"`);
    if (seen.has(card.id)) errors.push(`${where}: duplicate id`);
    seen.add(card.id);
    if (!existsSync(join(contentDir, `${card.lesson}.mdx`))) errors.push(`${where}: lesson "${card.lesson}" does not exist`);
    else cardsPerLesson[card.lesson]++;
    const lessonDeck = card.lesson.includes('/') ? card.lesson.split('/')[0] : 'guide';
    if (lessonDeck !== data.deck) errors.push(`${where}: lesson "${card.lesson}" belongs to deck "${lessonDeck}", not "${data.deck}"`);
    if (card.q?.length > MAX_Q) warnings.push(`${where}: question is long (${card.q.length} chars)`);
    if (card.a?.length > MAX_A) warnings.push(`${where}: answer is long (${card.a.length} chars)`);
    if ((card.q?.match(/`/g) ?? []).length % 2 || (card.a?.match(/`/g) ?? []).length % 2) errors.push(`${where}: unmatched backtick`);
    perDeck[data.deck] = (perDeck[data.deck] ?? 0) + 1;
  }
}

// Optional: `--only foundations,caching` checks coverage for those decks only (useful while decks are being written).
const onlyArg = process.argv.indexOf('--only');
const only = onlyArg > -1 ? process.argv[onlyArg + 1].split(',') : null;
const deckOf = (lesson) => (lesson.includes('/') ? lesson.split('/')[0] : 'guide');

for (const lesson of lessons) {
  if (only && !only.includes(deckOf(lesson))) continue;
  const min = MIN_FOR[lesson] ?? MIN_CARDS;
  if (cardsPerLesson[lesson] < min) errors.push(`coverage: "${lesson}" has ${cardsPerLesson[lesson]} cards (needs at least ${min})`);
}

console.log('Cards per deck:');
for (const deck of DECKS) console.log(`  ${deck.padEnd(22)} ${perDeck[deck]}`);
console.log(`  ${'total'.padEnd(22)} ${seen.size}`);
if (warnings.length) console.log(`\n${warnings.length} warnings:\n  ` + warnings.slice(0, 30).join('\n  '));
if (errors.length) {
  console.log(`\n${errors.length} errors:\n  ` + errors.slice(0, 60).join('\n  '));
  process.exit(1);
}
console.log('\nAll flashcards are OK.');
