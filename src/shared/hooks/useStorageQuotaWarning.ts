/**
 * @file useStorageQuotaWarning.ts
 * @description Hook to automatically show storage warnings
 */

import { useState } from 'react';
import { useStorageStats } from './useOfflineStorage';

export function useStorageQuotaWarning() {
  const { isQuotaWarning, isQuotaCritical } = useStorageStats();
  const [dismissed, setDismissed] = useState(false);

  const shouldShow = (isQuotaWarning || isQuotaCritical) && !dismissed;
  
  const dismiss = () => setDismissed(true);
  
  const reset = () => setDismissed(false);

  return {
    shouldShow,
    isWarning: isQuotaWarning,
    isCritical: isQuotaCritical,
    dismiss,
    reset,
  };
}