import { getNextLesson, source } from '@/lib/source';
import {
  DocsBody,
  DocsDescription,
  DocsPage,
  DocsTitle,
} from 'fumadocs-ui/layouts/docs/page';
import { notFound } from 'next/navigation';
import { getMDXComponents } from '@/components/mdx';
import type { Metadata } from 'next';
import { createRelativeLink } from 'fumadocs-ui/mdx';
import { Callout } from 'fumadocs-ui/components/callout';
import { MarkAsDone } from '@/components/mark-as-done';
import { ReadingProgress } from '@/components/reading-progress';
import { getSection } from '@/lib/sections';

export default async function Page(props: PageProps<'/learn/[[...slug]]'>) {
  const params = await props.params;
  const page = source.getPage(params.slug);
  if (!page) notFound();

  const MDX = page.data.body;
  const section = getSection(page.slugs);

  return (
    // Breadcrumb is off: the colored section label below already shows where you are.
    // Footer (previous/next cards) is off: "Mark as done" shows the next lesson instead.
    <DocsPage
      toc={page.data.toc}
      full={page.data.full}
      breadcrumb={{ enabled: false }}
      footer={{ enabled: false }}
      tableOfContent={{ header: <ReadingProgress /> }}
    >
      <span
        className={`inline-flex w-fit items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${section.className}`}
      >
        <section.icon className="size-3.5" />
        {section.label}
      </span>
      <DocsTitle>{page.data.title}</DocsTitle>
      <DocsDescription className="mb-0">{page.data.description}</DocsDescription>
      <DocsBody>
        {page.data.planned && (
          <Callout title="Not written yet">
            This page is in the plan, but the notes are not written yet. Here is what it will cover.
          </Callout>
        )}
        <MDX
          components={getMDXComponents({
            // this allows you to link to other pages with relative file paths
            a: createRelativeLink(source, page),
          })}
        />
      </DocsBody>
      {!page.data.planned && (
        <MarkAsDone
          pageUrl={page.url}
          // After the last lesson (the Cheat Sheet), the next step is the flashcards.
          nextLesson={getNextLesson(page.url) ?? { title: 'Flashcards', url: '/learn/system-design/flashcards' }}
        />
      )}
    </DocsPage>
  );
}

export async function generateStaticParams() {
  return source.generateParams();
}

export async function generateMetadata(props: PageProps<'/learn/[[...slug]]'>): Promise<Metadata> {
  const params = await props.params;
  const page = source.getPage(params.slug);
  if (!page) notFound();

  return {
    title: page.data.title,
    description: page.data.description,
  };
}
