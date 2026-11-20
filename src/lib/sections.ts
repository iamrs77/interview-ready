import {
  Activity,
  Box,
  Compass,
  Database,
  Dumbbell,
  Layers,
  LayoutGrid,
  MessageSquare,
  PenTool,
  Puzzle,
  Ruler,
  Send,
  Shapes,
  Share2,
  ShieldCheck,
  Workflow,
  Zap,
  type LucideIcon,
} from 'lucide-react';

export type Section = {
  label: string;
  icon: LucideIcon;
  /** Soft background + text color. */
  className: string;
};

/**
 * One calm color per module, used for the label at the top of each lesson page.
 * Keys are the folder names in content/system-design.
 */
export const sections = {
  guide: { label: 'Guide', icon: Compass, className: 'bg-violet-500/10 text-violet-700' },
  foundations: { label: 'Foundations', icon: Layers, className: 'bg-teal-500/10 text-teal-700' },
  'hld-basics': { label: 'High-Level Design Basics', icon: LayoutGrid, className: 'bg-indigo-500/10 text-indigo-700' },
  databases: { label: 'Databases', icon: Database, className: 'bg-sky-500/10 text-sky-700' },
  caching: { label: 'Caching and CDN', icon: Zap, className: 'bg-amber-500/10 text-amber-700' },
  messaging: { label: 'Messaging and Events', icon: Send, className: 'bg-orange-500/10 text-orange-700' },
  'distributed-systems': { label: 'Distributed Systems', icon: Share2, className: 'bg-fuchsia-500/10 text-fuchsia-700' },
  'reliability-security': { label: 'Reliability and Security', icon: ShieldCheck, className: 'bg-red-500/10 text-red-700' },
  'advanced-components': { label: 'Advanced Components', icon: Puzzle, className: 'bg-emerald-500/10 text-emerald-700' },
  production: { label: 'Production Systems', icon: Activity, className: 'bg-slate-500/10 text-slate-700' },
  questions: { label: 'Interview Questions', icon: MessageSquare, className: 'bg-rose-500/10 text-rose-700' },
} satisfies Record<string, Section>;

/**
 * The same for Low-Level Design (folders in content/low-level-design).
 * Kept apart from `sections` on purpose: that list is also the System Design flashcard decks.
 */
export const lldSections = {
  guide: { label: 'Guide', icon: Compass, className: 'bg-violet-500/10 text-violet-700' },
  'oop-basics': { label: 'OOP Basics', icon: Box, className: 'bg-teal-500/10 text-teal-700' },
  'design-principles': { label: 'Design Principles', icon: Ruler, className: 'bg-indigo-500/10 text-indigo-700' },
  'modeling-uml': { label: 'Modeling and UML', icon: PenTool, className: 'bg-sky-500/10 text-sky-700' },
  'design-patterns': { label: 'Design Patterns', icon: Shapes, className: 'bg-amber-500/10 text-amber-700' },
  concurrency: { label: 'Concurrency in LLD', icon: Workflow, className: 'bg-fuchsia-500/10 text-fuchsia-700' },
  problems: { label: 'Practice Problems', icon: Dumbbell, className: 'bg-rose-500/10 text-rose-700' },
} satisfies Record<string, Section>;

/** Finds the section from a page's slugs, e.g. ['system-design', 'caching', 'redis']. */
export function getSection(slugs: string[]): Section {
  const list: Record<string, Section> = slugs[0] === 'low-level-design' ? lldSections : sections;
  const key = slugs[1];
  return key && key in list ? list[key] : list.guide;
}
