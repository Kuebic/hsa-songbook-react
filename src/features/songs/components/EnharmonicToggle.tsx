/**
 * @file EnharmonicToggle.tsx
 * @description Component for toggling between enharmonic equivalent keys
 * Allows users to choose between F# and Gb, C# and Db, etc.
 */

import React from 'react';
import { Button } from '../../../shared/components/UI/Button';
import { ENHARMONIC_KEYS } from '../utils/lineOfFifths';

interface EnharmonicToggleProps {
  currentKey: string;
  onKeyChange: (newKey: string) => void;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

/**
 * Component that allows users to toggle between enharmonic equivalent keys
 */
export function EnharmonicToggle({
  currentKey,
  onKeyChange,
  disabled = false,
  size = 'sm',
  showLabel = true,
  className = ''
}: EnharmonicToggleProps) {
  
  // Find the enharmonic equivalent for the current key
  const enharmonicPair = ENHARMONIC_KEYS.find(pair => 
    pair.sharp === currentKey || pair.flat === currentKey
  );

  // If no enharmonic equivalent exists, don't render the toggle
  if (!enharmonicPair) {
    return null;
  }

  const getKeyDisplayName = (key: string) => {
    // Add "major" for clarity if needed
    return key;
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {showLabel && (
        <span className="text-sm text-gray-600 dark:text-gray-400">
          Enharmonic:
        </span>
      )}
      
      <div className="flex items-center bg-gray-100 dark:bg-gray-800 rounded-md p-1">
        {/* Current key button (active) */}
        <Button
          variant="secondary"
          size={size}
          className={`
            px-3 py-1 min-w-[3rem] font-medium transition-all
            ${currentKey === enharmonicPair.sharp 
              ? 'bg-blue-500 text-white shadow-sm' 
              : 'bg-transparent text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
            }
          `}
          onClick={() => onKeyChange(enharmonicPair.sharp)}
          disabled={disabled}
          aria-label={`Switch to ${enharmonicPair.sharp} major`}
        >
          {getKeyDisplayName(enharmonicPair.sharp)}
        </Button>

        {/* Separator */}
        <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1" />

        {/* Alternative key button */}
        <Button
          variant="secondary"
          size={size}
          className={`
            px-3 py-1 min-w-[3rem] font-medium transition-all
            ${currentKey === enharmonicPair.flat 
              ? 'bg-blue-500 text-white shadow-sm' 
              : 'bg-transparent text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
            }
          `}
          onClick={() => onKeyChange(enharmonicPair.flat)}
          disabled={disabled}
          aria-label={`Switch to ${enharmonicPair.flat} major`}
        >
          {getKeyDisplayName(enharmonicPair.flat)}
        </Button>
      </div>

      {/* Helper tooltip or description */}
      <div className="hidden md:block">
        <span className="text-xs text-gray-500 dark:text-gray-400">
          Same pitch, different spelling
        </span>
      </div>
    </div>
  );
}

/**
 * Simplified enharmonic toggle that just shows the alternative as a button
 */
export function SimpleEnharmonicToggle({
  currentKey,
  onKeyChange,
  disabled = false,
  className = ''
}: Pick<EnharmonicToggleProps, 'currentKey' | 'onKeyChange' | 'disabled' | 'className'>) {
  
  const enharmonicPair = ENHARMONIC_KEYS.find(pair => 
    pair.sharp === currentKey || pair.flat === currentKey
  );

  if (!enharmonicPair) {
    return null;
  }

  const alternativeKey = currentKey === enharmonicPair.sharp 
    ? enharmonicPair.flat 
    : enharmonicPair.sharp;

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={() => onKeyChange(alternativeKey)}
      disabled={disabled}
      className={`text-xs ${className}`}
      title={`Switch to ${alternativeKey} major (enharmonic equivalent)`}
    >
      ⇄ {alternativeKey}
    </Button>
  );
}

/**
 * Hook for managing enharmonic key state
 */
