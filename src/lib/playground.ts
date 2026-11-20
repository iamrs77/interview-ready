import type { Track } from './source';

/** Tracks that get the JS playground (the ones with JavaScript code). */
export const PLAYGROUND_TRACKS: Track[] = ['low-level-design', 'dsa'];

/** True when this URL is a lesson in a track that has the playground. */
export function hasPlaygroundAt(pathname: string): boolean {
  return PLAYGROUND_TRACKS.some((track) => pathname.startsWith(`/learn/${track}`));
}
