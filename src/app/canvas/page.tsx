import { redirect } from 'next/navigation';

// Each track has its own board now. The old /canvas link opens the System Design board,
// which keeps the drawing saved before the split.
export default function CanvasPage() {
  redirect('/canvas/system-design');
}
