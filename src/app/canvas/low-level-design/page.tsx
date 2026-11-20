import type { Metadata } from 'next';
import { FreeCanvas } from '@/components/canvas/free-canvas';

export const metadata: Metadata = {
  title: 'Free canvas: Low-Level Design',
  description: 'A blank board for class and sequence diagrams. It saves in this browser.',
};

export default function LowLevelDesignCanvasPage() {
  return <FreeCanvas boardId="lld-canvas" trackName="Low-Level Design" lessonsUrl="/learn/low-level-design" />;
}
