/*
 * Excalidraw is large (about 1 MB of script), so it is loaded only on the Free canvas page, in the browser.
 * Lesson pages never load it.
 *
 * Its drawing fonts are served by this site from /excalidraw/fonts (copied there from node_modules by
 * scripts/copy-excalidraw-fonts.mjs). EXCALIDRAW_ASSET_PATH tells Excalidraw where they are. It must be set
 * before Excalidraw loads.
 */

declare global {
  interface Window {
    EXCALIDRAW_ASSET_PATH?: string | string[];
  }
}

/** The drawing board component (with Excalidraw's styles). */
export function loadBoard() {
  window.EXCALIDRAW_ASSET_PATH = '/excalidraw/';
  return import('./excalidraw-board');
}
