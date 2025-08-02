/**
 * @file src/features/setlists/components/SetlistItemDragHandle.tsx
 * @description Drag handle component for setlist items
 */

import React from 'react';
import clsx from 'clsx';
import type { DraggableAttributes } from '@dnd-kit/core';
import type { SyntheticListenerMap } from '@dnd-kit/core/dist/hooks/utilities';

interface SetlistItemDragHandleProps {
  songTitle?: string;
  compactMode?: boolean;
  attributes: DraggableAttributes;
  listeners: SyntheticListenerMap | undefined;
}

export const SetlistItemDragHandle: React.FC<SetlistItemDragHandleProps> = ({
  songTitle,
  compactMode = false,
  attributes,
  listeners
}) => {
  const dragHandleClasses = clsx(
    'drag-handle',
    'w-6',
    'h-6',
    'text-gray-400',
    'hover:text-gray-600',
    'cursor-grab',
    'active:cursor-grabbing',
    'transition-colors',
    'flex',
    'items-center',
    'justify-center',
    {
      'opacity-0 group-hover:opacity-100': !compactMode,
      'w-4 h-4': compactMode,
    }
  );

  return (
    <button
      className={dragHandleClasses}
      {...attributes}
      {...listeners}
      aria-label={`Drag to reorder ${songTitle || 'song'}`}
      title="Drag to reorder"
    >
      <svg
        viewBox="0 0 20 20"
        className="w-full h-full"
        fill="currentColor"
      >
        <path d="M7 7a1 1 0 000 2h6a1 1 0 100-2H7zM7 11a1 1 0 100 2h6a1 1 0 100-2H7z" />
      </svg>
    </button>
  );
};

export default SetlistItemDragHandle;