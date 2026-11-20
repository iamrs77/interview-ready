'use client';

import { memo, useCallback, useRef, useState } from 'react';
import { Excalidraw, MainMenu, WelcomeScreen, hashElementsVersion } from '@excalidraw/excalidraw';
import '@excalidraw/excalidraw/index.css';
import type { AppState, BinaryFiles, ExcalidrawInitialDataState, UIOptions } from '@excalidraw/excalidraw/types';
import type { ExcalidrawElement, OrderedExcalidrawElement } from '@excalidraw/excalidraw/element/types';
import type { SavedScene } from '@/lib/canvas-store';

/*
 * The drawing board of the Free canvas: Excalidraw, light theme, with only what drawing a design needs.
 * Loaded with next/dynamic (ssr: false) through excalidraw-loader.ts, so only the canvas page loads it.
 *
 * Hidden: loading and saving files, the theme switch, the image tool, the AI tools, the library (its button
 * links to another site), collaboration and the links to Excalidraw's own products (the default main menu).
 * Keyboard shortcuts work only while the board has focus (handleKeyboardGlobally is off, the default), so
 * typing notes next to it never switches tools.
 */

const UI_OPTIONS: Partial<UIOptions> = {
  canvasActions: {
    loadScene: false,
    saveToActiveFile: false,
    export: false,
    toggleTheme: null,
    changeViewBackgroundColor: false,
    clearCanvas: true,
    saveAsImage: true,
  },
  tools: { image: false },
};

/** The parts of Excalidraw's view state worth keeping: where you looked, the zoom, and the grid. */
function keptAppState(appState: AppState): SavedScene['appState'] {
  return {
    viewBackgroundColor: appState.viewBackgroundColor,
    scrollX: appState.scrollX,
    scrollY: appState.scrollY,
    zoom: appState.zoom,
    gridModeEnabled: appState.gridModeEnabled,
  };
}

function toInitialData(scene: SavedScene | null): ExcalidrawInitialDataState | null {
  if (!scene) return null;
  return {
    elements: scene.elements as ExcalidrawElement[],
    appState: scene.appState as ExcalidrawInitialDataState['appState'],
    files: scene.files as BinaryFiles,
    // Open where the owner left off, not centred on the drawing.
    scrollToContent: false,
  };
}

function ExcalidrawBoard({
  initialScene,
  onSceneChange,
}: {
  initialScene: SavedScene | null;
  onSceneChange: (scene: SavedScene) => void;
}) {
  // Read once: Excalidraw only uses initialData when it mounts.
  const [initialData] = useState(() => toInitialData(initialScene));
  const lastChange = useRef('');

  // Excalidraw calls onChange very often (also for pointer moves). Pass it on only when the drawing,
  // the view or the images really changed.
  const handleChange = useCallback(
    (elements: readonly OrderedExcalidrawElement[], appState: AppState, files: BinaryFiles) => {
      const kept = keptAppState(appState);
      const key = `${hashElementsVersion(elements)}|${JSON.stringify(kept)}|${Object.keys(files).length}`;
      if (key === lastChange.current) return;
      lastChange.current = key;

      const visible = elements.filter((element) => !element.isDeleted);
      const usedFiles = new Set<string>(
        visible.flatMap((element) => ('fileId' in element && element.fileId ? [element.fileId] : [])),
      );
      onSceneChange({
        elements: visible,
        appState: kept,
        files: Object.fromEntries(Object.entries(files).filter(([id]) => usedFiles.has(id))),
      });
    },
    [onSceneChange],
  );

  return (
    <Excalidraw
      initialData={initialData}
      onChange={handleChange}
      theme="light"
      UIOptions={UI_OPTIONS}
      aiEnabled={false}
    >
      <MainMenu>
        <MainMenu.DefaultItems.SaveAsImage />
        <MainMenu.DefaultItems.ClearCanvas />
        <MainMenu.DefaultItems.Help />
      </MainMenu>
      <WelcomeScreen>
        <WelcomeScreen.Hints.ToolbarHint />
        <WelcomeScreen.Center>
          <WelcomeScreen.Center.Heading>Draw your design here: boxes, arrows and labels.</WelcomeScreen.Center.Heading>
        </WelcomeScreen.Center>
      </WelcomeScreen>
    </Excalidraw>
  );
}

export default memo(ExcalidrawBoard);
