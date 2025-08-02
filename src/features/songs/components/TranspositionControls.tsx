/**
 * @file TranspositionControls.tsx
 * @description Comprehensive transposition controls with music-based features
 */

import React from 'react';
import { Button } from '../../../shared/components/UI/Button';
import { EnharmonicToggle, SimpleEnharmonicToggle } from './EnharmonicToggle';

// interface TranspositionResult {
//   warnings?: string[];
//   usedMusicRules?: boolean;
//   confidence?: number;
// }

interface TranspositionControlsProps {
  chords: string[];
  onChordsChange: (chords: string[]) => void;
  className?: string;
  compact?: boolean;
  showKeyDetection?: boolean;
  showModeToggle?: boolean;
}

export function TranspositionControls({
  chords: _chords,
  onChordsChange: _onChordsChange,
  className = '',
  compact = false,
  showKeyDetection = true,
  showModeToggle = true
}: TranspositionControlsProps) {
  
  // Simple placeholder implementation until hook is properly implemented
  const [currentKey, setCurrentKey] = React.useState('C');
  const [transpositionMode, setTranspositionMode] = React.useState<'music' | 'math'>('music');
  const detectedKey = 'C';
  const keyDetectionConfidence = 0.8;
  const hasEnharmonicEquivalent = false;
  const isTransposed = false;
  // const lastTranspositionResult: TranspositionResult | null = null;
  const commonKeys = ['C', 'G', 'F', 'Am', 'Em', 'Dm'];

  const transposeToTarget = (targetKey: string) => {
    setCurrentKey(targetKey);
    // Placeholder - would implement actual transposition logic
  };

  const transposeBySemitones = (_semitones: number) => {
    // Placeholder - would implement semitone transposition
  };

  const resetTransposition = () => {
    setCurrentKey('C');
  };

  const toggleTranspositionMode = () => {
    // Placeholder - would toggle between music/math modes
    setTranspositionMode(transpositionMode === 'music' ? 'math' : 'music');
  };

  if (compact) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        {/* Quick transpose buttons */}
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="sm"
            onClick={() => transposeBySemitones(-1)}
            className="px-2 py-1 text-xs"
            title="Down 1 semitone"
          >
            ♭
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => transposeBySemitones(1)}
            className="px-2 py-1 text-xs"
            title="Up 1 semitone"
          >
            ♯
          </Button>
        </div>

        {/* Current key display */}
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Key: {currentKey}
        </span>

        {/* Enharmonic toggle */}
        {hasEnharmonicEquivalent && (
          <SimpleEnharmonicToggle
            currentKey={currentKey}
            onKeyChange={transposeToTarget}
            className="text-xs"
          />
        )}

        {/* Reset */}
        {isTransposed && (
          <Button
            variant="outline"
            size="sm"
            onClick={resetTransposition}
            className="text-xs"
            title="Reset to original key"
          >
            Reset
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Key Detection Section */}
      {showKeyDetection && (
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Key Detection
            </h4>
            {/* {lastTranspositionResult && lastTranspositionResult.warnings && (
              <span className="text-xs text-yellow-600 dark:text-yellow-400">
                ⚠️ {lastTranspositionResult.warnings.length} warning(s)
              </span>
            )} */}
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Detected Key:
              </span>
              <span className="font-mono font-medium">
                {detectedKey}
              </span>
              <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div 
                  className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${keyDetectionConfidence * 100}%` }}
                />
              </div>
              <span className="text-xs text-gray-500">
                {(keyDetectionConfidence * 100).toFixed(0)}%
              </span>
            </div>

            {currentKey !== detectedKey && (
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Current Key:
                </span>
                <span className="font-mono font-medium text-blue-600 dark:text-blue-400">
                  {currentKey}
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Transposition Mode Toggle */}
      {showModeToggle && (
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-600 dark:text-gray-400">
            Transposition Mode:
          </span>
          <div className="flex items-center bg-gray-100 dark:bg-gray-800 rounded-md p-1">
            <Button
              variant={transpositionMode === 'music' ? 'primary' : 'outline'}
              size="sm"
              onClick={toggleTranspositionMode}
              className="px-3 py-1 text-xs"
            >
              Music Theory
            </Button>
            <Button
              variant={transpositionMode === 'math' ? 'primary' : 'outline'}
              size="sm"
              onClick={toggleTranspositionMode}
              className="px-3 py-1 text-xs"
            >
              Math Based
            </Button>
          </div>
        </div>
      )}

      {/* Enharmonic Key Selection */}
      {hasEnharmonicEquivalent && (
        <div className="space-y-2">
          <EnharmonicToggle
            currentKey={currentKey}
            onKeyChange={transposeToTarget}
            showLabel={true}
          />
        </div>
      )}

      {/* Transposition Controls */}
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Transpose
        </h4>

        {/* Semitone Controls */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600 dark:text-gray-400 min-w-[80px]">
            By Steps:
          </span>
          <div className="flex items-center gap-1">
            {[-2, -1, 1, 2].map((semitones) => (
              <Button
                key={semitones}
                variant="outline"
                size="sm"
                onClick={() => transposeBySemitones(semitones)}
                className="px-3 py-1 text-xs"
                title={`${semitones > 0 ? 'Up' : 'Down'} ${Math.abs(semitones)} semitone${Math.abs(semitones) > 1 ? 's' : ''}`}
              >
                {semitones > 0 ? '+' : ''}{semitones}
              </Button>
            ))}
          </div>
        </div>

        {/* Common Keys */}
        <div className="space-y-2">
          <span className="text-sm text-gray-600 dark:text-gray-400">
            Common Keys:
          </span>
          <div className="flex flex-wrap gap-2">
            {commonKeys.slice(0, 8).map((key: string) => (
              <Button
                key={key}
                variant="outline"
                size="sm"
                onClick={() => transposeToTarget(key)}
                className="px-3 py-1 text-xs font-mono"
              >
                {key}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Reset and Status */}
      <div className="flex items-center justify-between pt-3 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2">
          {isTransposed && (
            <Button
              variant="secondary"
              size="sm"
              onClick={resetTransposition}
            >
              Reset to Original
            </Button>
          )}
        </div>

        {/* {lastTranspositionResult && (
          <div className="text-xs text-gray-500 dark:text-gray-400">
            {lastTranspositionResult.usedMusicRules ? 'Music Theory' : 'Math Based'} • 
            Confidence: {((lastTranspositionResult.confidence ?? 0) * 100).toFixed(0)}%
          </div>
        )} */}
      </div>

      {/* Warnings */}
      {/* {lastTranspositionResult && lastTranspositionResult.warnings && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md p-3">
          <div className="flex items-start gap-2">
            <span className="text-yellow-600 dark:text-yellow-400 text-sm">⚠️</span>
            <div className="space-y-1">
              {lastTranspositionResult.warnings.map((warning: string, index: number) => (
                <p key={index} className="text-sm text-yellow-700 dark:text-yellow-300">
                  {warning}
                </p>
              ))}
            </div>
          </div>
        </div>
      )} */}
    </div>
  );
}

/**
 * Simple key selector dropdown
 */
export function KeySelector({
  currentKey,
  onKeyChange,
  className = ''
}: {
  currentKey: string;
  onKeyChange: (key: string) => void;
  className?: string;
}) {
  const allKeys = [
    'C', 'G', 'D', 'A', 'E', 'B', 'F#', 'C#',
    'F', 'Bb', 'Eb', 'Ab', 'Db', 'Gb', 'Cb'
  ];

  return (
    <select
      value={currentKey}
      onChange={(e) => onKeyChange(e.target.value)}
      className={`
        px-3 py-2 border border-gray-300 dark:border-gray-600 
        bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100
        rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500
        ${className}
      `}
    >
      {allKeys.map((key) => (
        <option key={key} value={key}>
          {key} major
        </option>
      ))}
    </select>
  );
}