// Quick MDX syntax check, without a full build. It catches the usual mistakes, like a bare `<`, `{` or `}`
// outside code (MDX reads them as JSX).
// Run: node scripts/mdx-check.mjs content/javascript/functions/closures.mdx [more files...]
import { readFileSync } from 'node:fs';
import { compile } from '@mdx-js/mdx';
import remarkGfm from 'remark-gfm';

let failed = 0;
for (const file of process.argv.slice(2)) {
  const text = readFileSync(file, 'utf8').replace(/^---\n[\s\S]*?\n---\n/, '');
  try {
    await compile(text, { remarkPlugins: [remarkGfm] });
    console.log(`ok    ${file}`);
  } catch (error) {
    failed += 1;
    console.log(`FAIL  ${file}: ${error.message}`);
  }
}
process.exit(failed > 0 ? 1 : 0);
