/**
 * @file useDragHandler.ts
 * @description Custom hook for handling touch drag gestures on mobile bottom sheets
 */

import { useState, useRef, useCallback } from 'react';

export interface DragHandlerConfig {
  /** Threshold in pixels to trigger close action */
  closeThreshold?: number;
  /** Callback when drag should close the component */
  onClose?: () => void;
}

export interface DragHandlerReturn {
  /** Current Y offset for drag positioning */
  dragY: number;
  /** Whether currently dragging */
  isDragging: boolean;
  /** Touch start handler */
  handleTouchStart: (e: React.TouchEvent) => void;
  /** Touch move handler */
  handleTouchMove: (e: React.TouchEvent) => void;
  /** Touch end handler */
  handleTouchEnd: () => void;
  /** Reset drag state */
  resetDrag: () => void;
}

/**
 * Hook for managing touch drag gestures on mobile bottom sheets
 */
export function useDragHandler({
  closeThreshold = 100,
  onClose
}: DragHandlerConfig = {}): DragHandlerReturn {
  const [dragY, setDragY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const startY = useRef(0);
  const startDragY = useRef(0);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    startY.current = touch.clientY;
    startDragY.current = dragY;
    setIsDragging(true);
  }, [dragY]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isDragging) return;
    
    const touch = e.touches[0];
    const deltaY = touch.clientY - startY.current;
    const newDragY = Math.max(0, startDragY.current + deltaY);
    
    setDragY(newDragY);
  }, [isDragging]);

  const handleTouchEnd = useCallback(() => {
    if (!isDragging) return;
    
    setIsDragging(false);
    
    // If dragged down more than threshold, trigger close
    if (dragY > closeThreshold) {
      onClose?.();
    } else {
      // Snap back to position
      setDragY(0);
    }
  }, [isDragging, dragY, closeThreshold, onClose]);

  const resetDrag = useCallback(() => {
    setDragY(0);
    setIsDragging(false);
  }, []);

  return {
    dragY,
    isDragging,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    resetDrag,
  };
}