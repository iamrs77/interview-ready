'use client';

import { useMemo, useSyncExternalStore } from 'react';

// Progress is saved in this browser only (localStorage). No login needed.
const STORAGE_KEY = 'interview-ready:done-pages';
const CHANGE_EVENT = 'interview-ready:progress-change';

function readRaw(): string {
  try {
    return localStorage.getItem(STORAGE_KEY) ?? '[]';
  } catch {
    return '[]';
  }
}

// Pages that moved to a new address. A "done" mark saved under the old address counts for the new one.
// When a page moves again, add its old address here.
const MOVED_PAGES: Record<string, string> = {
  '/learn/system-design/core-concepts/caching': '/learn/system-design/caching/what-is-caching',
  '/learn/system-design/core-concepts/cap-theorem': '/learn/system-design/distributed-systems/cap-theorem',
  '/learn/system-design/key-technologies/redis': '/learn/system-design/caching/redis',
  '/learn/system-design/patterns/scaling-reads': '/learn/system-design/hld-basics/scaling-reads',
};

function parse(raw: string): string[] {
  try {
    const value: unknown = JSON.parse(raw);
    if (!Array.isArray(value)) return [];
    return value
      .filter((item): item is string => typeof item === 'string')
      .map((url) => MOVED_PAGES[url] ?? url);
  } catch {
    return [];
  }
}

function subscribe(onChange: () => void) {
  window.addEventListener('storage', onChange); // other tabs
  window.addEventListener(CHANGE_EVENT, onChange); // this tab
  return () => {
    window.removeEventListener('storage', onChange);
    window.removeEventListener(CHANGE_EVENT, onChange);
  };
}

/** URLs of all pages the user marked as done. */
export function useDonePages(): Set<string> {
  const raw = useSyncExternalStore(subscribe, readRaw, () => '[]');
  return useMemo(() => new Set(parse(raw)), [raw]);
}

/** Marks every lesson as not done. */
export function resetAllPages() {
  try {
    localStorage.setItem(STORAGE_KEY, '[]');
  } catch {
    // Storage can be blocked (private mode).
  }
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

export function setPageDone(pageUrl: string, done: boolean) {
  const pages = new Set(parse(readRaw()));
  if (done) pages.add(pageUrl);
  else pages.delete(pageUrl);

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...pages]));
  } catch {
    // Storage can be blocked (private mode). Progress just won't be saved.
  }
  window.dispatchEvent(new Event(CHANGE_EVENT));
}
