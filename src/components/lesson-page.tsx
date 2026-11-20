import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { DocsBody, DocsDescription, DocsPage, DocsTitle } from 'fumadocs-ui/layouts/docs/page';
import { createRelativeLink } from 'fumadocs-ui/mdx';
import { Callout } from 'fumadocs-ui/components/callout';
import { getMDXComponents } from '@/components/mdx';
import { MarkAsDone } from '@/components/mark-as-done';
import { ReadingProgress } from '@/components/reading-progress';
import { getNextLesson, source, trackOf, type Track } from '@/lib/source';
import { getSection } from '@/lib/sections';

/*
 * The lesson page, shared by every track's route (app/learn/<track>/[[...slug]]/page.tsx).
 * `slugs` is the full path inside /content, e.g. ['low-level-design', 'oop-basics', 'encapsulation'].
 */

/** After a track's last lesson: System Design goes on to its flashcards. Other tracks have none yet. */
const AFTER_LAST_LESSON: Partial<Record<Track, { title: string; url: string }>> = {
  'system-design': { title: 'Flashcards', url: '/learn/system-design/flashcards' },
};

export function LessonPage({ slugs }: { slugs: string[] }) {
  const page = source.getPage(slugs);
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
          nextLesson={getNextLesson(page.url) ?? AFTER_LAST_LESSON[trackOf(page.slugs)]}
        />
      )}
    </DocsPage>
  );
}

/** The static pages of one track, as params for its [[...slug]] route (slugs without the track name). */
export function lessonParams(track: Track) {
  return source
    .generateParams()
    .filter((params) => params.slug[0] === track)
    .map((params) => ({ slug: params.slug.slice(1) }));
}

export function lessonMetadata(slugs: string[]): Metadata {
  const page = source.getPage(slugs);
  if (!page) notFound();
  return { title: page.data.title, description: page.data.description };
}
