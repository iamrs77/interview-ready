import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, Brain } from 'lucide-react';
import { DocsDescription, DocsPage, DocsTitle } from 'fumadocs-ui/layouts/docs/page';
import { getDeck, getDecks } from '@/lib/flashcards';
import { sections } from '@/lib/sections';
import { StudySession } from '@/components/flashcards/study-session';

export const dynamicParams = false;

export function generateStaticParams() {
  return [{ deck: 'all' }, ...getDecks().map((deck) => ({ deck: deck.key }))];
}

function deckLabel(key: string): string {
  return key === 'all' ? 'All decks' : sections[key as keyof typeof sections].label;
}

export async function generateMetadata(props: PageProps<'/learn/system-design/flashcards/[deck]'>): Promise<Metadata> {
  const { deck } = await props.params;
  return { title: `${deckLabel(deck)} · Flashcards` };
}

export default async function DeckPage(props: PageProps<'/learn/system-design/flashcards/[deck]'>) {
  const { deck: key } = await props.params;
  const deck = getDeck(key);
  if (!deck) notFound();

  const section = deck.key === 'all' ? undefined : sections[deck.key];

  return (
    <DocsPage
      full
      breadcrumb={{ enabled: false }}
      footer={{ enabled: false }}
      tableOfContent={{ enabled: false }}
      tableOfContentPopover={{ enabled: false }}
    >
      <div className="flex flex-wrap items-center gap-3">
        <Link
          href="/learn/system-design/flashcards"
          className="inline-flex items-center gap-1 text-sm text-fd-muted-foreground hover:text-fd-foreground"
        >
          <ArrowLeft className="size-4" /> All decks
        </Link>
        {section ? (
          <span
            className={`inline-flex w-fit items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${section.className}`}
          >
            <section.icon className="size-3.5" />
            {section.label}
          </span>
        ) : (
          <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-violet-500/10 px-3 py-1 text-xs font-medium text-violet-700">
            <Brain className="size-3.5" />
            All decks
          </span>
        )}
      </div>
      <DocsTitle>{deckLabel(key)} flashcards</DocsTitle>
      <DocsDescription className="mb-0">
        {deck.cards.length} cards{key === 'all' ? ' from every module.' : ` from the ${deckLabel(key)} lessons.`}
      </DocsDescription>
      <StudySession key={key} cards={deck.cards} lessons={deck.lessons} />
    </DocsPage>
  );
}
