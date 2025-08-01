/**
 * @file useChordTransposition.test.ts
 * @description Tests for useChordTransposition hook
 */

import { renderHook, act } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { useChordTransposition } from '../hooks/useChordTransposition';
import { TRANSPOSE_LIMITS } from '../types/chord.types';

describe('useChordTransposition', () => {
  it('initializes with default transpose level of 0', () => {
    const { result } = renderHook(() => useChordTransposition());

    expect(result.current.transposeLevel).toBe(0);
    expect(result.current.isMaxTranspose).toBe(false);
    expect(result.current.isMinTranspose).toBe(false);
  });

  it('initializes with custom transpose level', () => {
    const { result } = renderHook(() => useChordTransposition(3));

    expect(result.current.transposeLevel).toBe(3);
  });

  it('clamps initial level to valid range', () => {
    const { result: resultTooHigh } = renderHook(() => useChordTransposition(15));
    const { result: resultTooLow } = renderHook(() => useChordTransposition(-15));

    expect(resultTooHigh.current.transposeLevel).toBe(TRANSPOSE_LIMITS.MAX);
    expect(resultTooLow.current.transposeLevel).toBe(TRANSPOSE_LIMITS.MIN);
  });

  describe('transposeUp', () => {
    it('transposes up by 1 semitone by default', () => {
      const { result } = renderHook(() => useChordTransposition());

      act(() => {
        result.current.transposeUp();
      });

      expect(result.current.transposeLevel).toBe(1);
    });

    it('transposes up by specified semitones', () => {
      const { result } = renderHook(() => useChordTransposition());

      act(() => {
        result.current.transposeUp(3);
      });

      expect(result.current.transposeLevel).toBe(3);
    });

    it('clamps to maximum transpose level', () => {
      const { result } = renderHook(() => useChordTransposition(10));

      act(() => {
        result.current.transposeUp(5);
      });

      expect(result.current.transposeLevel).toBe(TRANSPOSE_LIMITS.MAX);
      expect(result.current.isMaxTranspose).toBe(true);
    });
  });

  describe('transposeDown', () => {
    it('transposes down by 1 semitone by default', () => {
      const { result } = renderHook(() => useChordTransposition(2));

      act(() => {
        result.current.transposeDown();
      });

      expect(result.current.transposeLevel).toBe(1);
    });

    it('transposes down by specified semitones', () => {
      const { result } = renderHook(() => useChordTransposition(5));

      act(() => {
        result.current.transposeDown(3);
      });

      expect(result.current.transposeLevel).toBe(2);
    });

    it('clamps to minimum transpose level', () => {
      const { result } = renderHook(() => useChordTransposition(-10));

      act(() => {
        result.current.transposeDown(5);
      });

      expect(result.current.transposeLevel).toBe(TRANSPOSE_LIMITS.MIN);
      expect(result.current.isMinTranspose).toBe(true);
    });
  });

  describe('transpose', () => {
    it('sets specific transpose level', () => {
      const { result } = renderHook(() => useChordTransposition());

      act(() => {
        result.current.transpose(7);
      });

      expect(result.current.transposeLevel).toBe(7);
    });

    it('clamps level to valid range', () => {
      const { result } = renderHook(() => useChordTransposition());

      act(() => {
        result.current.transpose(20);
      });

      expect(result.current.transposeLevel).toBe(TRANSPOSE_LIMITS.MAX);

      act(() => {
        result.current.transpose(-20);
      });

      expect(result.current.transposeLevel).toBe(TRANSPOSE_LIMITS.MIN);
    });
  });

  describe('reset', () => {
    it('resets transpose level to 0', () => {
      const { result } = renderHook(() => useChordTransposition(5));

      act(() => {
        result.current.reset();
      });

      expect(result.current.transposeLevel).toBe(0);
      expect(result.current.isMaxTranspose).toBe(false);
      expect(result.current.isMinTranspose).toBe(false);
    });
  });

  describe('boundary detection', () => {
    it('correctly identifies maximum transpose level', () => {
      const { result } = renderHook(() => useChordTransposition());

      act(() => {
        result.current.transpose(TRANSPOSE_LIMITS.MAX);
      });

      expect(result.current.isMaxTranspose).toBe(true);
      expect(result.current.isMinTranspose).toBe(false);
    });

    it('correctly identifies minimum transpose level', () => {
      const { result } = renderHook(() => useChordTransposition());

      act(() => {
        result.current.transpose(TRANSPOSE_LIMITS.MIN);
      });

      expect(result.current.isMinTranspose).toBe(true);
      expect(result.current.isMaxTranspose).toBe(false);
    });

    it('updates boundary flags when transposing', () => {
      const { result } = renderHook(() => useChordTransposition(TRANSPOSE_LIMITS.MAX - 1));

      // Start near max
      expect(result.current.isMaxTranspose).toBe(false);

      act(() => {
        result.current.transposeUp();
      });

      expect(result.current.isMaxTranspose).toBe(true);

      act(() => {
        result.current.transposeDown();
      });

      expect(result.current.isMaxTranspose).toBe(false);
    });
  });

  describe('performance', () => {
    it('maintains stable function references', () => {
      const { result, rerender } = renderHook(() => useChordTransposition());

      const initialTransposeUp = result.current.transposeUp;
      const initialTransposeDown = result.current.transposeDown;
      const initialTranspose = result.current.transpose;
      const initialReset = result.current.reset;

      rerender();

      expect(result.current.transposeUp).toBe(initialTransposeUp);
      expect(result.current.transposeDown).toBe(initialTransposeDown);
      expect(result.current.transpose).toBe(initialTranspose);
      expect(result.current.reset).toBe(initialReset);
    });

    it('handles rapid transpose changes', () => {
      const { result } = renderHook(() => useChordTransposition());

      act(() => {
        // Simulate rapid changes
        for (let i = 0; i < 100; i++) {
          result.current.transposeUp();
        }
      });

      expect(result.current.transposeLevel).toBe(TRANSPOSE_LIMITS.MAX);

      act(() => {
        for (let i = 0; i < 100; i++) {
          result.current.transposeDown();
        }
      });

      expect(result.current.transposeLevel).toBe(TRANSPOSE_LIMITS.MIN);
    });
  });
});