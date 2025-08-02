/**
 * @file src/features/setlists/components/SetlistItemNotesSection.tsx
 * @description Notes editing section for setlist items
 */

import React, { useState, useCallback, useEffect, useRef } from 'react';

interface SetlistItemNotesSectionProps {
  notes?: string;
  isEditing: boolean;
  onSave: (notes: string) => void;
  onCancel: () => void;
}

export const SetlistItemNotesSection: React.FC<SetlistItemNotesSectionProps> = ({
  notes = '',
  isEditing,
  onSave,
  onCancel
}) => {
  const [localNotes, setLocalNotes] = useState(notes);
  const notesInputRef = useRef<HTMLTextAreaElement>(null);

  // Update local notes when prop changes
  useEffect(() => {
    setLocalNotes(notes);
  }, [notes]);

  // Auto-focus notes input when editing starts
  useEffect(() => {
    if (isEditing && notesInputRef.current) {
      notesInputRef.current.focus();
    }
  }, [isEditing]);

  const handleSave = useCallback(() => {
    onSave(localNotes);
  }, [localNotes, onSave]);

  const handleCancel = useCallback(() => {
    setLocalNotes(notes);
    onCancel();
  }, [notes, onCancel]);

  if (!isEditing && !notes) {
    return null;
  }

  return (
    <div className="mt-3">
      {isEditing ? (
        <div className="space-y-2">
          <textarea
            ref={notesInputRef}
            value={localNotes}
            onChange={(e) => setLocalNotes(e.target.value)}
            placeholder="Add performance notes..."
            className="w-full p-2 border border-gray-300 rounded text-sm resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            rows={3}
            maxLength={500}
          />
          <div className="flex justify-end gap-2">
            <button
              onClick={handleCancel}
              className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Save
            </button>
          </div>
        </div>
      ) : (
        notes && (
          <div className="p-2 bg-yellow-50 border border-yellow-200 rounded text-sm text-gray-700">
            <p className="whitespace-pre-wrap">{notes}</p>
          </div>
        )
      )}
    </div>
  );
};

export default SetlistItemNotesSection;