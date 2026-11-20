'use client';

import { useState } from 'react';
import { useFetchSearch } from 'fumadocs-core/search/client';
import {
  SearchDialog,
  SearchDialogClose,
  SearchDialogContent,
  SearchDialogHeader,
  SearchDialogIcon,
  SearchDialogInput,
  SearchDialogList,
  SearchDialogOverlay,
} from 'fumadocs-ui/components/dialog/search';
import type { SharedProps } from 'fumadocs-ui/contexts/search';

/**
 * The Fumadocs search dialog (Ctrl/Cmd+K), with one change: it never shows the last search again.
 * The default keeps the typed words after it closes. Here they are cleared, so every search starts empty.
 *
 * The reset happens as the dialog opens, not while it closes: clearing during the close animation
 * would make the results list jump to empty while it fades out.
 */
export default function LessonSearchDialog(props: SharedProps) {
  const { search, onSearchChange, isLoading, data, error } = useFetchSearch(); // calls /api/search

  const [wasOpen, setWasOpen] = useState(props.open);
  if (props.open !== wasOpen) {
    setWasOpen(props.open);
    if (props.open) onSearchChange('');
  }

  return (
    <SearchDialog
      {...props}
      search={search}
      onSearchChange={onSearchChange}
      isLoading={isLoading}
      data={data}
      error={error}
    >
      <SearchDialogOverlay />
      <SearchDialogContent>
        <SearchDialogHeader>
          <SearchDialogIcon />
          <SearchDialogInput />
          <SearchDialogClose />
        </SearchDialogHeader>
        <SearchDialogList />
      </SearchDialogContent>
    </SearchDialog>
  );
}
