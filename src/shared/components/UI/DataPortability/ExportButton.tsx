/**
 * @file ExportButton.tsx
 * @description Simple export button component using refactored hooks
 */

import React from 'react';
import { Button } from '../Button';
import { useDataExport } from '../../../hooks/useDataExport';

export interface ExportButtonProps {
  userId: string;
  className?: string;
  children?: React.ReactNode;
  onComplete?: () => void;
}

export function ExportButton({ 
  userId, 
  className = '', 
  children = 'Export Data',
  onComplete 
}: ExportButtonProps) {
  const { loading, downloadExport } = useDataExport(userId);

  const handleClick = async () => {
    const success = await downloadExport();
    if (success) {
      onComplete?.();
    }
  };

  return (
    <Button
      onClick={handleClick}
      disabled={loading}
      className={className}
    >
      {loading ? 'Exporting...' : children}
    </Button>
  );
}