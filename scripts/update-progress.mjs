// Rebuilds PROGRESS.md from the sidebar order (meta.json files) and each page's `planned` flag.
// Run: npm run progress
import { readFileSync, writeFileSync, existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const trackDir = join(process.cwd(), 'content', 'system-design');

function readMeta(dir) {
  return JSON.parse(readFileSync(join(dir, 'meta.json'), 'utf8'));
}

function readPage(file) {
  const text = readFileSync(file, 'utf8');
  const frontmatter = text.match(/^---\r?\n([\s\S]*?)\r?\n---/)?.[1] ?? '';
  const title = frontmatter.match(/^title:\s*"?(.+?)"?\s*$/m)?.[1] ?? file;
  const planned = /^planned:\s*true\s*$/m.test(frontmatter);
  return { title, planned };
}

const lines = [];
let total = 0;
let written = 0;

function addPage(file) {
  const page = readPage(file);
  total++;
  if (!page.planned) written++;
  lines.push(`- ${page.planned ? '⬜' : '✅'} ${page.title}`);
}

const root = readMeta(trackDir);
lines.push('## Guide');
const guidePages = [];

for (const entry of root.pages) {
  // Skip sidebar links like "[Brain][Flashcards](/learn/...)" and separators: they are not lesson files.
  if (entry.startsWith('[') || entry.startsWith('---')) continue;
  const folder = join(trackDir, entry);
  if (existsSync(join(folder, 'meta.json'))) {
    const meta = readMeta(folder);
    lines.push('', `## ${meta.title}`);
    for (const item of meta.pages) {
      const separator = item.match(/^---(.+)---$/);
      if (separator) lines.push('', `**${separator[1]}**`, '');
      else addPage(join(folder, `${item}.mdx`));
    }
  } else {
    // Top-level pages (Start Here, Interview Framework, Cheat Sheet) are listed under "Guide".
    guidePages.push(entry);
  }
}

// Insert the guide pages right after the "## Guide" heading.
const guideLines = [];
for (const entry of guidePages) {
  const file = join(trackDir, `${entry}.mdx`);
  const page = readPage(file);
  total++;
  if (!page.planned) written++;
  guideLines.push(`- ${page.planned ? '⬜' : '✅'} ${page.title}`);
}
lines.splice(1, 0, ...guideLines);

// Count the flashcards (src/data/flashcards/system-design/*.json).
const cardDir = join(process.cwd(), 'src', 'data', 'flashcards', 'system-design');
const cardFiles = existsSync(cardDir) ? readdirSync(cardDir).filter((name) => name.endsWith('.json')) : [];
const cardData = cardFiles.map((name) => JSON.parse(readFileSync(join(cardDir, name), 'utf8')));
const flashcards = { cards: cardData.reduce((n, d) => n + d.cards.length, 0), decks: new Set(cardData.map((d) => d.deck)).size };

const output = [
  '# Progress — System Design',
  '',
  '✅ = written · ⬜ = not written yet',
  '',
  'Same order as the sidebar. This file is generated: run `npm run progress` after writing a page.',
  'A page that is not written yet has `planned: true` in its frontmatter (it shows dimmed in the sidebar).',
  '',
  `**Written: ${written} of ${total}**`,
  '',
  ...lines,
  '',
  '## To do',
  '- [x] **Cheat Sheet:** written last, from all the finished lessons.',
  `- [x] **Flashcards:** ${flashcards.cards} cards in ${flashcards.decks} decks, one per module. Check them with \`npm run check:flashcards\`.`,
  '',
  '## Later: separate tracks (not System Design)',
  '- **OS and Concurrency (slim):** processes vs threads, concurrency vs parallelism, race conditions and mutexes,',
  '  deadlocks, thread pools, event loop and async, blocking vs non-blocking I/O.',
  '- **Low-Level Design:** OOP, SOLID, composition vs inheritance, interfaces and DI, UML basics, design patterns,',
  '  and practice problems: parking lot, elevator, Splitwise, movie booking, LRU cache.',
  '',
].join('\n');

writeFileSync(join(process.cwd(), 'PROGRESS.md'), output);
console.log(`PROGRESS.md updated: ${written} of ${total} written.`);
