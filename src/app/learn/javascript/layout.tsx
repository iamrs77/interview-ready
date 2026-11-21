import type { ReactNode } from 'react';
import { TrackLayout } from '@/components/track-layout';

// Every page under /learn/javascript (lessons and anything else) gets this track's sidebar.
export default function Layout({ children }: { children: ReactNode }) {
  return <TrackLayout track="javascript">{children}</TrackLayout>;
}
