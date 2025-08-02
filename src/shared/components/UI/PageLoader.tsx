/**
 * @file PageLoader.tsx
 * @description Loading component for lazy-loaded pages with skeleton UI
 */

import React from 'react';
import { LoadingSpinner } from './LoadingSpinner';

interface PageLoaderProps {
  /** Custom loading message */
  message?: string;
  /** Show skeleton layout instead of spinner */
  showSkeleton?: boolean;
}

export const PageLoader: React.FC<PageLoaderProps> = ({
  message = 'Loading...',
  showSkeleton = false
}) => {
  if (showSkeleton) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        {/* Header skeleton */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4 animate-pulse" />
          <div className="h-4 bg-gray-200 rounded w-2/3 animate-pulse" />
        </div>
        
        {/* Content skeleton */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="space-y-4">
            <div className="h-4 bg-gray-200 rounded w-full animate-pulse" />
            <div className="h-4 bg-gray-200 rounded w-5/6 animate-pulse" />
            <div className="h-4 bg-gray-200 rounded w-4/6 animate-pulse" />
            <div className="h-8 bg-gray-200 rounded w-2/6 animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <LoadingSpinner size="lg" />
        <p className="mt-4 text-gray-600 text-sm">{message}</p>
      </div>
    </div>
  );
};

export default PageLoader;