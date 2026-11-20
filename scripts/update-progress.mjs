// Rebuilds PROGRESS.md from the sidebar order (meta.json files) and each page's `planned` flag, for every track.
// Run: npm run progress
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join, relative } from 'node:path';

// The tracks, in order. Each is a folder in /content with its own meta.json.
const TRACKS = [
  { dir: 'system-design', title: 'System Design' },
  { dir: 'low-level-design', title: 'Low-Level Design' },
  { dir: 'dsa', title: 'DSA' },
];
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
 * Sidebar entries that are not lesson files: links like "[Shapes][Free Canvas](/canvas/...)",
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

let total = 0;
let written = 0;

/** One track's part of the file: its heading, its count, then its pages in sidebar order. */
function trackSection({ dir, title }) {
  const trackDir = join(process.cwd(), 'content', dir);
  if (!existsSync(join(trackDir, 'meta.json'))) return [];
  const lines = [];
  let trackTotal = 0;
  let trackWritten = 0;

  /** One page line. A missing file is skipped with a warning. */
  function pageLine(file) {
    if (!existsSync(file)) {
      warnings.push(`skipped ${relative(process.cwd(), file)}: no such file`);
      return [];
    }
    const page = readPage(file);
    trackTotal++;
    if (!page.planned) trackWritten++;
    return [`- ${page.planned ? '⬜' : '✅'} ${page.title}`];
  }

  const root = readMeta(trackDir);
  const guidePages = [];
  for (const entry of root.pages) {
    if (!isPageEntry(entry)) continue;
    const folder = join(trackDir, entry);
    if (existsSync(join(folder, 'meta.json'))) {
      const meta = readMeta(folder);
      lines.push('', `### ${meta.title}`);
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
  const guideLines = ['### Guide', ...guidePages.flatMap((entry) => pageLine(join(trackDir, `${entry}.mdx`)))];

  total += trackTotal;
  written += trackWritten;
  return [`## ${title}`, '', `**Written: ${trackWritten} of ${trackTotal}**`, '', ...guideLines, ...lines, ''];
}

const trackLines = TRACKS.flatMap(trackSection);

const output = [
  '# Progress',
  '',
  '✅ = written · ⬜ = not written yet',
  '',
  'Same order as the sidebar. This file is generated: run `npm run progress` after writing a page.',
  'A page that is not written yet has `planned: true` in its frontmatter (it shows dimmed in the sidebar).',
  '',
  ...trackLines,
  '## To do',
  '- [x] **System Design Cheat Sheet:** written last, from all the finished lessons.',
  '- [x] **Low-Level Design:** all lessons, practice problems and the Cheat Sheet.',
  '',
  '## Later: separate tracks',
  '- **OS and Concurrency (slim):** processes vs threads, concurrency vs parallelism, race conditions and mutexes,',
  '  deadlocks, thread pools, event loop and async, blocking vs non-blocking I/O.',
  '- **DSA in JavaScript.**',
  '',
].join('\n');

writeFileSync(join(process.cwd(), 'PROGRESS.md'), output);
for (const warning of warnings) console.warn(`Warning: ${warning}`);
console.log(`PROGRESS.md updated: ${written} of ${total} written.`);
