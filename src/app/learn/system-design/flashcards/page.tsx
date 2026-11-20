import type { Metadata } from 'next';
import { Brain } from 'lucide-react';
import { DocsDescription, DocsPage, DocsTitle } from 'fumadocs-ui/layouts/docs/page';
import { getDecks } from '@/lib/flashcards';
import { DeckList } from '@/components/flashcards/deck-list';

export const metadata: Metadata = {
  title: 'Flashcards',
  description: 'Short questions to check what you remember from every System Design lesson.',
};

export default function FlashcardsPage() {
  const decks = getDecks().map((deck) => ({ key: deck.key, cardIds: deck.cards.map((card) => card.id) }));

  return (
    <DocsPage
      full
      breadcrumb={{ enabled: false }}
      footer={{ enabled: false }}
      tableOfContent={{ enabled: false }}
      tableOfContentPopover={{ enabled: false }}
    >
      <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-violet-500/10 px-3 py-1 text-xs font-medium text-violet-700">
        <Brain className="size-3.5" />
        Flashcards
      </span>
      <DocsTitle>Flashcards</DocsTitle>
      <DocsDescription className="mb-0">
        Short questions to check what you remember. One deck for each module.
      </DocsDescription>
      <DeckList decks={decks} />
    </DocsPage>
  );
}
