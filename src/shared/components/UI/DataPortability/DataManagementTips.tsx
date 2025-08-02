/**
 * @file DataManagementTips.tsx
 * @description Help text and tips for data management
 */


export interface DataManagementTipsProps {
  className?: string;
}

const tips = [
  'Export data regularly as a backup',
  'Import files must be in HSA Songbook JSON format',
  'Large imports may take a few moments to complete',
  'Existing favorites and recent items are preserved during cleanup'
];

export function DataManagementTips({ className = '' }: DataManagementTipsProps) {
  return (
    <div className={`mt-6 p-4 bg-gray-50 rounded-md ${className}`}>
      <h5 className="font-medium text-gray-800 mb-2">Tips:</h5>
      <ul className="text-sm text-gray-600 space-y-1">
        {tips.map((tip, index) => (
          <li key={index}>• {tip}</li>
        ))}
      </ul>
    </div>
  );
}