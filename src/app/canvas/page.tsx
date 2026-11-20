import type { Metadata } from 'next';
import { FreeCanvas } from '@/components/canvas/free-canvas';

export const metadata: Metadata = {
  title: 'Free canvas',
  description: 'A blank board to draw anything. It saves in this browser.',
};

export default function FreeCanvasPage() {
  return <FreeCanvas />;
}