export function useEnharmonicKey(initialKey: string) {
  const [currentKey, setCurrentKey] = React.useState(initialKey);

  const toggleEnharmonic = React.useCallback(() => {
    const enharmonicPair = ENHARMONIC_KEYS.find(pair => 
      pair.sharp === currentKey || pair.flat === currentKey
    );

    if (enharmonicPair) {
      const alternativeKey = currentKey === enharmonicPair.sharp 
        ? enharmonicPair.flat 
        : enharmonicPair.sharp;
      setCurrentKey(alternativeKey);
    }
  }, [currentKey]);

  const setKey = React.useCallback((newKey: string) => {
    setCurrentKey(newKey);
  }, []);

  const hasEnharmonicEquivalent = React.useMemo(() => {
    return ENHARMONIC_KEYS.some(pair => 
      pair.sharp === currentKey || pair.flat === currentKey
    );
  }, [currentKey]);

  const enharmonicEquivalent = React.useMemo(() => {
    const enharmonicPair = ENHARMONIC_KEYS.find(pair => 
      pair.sharp === currentKey || pair.flat === currentKey
    );

    if (!enharmonicPair) return null;

    return currentKey === enharmonicPair.sharp 
      ? enharmonicPair.flat 
      : enharmonicPair.sharp;
  }, [currentKey]);

  return {
    currentKey,
    setKey,
    toggleEnharmonic,
    hasEnharmonicEquivalent,
    enharmonicEquivalent
  };
}

/**
 * List component showing all enharmonic key pairs
 */
export function EnharmonicKeyList({ 
  onKeySelect, 
  selectedKey,
  className = '' 
}: {
  onKeySelect?: (key: string) => void;
  selectedKey?: string;
  className?: string;
}) {
  return (
    <div className={`space-y-2 ${className}`}>
      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
        Enharmonic Key Pairs
      </h4>
      
      {ENHARMONIC_KEYS.map((pair, index) => (
        <div key={index} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded">
          <div className="flex items-center gap-4">
            <Button
              variant={selectedKey === pair.sharp ? "primary" : "outline"}
              size="sm"
              onClick={() => onKeySelect?.(pair.sharp)}
              className="min-w-[3rem]"
            >
              {pair.sharp}
            </Button>
            
            <span className="text-gray-400">≡</span>
            
            <Button
              variant={selectedKey === pair.flat ? "primary" : "outline"}
              size="sm"
              onClick={() => onKeySelect?.(pair.flat)}
              className="min-w-[3rem]"
            >
              {pair.flat}
            </Button>
          </div>
          
          <span className="text-xs text-gray-500">
            {pair.sharp} major = {pair.flat} major
          </span>
        </div>
      ))}
    </div>
  );
}

/**
 * Context provider for enharmonic key preference across the app
 */
interface EnharmonicContextType {
  preferredSpelling: 'sharp' | 'flat' | 'auto';
  setPreferredSpelling: (preference: 'sharp' | 'flat' | 'auto') => void;
  getPreferredKey: (sharpKey: string, flatKey: string) => string;
}

const EnharmonicContext = React.createContext<EnharmonicContextType | null>(null);

export function EnharmonicProvider({ children }: { children: React.ReactNode }) {
  const [preferredSpelling, setPreferredSpelling] = React.useState<'sharp' | 'flat' | 'auto'>('auto');

  const getPreferredKey = React.useCallback((sharpKey: string, flatKey: string) => {
    switch (preferredSpelling) {
      case 'sharp':
        return sharpKey;
      case 'flat':
        return flatKey;
      case 'auto':
      default:
        // Auto mode could use heuristics, for now default to sharp
        return sharpKey;
    }
  }, [preferredSpelling]);

  const value: EnharmonicContextType = {
    preferredSpelling,
    setPreferredSpelling,
    getPreferredKey
  };

  return (
    <EnharmonicContext.Provider value={value}>
      {children}
    </EnharmonicContext.Provider>
  );
}

export function useEnharmonicPreference() {
  const context = React.useContext(EnharmonicContext);
  if (!context) {
    throw new Error('useEnharmonicPreference must be used within EnharmonicProvider');
  }
  return context;
}