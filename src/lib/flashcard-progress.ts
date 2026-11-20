'use client';

import { useMemo, useSyncExternalStore } from 'react';

/*
 * Flashcard progress, saved in this browser only (localStorage).
 * Each card sits in a "box" from 0 to 5 (the Leitner system):
 *   - "I knew it" moves it up one box, so it comes back later: 1, 3, 7, 14, then 30 days.
 *   - "Again" puts it back in box 0, so it comes back right away.
 */
const STORAGE_KEY = 'interview-ready:flashcards';
const CHANGE_EVENT = 'interview-ready:flashcards-change';
const DAY = 24 * 60 * 60 * 1000;
const WAIT_DAYS = [0, 1, 3, 7, 14, 30]; // index = box

export type CardRecord = { box: number; due: number; reviews: number };
export type CardProgress = Record<string, CardRecord>;

function readRaw(): string {
  try {
    return localStorage.getItem(STORAGE_KEY) ?? '{}';
  } catch {
    return '{}';
  }
}

function parse(raw: string): CardProgress {
  try {
    const value: unknown = JSON.parse(raw);
    return value && typeof value === 'object' && !Array.isArray(value) ? (value as CardProgress) : {};
  } catch {
    return {};
  }
}

function save(progress: CardProgress) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  } catch {
    // Storage can be blocked (private mode). Progress just won't be saved.
  }
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

function subscribe(onChange: () => void) {
  window.addEventListener('storage', onChange); // other tabs
  window.addEventListener(CHANGE_EVENT, onChange); // this tab
  return () => {
    window.removeEventListener('storage', onChange);
    window.removeEventListener(CHANGE_EVENT, onChange);
  };
}

export function useFlashcardProgress(): CardProgress {
  const raw = useSyncExternalStore(subscribe, readRaw, () => '{}');
  return useMemo(() => parse(raw), [raw]);
}

/** Saves an answer and returns nothing. Call it from click or key handlers. */
export function recordAnswer(cardId: string, knewIt: boolean) {
  const progress = parse(readRaw());
  const previous = progress[cardId];
  const box = knewIt ? Math.min((previous?.box ?? 0) + 1, WAIT_DAYS.length - 1) : 0;
  progress[cardId] = { box, due: Date.now() + WAIT_DAYS[box] * DAY, reviews: (previous?.reviews ?? 0) + 1 };
  save(progress);
}

export function resetCards(cardIds: string[]) {
  const progress = parse(readRaw());
  for (const id of cardIds) delete progress[id];
  save(progress);
}

export type DeckStats = { total: number; fresh: number; due: number; known: number };

/** fresh = never studied, due = studied and ready to see again, known = last answer was "I knew it". */
export function deckStats(cardIds: string[], progress: CardProgress, now: number): DeckStats {
  let fresh = 0;
  let due = 0;
  let known = 0;
  for (const id of cardIds) {
    const record = progress[id];
    if (!record) fresh++;
    else {
      if (record.due <= now) due++;
      if (record.box >= 1) known++;
    }
  }
  return { total: cardIds.length, fresh, due, known };
}

// The current time, rounded to the minute and updated every minute, so screens can show what is due.
function subscribeToClock(onChange: () => void) {
  const timer = window.setInterval(onChange, 60_000);
  return () => window.clearInterval(timer);
}
const currentMinute = () => Math.floor(Date.now() / 60_000) * 60_000;

export function useNow(): number {
  return useSyncExternalStore(subscribeToClock, currentMinute, () => 0);
}
