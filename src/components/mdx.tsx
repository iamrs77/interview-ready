import defaultMdxComponents from 'fumadocs-ui/mdx';
import { Accordion, Accordions } from 'fumadocs-ui/components/accordion';
import { Step, Steps } from 'fumadocs-ui/components/steps';
import { Tab, Tabs } from 'fumadocs-ui/components/tabs';
import type { MDXComponents } from 'mdx/types';
import { Mermaid } from '@/components/mermaid';
import { LessonCodeBlock } from '@/components/code-block';

export function getMDXComponents(components?: MDXComponents) {
  return {
    ...defaultMdxComponents,
    Accordion,
    Accordions,
    Mermaid,
    Step,
    Steps,
    Tab,
    Tabs,
    // Code blocks: JavaScript ones get a "Run" button on tracks with the JS playground.
    pre: LessonCodeBlock,
    ...components,
  } satisfies MDXComponents;
}

declare global {
  type MDXProvidedComponents = ReturnType<typeof getMDXComponents>;
}
