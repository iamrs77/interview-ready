// Rebuilds PROGRESS.md from the sidebar order (meta.json files) and each page's `planned` flag.
// Run: npm run progress
import { readFileSync, writeFileSync, existsSync, readdirSync } from 'node:fs';
import { join, relative } from 'node:path';

const trackDir = join(process.cwd(), 'content', 'system-design');
const warnings = [];

function readMeta(dir) {
  const file = join(dir, 'meta.json');
  let meta;
  try {
    meta = JSON.parse(readFileSync(file, 'utf8'));
  } catch (e) {
    console.error(`Can't read ${relative(process.cwd(), file)}: ${e.message}`);
    process.exit(1);
  }
  if (!meta || typeof meta !== 'object' || !Array.isArray(meta.pages)) {
    console.error(`${relative(process.cwd(), file)}: "pages" must be a list`);
    process.exit(1);
  }
  return meta;
}

/*
 * Sidebar entries that are not lesson files: links like "[Brain][Flashcards](/learn/...)",
 * separators ("---" or "---Title---"), "..." / "z...a" / "...folder" (rest and extract), and "!page" (hidden).
 */
function isPageEntry(entry) {
  return typeof entry === 'string' && entry.trim() !== '' && !/^(\[|---|!)/.test(entry) && !entry.includes('...');
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

/** Adds one page line. A missing file is skipped with a warning. */
function pageLine(file) {
  if (!existsSync(file)) {
    warnings.push(`skipped ${relative(process.cwd(), file)}: no such file`);
    return [];
  }
  const page = readPage(file);
  total++;
  if (!page.planned) written++;
  return [`- ${page.planned ? '⬜' : '✅'} ${page.title}`];
}

const root = readMeta(trackDir);
lines.push('## Guide');
const guidePages = [];

for (const entry of root.pages) {
  if (!isPageEntry(entry)) continue;
  const folder = join(trackDir, entry);
  if (existsSync(join(folder, 'meta.json'))) {
    const meta = readMeta(folder);
    lines.push('', `## ${meta.title}`);
    for (const item of meta.pages) {
      const separator = typeof item === 'string' && item.match(/^---(.+)---$/);
      if (separator) lines.push('', `**${separator[1]}**`, '');
      else if (isPageEntry(item)) lines.push(...pageLine(join(folder, `${item}.mdx`)));
    }
  } else {
    // Top-level pages (Start Here, Interview Framework, Cheat Sheet) are listed under "Guide".
    guidePages.push(entry);
  }
}

// Insert the guide pages right after the "## Guide" heading.
const guideLines = guidePages.flatMap((entry) => pageLine(join(trackDir, `${entry}.mdx`)));
lines.splice(1, 0, ...guideLines);

// Count the flashcards (src/data/flashcards/system-design/*.json). A file that can't be read is skipped.
const cardDir = join(process.cwd(), 'src', 'data', 'flashcards', 'system-design');
const cardFiles = existsSync(cardDir) ? readdirSync(cardDir).filter((name) => name.endsWith('.json')) : [];
const cardData = cardFiles.flatMap((name) => {
  try {
    const data = JSON.parse(readFileSync(join(cardDir, name), 'utf8'));
    if (data && Array.isArray(data.cards)) return [data];
    warnings.push(`skipped flashcards ${name}: no "cards" list`);
  } catch (e) {
    warnings.push(`skipped flashcards ${name}: ${e.message}`);
  }
  return [];
});
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
for (const warning of warnings) console.warn(`Warning: ${warning}`);
console.log(`PROGRESS.md updated: ${written} of ${total} written.`);
