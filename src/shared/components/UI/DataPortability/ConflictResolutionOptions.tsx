/**
 * @file ConflictResolutionOptions.tsx
 * @description Radio button group for selecting conflict resolution strategy
 */

import type { ConflictResolution } from '../../../hooks/useDataImport';

export interface ConflictResolutionOptionsProps {
  value: ConflictResolution;
  onChange: (value: ConflictResolution) => void;
  disabled?: boolean;
  className?: string;
}

const options: { value: ConflictResolution; label: string; description: string }[] = [
  {
    value: 'keep_existing',
    label: 'Keep existing data',
    description: 'Preserve your current data when conflicts occur (recommended)'
  },
  {
    value: 'overwrite',
    label: 'Overwrite with imported data',
    description: 'Replace existing data with imported versions'
  },
  {
    value: 'create_new',
    label: 'Create new copies',
    description: 'Keep both versions by creating duplicates'
  }
];

export function ConflictResolutionOptions({
  value,
  onChange,
  disabled = false,
  className = ''
}: ConflictResolutionOptionsProps) {
  return (
    <div className={className}>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        How to handle conflicts with existing data:
      </label>
      <div className="space-y-2">
        {options.map((option) => (
          <label 
            key={option.value}
            className={`flex items-start ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
          >
            <input
              type="radio"
              name="conflictResolution"
              value={option.value}
              checked={value === option.value}
              onChange={(e) => onChange(e.target.value as ConflictResolution)}
              disabled={disabled}
              className="mt-1 mr-3"
            />
            <div className="flex-1">
              <span className="text-sm font-medium text-gray-700">
                {option.label}
              </span>
              <p className="text-xs text-gray-500 mt-0.5">
                {option.description}
              </p>
            </div>
          </label>
        ))}
      </div>
    </div>
  );
}