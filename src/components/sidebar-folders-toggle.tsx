'use client';

import { useEffect, useRef, useState } from 'react';
import { ChevronsDownUp, ChevronsUpDown } from 'lucide-react';

/*
 * "Collapse all" / "Expand all" for the sections in the sidebar.
 *
 * Fumadocs keeps each folder's open state inside the folder, with no way to set them all at once.
 * So this button finds every folder's header button and clicks it, like a person would.
 * In Fumadocs 16.19, a folder is a <div data-open> (or <div data-closed>) whose first child is its header
 * <button aria-expanded>. Re-check after a Fumadocs upgrade: the button should still open and close every section.
 */

// The desktop sidebar and the phone drawer. Each one has its own copy of this button.
const SIDEBAR_SELECTOR = '#nd-sidebar, #nd-sidebar-mobile';
const FOLDER_BUTTON_SELECTOR = ':is([data-open], [data-closed]) > button[aria-expanded]';

function folderButtons(sidebar: Element): HTMLButtonElement[] {
  return Array.from(sidebar.querySelectorAll<HTMLButtonElement>(FOLDER_BUTTON_SELECTOR));
}

function isOpen(button: HTMLButtonElement): boolean {
  return button.getAttribute('aria-expanded') === 'true';
}

export function SidebarFoldersToggle() {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [anyOpen, setAnyOpen] = useState(false);
  // A track with no sections (like Git) has nothing to open or close, so the button stays hidden.
  const [hasFolders, setHasFolders] = useState(false);

  // Keep the label right when sections are opened or closed by hand too.
  useEffect(() => {
    const sidebar = buttonRef.current?.closest(SIDEBAR_SELECTOR);
    if (!sidebar) {
      return;
    }

    const update = () => {
      const buttons = folderButtons(sidebar);
      setHasFolders(buttons.length > 0);
      setAnyOpen(buttons.some(isOpen));
    };
    update();

    const observer = new MutationObserver(update);
    observer.observe(sidebar, { subtree: true, childList: true, attributes: true, attributeFilter: ['aria-expanded'] });
    return () => observer.disconnect();
  }, []);

  function toggle() {
    const sidebar = buttonRef.current?.closest(SIDEBAR_SELECTOR);
    if (!sidebar) {
      return;
    }

    if (anyOpen) {
      // Deepest first, so a folder inside another one closes before its parent.
      const openButtons = folderButtons(sidebar).filter(isOpen).reverse();
      openButtons.forEach((button) => button.click());
      return;
    }

    // A folder inside a closed folder only appears once its parent opens, so open in a few rounds.
    let rounds = 0;
    const openRound = () => {
      const closedButtons = folderButtons(sidebar).filter((button) => !isOpen(button));
      closedButtons.forEach((button) => button.click());
      rounds += 1;
      if (closedButtons.length > 0 && rounds < 5) {
        window.setTimeout(openRound, 50);
      }
    };
    openRound();
  }

  const Icon = anyOpen ? ChevronsDownUp : ChevronsUpDown;
  const label = anyOpen ? 'Collapse all' : 'Expand all';

  return (
    <button
      ref={buttonRef}
      type="button"
      onClick={toggle}
      title={anyOpen ? 'Close every section' : 'Open every section'}
      className={`-mb-1 items-center gap-1 self-end rounded-md px-1.5 py-0.5 text-xs font-medium text-fd-muted-foreground transition-colors hover:bg-fd-accent hover:text-fd-accent-foreground ${hasFolders ? 'inline-flex' : 'hidden'}`}
    >
      <Icon className="size-3.5" />
      {label}
    </button>
  );
}
