/**
 * @file src/features/setlists/components/SetlistItemTransposeControls.tsx
 * @description Transpose controls component for setlist items
 */

import React, { useCallback } from 'react';

interface SetlistItemTransposeControlsProps {
  currentTranspose: number;
  onTransposeChange: (newTranspose: number) => void;
}

export const SetlistItemTransposeControls: React.FC<SetlistItemTransposeControlsProps> = ({
  currentTranspose,
  onTransposeChange
}) => {
  const handleTransposeDown = useCallback(() => {
    onTransposeChange(Math.max(-11, currentTranspose - 1));
  }, [currentTranspose, onTransposeChange]);

  const handleTransposeUp = useCallback(() => {
    onTransposeChange(Math.min(11, currentTranspose + 1));
  }, [currentTranspose, onTransposeChange]);

  const handleReset = useCallback(() => {
    onTransposeChange(0);
  }, [onTransposeChange]);

  return (
    <div className="mt-3 p-3 bg-gray-50 rounded border">
      <div className="flex items-center gap-2">
        <label className="text-sm font-medium text-gray-700">
          Transpose:
        </label>
        <div className="flex items-center gap-1">
          <button
            onClick={handleTransposeDown}
            disabled={currentTranspose <= -11}
            className="w-8 h-8 flex items-center justify-center bg-white border rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Transpose down"
          >
            −
          </button>
          
          <span className="w-12 text-center font-mono text-sm">
            {currentTranspose > 0 ? '+' : ''}{currentTranspose}
          </span>
          
          <button
            onClick={handleTransposeUp}
            disabled={currentTranspose >= 11}
            className="w-8 h-8 flex items-center justify-center bg-white border rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Transpose up"
          >
            +
          </button>
          
          {currentTranspose !== 0 && (
            <button
              onClick={handleReset}
              className="ml-2 px-2 py-1 text-xs bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
            >
              Reset
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default SetlistItemTransposeControls;