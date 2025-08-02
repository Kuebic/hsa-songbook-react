/**
 * @file useFileImport.ts
 * @description Generic hook for file input handling
 */

import { useRef, useCallback } from 'react';

export interface UseFileImportOptions {
  accept?: string;
  maxSize?: number; // bytes
  onFileSelect?: (file: File) => void;
  onError?: (error: string) => void;
}

export interface UseFileImportResult {
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  triggerFileSelect: () => void;
  handleFileSelect: (event: React.ChangeEvent<HTMLInputElement>) => Promise<string | null>;
}

export function useFileImport(options: UseFileImportOptions = {}): UseFileImportResult {
  const {
    accept = '.json',
    maxSize = 10 * 1024 * 1024, // 10MB default
    onFileSelect,
    onError
  } = options;

  const fileInputRef = useRef<HTMLInputElement>(null);

  const triggerFileSelect = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileSelect = useCallback(async (
    event: React.ChangeEvent<HTMLInputElement>
  ): Promise<string | null> => {
    const file = event.target.files?.[0];
    if (!file) return null;

    // Validate file type
    if (accept && !file.name.match(new RegExp(accept.replace('*', '.*')))) {
      const error = `Please select a valid file (${accept})`;
      onError?.(error);
      return null;
    }

    // Validate file size
    if (maxSize && file.size > maxSize) {
      const sizeMB = (maxSize / 1024 / 1024).toFixed(1);
      const error = `File size exceeds ${sizeMB}MB limit`;
      onError?.(error);
      return null;
    }

    // Notify file selection
    onFileSelect?.(file);

    // Read file content
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        const content = e.target?.result as string;
        resolve(content);
      };
      
      reader.onerror = () => {
        const error = 'Failed to read file';
        onError?.(error);
        reject(new Error(error));
      };
      
      reader.readAsText(file);
    });
  }, [accept, maxSize, onFileSelect, onError]);

  return {
    fileInputRef,
    triggerFileSelect,
    handleFileSelect
  };
}