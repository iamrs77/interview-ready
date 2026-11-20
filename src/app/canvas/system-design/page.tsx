import type { Metadata } from 'next';
import { FreeCanvas } from '@/components/canvas/free-canvas';

export const metadata: Metadata = {
  title: 'Free canvas: System Design',
  description: 'A blank board for system design drawings. It saves in this browser.',
};

export default function SystemDesignCanvasPage() {
  // "free-canvas" is the board id from before the split, so an old drawing is still found.
  return <FreeCanvas boardId="free-canvas" trackName="System Design" lessonsUrl="/learn/system-design" />;
}
