import {
  Activity,
  Binary,
  Blocks,
  Box,
  Boxes,
  Brackets,
  Bug,
  CircleQuestionMark,
  Coins,
  Compass,
  Component,
  Database,
  Dumbbell,
  FileCode,
  FileType,
  FlaskConical,
  GitBranch,
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
  Sparkles,
  SquareFunction,
  Table,
  Timer,
  TreeDeciduous,
  Triangle,
  Undo2,
  Workflow,
  Wrench,
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

/** The same for JavaScript (folders in content/javascript). */
export const jsSections = {
  guide: { label: 'Guide', icon: Compass, className: 'bg-violet-500/10 text-violet-700' },
  'core-basics': { label: 'Core Basics', icon: Blocks, className: 'bg-teal-500/10 text-teal-700' },
  functions: { label: 'Functions', icon: SquareFunction, className: 'bg-sky-500/10 text-sky-700' },
  'objects-arrays': { label: 'Objects and Arrays', icon: Boxes, className: 'bg-indigo-500/10 text-indigo-700' },
  oop: { label: 'OOP in JavaScript', icon: Component, className: 'bg-cyan-500/10 text-cyan-700' },
  async: { label: 'Asynchronous JavaScript', icon: Timer, className: 'bg-amber-500/10 text-amber-700' },
  'modern-js': { label: 'Modern JavaScript', icon: Sparkles, className: 'bg-pink-500/10 text-pink-700' },
  'json-storage': { label: 'JSON and Storage', icon: Database, className: 'bg-emerald-500/10 text-emerald-700' },
  'memory-errors': { label: 'Memory, Errors and Performance', icon: Bug, className: 'bg-red-500/10 text-red-700' },
  testing: { label: 'Testing', icon: FlaskConical, className: 'bg-lime-500/10 text-lime-700' },
  'write-your-own': { label: 'Write Your Own', icon: Wrench, className: 'bg-orange-500/10 text-orange-700' },
  'guess-the-output': { label: 'Guess the Output', icon: CircleQuestionMark, className: 'bg-fuchsia-500/10 text-fuchsia-700' },
  typescript: { label: 'TypeScript', icon: FileType, className: 'bg-blue-500/10 text-blue-700' },
} satisfies Record<string, Section>;

/** Git has no sections: every page is in the track root. */
export const gitSections = {
  guide: { label: 'Git', icon: GitBranch, className: 'bg-orange-500/10 text-orange-700' },
} satisfies Record<string, Section>;

/** Each track's sections, by track folder name. System Design is the default. */
const sectionsByTrack: Record<string, Record<string, Section>> = {
  'low-level-design': lldSections,
  dsa: dsaSections,
  javascript: jsSections,
  git: gitSections,
};

/** Finds the section from a page's slugs, e.g. ['system-design', 'caching', 'redis']. */
export function getSection(slugs: string[]): Section {
  const list: Record<string, Section> = sectionsByTrack[slugs[0]] ?? sections;
  const key = slugs[1];
  return key && key in list ? list[key] : list.guide;
}
