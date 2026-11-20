'use client';

import type { ReactNode } from 'react';
import { RootProvider } from 'fumadocs-ui/provider/next';
// A plain import: Fumadocs always renders the search dialog (closed) on every page, so a dynamic()
// import would load it right away anyway and save nothing.
import SearchDialog from '@/components/search-dialog';

export function Provider({ children }: { children: ReactNode }) {
  return (
    // Light theme only. Search (Ctrl/Cmd+K) uses the route in app/api/search.
    <RootProvider theme={{ enabled: false }} search={{ SearchDialog }}>
      {children}
    </RootProvider>
  );
}
