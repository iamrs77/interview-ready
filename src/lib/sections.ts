import {
  Activity,
  Binary,
  Box,
  Brackets,
  Coins,
  Compass,
  Database,
  Dumbbell,
  FileCode,
  Layers,
  Layers2,
  LayoutGrid,
  Link,
  MessageSquare,
  MoveHorizontal,
  PenTool,
  Puzzle,
  Ruler,
  Search,
  Send,
  Shapes,
  Share2,
  ShieldCheck,
  Table,
  TreeDeciduous,
  Triangle,
  Undo2,
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
 * Kept apart from `sections` so each track's labels stay in one place.
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

/** The same for DSA (folders in content/dsa). */
export const dsaSections = {
  guide: { label: 'Guide', icon: Compass, className: 'bg-violet-500/10 text-violet-700' },
  foundations: { label: 'Foundations', icon: Layers, className: 'bg-teal-500/10 text-teal-700' },
  'js-toolkit': { label: 'JavaScript Toolkit', icon: FileCode, className: 'bg-pink-500/10 text-pink-700' },
  'arrays-hashing': { label: 'Arrays and Hashing', icon: Brackets, className: 'bg-sky-500/10 text-sky-700' },
  'two-pointers': { label: 'Two Pointers and Sliding Window', icon: MoveHorizontal, className: 'bg-indigo-500/10 text-indigo-700' },
  'searching-sorting': { label: 'Binary Search and Sorting', icon: Search, className: 'bg-amber-500/10 text-amber-700' },
  'stacks-queues': { label: 'Stacks and Queues', icon: Layers2, className: 'bg-orange-500/10 text-orange-700' },
  'linked-lists': { label: 'Linked Lists', icon: Link, className: 'bg-lime-500/10 text-lime-700' },
  trees: { label: 'Trees', icon: TreeDeciduous, className: 'bg-emerald-500/10 text-emerald-700' },
  heaps: { label: 'Heaps', icon: Triangle, className: 'bg-rose-500/10 text-rose-700' },
  graphs: { label: 'Graphs', icon: Share2, className: 'bg-fuchsia-500/10 text-fuchsia-700' },
  backtracking: { label: 'Backtracking', icon: Undo2, className: 'bg-cyan-500/10 text-cyan-700' },
  'dynamic-programming': { label: 'Dynamic Programming', icon: Table, className: 'bg-red-500/10 text-red-700' },
  'greedy-intervals': { label: 'Greedy and Intervals', icon: Coins, className: 'bg-yellow-500/10 text-yellow-700' },
  'math-bits': { label: 'Math and Bits', icon: Binary, className: 'bg-slate-500/10 text-slate-700' },
} satisfies Record<string, Section>;

/** Each track's sections, by track folder name. System Design is the default. */
const sectionsByTrack: Record<string, Record<string, Section>> = {
  'low-level-design': lldSections,
  dsa: dsaSections,
};

/** Finds the section from a page's slugs, e.g. ['system-design', 'caching', 'redis']. */
export function getSection(slugs: string[]): Section {
  const list: Record<string, Section> = sectionsByTrack[slugs[0]] ?? sections;
  const key = slugs[1];
  return key && key in list ? list[key] : list.guide;
}
