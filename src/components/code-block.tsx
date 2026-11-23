'use client';

import type { ComponentProps, MouseEvent, ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { Play } from 'lucide-react';
import { CodeBlock, Pre } from 'fumadocs-ui/components/codeblock';
import { runInPlayground } from '@/components/js-playground';
import { hasPlaygroundAt } from '@/lib/playground';
import { codeWithEarlierSteps } from '@/lib/earlier-steps';

/*
 * Lesson code blocks. On tracks with the JS playground, JavaScript blocks get a "Run" button: one click
 * puts the block's code in the playground, opens it and runs it. A block marked ```js noRun gets none.
 * A block that builds on earlier ones ("Step 2" using the class from "Step 1") runs with the earlier blocks
 * it needs put in front (see codeWithEarlierSteps).
 * Other blocks look exactly like Fumadocs' normal code block.
 */

const RUNNABLE_LANGUAGES = ['js', 'javascript', 'jsx'];

/** The block's code as plain text, the same way Fumadocs' copy button reads it. */
function readCode(button: Element): string {
  const pre = button.closest('figure')?.querySelector('pre');
  if (!pre) {
    return '';
  }
  const copy = pre.cloneNode(true) as HTMLElement;
  copy.querySelectorAll('.nd-copy-ignore').forEach((node) => node.replaceWith('\n'));
  return copy.textContent ?? '';
}

function RunButton() {
  function run(event: MouseEvent<HTMLButtonElement>) {
    // Every Run button on the page, in page order. Their blocks are the code this block may build on.
    const buttons = Array.from(document.querySelectorAll('[data-run-button]'));
    const blocks = buttons.map(readCode);
    const index = buttons.indexOf(event.currentTarget);
    if (index < 0) {
      runInPlayground(readCode(event.currentTarget));
      return;
    }
    runInPlayground(codeWithEarlierSteps(blocks, index));
  }

  return (
    <button
      type="button"
      data-run-button=""
      onClick={run}
      title="Run this code in the JS Playground"
      className="inline-flex h-6 items-center gap-1 rounded-md border border-indigo-200 bg-indigo-50 px-2 text-xs font-medium text-indigo-700 transition-colors hover:border-indigo-300 hover:bg-indigo-100"
    >
      <Play className="size-3" />
      Run
    </button>
  );
}

/** The copy button (Fumadocs passes it as children) with "Run" before it. */
function RunActions({ className, children }: { className?: string; children?: ReactNode }) {
  return (
    <div className={`flex items-center gap-1 ${className ?? ''}`}>
      <RunButton />
      {children}
    </div>
  );
}

export function LessonCodeBlock(props: ComponentProps<'pre'> & { 'data-language'?: string; 'data-no-run'?: string }) {
  const pathname = usePathname();
  const language = props['data-language'] ?? '';
  const runnable = RUNNABLE_LANGUAGES.includes(language) && !props['data-no-run'] && hasPlaygroundAt(pathname);

  return (
    <CodeBlock {...(props as ComponentProps<typeof CodeBlock>)} Actions={runnable ? RunActions : undefined}>
      <Pre>{props.children}</Pre>
    </CodeBlock>
  );
}
